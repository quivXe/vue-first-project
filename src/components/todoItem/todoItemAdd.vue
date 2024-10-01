<script setup>

import { ref } from 'vue'

const emit = defineEmits([
    "newTaskBlur"
])
const inputValue = ref("");

function onBlur() {
    if (inputValue.value === "") return;
    emit('newTaskBlur', inputValue.value);
    inputValue.value = "";
}

</script>
<template>
    <input type="text" placeholder="Create new task" v-model="inputValue" @blur="onBlur">
</template>

<style scoped>
    input {
        padding: 2px 5px;
    }
</style>