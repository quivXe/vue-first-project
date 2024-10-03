<script setup>
import { ref, computed, onMounted } from 'vue'
import TodoParentTree from './components/nav/todoParentTree.vue'
import TodoItem from "./components/todoColumn/todoItem/todoItem.vue"
import TodoBackButton from "./components/nav/todoBackButton.vue"
import TodoColumn from "./components/todoColumn/todoColumn.vue"
import TodoItemAdd from "./components/todoColumn/todoItem/todoItemAdd.vue"
import Options from "./components/options.vue"
import Description from './components/todoDescription/description.vue'
import ShowDescriptionButton from './components/todoDescription/showDescriptionButton.vue'

let id = 1; // temp
function tempTaskGenerator(levels) {
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
      subTasks: tempTaskGenerator(levels[i])
    })
  }
  return output;
}
class TaskManager {
  constructor() {
    this.TASK_STATUSES = {
      TODO: 0,
      DOING: 1,
      DONE: 2
    }

    this.allTasks = ref(tempTaskGenerator([[[[], [], []], []], [[[], []], []], [[]]]))

    this.parentTree = ref([]);

    this.currentTasks = computed(() => {
      return this.getCurrentTasks();
    })

    // Binding all methods to ensure 'this' refers to the correct context
    this.getCurrentTasks = this.getCurrentTasks.bind(this);
    this.findTaskParent = this.findTaskParent.bind(this);
    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
    this.pushParent = this.pushParent.bind(this);
    this.popParent = this.popParent.bind(this);
    this.selectParentInTree = this.selectParentInTree.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
  }

  getCurrentTasks(index = 0, subTasks = this.allTasks.value) {
    if (this.parentTree.value[index] === undefined) return subTasks;
    let currentTask = subTasks.find(task => task.id === this.parentTree.value[index].id);

    if (!currentTask || !currentTask.subTasks) return null; // Return null if something goes wrong (e.g., task not found)

    return this.getCurrentTasks(index + 1, currentTask.subTasks);
  }

  findTaskParent(subTasks = this.allTasks.value, task) {
    if (subTasks.find(t => t.id === task.id)) return subTasks;

    for (let i=0; i<subTasks.length; i++) {
      let parent = this.findTaskParent(subTasks[i].subTasks, task);
      if (parent !== null) return parent;
    }
    return null;
  }

  addTask(value, parent=null) {
    if ( parent === null ) parent = this.getCurrentTasks();

    let maxFlexIndex = parent.reduce((acc, curr) => {
      if (curr.flexIndex > acc) return curr.flexIndex;
      return acc;
    }, -Infinity);

    parent.push({
      id: id++,
      name: value,
      subTasks: [],
      flexIndex: maxFlexIndex + 2,
      status: 0 // TODO: MAKE STATUS BASED ON COLUMN
    });
  }

  removeTask(task, inCurrentTasks=true) {
    let parent;
    if (inCurrentTasks) parent = this.getCurrentTasks();
    else {
      parent = this.findTaskParent(task);
      if (parent === null) return; // couldnt find given task
    }

    let index = parent.findIndex(t => t.id === task.id);
    if (index !== -1) parent.splice(index, 1);
  }

  changeTaskName(task, newName) {
    task.name = newName;
  }

  updateDescription(task, newDescription) {
    task.description = newDescription;
  }

  pushParent(task) {
    this.parentTree.value.push(task);
  }

  popParent() {
    return this.parentTree.value.pop();
  }

  selectParentInTree(task) {
    while ( this.parentTree.value[this.parentTree.value.length-1].id !== task.id ) {
      this.popParent();
    }
  }

}

class UIManager {
  constructor() {
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
    return taskManager.currentTasks.value;
  }

  get parentTree() {
    return taskManager.parentTree.value;
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
    return taskManager.TASK_STATUSES;
  }

  taskClicked(task) {
    taskManager.pushParent(task);
  }

  deleteTaskClicked(task) {
    taskManager.removeTask(task);
  }

  changeTaskName(task, newName) {
    taskManager.changeTaskName(task, newName);
    this.changingTaskName = null;
  }

  updateDescription(task, newDescription) {
    taskManager.updateDescription(task, newDescription);
  }
  addTaskClicked() {
    this.creatingNewTask = true;
  }

  newTaskBlur(value) {
    taskManager.addTask(value);
    this.creatingNewTask = false;
  }

  backButtonClicked() {
    taskManager.popParent();
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
          taskManager.removeTask(task);
        }},
        { name: "Change name", callback: () => {
          this.changingTaskName = task;
          this.showOptions = false;
        }}
      ]
    };
  }


  startDraggingTaskTriggered(task) {
    this.draggedTask = taskManager.getCurrentTasks().find(t => t.id == task.id);
  }
  stopDraggingTaskTriggered(task) {
    this.draggedTask = null;

    // update flex indexes
    let _currentTasks = taskManager.getCurrentTasks();
    _currentTasks.sort((t1, t2) => t1.flexIndex - t2.flexIndex);
    for (let i = 0; i < _currentTasks.length; i++) {
      _currentTasks[i].flexIndex = (i+1) * 2;
    }
  }

  parentClicked(parent) {
    if (parent === null) {
      do {
        parent = taskManager.popParent();
      } while (parent !== undefined);
    }
    else taskManager.selectParentInTree(parent);
  }

  getCurrentParent() {
    return this.parentTree[this.parentTree.length - 1];
  }
}

const taskManager = new TaskManager();
const uiManager = new UIManager();

onMounted(() => {
  document.addEventListener('mouseup', () => { uiManager.mouseReleasedToggle = !uiManager.mouseReleasedToggle });
})
</script>

<template>
  <div class="header">
    TODO APP
  </div>
  <div class="nav">
    <TodoBackButton
      @backPressed="uiManager.backButtonClicked"
    />
    <TodoParentTree
      :parents="uiManager.parentTree"
      @parent-clicked="uiManager.parentClicked"
    />
  </div>
  <div class="main">
    <div class="columns">
      <TodoColumn
        v-for="(taskStatusNumber, taskStatusName) in uiManager.TASK_STATUSES"
        :key="taskStatusNumber"
        :column-status-number="taskStatusNumber"
        :task-status-name="taskStatusName"
        @mouse-over-column="uiManager.mouseOverColumn"
      >
        <TodoItemAdd
          v-if="taskStatusNumber === uiManager.TASK_STATUSES.TODO"
          @click="uiManager.addTaskClicked"/>
        <TodoItem
          v-for="task in uiManager.currentTasks.filter(t => t.status === taskStatusNumber)"
          :key="task.id"
          :task="task"
          :mouse-released-toggle="uiManager.mouseReleasedToggle"
          :_dragging="task.id === uiManager.draggedTask?.id"
          :change-name="uiManager.changingTaskName?.id === task.id"
          @task-clicked="uiManager.taskClicked"
          @delete-task="uiManager.deleteTaskClicked"
          @mouse-over-task="uiManager.mouseOverTask"
          @start-dragging="uiManager.startDraggingTaskTriggered"
          @stop-dragging="uiManager.stopDraggingTaskTriggered"
          @options-clicked="uiManager.taskOptionsClicked"
          @change-name-blur="uiManager.changeTaskName"
        />
        <TodoItem
          v-if="uiManager.creatingNewTask && taskStatusNumber === uiManager.TASK_STATUSES.TODO"
          :create-new="true"
          @new-task-blur="uiManager.newTaskBlur"
        />
      </TodoColumn>
    </div>
    <div class="description-container">
      <ShowDescriptionButton
        @show-description-toggle="uiManager.showDescription = !uiManager.showDescription"
        :is-description-shown="uiManager.showDescription"
        :disabled="uiManager.getCurrentParent() === undefined"
      />
      <Description
        v-if="uiManager.showDescription"
        :task="uiManager.getCurrentParent()"  
        @save-description="uiManager.updateDescription"
      />
    </div>
  </div>
  <div class="footer">
    Icons by <a href="https://icons8.com">Icons8</a>
  </div>
  <Options
    v-if="uiManager.showOptions"
    :header="uiManager.optionsMenuData.header"
    :options="uiManager.optionsMenuData.options"
  />
  <div
    v-if="uiManager.showOptions"
    @click="uiManager.showOptions = false"
    class="options-overlay"
  ></div>
  <div
    v-if="uiManager.showDescription"
    @click="uiManager.showDescription = false"
    class="description-overlay"
  ></div>
</template>

<style lang="sass" scoped>
  @use "@/assets/common"

  *
    box-sizing: border-box

  %overlay
    position: fixed
    top: 0
    left: 0
    height: 100vh
    width: 100%
    z-index: 8888
  
  .header
    display: flex
    justify-content: center
    align-items: center
    font-size: 2em

    height: common.$header-height
    background-color: common.$bg-color
    color: common.$header-text-color

    border-bottom: common.$border

  .nav
    display: flex

    height: common.$nav-height
    background-color: common.$bg-color
    color: common.$nav-text-color
    border-bottom: common.$border

  .main
    position: relative

    display: flex

    height: common.$main-height
    min-height: 300px

    background-color: common.$bg-color
    color: common.$main-text-color


    .columns
      display: flex
      justify-content: space-evenly
      width: 100%

    .description-container
      display: flex
      align-items: center
      position: absolute
      right: 0

      z-index: 9999

      height: 100%
      

  .footer
    display: none

  .options-overlay
    @extend %overlay

    background-color: common.$overlay-color
    opacity: .7
  
  .description-overlay
    @extend %overlay

    background-color: common.$overlay-color
    opacity: .3
</style>
