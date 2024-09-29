<script setup>
import { ref } from 'vue'
import TodoHeader from './components/todoHeader/todoHeader.vue';"./components/todoHeader/todoHeader.vue"
import TodoItem from "./components/todoItem/todoItem.vue"
import TodoAddItem from "./components/todoItem/todoItemAdd.vue"

const title = ref("changed title")
let id = 0;
const tasks = ref([
  {id: id++, "name": `do task n.${id}`},
  {id: id++, "name": `do task n.${id}`},
  {id: id++, "name": `do task n.${id}`},
])

function onTaskPressed(task) {
  title.value = task.name;
}

function onDeleteTask(task) {
  tasks.value = tasks.value.filter(t => t.id !== task.id);
}

function onNewTaskBlur(value) {
  if (value === "") return;
  tasks.value.push({
    id: id++, name: value
  })
}
</script>

<template>
<TodoHeader :title="title"></TodoHeader>
<ul>
  <TodoItem v-for="task in tasks" :task="task" @task-pressed="onTaskPressed" @delete-task="onDeleteTask"></TodoItem>
  <TodoAddItem @newTaskBlur="onNewTaskBlur"</TodoAddItem>
</ul>
</template>

<style scoped>

</style>
