import { toRaw, ref } from 'vue'

class TaskManager {
  constructor(indexedDBManager, collabName=null) {
    this.TASK_STATUSES = {
      TODO: 0,
      DOING: 1,
      DONE: 2
    }

    this.indexedDBManager = indexedDBManager;

    this.currentTasks = ref([]);
    this.collabName = collabName;

    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
  }

  async init(currentParentId=-1) {
    await this.updateCurrentTasks(currentParentId);
  }

  async updateCurrentTasks(parentId) {
    if (parentId === -1 && this.collabName !== null) {
      let tasks = await this.indexedDBManager.getTasksByParentId(parentId);
      this.currentTasks.value = tasks.filter(t => t.collabName === this.collabName);
    } else {
      this.currentTasks.value = await this.indexedDBManager.getTasksByParentId(parentId);
    }
  }

  async getTaskById(taskId) {
    return this.indexedDBManager.getObjectById(taskId);
  }

  async addTask(value, parentId, inCurrentTasks=true) {

    // get maxFlexIndex
    const siblings = await this.indexedDBManager.getTasksByParentId(parentId);
    let maxFlexIndex;
    if (siblings.length > 0) maxFlexIndex = siblings.reduce((acc, curr) => { return acc > curr ? acc : curr }, -Infinity).flexIndex;
    else maxFlexIndex = 0;

    let task = {
      name: value,
      flexIndex: maxFlexIndex + 2,
      status: 0,
      parentId: parentId,
      description: ''
    }

    let id = await this.indexedDBManager.addObject(task);
    task.id = id;

    if (inCurrentTasks) this.currentTasks.value.push(task);
  }

  async removeTask(task, inCurrentTasks=true) {
    async function getRemoveTreePromises(task, indexedDBManager) {
      const removeSelfPromise = indexedDBManager.deleteObject(task.id)
      const childrenPromise = indexedDBManager.getTasksByParentId(task.id).then(children => {
        return Promise.all( children.map(child => getRemoveTreePromises(child, indexedDBManager)) );
      });
      return Promise.all([removeSelfPromise, childrenPromise]);
    }

    await getRemoveTreePromises(task, this.indexedDBManager);

    if (inCurrentTasks) {
      let newCurrentTasks = this.currentTasks.value.filter(t => t.id !== task.id);
      this.currentTasks.value = newCurrentTasks;
    }
  }

  async changeTaskName(task, newName) {
    task.name = newName;
    await this.indexedDBManager.updateObject(toRaw(task));
  }

  async updateDescription(task, newDescription) {
    task.description = newDescription;
    await this.indexedDBManager.updateObject(toRaw(task));
  }

  async updateStatus(task, newStatus) {
    task.status = newStatus;
    await this.indexedDBManager.updateObject(toRaw(task));
  }

}
export default TaskManager;