<script setup>
import DeleteItem from "./todoItemDelete.vue"
import { ref, watch } from 'vue'

const CLICK_DRAG_DELAY_DELTA = 200;

const props = defineProps({
    task: Object | null,
    mouseReleasedToggle: Boolean,
    _dragging: Boolean
})
const emit = defineEmits([
    "taskClicked",
    "deleteTask",
    "mouseOverTask",
    "startDragging",
    "stopDragging"
])
const dragging = ref(props._dragging); // ensure that even if item is rerendered, it maintain same dragging value
const newTaskValue = ref("");

var taskPressed = false;
var timeoutId = null;
function onTaskPressed(task) {
    taskPressed = true;

    timeoutId = setTimeout(() => {
        dragging.value = true;
        emit("startDragging", task)
    }, CLICK_DRAG_DELAY_DELTA)
}
function releaseTask(task) {
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
function onNewTaskBlur() {
    if (newTaskValue === "") return;
    
}
watch(() => props.mouseReleasedToggle, () => {
    // checking for dragging cuz when changing column, task rerenders itself and taskPressed is false, but dragging is passed by parent
    if (dragging.value || taskPressed) {
        releaseTask(props.task)
    }
})
</script>

<template>
    <div
        class="container"
        :class="{ dragging: dragging }"
        :style="{ order: task.flexIndex }"
        @mouseover="task !== null ? mouseOverContainer(task) : null"
    >
        <div
            class="tile-content"
            v-if="task !== null"
            @mousedown="onTaskPressed(task)"
        >
            {{ task.name }}
        </div>
        <div
            v-else
            @blur="onNewTaskBlur"
        >
            <input type="text" text="New task" v-model="newTaskValue">
        </div>
        <div class="options"></div>
        <!-- <DeleteItem :task="task" @delete-task="emit('deleteTask', task)"></DeleteItem> -->
    </div>
</template>

<style scoped lang="sass">
    @use "@/assets/common"

    .container
        user-select: none

        box-sizing: border-box
        width: 100%
        padding: 5px 10px
        display: flex
        background-color: common.$tile-bg-color
        box-shadow: -1px 1px 4px rgba(0, 0, 0, 0.681)

        transition-property: transform, filter
        transition-duration: .2s
        transition-timing-function: ease-in-out

        .tile-content
            flex-grow: 1
            padding: 5px 10px
            overflow-wrap: anywhere
            cursor: pointer
            color: common.$tile-unhovered-color

            &:hover
                color: common.$tile-hovered-color

            input
                width: 100%
                padding: 3px
                background-color: common.$input-in-tile-bg
                border: common.$border
                outline: none
                color: common.$input-in-tile-color
        
        .options
            padding: 2px
            width: 15px
            background-image: url("@/assets/images/more.png")
            background-size: contain
            background-repeat: no-repeat
            background-position: center
            flex-shrink: 0
            cursor: pointer

            filter: brightness(.6)

            &:hover
                filter: brightness(1)
        
    .container.dragging
        transform: scale(.8)
        opacity: 0.4
        box-shadow: 0 0 5px 3px rgba(255, 255, 255, .7)
    
</style>