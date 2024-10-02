<script setup>
import { ref, computed, onMounted } from 'vue'
import TodoParentTree from './components/nav/todoParentTree.vue'
import TodoItem from "./components/todoItem/todoItem.vue"
import TodoAddItem from "./components/todoItem/todoItemAdd.vue"
import TodoBackButton from "./components/nav/todoBackButton.vue"
import TodoColumn from "./components/todoColumn.vue"

let id = 12;
const allTasks = ref([
  {
    id: 1,
    name: "do task n.1",
    flexIndex: 2,
    status: 0,
    subTasks: [
      {
        id: 2,
        name: "1do task n.2",
        flexIndex: 2,
        status: 1,
        subTasks: []
      },
      {
        id: 3,
        name: "1do task n.3",
        flexIndex: 4,
        status: 2,
        subTasks: []
      },
      {
        id: 4,
        name: "1do task n.4",
        flexIndex: 6,
        status: 1,
        subTasks: []
      },
    ]
  },
  {
    id: 5,
    name: "do task n.5",
    flexIndex: 4,
    status: 0,
    subTasks: [
      {
        id: 6,
        name: "2do task n.6",
        flexIndex: 2,
        status: 0,
        subTasks: []
      },
      {
        id: 7,
        name: "2do task n.7",
        flexIndex: 4,
        status: 2,
        subTasks: []
      },
      {
        id: 8,
        name: "2do task n.8",
        flexIndex: 6,
        status: 1,
        subTasks: []
      },
    ]
  },
  {
    id: 9,
    name: "do task n.9",
    flexIndex: 6,
    status: 2,
    subTasks: [
      {
        id: 10,
        name: "3do task n.10",
        flexIndex: 2,
        status: 0,
        subTasks: []
      },
      {
        id: 11,
        name: "3do task n.11",
        flexIndex: 4,
        status: 1,
        subTasks: []
      },
      {
        id: 12,
        name: "3do task n.12",
        flexIndex: 6,
        status: 2,
        subTasks: []
      },
    ]
  }
]);

const TASK_STATUSES = {
  TODO: 0,
  DOING: 1,
  DONE: 2
}

const mouseReleasedToggle = ref(false);

const currentTasks = computed(() => {
  return getCurrentTasks()
})
const parentNameTree = computed(() => {
  return parentTree.value.map(parent => parent.name)
})
const parentTree = ref([]);

function getCurrentTasks(index = 0, subTasks = allTasks.value) {
  if (parentTree.value[index] === undefined) return subTasks;
  let currentTask = subTasks.find(task => task.id === parentTree.value[index].id);

  if (!currentTask || !currentTask.subTasks) return null; // Return null if something goes wrong (e.g., task not found)

  return getCurrentTasks(index + 1, currentTask.subTasks);
}

function onTaskClicked(task) {
  parentTree.value.push(task);
}

function onDeleteTask(task) {
  let _currentTasks = getCurrentTasks();
  const index = _currentTasks.findIndex(t => t.id === task.id);
  if (index !== -1) _currentTasks.splice(index, 1);
}
function addTask(value) {
  console.log("add task")
  let _currentTasks = getCurrentTasks();
  let maxFlexIndex = _currentTasks.reduce((acc, curr) => {
    if (curr.flexIndex > acc) return curr.flexIndex;
    return acc;
  }, -Infinity);

  _currentTasks.push({
    id: id++,
    name: value,
    subTasks: [],
    flexIndex: maxFlexIndex + 2,
    status: 0 // TODO: MAKE STATUS BASED ON COLUMN
  });
  console.log(getCurrentTasks())
}
function popParent() {
  parentTree.value.pop();
}

function onMouseOverTask(mouseOverTask) {
  if (draggedTask === null) return;
  if (draggedTask.id === mouseOverTask.id) return;
  draggedTask.flexIndex = draggedTask.flexIndex > mouseOverTask.flexIndex ? 
    mouseOverTask.flexIndex - 1 :
    mouseOverTask.flexIndex + 1;
}
function onMouseOverColumn(columnStatusNumber) {
  if (draggedTask === null) return;
  draggedTask.status = columnStatusNumber;
}

var draggedTask = null;
function onStartDraggingTask(task) {
  draggedTask = getCurrentTasks().find(t => t.id == task.id);
}
function onStopDraggingTask(task) {
  draggedTask = null;

  // update flex indexes
  let _currentTasks = getCurrentTasks();
  _currentTasks.sort((t1, t2) => t1.flexIndex - t2.flexIndex);
  for (let i = 0; i < _currentTasks.length; i++) {
    _currentTasks[i].flexIndex = (i+1) * 2;
  }
}


onMounted(() => {
  document.addEventListener('mouseup', () => { mouseReleasedToggle.value = !mouseReleasedToggle.value });
})
</script>

<template>
  <div class="header">
    TODO APP
  </div>
  <div class="nav">
    <TodoBackButton @backPressed="popParent"/>
    <TodoParentTree :parents="parentNameTree"/>
  </div>
  <div class="main">
    <div class="columns">
      <TodoColumn
        v-for="(taskStatusNumber, taskStatusName) in TASK_STATUSES"
        :key="taskStatusNumber"
        :column-status-number="taskStatusNumber"
        :task-status-name="taskStatusName"
        @mouse-over-column="onMouseOverColumn"
      >
        <TodoItem
          v-for="task in currentTasks.filter(t => t.status === taskStatusNumber)"
          :key="task.id"
          :task="task"
          :mouse-released-toggle="mouseReleasedToggle"
          :_dragging="task.id === draggedTask?.id"
          @task-clicked="onTaskClicked"
          @delete-task="onDeleteTask"
          @mouse-over-task="onMouseOverTask"
          @start-dragging="onStartDraggingTask"
          @stop-dragging="onStopDraggingTask"
        />
        <TodoAddItem @new-task-blur="addTask"/>
      </TodoColumn>
    </div>
  </div>
  <div class="footer">

  </div>
</template>

<style lang="sass" scoped>
  @use "@/assets/common"

  *
    box-sizing: border-box

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

  .main
    display: flex

    height: common.$main-height
    background-color: common.$bg-color

    .columns
      display: flex

      width: 100%
      

  .footer
    display: none


</style>
