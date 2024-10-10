import { toRaw, ref } from 'vue';
import IndexedDBManager from './IndexedDBManager';
import CollaborationManager from './CollaborationManager';

/**
 * Task object, stored in indexedDB, and displayed by UIManager
 *
 * @typedef {Object} Task
 * 
 * @param {String} name
 * @param {Int} flexIndex
 * @param {Int} status - Has to be value from TaskManager.TASK_STATUSES
 * @param {Int} parentId - Id of task that is one tier above
 * @param {String} description
 * @param {String} [collabName=null] - The name of collaboration (if any). Defaults to null.
 * @param {number} [id=null] - Task id, autoincremented
 */


/**
 * Manages tasks and serves as a bridge between the UI and IndexedDB.
 * It interacts with IndexedDBManager to perform CRUD operations on tasks.
 *
 * @class TaskManager
 */
class TaskManager {
  /**
   * Creates an instance of TaskManager.
   *
   * @constructor
   * @param {IndexedDBManager} indexedDBManager - An instance of IndexedDBManager to manage task storage.
   * @param {CollaborationManager} [collabManager=null] - An instance of CollaborationManager to send updates on collaboration.
   */
  constructor(indexedDBManager, collabManager=null) {
    this.TASK_STATUSES = {
      TODO: 0,
      DOING: 1,
      DONE: 2
    }

    this.indexedDBManager = indexedDBManager;
    this.collabManager = collabManager;

    this.collaborating = collabManager !== null;
    this.currentTasks = ref([]);

    // Binding methods to ensure correct context
    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
    this.retryOperation = this.retryOperation.bind(this);
  }

  /**
   * Initializes the TaskManager by setting the current tasks for the provided parent ID.
   *
   * @async
   * @param {number} [currentParentId=-1] - The parent ID for which to fetch tasks. Defaults to -1 (root).
   */
  async init(currentParentId=-1) {
    await this.updateCurrentTasks(currentParentId);
  }

  /**
   * Updates the current tasks based on the provided parent ID.
   *
   * @async
   * @param {number} parentId - The parent ID for which to fetch tasks.
   */
  async updateCurrentTasks(parentId) {
    if (parentId === -1 && this.collaborating) {
      let tasks = await this.indexedDBManager.getTasksByParentId(parentId);
      this.currentTasks.value = tasks.filter(t => t.collabName === this.collabManager.collabName);
    } else {
      this.currentTasks.value = await this.indexedDBManager.getTasksByParentId(parentId);
    }
  }

  /**
   * Retrieves a task object from the indexedDBManager using the given ID.
   *
   * @async
   * @param {number} taskId - The ID of the task to retrieve.
   * @returns {Promise<Object>} The task object with the specified ID.
   */
  async getTaskById(taskId) {
    return await this.indexedDBManager.getObjectById(taskId);
  }

  /**
   * Adds a new task to the indexedDBManager. If inCurrentTasks is true, updates currentTasks.
   *
   * @async
   * @param {String} value - The name of the task to be added.
   * @param {number} parentId - The ID of the parent task (if any).
   * @param {boolean} [inCurrentTasks=true] - Whether to update currentTasks with the new task. Defaults to true.
   * @returns {Promise<void>} 
   */
  async addTask(value, parentId, inCurrentTasks=true) {
    // Get maxFlexIndex
    const siblings = await this.indexedDBManager.getTasksByParentId(parentId);
    let maxFlexIndex;
    if (siblings.length > 0) {
      maxFlexIndex = siblings.reduce((acc, curr) => acc > curr.flexIndex ? acc : curr.flexIndex, -Infinity).flexIndex;
    } else {
      maxFlexIndex = 0;
    }

    // Create task object
    let task = {
      name: value,
      flexIndex: maxFlexIndex + 2,
      status: 0,
      parentId: parentId,
      description: ''
    };
    let id;

    // Add to IndexedDB
    try {
      id = await this.indexedDBManager.addObject(task);
    } catch (error) {
      console.log("Failed to add task to indexedDB", error);
      try {
        id = await this.retryOperation(() => this.indexedDBManager.updateObject(toRaw(task)));
      } catch (retryError) {
        console.log(retryError);
        return; // Retry failed
      }
    }

    // Send update to collaboration
    this.collabManager.send(
      "add",
      {
        value: value,
        parentId: parentId
      }
    );

    // Update current tasks (if needed)
    task.id = id;
    if (inCurrentTasks) this.currentTasks.value.push(task);
  }

  /**
   * Removes a task from indexedDBManager. If inCurrentTasks is true, updates currentTasks accordingly.
   *
   * @async
   * @param {Task} task - The task object to be removed.
   * @param {boolean} [inCurrentTasks=true] - Whether to update currentTasks after removal. Defaults to true.
   * @returns {Promise<void>} 
   */
  async removeTask(task, inCurrentTasks=true) {
    async function removeTaskWithChildren(task, indexedDBManager) {
      const removeSelfPromise = indexedDBManager.deleteObject(task.id);
      const childrenPromise = indexedDBManager.getTasksByParentId(task.id).then(children => {
        return Promise.all(children.map(child => removeTaskWithChildren(child, indexedDBManager)));
      });
      return Promise.all([removeSelfPromise, childrenPromise]);
    }

    // Remove from indexedDb
    try {
      await removeTaskWithChildren(task, this.indexedDBManager);
    } catch (error) {
      console.log("Failed to remove task from indexedDB", error);
      try {
        this.retryOperation(() => removeTaskWithChildren(task, this.indexedDBManager));
      } catch (retryError) {
        console.log(retryError);
        return; // Retry failed
      }
    }

    // Send to collab
    this.collabManager.send(
      "delete",
      {
        taskId: task.id
      }
    );

    if (inCurrentTasks) {
      let newCurrentTasks = this.currentTasks.value.filter(t => t.id !== task.id);
      this.currentTasks.value = newCurrentTasks;
    }
  }

  /**
   * Changes the name of a task in the indexedDBManager and current tasks.
   *
   * @async
   * @param {Task} task - The task object to be updated.
   * @param {String} newName - The new name for the task.
   * @returns {Promise<void>}
   */
  async changeTaskName(task, newName) {
    task.name = newName;

    // Update indexedDb
    try {
      await this.indexedDBManager.updateObject(toRaw(task));
    } catch (error) {
      console.log("Failed to change task name", error);
      try {
        this.retryOperation(() => this.indexedDBManager.updateObject(toRaw(task)));
      } catch (retryError) {
        console.log(retryError);
        return; // Retry failed
      }
    }

    // Send to collab
    this.collabManager.send(
      "update",
      {
        type: 'name',
        taskId: task.id,
        newName: newName
      }
    );
  }

  /**
   * Updates the description of a task in the indexedDBManager and current tasks.
   *
   * @async
   * @param {Task} task - The task object to be updated.
   * @param {String} newDescription - The new description for the task.
   * @returns {Promise<void>}
   */
  async updateDescription(task, newDescription) {
    task.description = newDescription;

    // Update indexedDb
    try {
      await this.indexedDBManager.updateObject(toRaw(task));
    } catch (error) {
      console.log("Failed to update description", error);
      try {
        this.retryOperation(() => this.indexedDBManager.updateObject(toRaw(task)));
      } catch (retryError) {
        console.log(retryError);
        return; // Retry failed
      }
    }

    // Send to collab
    this.collabManager.send(
      "update",
      {
        type: "description",
        taskId: task.id,
        newDescription: newDescription
      }
    )
  }

  /**
   * Updates the status of a task in the indexedDBManager and current tasks.
   *
   * @async
   * @param {Task} task - The task object to be updated.
   * @param {String} newStatus - The new status for the task. Should be one of the TASK_STATUSES.
   * @returns {Promise<void>}
   */
  async updateStatus(task, newStatus) {
    task.status = newStatus;

    // Update indexedDb
    try {
      await this.indexedDBManager.updateObject(toRaw(task));
    } catch (error) {
      console.log("Failed to update status", error);
      try {
        this.retryOperation(() => this.indexedDBManager.updateObject(toRaw(task)));
      } catch (retryError) {
        console.log(retryError);
        return; // Retry failed
      }
    }

    // Send to collab
    this.collabManager.send(
      "update",
      {
        type: "status",
        taskId: task.id,
        newStatus: newStatus
      }
    )
  }

  /**
   * Retries the provided operation a specified number of times with exponential backoff.
   *
   * @async
   * @param {function(...args): T} operation - The operation to be retried.
   * @param {number} [retries=3] - The maximum number of retry attempts. Defaults to 3.
   * @param {number} [delay=1000] - The initial delay between retries in milliseconds. Defaults to 1000.
   * @returns {Promise<T>} The result of the operation if successful.
   * @throws {Error} Throws an error if all retry attempts fail.
   * @template T
   */
  async retryOperation(operation, retries = 3, delay = 1000) {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt >= retries) throw error; // Rethrow error if max retries reached
        console.warn(`Retry attempt ${attempt}, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
    throw new Error('Operation failed after maximum retries.');
  }
}

export default TaskManager;
