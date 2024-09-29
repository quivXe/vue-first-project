<script setup>
import { ref } from 'vue'
import TodoHeader from './components/todoHeader/todoHeader.vue';"./components/todoHeader/todoHeader.vue"
import TodoItem from "./components/todoItem/todoItem.vue"

const title = ref("changed title")
const tasks = ref([
  {id: 1, "name": "do 1first"},
  {id: 2, "name": "do 2first"},
  {id: 3, "name": "do 3first"},
])

function onTaskPressed(task) {
  title.value = task.name;
}
</script>

<template>
<TodoHeader :title="title"></TodoHeader>
<ul>
  <TodoItem v-for="task in tasks" :task="task" @taskPressed="onTaskPressed"></TodoItem>
</ul>
</template>

<style scoped>

</style>
