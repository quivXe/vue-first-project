<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import Debounce from '../../utils/debounce';

const props = defineProps({
    task: Object,
    mouseReleasedToggle: Boolean,
    _holding: Boolean,
    createNew: {
        type: Boolean,
        default: false
    },
    changeName: {
        type: Boolean,
        default: false
    },
    isTouchScreen: Boolean
})
const emit = defineEmits([
    "taskClicked",
    "mouseOverTask",
    "startHold",
    "stopHold",
    "newTaskBlur",
    "changeNameBlur",
    "optionsClicked"
])


// <!--      ╭──────────────────────────────────────────────────────────╮      -->
// <!--      │                 HOLDING / CLICKING TASK                  │      -->
// <!--      ╰──────────────────────────────────────────────────────────╯      -->

const CLICK_HOLD_DELAY_DELTA = 350; // Time in ms after which click becomes holding.

const debouncedHold = new Debounce((task) => {
  holding.value = true;
  emit("startHold", task);
}, CLICK_HOLD_DELAY_DELTA);

const holding = ref(props._holding); // ensure that even if item is rerendered, it maintain same holding value
let taskPressed = false;

function onTaskPressed(task) {
    taskPressed = true;
    debouncedHold.run(task);
}

function releaseTask(task) {
    taskPressed = false;

    // timeout hasnt fired yet - counts as click, not hold
    if (!holding.value) {
        debouncedHold.stop();
        emit('taskClicked', task);
    } 

    // holding started
    else {
        emit('stopHold', task);
    }
    holding.value = false;
}

/**
 * Function mainly for handling updating flex index by UI Manager
 */
function mouseOverContainer(task) {
    emit('mouseOverTask', task)
}

// checking for holding cuz when changing column, task rerenders itself and taskPressed is false, but holding is passed by parent
watch(() => props.mouseReleasedToggle, () => {
  if (holding.value || taskPressed) {
    releaseTask(props.task)
  }
})



// <!--      ╭──────────────────────────────────────────────────────────╮      -->
// <!--      │                      CHANGING NAME                       │      -->
// <!--      ╰──────────────────────────────────────────────────────────╯      -->

const inputTaskValue = ref("");
const inputTaskRef = ref(null);

watch(() => props.changeName, (changeName) => {
  inputTaskValue.value = props.task.name
  nextTick(() => {
    if (changeName) {
      inputTaskRef.value.focus();
      inputTaskRef.value.select();
    }
  })
})

function onInputTaskBlur() {
    if (inputTaskValue.value === "") return;
    inputTaskValue.value = inputTaskValue.value.trim().slice(0, 500);
    if (props.changeName) emit("changeNameBlur", props.task, inputTaskValue.value);
    else if (props.createNew) emit("newTaskBlur", inputTaskValue.value);
}

onMounted(() => {
  if (props.createNew) {
    inputTaskValue.value= "New task";
    nextTick(() => {
      inputTaskRef.value.focus();
      inputTaskRef.value.select();
    })
  }
})

</script>

<template>
    <div
        class="container"
        :class="{ dragging: holding && !isTouchScreen }"
        :style="{ order: !createNew ? task.flexIndex : 9999 }"
        @mouseover="!createNew ? mouseOverContainer(task) : null"
    >

        <div
            v-if="!createNew && !changeName"
            class="tile-content"
            :class="{ 'is-touch-screen': isTouchScreen }"
            @mousedown.prevent="onTaskPressed(task)"
            @touchstart.prevent="onTaskPressed(task)"
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
            v-if="!isTouchScreen"
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

        .tile-content.is-touch-screen
          padding-right: 10px

          span
            margin: auto
            text-align: center

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