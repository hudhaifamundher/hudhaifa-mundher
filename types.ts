export interface MindMapNode {
    title: string;
    summary: string;
    sourceText: string;
    children?: MindMapNode[];
    // D3 properties will be added dynamically
    x?: number;
    y?: number;
    parent?: MindMapNode | null;
    depth?: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export type AppStatus = 'idle' | 'loading' | 'success' | 'error';

export interface SearchResult {
    uri: string;
    title: string;
}

export interface ArchivedMindMap {
    id: number;
    fileName: string;
    createdAt: string;
    mindMapData: MindMapNode;
}
