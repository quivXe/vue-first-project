<script setup>
import DeleteItem from "./todoItemDelete.vue"

const props = defineProps({
    task: Object
})
const emit = defineEmits([
    "taskPressed",
    "deleteTask"
])
</script>

<template>
    <li>
        <span @click="emit('taskPressed', task)">{{ task.name }}</span>
        <DeleteItem :task="task" @delete-task="emit('deleteTask', task)"></DeleteItem>
    </li>
</template>

<style scoped>
    li {
        margin: 10px 0;
    }
</style>