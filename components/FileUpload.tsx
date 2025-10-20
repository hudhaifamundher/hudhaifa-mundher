
import React, { useCallback } from 'react';
import type { AppStatus } from '../types';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    status: AppStatus;
    statusMessage: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, status, statusMessage }) => {
    
    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            if (file.type === "application/pdf") {
                onFileSelect(file);
            }
        }
    }, [onFileSelect]);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onFileSelect(event.target.files[0]);
        }
    };

    const renderStatus = () => {
        if (status === 'loading') {
            return (
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-12 w-12 text-brand-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{statusMessage}</p>
                </div>
            );
        }
        if (status === 'error') {
            return <p className="text-lg text-red-500">{statusMessage}</p>;
        }
        return null;
    };

    return (
        <div className="w-full h-full flex flex-col justify-center items-center p-8 text-center">
            {status === 'loading' || status === 'error' ? (
                renderStatus()
            ) : (
                <div 
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    className="w-full max-w-2xl border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 transition-colors hover:border-brand-500 dark:hover:border-brand-400 bg-white dark:bg-gray-800"
                >
                    <input type="file" id="pdf-upload" className="hidden" accept=".pdf" onChange={onFileChange} />
                    <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                        <svg className="w-16 h-16 text-brand-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H13a4 4 0 014 4v1.586a1 1 0 01-.293.707l-1.414 1.414a1 1 0 00-.293.707V16m-7-3h4m-2 2v-4m-2-4h4m-2 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Drag & Drop or Click to Upload</h2>
                        <p className="text-gray-500 dark:text-gray-400">Turn any PDF into an interactive mind map</p>
                    </label>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
