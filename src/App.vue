<script setup>
import { ref, computed  } from 'vue'
import TodoHeader from './components/todoHeader/todoHeader.vue'
import TodoItem from "./components/todoItem/todoItem.vue"
import TodoAddItem from "./components/todoItem/todoItemAdd.vue"
import TodoBackButton from "./components/todoBackButton.vue"

let id = 1;

const allTasks = ref([
  {
    id: id++,
    name: `do task n.${id}`,
    flexIndex: 2,
    subTasks: [
      {
        id: id++,
        name: `1do task n.${id}`,
        flexIndex: 2,
        subTasks: []
      },
      {
        id: id++,
        name: `1do task n.${id}`,
        flexIndex: 4,
        subTasks: []
      },
      {
        id: id++,
        name: `1do task n.${id}`,
        flexIndex: 6,
        subTasks: []
      },
    ]
  },
  {
    id: id++,
    name: `do task n.${id}`,
    flexIndex: 4,
    subTasks: [
      {
        id: id++,
        name: `2do task n.${id}`,
        flexIndex: 2,
        subTasks: []
      },
      {
        id: id++,
        name: `2do task n.${id}`,
        flexIndex: 4,
        subTasks: []
      },
      {
        id: id++,
        name: `2do task n.${id}`,
        flexIndex: 6,
        subTasks: []
      },
    ]
  },
  {
    id: id++,
    name: `do task n.${id}`,
    flexIndex: 6,
    subTasks: [
      {
        id: id++,
        name: `3do task n.${id}`,
        flexIndex: 2,
        subTasks: []
      },
      {
        id: id++,
        name: `3do task n.${id}`,
        flexIndex: 4,
        subTasks: []
      },
      {
        id: id++,
        name: `3do task n.${id}`,
        flexIndex: 6,
        subTasks: []
      },
    ]
  }
]);


const dragging = ref(false);
const currentTasks = computed(() => {
  return getCurrentTasks()
})
const title = computed(() => {
  return parentTree.value.length?
    parentTree.value[parentTree.value.length - 1].name :
    "VUE TODO APP"
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
function onNewTaskBlur(value) {
  if (value === "") return;
  addTask(value);
}
function addTask(value) {
  getCurrentTasks().push({
    id: id++,
    name: value,
    subTasks: []
  });
}
function popParent() {
  parentTree.value.pop();
}

function onMouseOverTask(mouseOverTask) {
  if (draggedTask === null) return;
  if (draggedTask === mouseOverTask.id) return; 
  draggedTask.flexIndex = draggedTask.flexIndex > mouseOverTask.flexIndex ? 
    mouseOverTask.flexIndex - 1 :
    mouseOverTask.flexIndex + 1;
}

var draggedTask = null;
function onStartDraggingTask(task) {
  draggedTask = getCurrentTasks().find(t => t.id == task.id);
}
function onStopDraggingTask(task) {
  draggedTask = null;
}

</script>

<template>
  <div class="header">
    <TodoBackButton @backPressed="popParent"/>
    <TodoHeader :title="title"/>
  </div>

  <div class="column">
    <TodoItem
      v-for="task in currentTasks"
      :key="task.id"
      :task="task"
      @task-clicked="onTaskClicked"
      @delete-task="onDeleteTask"
      @mouse-over-task="onMouseOverTask"
      @start-dragging="onStartDraggingTask"
      @stop-dragging="onStopDraggingTask"
    />
    <TodoAddItem @new-task-blur="onNewTaskBlur"/>
  </div>

</template>

<style scoped>
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }
  .column {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    background-color: lightblue;
    width: 20vw;
  }
</style>
