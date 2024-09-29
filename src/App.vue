<script setup>
import { ref } from 'vue'
import TodoHeader from './components/todoHeader/todoHeader.vue';"./components/todoHeader/todoHeader.vue"
import TodoItem from "./components/todoItem/todoItem.vue"

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
</script>

<template>
<TodoHeader :title="title"></TodoHeader>
<ul>
  <TodoItem v-for="task in tasks" :task="task" @task-pressed="onTaskPressed" @delete-task="onDeleteTask"></TodoItem>
</ul>
</template>

<style scoped>

</style>
