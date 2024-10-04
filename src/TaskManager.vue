<script>
import { ref, toRaw } from 'vue'

let id = 1; // temp
function tempTaskGenerator(levels, _id=null) {
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  
  }
  let output = []
  for (let i=0; i<levels.length; i++) {
    output.push({
      id: id++,
      name: `task with id ${id-1}`,
      flexIndex: (i+1) * 2,
      status: getRandomInt(0, 2),
      description: "",
      subTasks: tempTaskGenerator(levels[i], _id=id-1),
      parentId: _id
    })
  }
  return output;
}
class TaskManager {
  constructor(indexedDBManager) {
    this.TASK_STATUSES = {
      TODO: 0,
      DOING: 1,
      DONE: 2
    }

    this.indexedDBManager = indexedDBManager;

    this.parentTree = ref([]);
    this.currentTasks = ref([]);

    // Binding all methods to ensure 'this' refers to the correct context
    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
    this.pushParent = this.pushParent.bind(this);
    this.popParent = this.popParent.bind(this);
    this.selectParentInTree = this.selectParentInTree.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
  }

  async init() {
    let currentParent = this.getCurrentParent();
    let parentId;
    if (currentParent === null) parentId = -1;
    else parentId = currentParent.id;

    this.currentTasks.value = await this.indexedDBManager.getTasksByParentId(parentId);
  }
  async getTaskById(taskId) {
    return this.indexedDBManager.getObjectById(taskId);
  }
  async addTask(value, parentId=null, inCurrentTasks=true) {
    let parent;
    if (inCurrentTasks) parent = this.getCurrentParent();
    else parent = await this.getTaskById(parentId);
    parentId = parent === null ? -1 : parent.id;

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

  async pushParent(task) {
    this.parentTree.value.push(task);
    this.currentTasks.value = await this.indexedDBManager.getTasksByParentId(task.id);
  }

  async popParent() {
    let task = this.parentTree.value.pop();
    if (task !== undefined) this.currentTasks.value = await this.indexedDBManager.getTasksByParentId(task.parentId);
  }

  async selectParentInTree(task) {
    let currentParent = this.getCurrentParent();
    while ( currentParent !== null && currentParent.id !== task.id ) {
      this.parentTree.value.pop();
      currentParent = this.getCurrentParent();
    }
    this.currentTasks.value = await this.indexedDBManager.getTasksByParentId(task.id);
  }

  getCurrentParent() {
    let l = this.parentTree.value.length;
    if (l === 0) return null;
    return this.parentTree.value[l-1];
  }

}
export default TaskManager;
</script>