<script setup>
const props = defineProps({
    task: Object
})
const emit = defineEmits([
    "taskPressed"
])
</script>

<template>
    <li @click="emit('taskPressed', task)">{{ task.name }}</li>
</template>