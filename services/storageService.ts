import type { ArchivedMindMap, MindMapNode } from '../types';

const ARCHIVE_KEY = 'mindMapArchive';

/**
 * Retrieves all archived mind maps from localStorage.
 * @returns An array of ArchivedMindMap objects.
 */
export const getArchivedMindMaps = (): ArchivedMindMap[] => {
    try {
        const rawData = localStorage.getItem(ARCHIVE_KEY);
        if (!rawData) return [];
        const archives = JSON.parse(rawData) as ArchivedMindMap[];
        // Sort by date, newest first
        return archives.sort((a, b) => b.id - a.id);
    } catch (error) {
        console.error("Failed to retrieve archives from localStorage", error);
        return [];
    }
};

/**
 * Saves a new mind map to the archive in localStorage.
 * @param fileName - The name of the original PDF file.
 * @param mindMapData - The mind map data to be saved.
 * @returns The updated array of all archived mind maps.
 */
export const saveMindMap = (fileName: string, mindMapData: MindMapNode): ArchivedMindMap[] => {
    const archives = getArchivedMindMaps();
    const newArchive: ArchivedMindMap = {
        id: Date.now(),
        fileName,
        createdAt: new Date().toISOString(),
        mindMapData,
    };

    const updatedArchives = [newArchive, ...archives];

    try {
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updatedArchives));
    } catch (error) {
        console.error("Failed to save mind map to localStorage", error);
        // If saving fails, return the original archives to not break the app state
        return archives; 
    }
    
    return updatedArchives;
};

/**
 * Deletes a mind map from the archive in localStorage.
 * @param id - The ID of the mind map to delete.
 * @returns The updated array of archived mind maps after deletion.
 */
export const deleteMindMap = (id: number): ArchivedMindMap[] => {
    let archives = getArchivedMindMaps();
    const updatedArchives = archives.filter(archive => archive.id !== id);

    try {
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updatedArchives));
    } catch (error) {
        console.error("Failed to delete mind map from localStorage", error);
        return archives;
    }

    return updatedArchives;
};
