<script setup>

import { ref } from 'vue'

const emit = defineEmits([
    "newTaskBlur"
])
const inputValue = ref("");

function onBlur() {
    emit('newTaskBlur', inputValue.value);
    inputValue.value = "";
}
</script>
<template>
    <li><input type="text" placeholder="Create new task" v-model="inputValue" @blur="onBlur"></li>
</template>