<script setup>
import DeleteItem from "./todoItemDelete.vue"
import { ref, watch } from 'vue'

const props = defineProps({
    task: Object,
    mouseReleasedToggle: Boolean
})
const emit = defineEmits([
    "taskClicked",
    "deleteTask",
    "mouseOverTask",
    "startDragging",
    "stopDragging"
])
const dragging = ref(false);

var pressStart = null;
var timeoutId = null;
function taskPressed(task) {
    pressStart = Date.now();
    timeoutId = setTimeout(() => {
        dragging.value = true;
        emit("startDragging", task)
    }, 800)
}
function taskReleased(task) {
    console.log(task.name);
    let pressDuration = Date.now() - pressStart;
    if (pressDuration < 800) {
        clearTimeout(timeoutId);
        timeoutId = null;
        emit('taskClicked', task);
    }
    dragging.value = false;
    emit("stopDragging", task);
}
function mouseOverContainer(task) {
    emit('mouseOverTask', task)
}
console.log(props.mouseReleasedToggle);
watch(() => props.mouseReleasedToggle, () => {
    if (pressStart) {
        taskReleased(props.task)
    }
})
</script>

<template>
    <div
    class="container"
    :class="{ dragging: dragging }"
    :style="{ order: task.flexIndex }"
    @mouseover="mouseOverContainer(task)"
    >
        <span
            @mousedown="taskPressed(task)"
        >
            {{ task.name }}
        </span>
        <DeleteItem :task="task" @delete-task="emit('deleteTask', task)"></DeleteItem>
    </div>
</template>

<style scoped>
    .container {
        display: flex;
        align-items: center;
        user-select: none;
    }
    span {
        flex-grow: 1;
    }
    .dragging {
        background-color: rgba(0, 0, 0, .3);
    }
</style>