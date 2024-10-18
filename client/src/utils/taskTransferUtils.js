import { generateUUID } from './uuid';

/**
 * Recursively migrates a task tree from a local IndexedDB to a collaboration IndexedDB.
 * @param {IndexedDBManager} localIndexedDBManager - The IndexedDBManager instance for the local IndexedDB.
 * @param {IndexedDBManager} collabIndexedDBManager - The IndexedDBManager instance for the collaboration IndexedDB.
 * @param {number} parentId - The ID of the parent task in the local IndexedDB.
 * @param {string} collabName - The name of collaboration.
 * @param {number} [newParentId=-1] - The ID of the parent task in the collaboration IndexedDB. Default: -1 (root).
 * @returns {Promise<void>} A promise that resolves when all tasks have been migrated to the collaboration IndexedDB.
 */
export async function migrateTaskTree (localIndexedDBManager, collabIndexedDBManager, collabName,parentId, newParentId=-1) {
    const migrateRec = async (parentId, newParentId) => {
        const parent = await localIndexedDBManager.getObjectById(parentId);
        delete parent.id;
        parent.collabName = collabName;
        parent.parentId = newParentId;
        parent.collabTaskId = generateUUID();
    
        const createdParentId = await collabIndexedDBManager.addObject(parent);
    
        const addChildrenPromise = localIndexedDBManager.getTasksByParentId(parentId).then(children => {
            return Promise.all( children.map(child => migrateRec( child.id, parent.collabTaskId )) );
        });
        return addChildrenPromise;
    }
    return migrateRec(parentId, newParentId);
}; 

/**
 * Imports a list of tasks into the IndexedDB.
 * @param {IndexedDBManager} indexedDBManager - The IndexedDBManager instance.
 * @param {import("../services/TaskManager").Task[]} tasks - The array of tasks to import.
 * @returns {Promise<void>} A promise that resolves when all tasks have been added to the IndexedDB.
 */
export async function importTasks (indexedDBManager, tasks) {
    return Promise.all( tasks.map(task => {
        delete task.id;
        return indexedDBManager.addObject(task)
    }) );
}