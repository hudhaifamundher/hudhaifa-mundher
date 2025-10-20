
import React, { useState, useEffect, useRef } from 'react';
import type { MindMapNode, ChatMessage, SearchResult } from '../types';

interface SidePanelProps {
    selectedNode: MindMapNode | null;
    chatMessages: ChatMessage[];
    onSendMessage: (message: string) => void;
    onClose: () => void;
    onSearch: (query: string) => void;
    searchResults: SearchResult[];
    isSearching: boolean;
    isChatActive: boolean;
}

type PanelView = 'detail' | 'chat';

const SidePanel: React.FC<SidePanelProps> = ({
    selectedNode, chatMessages, onSendMessage, onClose, onSearch, searchResults, isSearching, isChatActive
}) => {
    const [view, setView] = useState<PanelView>('chat');
    const [chatInput, setChatInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedNode) {
            setView('detail');
        }
    }, [selectedNode]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim()) {
            onSendMessage(chatInput.trim());
            setChatInput('');
        }
    };
    
    if (!selectedNode && !isChatActive) {
        return null;
    }

    const renderDetailView = () => (
        <>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-brand-600 dark:text-brand-400 mb-2">{selectedNode?.title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{selectedNode?.summary}</p>
            </div>
            <div className="p-6 flex-grow overflow-y-auto">
                <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Source Text</h3>
                <blockquote className="border-l-4 border-brand-500 pl-4 py-2 italic bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-r-md">
                    "{selectedNode?.sourceText}"
                </blockquote>
                
                <div className="mt-6">
                    <button 
                        onClick={() => onSearch(selectedNode!.title)} 
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 transition-colors flex items-center justify-center"
                        disabled={isSearching}
                    >
                         {isSearching ? 'Searching...' : 'Find More Context with Google'}
                    </button>
                    {isSearching && <div className="text-center mt-2 text-sm">Searching online...</div>}
                    {searchResults.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="font-semibold">Search Results:</h4>
                            {searchResults.map((result, index) => (
                                <a key={index} href={result.uri} target="_blank" rel="noopener noreferrer" className="block text-brand-500 hover:underline truncate text-sm">
                                    {result.title}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const renderChatView = () => (
        <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-center">AI Study Assistant</h2>
            </div>
            <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask about the document..."
                        className="flex-grow px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button type="submit" className="flex-shrink-0 w-10 h-10 bg-brand-600 text-white rounded-full hover:bg-brand-700 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                </form>
            </div>
        </>
    );

    return (
        <aside className="w-full md:w-1/3 max-w-lg flex-shrink-0 bg-white dark:bg-gray-800 shadow-lg flex flex-col transition-transform duration-300 transform">
            {isChatActive && (
                 <div className="flex p-2 bg-gray-100 dark:bg-gray-900 rounded-t-lg">
                    <button 
                        onClick={() => setView('chat')} 
                        className={`w-1/2 py-2 text-sm font-medium rounded-md ${view === 'chat' ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        Chat
                    </button>
                    <button 
                        onClick={() => setView('detail')} 
                        disabled={!selectedNode}
                        className={`w-1/2 py-2 text-sm font-medium rounded-md ${view === 'detail' ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Details
                    </button>
                </div>
            )}
            {view === 'detail' && selectedNode ? renderDetailView() : renderChatView()}
        </aside>
    );
};

export default SidePanel;
