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
    inputTaskValue.value = inputTaskValue.value.trim().slice(0, 500);
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
            <span>{{ task.name }}</span>
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
        display: flex
        background-color: common.$bg-color-contrast
        box-shadow: -1px 1px 4px common.$box-shadow-color
        border-radius: 10px

        transition-property: transform, filter
        transition-duration: .2s
        transition-timing-function: ease-in-out

        &:hover
            box-shadow: 0 0 3px 1px common.$box-shadow-color-hover
    
        > *
            padding: 10px 15px
        > *:first-child
            padding-right: 0
        > *:last-child
            padding-left: 10px
        
        .tile-content
            flex-grow: 1
            overflow-wrap: anywhere
            cursor: pointer
            color: common.$text-color

            display: flex
            align-items: center
            

            &:hover > span
                @extend %hovered

            input

                box-sizing: border-box

                width: 100%
                padding: 8px 10px
                
                @extend %input

            span
                @extend %not-hovered
        
        .options
            display: flex
            align-items: center
            justify-content: center
            flex-shrink: 0
            cursor: pointer

            @extend %not-hovered

            &:hover
                transform: scale(1.1)

                @extend %hovered
        
    .container.dragging
        transform: scale(.8)
        opacity: 0.4
        box-shadow: 0 0 5px 3px common.$box-shadow-color-active
    
</style>