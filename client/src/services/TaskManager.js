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
 * @param {number} [collabTaskId] - The id of task in collaboration.
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
    this.currentUIParent;

    // Binding methods to ensure correct context
    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
    this.retryOperation = this.retryOperation.bind(this);
  }

  /**
   * Initializes the TaskManager by setting the current tasks for the provided parent ID. If Collaborating, sets currentCollabTaskId.
   *
   * @async
   * @param {number} [currentParentId=-1] - The parent ID for which to fetch tasks. Defaults to -1 (root).
   */
  async init(currentParentId=-1) {

    // if in collab, sets current currentCollabTaskId.
    if (this.collaborating) {
      let tasksInCollab = await this.indexedDBManager.getTasksByCollabName(this.collabManager.collabName);
      this.currentCollabTaskId = tasksInCollab.reduce((acc, curr) => acc > curr.collabTaskId ? acc : curr.collabTaskId, -Infinity);
    }
    await this.updateCurrentTasks({parentId: currentParentId});
  }

  /**
   * Updates the current tasks based on the provided parent / parentId.
   *
   * @async
   * @param {Object} options - Contains either parentId or parent object.
   * @param {number} [options.parentId] - The parent ID for which to fetch tasks.
   * @param {Task} [options.parent] - The parent object.
   */
  async updateCurrentTasks(options) {
    if (this.collaborating) {
      let parentId = options.parentId ? 
        options.parentId :
        options.parent?.collabTaskId || -1;
      this.currentTasks.value = await this.indexedDBManager.getTasksByParentIdInCollab(this.collabManager.collabName, parentId);
      this.currentParentId = parentId;
    }
    else {
      let parentId = options.parentId ?
        options.parentId :
        options.parent?.id || -1;
      this.currentTasks.value = await this.indexedDBManager.getTasksByParentId(parentId);
      this.currentParentId = parentId;
    }
  }

  /**
   * Retrieves a task object from the indexedDBManager using the given ID. If collaborating, id is interpreted as `collabTaskId`.
   *
   * @async
   * @param {number} taskId - The ID of the task to retrieve.
   * @returns {Promise<Object>} The task object with the specified ID.
   */
  async getTaskById(taskId) {
    return this.collaborating ? 
      await this.indexedDBManager.getTaskByCollabTaskId(this.collabManager.collabName, taskId) :
      await this.indexedDBManager.getObjectById(taskId);
  }

  /**
   * Retrieves tasks array from the indexedDBManager using the given parent ID. If collaborating, it search in collaboration.
   * 
   * @param {number} parentId - The ID of the parent
   * @returns {Promise<Task[]>} Array of tasks that match given parentId 
   */
  async getTasksByParentId(parentId) {
    return this.collaborating ?
      await this.indexedDBManager.getTasksByParentIdInCollab(this.collabManager.collabName, parentId) :
      await this.indexedDBManager.getTasksByParentId(parentId);
  }

  /**
   * Adds a new task to the indexedDBManager. If inCurrentTasks is true, updates currentTasks.
   * 
   * @param {Object} options
   * @param {string} options.value - The name of the task to be added.
   * @param {number} [options.parentId] - The ID of the parent task. Interpreted as `collabTaskId` if in collaboration.
   * @param {Task} [options.parent] - Parent object, where the task should be added.
   * @param {boolean} [options.fromUI] - Whether to send operation to collaboration if in any.
   * @returns {Promise<void>} 
   */
  // async addTask(value, parentId, inCurrentTasks=true, updateCollab=true) {
  async addTask(options) {
    if (options.parent) {
      options.parent = options.parent
    }

    const getMaxFlexIndex = siblings => {
      let maxFlexIndex;
      if (siblings.length > 0) {
        maxFlexIndex = siblings.reduce((acc, curr) => acc > curr.flexIndex ? acc : curr.flexIndex, -Infinity);
      } else {
        maxFlexIndex = 0;
      }
      return maxFlexIndex;
    }

    let task;
    
    if (this.collaborating) {
      let parentId = options.parentId || options.parent?.collabTaskId || -1;

      // Get maxFlexIndex
      let siblings = await this.indexedDBManager.getTasksByParentIdInCollab(this.collabManager.collabName, parentId);
      let maxFlexIndex = getMaxFlexIndex(siblings);

      // Create task object
      task = {
        name: options.value,
        flexIndex: maxFlexIndex + 2,
        status: 0,
        parentId: parentId,
        description: '',
        collabName: this.collabManager.collabName,
        collabTaskId: ++this.currentCollabTaskId
      };

    }
    else {
      let parentId = options.parentId || options.parent?.id || -1;

      // Get maxFlexIndex
      let siblings = await this.indexedDBManager.getTasksByParentId(parentId);
      let maxFlexIndex = getMaxFlexIndex(siblings);

      // Create task object
      task = {
        name: options.value,
        flexIndex: maxFlexIndex + 2,
        status: 0,
        parentId: parentId,
        description: ''
      };

    }
    
    // Add to IndexedDB
    let id;
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
    task.id = id;
    
    // Send update to collaboration if needed.
    if (this.collaborating && options.fromUI) {
      
      // this.collabManager.send(
      //   "add",
      //   {
      //     value: task.name,
      //     parentId: task.parentId
      //   }
      // );

    }
  
    // Update current tasks if needed
    if (task.parentId === this.currentParentId) this.currentTasks.value.push(task);

  }

  /**
   * Removes a task from indexedDBManager.
   *
   * @async
   * @param {Object} options
   * @param {number} [options.taskId] - The id of the task object to be removed. If collaborating, it will be interpreter as `collabTaskId`.
   * @param {Task} [options.task] - The task object to be removed.
   * @param {boolean} [options.fromUI] - Whether to send update to collaboration if in any.
   * 
   */
  async removeTask(options) {
    let indexedDBManager = this.indexedDBManager;
    let collabName = this.collabManager?.collabName;

    async function removeTaskWithChildren(task) {
      const removeSelfPromise = indexedDBManager.deleteObject(task.id);
      const childrenPromise = indexedDBManager.getTasksByParentId(task.id).then(children => {
        return Promise.all(children.map(child => removeTaskWithChildren(child)));
      });
      return Promise.all([removeSelfPromise, childrenPromise]);
    }
    async function removeTaskWithChildrenInCollab(task) {
      const removeSelfPromise = indexedDBManager.deleteObject(task.id);
      const childrenPromise = indexedDBManager.getTasksByParentIdInCollab(collabName, task.collabTaskId).then(children => {
        return Promise.all(children.map(child => removeTaskWithChildrenInCollab(child)));
      });
      return Promise.all([removeSelfPromise, childrenPromise]);
    }

    let removeFunc;
    let task;
    if (this.collaborating) {
      task = options.task || await this.indexedDBManager.getTaskByCollabTaskId(collabName, task.collabTaskId);
      removeFunc = removeTaskWithChildrenInCollab;
    } else {
      task = options.task || await this.getTaskById(options.taskId);
      removeFunc = removeTaskWithChildren
    }

    // Remove from indexedDb
    try {
      await removeFunc(task);
    } catch (error) {
      console.log("Failed to remove task from indexedDB", error);
      try {
        this.retryOperation(() => removeFunc(task));
      } catch (retryError) {
        console.log(retryError);
        return; // Retry failed
      }
    }

    // Send to collab
    if (this.collaborating && options.fromUI) {
      // this.collabManager.send(
      //   "delete",
      //   {
      //     taskId: task.collabTaskId
      //   }
      // );
    }

    if (task.parentId === this.currentParentId) {
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
   * @param {boolean} [fromUI=false] - Whether to send update to collaboration if in any.
   * @returns {Promise<void>}
   */
  async changeTaskName(task, newName, fromUI=false) {
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
    if (this.collaborating && fromUI) {
      // this.collabManager.send(
      //   "update",
      //   {
      //     type: 'name',
      //     taskId: task.id,
      //     newName: newName
      //   }
      // );
    }
  }

  /**
   * Updates the description of a task in the indexedDBManager and current tasks.
   *
   * @async
   * @param {Task} task - The task object to be updated.
   * @param {String} newDescription - The new description for the task.
   * @param {boolean} [fromUI=false] - Whether to send update to collaboration if in any.
   * @returns {Promise<void>}
   */
  async updateDescription(task, newDescription, fromUI=false) {
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
    if (this.collaborating && fromUI) {
      // this.collabManager.send(
      //   "update",
      //   {
      //     type: "description",
      //     taskId: task.id,
      //     newDescription: newDescription
      //   }
      // )
    }
  }

  /**
   * Updates the status and flex indexes after dragging.
   *
   * @async
   * @param {Task} task - The task object to be updated.
   * @param {String} newStatus - The new status for the task. Should be one of the TASK_STATUSES.
   * @param {boolean} [fromUI=false] - Whether to send update to collaboration if in any.
   * @returns {Promise<void>}
   * 
   * @param {Object} options
   * @param {Task} [options.draggedTask] - The dragged task (with new flexIndex and new status)
   * @param {number} [options.draggedTaskId] - The id of the dragged task. Interpreted as `collabTaskId` if in collaboration.
   * @param {number} [options.newStatus] - New status of dragged task.
   * @param {number} [options.newFlexIndex] - New flex index of dragged task.
   * @param {boolean} [options.fromUI] - Whether to send to collaboration if in any.
   * 
   */
  async fixFlexIndexesAndSetStatus(options) {

    // For sending to collaboration
    let savedNewFlexIndex = options.newFlexIndex || options.draggedTask.flexIndex;

    // Get task
    let task;
    if (options.draggedTask) task = options.draggedTask;
    else {
      task = await this.getTaskById(options.draggedTaskId)
      task.status = options.newStatus;
      task.flexIndex = options.newFlexIndex;
    }

    // Get siblings
    let siblings = options.fromUI ?
      toRaw(this.currentTasks.value) :
      await this.getTasksByParentId(task.parentId);
    
    // To update for indexedDB batch
    let toUpdate = [];
    for (let i = 0; i < siblings.length; i++) {
      const t = siblings[i];
      if (t.id === task.id) {
        t.status = task.status;
        t.flexIndex = task.flexIndex;
        toUpdate.push(t);
      }
      else if (t.status === task.status) {
        toUpdate.push(t);
      }
    }
    
    toUpdate.sort((t1, t2) => t1.flexIndex - t2.flexIndex);
    for (let i = 0; i < toUpdate.length; i++) {
      toUpdate[i].flexIndex = (i + 1) * 2;
    }
    
    
    // Update indexedDb
    try {
      await this.indexedDBManager.batchUpdate(toRaw(toUpdate));
    } catch (error) {
      console.log("Failed to update status", error);
      try {
        this.retryOperation(() => this.indexedDBManager.batchUpdate(toRaw(toUpdate)));
      } catch (retryError) {
        console.log(retryError);
        return; // Retry failed
      }
    }

    // Send to collab
    if (this.collaborating && options.fromUI) {
      // this.collabManager.send(
      //   "update",
      //   {
      //     type: "drag",
      //     taskId: task.collabTaskId,
      //     newStatus: task.status,
      //     newFlexIndex: savedNewFlexIndex
      //   }
      // )
    }
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
