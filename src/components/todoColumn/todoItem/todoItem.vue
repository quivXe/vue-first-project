<script setup>
import { ref, watch, onMounted } from 'vue'

const CLICK_DRAG_DELAY_DELTA = 200;

const props = defineProps({
    task: Object,
    mouseReleasedToggle: Boolean,
    _dragging: Boolean,
    createNew: {
        type: Boolean,
        default: false
    }
})
const emit = defineEmits([
    "taskClicked",
    "deleteTask",
    "mouseOverTask",
    "startDragging",
    "stopDragging",
    "newTaskBlur"
])
const dragging = ref(props._dragging); // ensure that even if item is rerendered, it maintain same dragging value
const newTaskValue = ref("New task");
const newTaskRef = ref(null);

var taskPressed = false;
var timeoutId = null;

onMounted(() => {
    if (props.createNew) {
        newTaskRef.value.focus();
        newTaskRef.value.select();
    }
})

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
    console.log("halo")
    if (newTaskValue === "") return;
    emit("newTaskBlur", newTaskValue.value);
    newTaskValue.value = "New task";
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
        :style="{ order: !createNew ? task.flexIndex : 9999 }"
        @mouseover="!createNew ? mouseOverContainer(task) : null"
    >

        <div
            v-if="!createNew"
            class="tile-content"
            @mousedown="onTaskPressed(task)"
        >
            {{ task.name }}
        </div>

        <div
            v-else
            class="tile-content"
        >
            <input
                type="text"
                text="New task"
                v-model="newTaskValue"
                ref="newTaskRef"
                @blur="onNewTaskBlur"
            >
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

                box-sizing: border-box
        
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