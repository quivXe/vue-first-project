<script setup>
import { ref, reactive, computed  } from 'vue'
import TodoHeader from './components/todoHeader/todoHeader.vue'
import TodoItem from "./components/todoItem/todoItem.vue"
import TodoAddItem from "./components/todoItem/todoItemAdd.vue"

const title = ref("changed title")
var id = 0;
// const tasks = ref([
//   {id: id++, "name": `do task n.${id}`},
//   {id: id++, "name": `do task n.${id}`},
//   {id: id++, "name": `do task n.${id}`},
// ])
const allTasks = ref([
  {
    id: id++,
    "name": `do task n.${id}`,
    subTasks: [
      {id: id++, "name": `1do task n.${id}`},
      {id: id++, "name": `1do task n.${id}`},
      {id: id++, "name": `1do task n.${id}`},
    ]
  },
  {
    id: id++,
    "name": `do task n.${id}`,
    subTasks: [
      {id: id++, "name": `2do task n.${id}`},
      {id: id++, "name": `2do task n.${id}`},
      {id: id++, "name": `2do task n.${id}`},
    ]
  },
  {
    id: id++,
    "name": `do task n.${id}`,
    subTasks: [
      {id: id++, "name": `3do task n.${id}`},
      {id: id++, "name": `3do task n.${id}`},
      {id: id++, "name": `3do task n.${id}`},
    ]
  },
])

const currentTasks = computed(() => {
  return getCurrentTasks()
})
function getCurrentTasks(index = 0, subTasks = allTasks.value) {
  if (parentTree.value[index] === undefined) return subTasks;
  let currentTask = subTasks.find(task => task.id === parentTree.value[index]);

  if (!currentTask || !currentTask.subTasks) return null; // Return null if something goes wrong (e.g., task not found)

  return getCurrentTasks(index + 1, currentTask.subTasks);
}

function onTaskPressed(task) {
  parentTree.value.push(task.id);
  title.value = task.name;
}

function onDeleteTask(task) {
  let _currentTasks = getCurrentTasks();
  const index = _currentTasks.findIndex(t => t.id === task.id);
  if (index !== -1) _currentTasks.splice(index, 1);
  console.log(allTasks.value)
}
function onNewTaskBlur(value) {
  if (value === "") return;
  addTask(value);
}
function addTask(value) {
  getCurrentTasks().push({
    id: id++,
    name: value
  });
}

const parentTree = ref([]);
</script>

<template>
<TodoHeader :title="title"/>
<ul>
  <TodoItem v-for="task in currentTasks" :task="task" @task-pressed="onTaskPressed" @delete-task="onDeleteTask"/>
  <TodoAddItem @newTaskBlur="onNewTaskBlur"/>
</ul>
</template>

<style scoped>

</style>
