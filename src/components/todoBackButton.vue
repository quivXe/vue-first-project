<script setup>
const emit = defineEmits([
    "backPressed"
])
</script>

<template>
    <div @click="emit('backPressed')"><</div>
</template>

<style scoped>
div {
    padding: .5em .75em;
    background: #d6d6d6;
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
}
div:hover {
    background: #e6e6e6;
}
div:active {
    background: #c6c6c6;
}
div {
    display: inline-block;
}
</style>
