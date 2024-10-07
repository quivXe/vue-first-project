import { ref } from 'vue'
import { useRouter } from 'vue-router';

class UIManager {
  constructor(taskManager) {
    this.taskManager = taskManager;

    this.router = useRouter();

    this._parentTree = ref([]);
    this._mouseReleasedToggle = ref(false);
    this._creatingNewTask = ref(false);
    this._showOptions = ref(false);
    this._changingTaskName = ref(null);
    this._showDescription = ref(false);
    this.optionsMenuData = {}
    this.draggedTask = null;

    // Bind methods to the instance
    // Ensure that methods always refer to the class instance (even when passed as callbacks)
    this.taskClicked = this.taskClicked.bind(this);
    this.deleteTaskClicked = this.deleteTaskClicked.bind(this);
    this.changeTaskName = this.changeTaskName.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
    this.addTaskClicked = this.addTaskClicked.bind(this);
    this.newTaskBlur = this.newTaskBlur.bind(this);
    this.mouseOverTask = this.mouseOverTask.bind(this);
    this.mouseOverColumn = this.mouseOverColumn.bind(this);
    this.startDraggingTaskTriggered = this.startDraggingTaskTriggered.bind(this);
    this.stopDraggingTaskTriggered = this.stopDraggingTaskTriggered.bind(this);
    this.taskOptionsClicked = this.taskOptionsClicked.bind(this);
    this.getCurrentParent = this.getCurrentParent.bind(this);
    this.pushParent = this.pushParent.bind(this);
    this.popParent = this.popParent.bind(this);
    this.selectParentInTree = this.selectParentInTree.bind(this);
  }

  init(taskManager) {
    this.taskManager = taskManager;
    this._currentTasks = ref(this.taskManager.currentTasks);
  }

  get currentTasks() {
    return this._currentTasks.value;
  }

  get parentTree() {
    return this._parentTree.value;
  }

  get mouseReleasedToggle() {
    return this._mouseReleasedToggle.value;
  }
  set mouseReleasedToggle(v) {
    this._mouseReleasedToggle.value = v;
  }

  get creatingNewTask() {
    return this._creatingNewTask.value;
  }
  set creatingNewTask(v) {
    this._creatingNewTask.value = v;
  }

  get changingTaskName() {
    return this._changingTaskName.value;
  }
  set changingTaskName(v) {
    this._changingTaskName.value = v;
  }

  get showOptions() {
    return this._showOptions.value
  }
  set showOptions(v) {
    this._showOptions.value = v;
  }

  get showDescription() {
    return this._showDescription.value;
  }
  set showDescription(v) {
    this._showDescription.value = v;
  }

  get TASK_STATUSES() {
    return this.taskManager.TASK_STATUSES;
  }

  taskClicked(task) {
    this.pushParent(task);
  }

  deleteTaskClicked(task) {
    this.taskManager.removeTask(task);
  }

  changeTaskName(task, newName) {
    this.taskManager.changeTaskName(task, newName);
    this.changingTaskName = null;
  }

  updateDescription(task, newDescription) {
    this.taskManager.updateDescription(task, newDescription);
  }
  addTaskClicked() {
    this.creatingNewTask = true;
  }

  newTaskBlur(value) {
    let parentId = this.getCurrentParent(true);
    this.taskManager.addTask(value, parentId);
    this.creatingNewTask = false;
  }

  mouseOverTask(taskOver) {
    if (this.draggedTask === null) return;
    if (this.draggedTask.id === taskOver.id) return;
    this.draggedTask.flexIndex = this.draggedTask.flexIndex > taskOver.flexIndex ? 
      taskOver.flexIndex - 1 :
      taskOver.flexIndex + 1;
    }
  
  mouseOverColumn(columnStatusNumber) {
    if (this.draggedTask === null) return;
    this.draggedTask.status = columnStatusNumber;
  }

  taskOptionsClicked(task) {
    this.showOptions = true;
    this.optionsMenuData = {
      header: "OPTIONS",
      options: [
        { 
          name: "Delete", callback: () => {
            this.showOptions = false;
            this.taskManager.removeTask(task);
        }},
        { 
          name: "Change name", callback: () => {
            this.changingTaskName = task;
            this.showOptions = false;
        }},
        {
          name: "Share", callback: () => {
            this.router.push({ name: 'ShareTask', params: { taskId: task.id } });
          }
        }
      ]
    };
  }

  startDraggingTaskTriggered(task) {
    this.draggedTask = this.currentTasks.find(t => t.id == task.id);
  }
  stopDraggingTaskTriggered(task) {
    this.draggedTask = null;

    // update flex indexes
    let _currentTasks = this.currentTasks;
    _currentTasks.sort((t1, t2) => t1.flexIndex - t2.flexIndex);
    for (let i = 0; i < _currentTasks.length; i++) {
      _currentTasks[i].flexIndex = (i+1) * 2;
    }

    this.taskManager.updateStatus(task, task.status);
  }

  getCurrentParent(getId=false) {
    let currentParent = this._parentTree.value[this._parentTree.value.length - 1];
    if (getId) {
      return currentParent === undefined ? 
        -1 :
        currentParent.id;
    } else {
      return currentParent === undefined ?
        null :
        currentParent
    }
  }

  pushParent(task) {
    this._parentTree.value.push(task);
    this.taskManager.updateCurrentTasks(task.id);
  }

  popParent() {
    let parentPopped = this._parentTree.value.pop();
    let newParentId = this.getCurrentParent(true);
    if (parentPopped !== undefined) this.taskManager.updateCurrentTasks(newParentId);
    return parentPopped;
  }

  selectParentInTree(task) {
    let currentParentId = this.getCurrentParent(true);

    if (task === null) this._parentTree.value = []; // home is clicked
    else {
      while (task.id !== this.getCurrentParent(true)) {
        this.parentTree.pop();
      }
    }

    // update current tasks if needed
    let newParentId = this.getCurrentParent(true);
    if (currentParentId !== newParentId) this.taskManager.updateCurrentTasks(newParentId);
  }
}

export default UIManager