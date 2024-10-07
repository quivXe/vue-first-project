import { openDB } from 'idb';

const VERSION = 2;

class IndexedDBManager {
    constructor(dbName, storeName) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.dbPromise = this.initializeDB();
    }
    

    async initializeDB() {
      const storeName = this.storeName;

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
    };

    async addObject(object) {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, 'readwrite');
        const id = await tx.store.add(object);
        await tx.done;
        return id;
    }

    async getObjectById(id) {
        const db = await this.dbPromise;
        return await db.get(this.storeName, id);
    }

    async updateObject(object) {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, 'readwrite');
        await tx.store.put(object);
        await tx.done;
    }

    async deleteObject(id) {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, 'readwrite');
        await tx.store.delete(id);
        await tx.done;
    }

    async getAllObjects() {
        const db = await this.dbPromise;
        return await db.getAll(this.storeName);
    }

    async getTasksByParentId(parentId) {
      const db = await this.dbPromise;
      const tasks = await db.getAllFromIndex(this.storeName, "parentId", parentId);
      return tasks;
    }

    async getTasksByCollabName(collabName) {
        const db = await this.dbPromise;
        const tasks = await db.getAllFromIndex(this.storeName, "collabName", collabName);
        return tasks;
    }
}

export default IndexedDBManager;