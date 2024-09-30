<script setup>
import DeleteItem from "./todoItemDelete.vue"
import { ref, watch } from 'vue'

const CLICK_DRAG_DELAY_DELTA = 600;

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

var taskPressed = false;
var timeoutId = null;
function onTaskPressed(task) {
    taskPressed = true;

    timeoutId = setTimeout(() => {
        dragging.value = true;
        emit("startDragging", task)
    }, CLICK_DRAG_DELAY_DELTA)
}
function taskReleased(task) {
    taskPressed = false;

    // timeout hasnt fired yet - counts as click, not drag
    if (!dragging.value) {
        clearTimeout(timeoutId);
        timeoutId = null;
        emit('taskClicked', task);
    } 

    // dragging started
    else {
        timeoutId = null;
        emit('stopDragging', task);
    }
    
    dragging.value = false;
}
function mouseOverContainer(task) {
    emit('mouseOverTask', task)
}

watch(() => props.mouseReleasedToggle, () => {
    console.log('taskPressed: ' + taskPressed)
    if (taskPressed) {
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
            @mousedown="onTaskPressed(task)"
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