import React from 'react';
import type { MindMapNode } from '../types';

interface HeaderProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    mindMapData: MindMapNode | null;
    onOpenArchive: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, onToggleDarkMode, mindMapData, onOpenArchive }) => {
    
    const handleExport = () => {
        const svgElement = document.querySelector('#mindmap-svg') as SVGSVGElement;
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        
        const bbox = svgElement.getBBox();
        const padding = 50;
        canvas.width = bbox.width + padding * 2;
        canvas.height = bbox.height + padding * 2;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = isDarkMode ? '#111827' : '#f9fafb';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Adjust drawing to account for the bbox offset
            ctx.drawImage(img, -bbox.x + padding, -bbox.y + padding);
            
            const link = document.createElement('a');
            link.download = `${mindMapData?.title.replace(/ /g, '_') || 'mindmap'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };
    
    return (
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center z-10">
            <h1 className="text-xl font-bold text-brand-600 dark:text-brand-400">PDF to Mind Map AI</h1>
            <div className="flex items-center space-x-4">
                <button
                    onClick={onOpenArchive}
                    className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-100 dark:bg-brand-900/50 dark:text-brand-300 rounded-md hover:bg-brand-200 dark:hover:bg-brand-900 transition-colors"
                >
                    Archive
                </button>
                <button
                    onClick={handleExport}
                    disabled={!mindMapData}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    Export as PNG
                </button>
                <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">
                        {isDarkMode ? 'Dark' : 'Light'} Mode
                    </span>
                    <button onClick={onToggleDarkMode} className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-gray-200 dark:bg-gray-700">
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
