import React, { useState, useEffect, useCallback } from 'react';
import type { MindMapNode, ChatMessage, AppStatus, SearchResult, ArchivedMindMap } from './types';
import { generateMindMapFromPdf, searchGoogle, createChatSession, sendMessageToChat } from './services/geminiService';
import { getArchivedMindMaps, saveMindMap, deleteMindMap } from './services/storageService';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import MindMap from './components/MindMap';
import SidePanel from './components/SidePanel';
import ArchiveModal from './components/ArchiveModal';
import { Chat } from '@google/genai';

const App: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
    const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [status, setStatus] = useState<AppStatus>('idle');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [archives, setArchives] = useState<ArchivedMindMap[]>([]);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        // Load archives on initial app load
        setArchives(getArchivedMindMaps());
    }, []);

    const handleFileSelect = (file: File) => {
        setPdfFile(file);
        setMindMapData(null);
        setSelectedNode(null);
        setChatMessages([]);
        setChatSession(null);
        setSearchResults([]);
        setIsFocusMode(false);
        generateMindMap(file);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (error) => reject(error);
        });
    };

    const initializeChat = useCallback(async (data: MindMapNode) => {
        setStatusMessage('Initializing AI study assistant...');
        const chat = await createChatSession(`You are an AI assistant helping a user study a document. The document's content has been structured as a mind map. This is the content: ${JSON.stringify(data)}. Answer questions based ONLY on this content. If the information is not in the document, say so clearly and do not provide external information unless asked to search for it.`);
        setChatSession(chat);
        setChatMessages([{ role: 'model', content: `Hello! I'm your AI study assistant. Ask me anything about "${data.title}".` }]);
    }, []);

    const generateMindMap = useCallback(async (file: File) => {
        setStatus('loading');
        setStatusMessage('Reading PDF and analyzing content...');
        try {
            const base64String = await fileToBase64(file);
            setStatusMessage('Generating mind map with AI...');
            const data = await generateMindMapFromPdf(base64String);
            setMindMapData(data);
            
            await initializeChat(data);
            
            setStatus('success');
            setStatusMessage('');

            // Save to archive and update state
            const updatedArchives = saveMindMap(file.name, data);
            setArchives(updatedArchives);

        } catch (error) {
            console.error('Error generating mind map:', error);
            setStatus('error');
            setStatusMessage('Failed to create mind map. Please try another PDF.');
        }
    }, [initializeChat]);
    
    const handleNodeSelect = useCallback((node: MindMapNode | null) => {
        setSelectedNode(node);
        setSearchResults([]);
        setIsFocusMode(!!node);
    }, []);
    
    const handleSendMessage = async (message: string) => {
        if (!chatSession) return;

        const userMessage: ChatMessage = { role: 'user', content: message };
        setChatMessages(prev => [...prev, userMessage]);

        try {
            const response = await sendMessageToChat(chatSession, message);
            const modelMessage: ChatMessage = { role: 'model', content: response };
            setChatMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
            setChatMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleSearch = async (query: string) => {
        setIsSearching(true);
        setSearchResults([]);
        try {
            const results = await searchGoogle(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLoadFromArchive = async (archive: ArchivedMindMap) => {
        setMindMapData(archive.mindMapData);
        await initializeChat(archive.mindMapData);
        setSelectedNode(null);
        setSearchResults([]);
        setIsFocusMode(false);
        setStatus('success');
        setIsArchiveOpen(false);
    };

    const handleDeleteFromArchive = (id: number) => {
        const updatedArchives = deleteMindMap(id);
        setArchives(updatedArchives);
    };

    return (
        <div className="flex flex-col h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
            <Header 
                isDarkMode={isDarkMode} 
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
                mindMapData={mindMapData}
                onOpenArchive={() => setIsArchiveOpen(true)}
            />
            <main className="flex-grow flex overflow-hidden">
                <div className="flex-grow relative">
                    {mindMapData ? (
                        <MindMap data={mindMapData} onNodeSelect={handleNodeSelect} selectedNode={selectedNode} isFocusMode={isFocusMode} />
                    ) : (
                        <FileUpload onFileSelect={handleFileSelect} status={status} statusMessage={statusMessage} />
                    )}
                </div>
                <SidePanel
                    selectedNode={selectedNode}
                    chatMessages={chatMessages}
                    onSendMessage={handleSendMessage}
                    onClose={() => handleNodeSelect(null)}
                    onSearch={handleSearch}
                    searchResults={searchResults}
                    isSearching={isSearching}
                    isChatActive={!!chatSession}
                />
            </main>
            <ArchiveModal
                isOpen={isArchiveOpen}
                onClose={() => setIsArchiveOpen(false)}
                archives={archives}
                onLoad={handleLoadFromArchive}
                onDelete={handleDeleteFromArchive}
            />
        </div>
    );
};

export default App;