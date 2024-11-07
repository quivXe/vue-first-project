import { toRaw, ref } from 'vue';
import IndexedDBManager from './IndexedDBManager';
import CollaborationManager from './CollaborationManager';
import { generateUUID } from '../utils/uuid';
import { handleFetchError } from '../utils/handleErrorUtil';

function handleIdbError(text, error) {
  window.dispatchEvent(
    new CustomEvent('show-notification', {
        detail: "Something went wrong."
    })
  );

  console.log(text);
  console.warn(error);
};

/**
 * Task object, stored in indexedDB, and displayed by UIManager
 *
 * @typedef {Object} Task
 * 
 * @param {String} name
 * @param {Int} flexIndex - Flex position (order) in the column.
 * @param {Int} status - Has to be value from TaskManager.TASK_STATUSES
 * @param {Int} parentId - Id of task that is one tier above
 * @param {String} description
 * @param {String} [collabName=null] - The name of collaboration (if any). Defaults to null.
 * @param {string} [collabTaskId] - The id of task in collaboration (UUID).
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
   * @param {Array<Task>} [parentTree=[]] - The parent tree of tasks. Defaults to empty array.
   */
  constructor(indexedDBManager, collabManager=null, parentTree=[]) {
    this.TASK_STATUSES = {
      TODO: 0,
      DOING: 1,
      DONE: 2
    }

    this.indexedDBManager = indexedDBManager;
    this.collabManager = collabManager;
    this.parentTree;

    this.collaborating = collabManager !== null;
    this.currentTasks = ref([]);
    this.parentTree = ref(parentTree);

    // Binding methods to ensure correct context
    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
    this.retryOperation = this.retryOperation.bind(this);
  }

  get currentParentId() {
    return this.collaborating ? 
      this.parentTree.value[this.parentTree.value.length - 1]?.collabTaskId || -1 :
      this.parentTree.value[this.parentTree.value.length - 1]?.id || -1;
  }
  /**
   * Initializes the TaskManager by updating current tasks based on the current parent.
   *
   * @async
   */
  async init() {
    await this.updateCurrentTasks({parentId: this.currentParentId});
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
    }
    else {
      let parentId = options.parentId ?
        options.parentId :
        options.parent?.id || -1;
      this.currentTasks.value = await this.indexedDBManager.getTasksByParentId(parentId);
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
   * @param {Task|null} [options.parent] - Parent object, where the task should be added, if null, add to root.
   * @param {string} [options.collabTaskId] - The collabTaskId of the task to be added (UUID).
   * @param {boolean} [options.fromUI] - Whether to send operation to collaboration if in any.
   * @returns {Promise<void>} 
   */
  async addTask(options) {

    const getMaxFlexIndex = siblings => {
      siblings = siblings.filter(t => t.status === this.TASK_STATUSES.TODO);
      let maxFlexIndex;
      if (siblings.length > 0) {
        maxFlexIndex = siblings.reduce((acc, curr) => acc > curr.flexIndex ? acc : curr.flexIndex, -Infinity);
      } else {
        maxFlexIndex = 0;
      }
      return maxFlexIndex;
    }

    let task = {
      name: options.value,
      status: this.TASK_STATUSES.TODO,
      description: '',
    };
    let parentId;

    if (this.collaborating) {
      task.collabName = this.collabManager.collabName;
      parentId = options.parentId || options.parent?.collabTaskId || -1;
      task.collabTaskId = options.collabTaskId || generateUUID();
    } 
    else { 
      parentId = options.parentId || options.parent?.id || -1;
    }
    task.parentId = parentId;

    // Set maxFlexIndex
    const siblings = await this.getTasksByParentId(parentId);
    task.flexIndex = getMaxFlexIndex(siblings) + 2;
    
    // Send update to collaboration if needed.
    if (this.collaborating && options.fromUI) {
      try {
        await this.collabManager.send(
          "add",
          {
            value: task.name,
            parentId: task.parentId,
            collabTaskId: task.collabTaskId,
          }
        )
      } catch({err, url}) {
        console.log("Failed to send add task", err);
        console.log(url, err.status);
        handleFetchError({ url: url, statusCode: err.status });
        return;
      }
    }
    
    // Add to IndexedDB
    let id;
    try {
      id = await this.indexedDBManager.addObject(task);
    } catch (error) {
      try {
        id = await this.retryOperation(() => this.indexedDBManager.updateObject(toRaw(task)));
      } catch (retryError) {
        handleIdbError("Failed to add task in indexedDB", error);
        return; // Retry failed
      }
    }
    task.id = id;
  
    // Update current tasks if needed
    if (task.parentId === this.currentParentId) this.currentTasks.value.push(task);;

  }  /**
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
    const indexedDBManager = this.indexedDBManager;
    const taskManager = this;

    async function removeTaskWithChildren(task) {
      const removeSelfPromise = indexedDBManager.deleteObject(task.id);
      const childrenPromise = taskManager.getTasksByParentId(taskManager.collaborating ? task.collabTaskId : task.id).then(children => {
        return Promise.all(children.map(child => removeTaskWithChildren(child)));
      });
      return Promise.all([removeSelfPromise, childrenPromise]);
    }
    const task = options.task || await this.getTaskById(options.taskId);

    // Send to collab
    if (this.collaborating && options.fromUI) {
      try {
        await this.collabManager.send(
          "delete",
          {
            taskId: task.collabTaskId
          }
        );
      } catch({err, url}) {
        console.log("Failed to send delete task", err);
        handleFetchError({ url: url, statusCode: err.status });
        return;
      }
    }

    // Remove from indexedDb
    try {
      await removeTaskWithChildren(task);
    } catch (error) {
      try {
        this.retryOperation(() => removeTaskWithChildren(task));
      } catch (retryError) {
        handleIdbError("Failed to remove task from indexedDB", error);
        return; // Retry failed
      }
    }

    // Update parent tree and current tasks
    if (this.parentTree.value.find(t => t.collabTaskId === task.collabTaskId)) {

      while (this.currentParentId !== task.collabTaskId) {
        this.parentTree.value.pop();
      }
      this.parentTree.value.pop();

      this.updateCurrentTasks({ parentId: task.parentId });
    }
    else if (task.parentId === this.currentParentId) {
      let newCurrentTasks = this.currentTasks.value.filter(t => t.id !== task.id);
      this.currentTasks.value = newCurrentTasks;
    }
  }

  /**
   * Changes the name of a task in the indexedDBManager and current tasks.
   *
   * @async
   * @param {Object} options - Options
   * @param {String} options.newName - The new name for the task.
   * @param {Task} [options.task] - The task object to be updated.
   * @param {string} [options.taskId] - The id of the task object to be updated.
   * @param {boolean} [options.fromUI] - Whether to send update to collaboration if in any.
   * @returns {Promise<void>}
   */
  async changeTaskName(options) {
    console.log(options.taskId);
    const task = options.task || await this.getTaskById(options.taskId);

    // Send to collab
    if (this.collaborating && options.fromUI) {
      try {
        await this.collabManager.send(
          "update",
          {
            type: 'name',
            taskId: task.collabTaskId,
            newName: options.newName
          }
        );
      } catch({err, url}) {
        console.log("Failed to send update to collab", err);
        handleFetchError({ url: url, statusCode: err.status });
        return;
      }
    }

    task.name = options.newName;

    // Update indexedDb
    try {
      await this.indexedDBManager.updateObject(toRaw(task));
    } catch (error) {
      try {
        this.retryOperation(() => this.indexedDBManager.updateObject(toRaw(task)));
      } catch (retryError) {
        handleIdbError("Failed to change task name", error);
        return; // Retry failed
      }
    }

    // Update if needed
    if (!options.task && task.parentId === this.currentParentId) {
      let newCurrentTasks = this.currentTasks.value.map(t => {
        if (t.id === task.id) t.name = options.newName;
        return t;
      });
      this.currentTasks.value = newCurrentTasks;
    }
  }

  /**
   * Updates the description of a task in the indexedDBManager and current tasks.
   *
   * @async
   * @param {Object} options - Options
   * @param {String} options.newDescription - The new description for the task.
   * @param {Task} [options.task] - The task object to be updated.
   * @param {number} [options.taskId] - The id of the task object to be updated.
   * @returns {Promise<void>}
   */
  async updateDescription(options) {
    const task = options.task || await this.getTaskById(options.taskId);
    const newDescription = options.newDescription;

    // Send to collab
    if (this.collaborating && options.fromUI) {
      try {
        await this.collabManager.send(
          "update",
          {
            type: "description",
            taskId: task.collabTaskId,
            newDescription: newDescription
          }
        )
      }
      catch({err, url}) {
        console.log("Failed to send update description", err);
        handleFetchError({ url: url, statusCode: err.status });
        return;
      }
    }

    task.description = newDescription;

    // Update indexedDb
    try {
      await this.indexedDBManager.updateObject(toRaw(task));
    } catch (error) {
      try {
        this.retryOperation(() => this.indexedDBManager.updateObject(toRaw(task)));
      } catch (retryError) {
        handleIdbError("Failed to update task description", error);
        return; // Retry failed
      }
    }

    // Update if needed
    if (!options.task && this.collaborating) {
      let toUpdateTask = this.parentTree.value.find(t => t.collabTaskId === task.collabTaskId);
      if (toUpdateTask) toUpdateTask.description = newDescription;
      else {
        let toUpdateTask = this.currentTasks.value.find(t => t.collabTaskId === task.collabTaskId);
        if (toUpdateTask) toUpdateTask.description = newDescription;
      }
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
    let newStatus;
    if (options.draggedTask) { newStatus = options.draggedTask.status; }
    else { newStatus = options.newStatus; }

    // Get task
    let task;
    if (options.draggedTask) task = options.draggedTask;
    else {
      task = await this.getTaskById(options.draggedTaskId)
      task.status = newStatus;
      task.flexIndex = options.newFlexIndex;
    }

    // Send to collab
    if (this.collaborating && options.fromUI) {
      try {
        await this.collabManager.send(
          "update",
          {
            type: "drag",
            taskId: task.collabTaskId,
            newStatus: newStatus,
            newFlexIndex: savedNewFlexIndex
          }
        )
      }
      catch({err, url}) {
        console.log("Failed to send status to collaboration", err);
        handleFetchError({ url: url, statusCode: err.status });
        return;
      }
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
      try {
        this.retryOperation(() => this.indexedDBManager.batchUpdate(toRaw(toUpdate)));
      } catch (retryError) {
        handleIdbError("Failed to update task status", error);
        return; // Retry failed
      }
    }

    // Update if needed
    if (!options.draggedTask && task.parentId === this.currentParentId) {
      this.updateCurrentTasks({ parentId: this.currentParentId });
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
