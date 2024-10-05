import { openDB } from 'idb';

const VERSION = 1;

class IndexedDBManager {
    constructor(dbName, storeName) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.dbPromise = this.initializeDB(); // Call initializeDB only once
    }
    
    async init() {
      this.dbPromise = this.initializeDB()
    }

    async initializeDB() {
      const storeName = this.storeName;

        return openDB(this.dbName, VERSION, {
            upgrade(db) {
                // Create an object store if it doesn't exist
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, {
                        keyPath: 'id', // Use 'id' as the key path
                        autoIncrement: true,
                    });
                    
                    store.createIndex('parentId', 'parentId');
                }
            }
        });
    }

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
}

export default IndexedDBManager;