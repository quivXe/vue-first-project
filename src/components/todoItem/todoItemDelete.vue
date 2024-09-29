<script setup>
const emit = defineEmits([
    "deleteTask"
])
const props = defineProps({
    "task": Object,
})
</script>
<template>
    <div @click="emit('deleteTask', task)">delete</div>
</template>
<style scoped>
    div {
        display: inline-block;
        margin: 0 15px;
    }
</style>