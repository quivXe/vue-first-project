<script>
import { ref } from 'vue'

class UIManager {
  constructor(taskManager) {
    this.taskMaanger = taskManager;

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
    this.backButtonClicked = this.backButtonClicked.bind(this);
    this.mouseOverTask = this.mouseOverTask.bind(this);
    this.mouseOverColumn = this.mouseOverColumn.bind(this);
    this.startDraggingTaskTriggered = this.startDraggingTaskTriggered.bind(this);
    this.stopDraggingTaskTriggered = this.stopDraggingTaskTriggered.bind(this);
    this.taskOptionsClicked = this.taskOptionsClicked.bind(this);
    this.parentClicked = this.parentClicked.bind(this);
    this.getCurrentParent = this.getCurrentParent.bind(this);
  }

  get currentTasks() {
    return this.taskMaanger.currentTasks.value;
  }

  get parentTree() {
    return this.taskMaanger.parentTree.value;
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
    return this.taskMaanger.TASK_STATUSES;
  }

  taskClicked(task) {
    this.taskMaanger.pushParent(task);
  }

  deleteTaskClicked(task) {
    this.taskMaanger.removeTask(task);
  }

  changeTaskName(task, newName) {
    this.taskMaanger.changeTaskName(task, newName);
    this.changingTaskName = null;
  }

  updateDescription(task, newDescription) {
    this.taskMaanger.updateDescription(task, newDescription);
  }
  addTaskClicked() {
    this.creatingNewTask = true;
  }

  newTaskBlur(value) {
    this.taskMaanger.addTask(value);
    this.creatingNewTask = false;
  }

  backButtonClicked() {
    this.taskMaanger.popParent();
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
        { name: "Delete", callback: () => {
          this.showOptions = false;
          this.taskMaanger.removeTask(task);
        }},
        { name: "Change name", callback: () => {
          this.changingTaskName = task;
          this.showOptions = false;
        }}
      ]
    };
  }


  startDraggingTaskTriggered(task) {
    this.draggedTask = this.taskMaanger.getCurrentTasks().find(t => t.id == task.id);
  }
  stopDraggingTaskTriggered(task) {
    this.draggedTask = null;

    // update flex indexes
    let _currentTasks = this.taskMaanger.getCurrentTasks();
    _currentTasks.sort((t1, t2) => t1.flexIndex - t2.flexIndex);
    for (let i = 0; i < _currentTasks.length; i++) {
      _currentTasks[i].flexIndex = (i+1) * 2;
    }
  }

  parentClicked(parent) {
    if (parent === null) {
      do {
        parent = this.taskMaanger.popParent();
      } while (parent !== undefined);
    }
    else this.taskMaanger.selectParentInTree(parent);
  }

  getCurrentParent() {
    return this.parentTree[this.parentTree.length - 1];
  }
}

export default UIManager
</script>