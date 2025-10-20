import React from 'react';
import type { ArchivedMindMap } from '../types';

interface ArchiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    archives: ArchivedMindMap[];
    onLoad: (archive: ArchivedMindMap) => void;
    onDelete: (id: number) => void;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ isOpen, onClose, archives, onLoad, onDelete }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-brand-600 dark:text-brand-400">Mind Map Archive</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    {archives.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400">Your archive is empty. Generate a new mind map to save it here.</p>
                    ) : (
                        <ul className="space-y-4">
                            {archives.map(archive => (
                                <li key={archive.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between transition-shadow hover:shadow-md">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate" title={archive.fileName}>{archive.fileName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Saved on: {new Date(archive.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2 flex-shrink-0">
                                        <button onClick={() => onLoad(archive)} className="px-3 py-1 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 transition-colors">
                                            Load
                                        </button>
                                        <button onClick={() => onDelete(archive.id)} className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArchiveModal;
