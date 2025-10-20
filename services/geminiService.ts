import { GoogleGenAI, Type, Chat } from '@google/genai';
import type { MindMapNode, SearchResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define a schema with a fixed depth to avoid infinite recursion in the schema object itself.
// The prompt will still encourage the model to create a deeper structure if necessary,
// and our validation function can handle it. This approach avoids the "Maximum call stack size exceeded" error
// caused by a direct self-referencing object that the SDK cannot serialize.

// Base case: a leaf node with no children property in its schema.
const leafNodeSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'A very concise, human-readable topic name (2-8 words).' },
        summary: { type: Type.STRING, description: 'A brief 1-2 sentence explanation of the topic.' },
        sourceText: { type: Type.STRING, description: 'The single, most relevant verbatim sentence or short phrase from the source. Must be concise.' },
    },
     required: ['title', 'summary', 'sourceText'],
}

// Iteratively build the schema to a generous but finite depth. A depth of 10 was too deep for the API.
// 5 is a safe number that prevents the API error while still providing a strong structural guide.
let mindMapNodeSchema: any = leafNodeSchema;
const maxSchemaDepth = 5; 

for (let i = 0; i < maxSchemaDepth; i++) {
    mindMapNodeSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'A very concise, human-readable topic name (2-8 words).' },
            summary: { type: Type.STRING, description: 'A brief 1-2 sentence explanation of the topic.' },
            sourceText: { type: Type.STRING, description: 'The single, most relevant verbatim sentence or short phrase from the source. Must be concise.' },
            children: {
                type: Type.ARRAY,
                description: 'An array of child nodes that recursively follow this same schema.',
                items: mindMapNodeSchema,
            },
        },
        required: ['title', 'summary', 'sourceText'],
    };
}

const mindMapSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'The main title of the document, kept concise.' },
        summary: { type: Type.STRING, description: 'A brief summary of the entire document.' },
        sourceText: { type: Type.STRING, description: 'N/A for the root node.' },
        children: {
            type: Type.ARRAY,
            description: 'An array of top-level topic nodes.',
            items: mindMapNodeSchema,
        },
    },
    required: ['title', 'summary', 'children'],
};

/**
 * Recursively validates and cleans the raw mind map data from the API.
 * Ensures that each node has the required properties and truncates overly long titles.
 * @param node The node to validate.
 * @returns A valid MindMapNode or null if the node is invalid.
 */
const validateAndCleanMindMap = (node: any): MindMapNode | null => {
    // Check for required properties and their types
    if (!node || typeof node.title !== 'string' || typeof node.summary !== 'string') {
        console.warn('Discarding invalid node:', node);
        return null;
    }
    
    const validNode: MindMapNode = {
        title: node.title.substring(0, 200), // Prevent ridiculously long titles
        summary: node.summary,
        sourceText: node.sourceText || 'N/A', // Ensure sourceText exists
    };

    if (Array.isArray(node.children) && node.children.length > 0) {
        validNode.children = node.children
            .map(child => validateAndCleanMindMap(child)) // Recursively validate children
            .filter((child): child is MindMapNode => child !== null); // Filter out any invalid children
    }
    
    return validNode;
};


export const generateMindMapFromPdf = async (pdfBase64: string): Promise<MindMapNode> => {
    const prompt = `
        Analyze the content of this PDF document. The document could be text-based or image-based (scanned). 
        Identify the main title, topics, sub-topics, and key details. 
        Structure this information into a hierarchical JSON format suitable for a mind map.
        The root object must represent the entire document. 
        Each node in the tree must have 'title', 'summary', and 'sourceText' properties.
        - The 'title' property must be a VERY short, human-readable heading, strictly 2-8 words long.
        - The 'summary' must be a concise 1-2 sentence explanation.
        - The 'sourceText' must be the single, most relevant sentence or short phrase from the document that this topic is derived from. It should be exact and verbatim, but also very concise. DO NOT include long paragraphs.
        Each node can have a 'children' property containing an array of nodes that recursively follow the same structure. Any node, at any level, can have children if the content supports it.
        The hierarchy should be as deep as the document's content logically allows.
        Return ONLY the JSON object that strictly follows the provided schema. Do not add any extra text or markdown formatting.
    `;

    const imagePart = {
        inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64,
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: mindMapSchema,
        },
    });

    const rawText = response.text;
    let jsonText = rawText.trim();

    // The model can sometimes wrap the JSON in ```json ... ```. Let's remove it.
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    
    // Find the first '{' and last '}' to ensure we are parsing a valid object.
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        console.error("Could not find a valid JSON object in the response.", rawText);
        throw new Error("Received a malformed response from the API.");
    }
    jsonText = jsonText.substring(startIndex, endIndex + 1);

    try {
        const parsedJson = JSON.parse(jsonText);
        const cleanedData = validateAndCleanMindMap(parsedJson);
        if (!cleanedData) {
            console.error("Parsed JSON failed validation:", parsedJson);
            throw new Error("API returned data that doesn't match the required structure.");
        }
        return cleanedData;
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonText);
        if (e instanceof Error) {
            console.error("Parsing error:", e.message);
        }
        throw new Error("Received invalid JSON from the API.");
    }
};

export const searchGoogle = async (query: string): Promise<SearchResult[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find more information about: "${query}"`,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (!groundingChunks) return [];

    const results: SearchResult[] = groundingChunks
        .map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Untitled',
        }))
        .filter((result: SearchResult) => result.uri);

    return results;
};

export const createChatSession = async (systemInstruction: string): Promise<Chat> => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
    return chat;
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<string> => {
    const response = await chat.sendMessage({ message });
    return response.text;
};