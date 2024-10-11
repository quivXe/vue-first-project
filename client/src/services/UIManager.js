import { ref } from 'vue';
import { useRouter } from 'vue-router';
import TaskManager from './TaskManager';

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
 * Manages the UI interactions and states for task management.
 *
 * @class UIManager
 */
class UIManager {
  /**
   * Creates an instance of UIManager.
   *
   * @constructor
   * @param {TaskManager} taskManager - An instance of TaskManager to manage tasks.
   */
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.router = useRouter();

    this._parentTree = ref([]);
    this._mouseReleasedToggle = ref(false);
    this._creatingNewTask = ref(false);
    this._showOptions = ref(false);
    this._changingTaskName = ref(null);
    this._showDescription = ref(false);

    this.optionsMenuData = {};
    this.draggedTask = null;

    // Bind methods to the instance
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

  /**
   * Initializes the UIManager by updating current tasks.
   *
   * @param {TaskManager} taskManager - An instance of TaskManager.
   */
  init(taskManager) {
    this.taskManager = taskManager;
    this._currentTasks = ref(this.taskManager.currentTasks);
  }

  get currentTasks() { return this._currentTasks.value; }

  get parentTree() { return this._parentTree.value; }

  get mouseReleasedToggle() { return this._mouseReleasedToggle.value; }
  set mouseReleasedToggle(v) { this._mouseReleasedToggle.value = v; }

  get creatingNewTask() { return this._creatingNewTask.value; }
  set creatingNewTask(v) { this._creatingNewTask.value = v; }

  get changingTaskName() { return this._changingTaskName.value; }
  set changingTaskName(v) { this._changingTaskName.value = v; }

  get showOptions() { return this._showOptions.value; }
  set showOptions(v) { this._showOptions.value = v; }

  get showDescription() { return this._showDescription.value; }
  set showDescription(v) { this._showDescription.value = v; }

  get TASK_STATUSES() { return this.taskManager.TASK_STATUSES; }

  /**
   * Handles the event when a task is clicked.
   *
   * @param {Task} task - The task object that was clicked.
   */
  taskClicked(task) {
    this.pushParent(task);
  }

  /**
   * Handles the event when a task delete button is clicked.
   *
   * @param {Task} task - The task object to be deleted.
   */
  deleteTaskClicked(task) {
    this.taskManager.removeTask({ task, fromUI: true });
  }

  /**
   * Handles the event for changing a task's name when the user exits the name input.
   *
   * @param {Task} task - The task object to be updated.
   * @param {String} newName - The new name for the task.
   */
  changeTaskName(task, newName) {
    this.taskManager.changeTaskName(task, newName, true);
    this.changingTaskName = null;
  }

  /**
   * Handles the event for updating a task's description.
   *
   * @param {Task} task - The task object to be updated.
   * @param {String} newDescription - The new description for the task.
   */
  updateDescription(task, newDescription) {
    this.taskManager.updateDescription(task, newDescription, true);
  }

  /** 
   * Handles the click event on the create task button.
   */
  addTaskClicked() {
    this.creatingNewTask = true;
  }

  /**
   * Handles the blur event when the user exits the task name input.
   *
   * @param {String} value - The name of the new task to be added.
   */
  newTaskBlur(value) {
    let parent = this.getCurrentParent();
    this.taskManager.addTask({ value, parent, fromUI: true });
    this.creatingNewTask = false;
  }

  /**
   * Handles mouse over a task element event. Updates flexIndex 
   * whenever the dragged task changes its location.
   *
   * @param {Task} taskOver - The task object that the dragged task is over.
   */
  mouseOverTask(taskOver) {
    if (this.draggedTask === null) return;
    if (this.draggedTask.id === taskOver.id) return;
    this.draggedTask.flexIndex = this.draggedTask.flexIndex > taskOver.flexIndex ? 
      taskOver.flexIndex - 1 :
      taskOver.flexIndex + 1;
  }

  /**
   * Handles mouse over column event. Updates the status of the dragged task.
   *
   * @param {number} columnStatusNumber - The new status number for the dragged task.
   */
  mouseOverColumn(columnStatusNumber) {
    if (this.draggedTask === null) return;
    this.draggedTask.status = columnStatusNumber;
  }

  /**
   * Handles the click event on the options button in a task.
   *
   * @param {Task} task - The task object for which options are shown.
   */
  taskOptionsClicked(task) {
    this.showOptions = true;
    this.optionsMenuData = {
      header: "OPTIONS",
      options: [
        {
          name: "Delete", callback: () => {
            this.showOptions = false;
            this.deleteTaskClicked(task);
          }
        },
        {
          name: "Change name", callback: () => {
            this.changingTaskName = task;
            this.showOptions = false;
          }
        },
        {
          name: "Share", callback: () => {
            this.router.push({ name: 'ShareTask', params: { taskId: task.id } });
          }
        }
      ]
    };
  }

  /**
   * Handles the event when a task starts being dragged.
   *
   * @param {Task} task - The task object that is being dragged.
   */
  startDraggingTaskTriggered(task) {
    this.draggedTask = this.currentTasks.find(t => t.id == task.id);
  }

  /**
   * Handles the event when dragging stops.
   *
   * @param {Task} task - The task object that was dragged.
   */
  stopDraggingTaskTriggered(task) {
    this.draggedTask = null;

    this.taskManager.fixFlexIndexesAndSetStatus({draggedTask: task, fromUI: true});
  }

  /**
   * Returns the task object of the current parent.
   *
   * @param {Object} [options={}]
   * @param {boolean} [options.getId] - Whether to return the parent's ID instead of the task object.
   * @returns {Object|null} The current parent task object, or null if none exists.
   */
  getCurrentParent(options={}) {
    const { getId } = options;

    let currentParent = this._parentTree.value[this._parentTree.value.length - 1];
    if (getId) return currentParent?.id || -1;
    return currentParent || null;
  }

  /**
   * Pushes the provided task to the parent tree.
   *
   * @param {Task} task - The task object to be pushed to the parent tree.
   */
  pushParent(task) {
    this._parentTree.value.push(task);
    this.taskManager.updateCurrentTasks({ parent: task });
  }

  /**
   * Pops the parent from the parent tree and returns it.
   *
   * @returns {Task|null} The task object that was popped, or null if none exists.
   */
  popParent() {
    let parentPopped = this._parentTree.value.pop();
    if (parentPopped !== undefined) this.taskManager.updateCurrentTasks({ parent: this.getCurrentParent() });
    return parentPopped;
  }

  /**
   * Handles the event when a user selects a provided parent from the parent tree.
   *
   * @param {Task} task - The task object to be selected as a parent.
   */
  selectParentInTree(task) {

    let currentParent = this.getCurrentParent();

    if (task === currentParent) return; // Nothing has changed

    if (task === null) { // Home clicked
      this._parentTree.value = [];
      currentParent = null;
    } else {
      while (task.id !== currentParent.id) {
        this.parentTree.pop();
        currentParent = this.getCurrentParent();
      }
    }

    // Update current tasks
    this.taskManager.updateCurrentTasks({ parent: currentParent });

  }
}

export default UIManager;
