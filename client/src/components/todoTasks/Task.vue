<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import Debounce from '../../utils/debounce';

const CLICK_DRAG_DELAY_DELTA = 350;

const props = defineProps({
    task: Object,
    mouseReleasedToggle: Boolean,
    _dragging: Boolean,
    createNew: {
        type: Boolean,
        default: false
    },
    changeName: {
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
    "newTaskBlur",
    "changeNameBlur",
    "optionsClicked"
])
const dragging = ref(props._dragging); // ensure that even if item is rerendered, it maintain same dragging value
const inputTaskValue = ref("");
const inputTaskRef = ref(null);

const debouncedStartDragging = new Debounce((task) => {
    dragging.value = true;
    emit("startDragging", task);
}, CLICK_DRAG_DELAY_DELTA);

var taskPressed = false;

onMounted(() => {
    if (props.createNew) {
        inputTaskValue.value= "New task";
        nextTick(() => {
            inputTaskRef.value.focus();
            inputTaskRef.value.select();
        })
    }
})
watch(() => props.changeName, (changeName) => {
    inputTaskValue.value = props.task.name
    nextTick(() => {
        if (changeName) {
            inputTaskRef.value.focus();
            inputTaskRef.value.select();
        }
    })
})

function onTaskPressed(task) {
    taskPressed = true;
    debouncedStartDragging.run(task);
}
function releaseTask(task) {
    taskPressed = false;

    // timeout hasnt fired yet - counts as click, not drag
    if (!dragging.value) {
        debouncedStartDragging.stop();
        emit('taskClicked', task);
    } 

    // dragging started
    else {
        emit('stopDragging', task);
    }
    dragging.value = false;
}
function mouseOverContainer(task) {
    emit('mouseOverTask', task)
}
function onInputTaskBlur() {
    if (inputTaskValue.value === "") return;
    if (props.changeName) emit("changeNameBlur", props.task, inputTaskValue.value);
    else if (props.createNew) emit("newTaskBlur", inputTaskValue.value);
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
            v-if="!createNew && !changeName"
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
                v-model="inputTaskValue"
                ref="inputTaskRef"
                @blur="onInputTaskBlur"
                @keydown.enter="onInputTaskBlur"
            >
        </div>

        <div
            class="options"
            @click="emit('optionsClicked', task)"
        ><img src="@/assets/images/more.svg" alt="more"></div>
    </div>
</template>

<style scoped lang="sass">
    @use "@/assets/styles/common"

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
            display: flex
            align-items: center
            justify-content: center
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