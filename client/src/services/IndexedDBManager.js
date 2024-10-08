import { openDB } from 'idb';

const VERSION = 2;

/**
 * Manages interactions with IndexedDB for storing and retrieving tasks.
 */
class IndexedDBManager {
    /**
     * Creates an instance of IndexedDBManager.
     * @param {string} dbName - The name of the IndexedDB database.
     * @param {string} storeName - The name of the object store to use within the database.
     */
    constructor(dbName, storeName) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.dbPromise = this.initializeDB();
    }

    /**
     * Initializes the IndexedDB database and object stores.
     * @returns {Promise<IDBDatabase>} The promise that resolves with the database instance.
     */
    async initializeDB() {

        return openDB(this.dbName, VERSION, {
            upgrade(db) {
                // Create an object store if it doesn't exist
                if (!db.objectStoreNames.contains("local_tasks")) {
                    const store = db.createObjectStore("local_tasks", {
                        keyPath: 'id', // Use 'id' as the key path
                        autoIncrement: true,
                    });
                    
                    store.createIndex('parentId', 'parentId');
                }
                if (!db.objectStoreNames.contains("collab_tasks")) {
                    const store = db.createObjectStore("collab_tasks", {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    store.createIndex('parentId', 'parentId');
                    store.createIndex('collabName', 'collabName');
                }
            }
        });
    }

    /**
     * Adds an object to the object store.
     * @param {Object} object - The object to be added to the store.
     * @returns {Promise<number>} The ID of the added object.
     */
    async addObject(object) {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, 'readwrite');
        const id = await tx.store.add(object);
        await tx.done;
        return id;
    }

    /**
     * Retrieves an object by its ID.
     * @param {number} id - The ID of the object to retrieve.
     * @returns {Promise<Object|null>} The retrieved object or null if not found.
     */
    async getObjectById(id) {
        const db = await this.dbPromise;
        return await db.get(this.storeName, id);
    }

    /**
     * Updates an existing object in the object store.
     * @param {Object} object - The object to be updated.
     * @returns {Promise<void>} A promise that resolves when the object has been updated.
     */
    async updateObject(object) {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, 'readwrite');
        await tx.store.put(object);
        await tx.done;
    }

    /**
     * Deletes an object by its ID.
     * @param {number} id - The ID of the object to delete.
     * @returns {Promise<void>} A promise that resolves when the object has been deleted.
     */
    async deleteObject(id) {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, 'readwrite');
        await tx.store.delete(id);
        await tx.done;
    }

    /**
     * Retrieves all objects from the object store.
     * @returns {Promise<Array<Object>>} A promise that resolves with an array of all objects.
     */
    async getAllObjects() {
        const db = await this.dbPromise;
        return await db.getAll(this.storeName);
    }

    /**
     * Retrieves tasks by their parent ID.
     * @param {number} parentId - The ID of the parent task.
     * @returns {Promise<Array<Object>>} A promise that resolves with an array of tasks.
     */
    async getTasksByParentId(parentId) {
        const db = await this.dbPromise;
        const tasks = await db.getAllFromIndex(this.storeName, "parentId", parentId);
        return tasks;
    }

    /**
     * Retrieves tasks by their collaboration name.
     * @param {string} collabName - The name of the collaboration.
     * @returns {Promise<Array<Object>>} A promise that resolves with an array of tasks.
     */
    async getTasksByCollabName(collabName) {
        const db = await this.dbPromise;
        const tasks = await db.getAllFromIndex(this.storeName, "collabName", collabName);
        return tasks;
    }
}

export default IndexedDBManager;
