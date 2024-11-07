<script setup>
import { onMounted, watch, ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

import {
  AddTaskButton,
  Column,
  Options,
  Task,
  Description,
  ShowDescriptionButton,
  BackButton,
  ParentTree
} from '@/components/todoTasks';

import TaskManager from '../services/TaskManager.js'
import UIManager from '../services/UIManager.js'
import IndexedDBManager from '../services/IndexedDBManager.js'
import CollaborationManager from '../services/CollaborationManager.js'
import Debounce from '../utils/debounce.js';
import { handleFetchError, redirect } from '../utils/handleErrorUtil.js';


const route = useRoute();
let collabName = route.name === "TaskCollaboration" ? route.params.collaborationName : null;
let collaborating = collabName !== null;

let indexedDBManager = null;
let taskManager = null;
let collabManager = null;
const uiManager = new UIManager();

const managersLoaded = ref(false);
const loadingText = ref("Loading...");

function tempNotification() {
  console.log("notification sent");
  const event = new CustomEvent('show-notification', {
    detail: "This is a sample text to demonstrate how to break the text into lines based on a maximum character limit. A longerwo rdthatneeds tobebroken should also work."
  });
  window.dispatchEvent(event);
}
const initializeManagers = async () => {
  try {
    // has to create new cuz it wasnt refreshed 
    collabName = route.name === "TaskCollaboration" ? route.params.collaborationName : null;
    collaborating = collabName !== null;

    /* ---------------------- Subscribing to pusher channel --------------------- */
    new Promise((resolve, reject) => {
      if (collaborating) {
        collabManager = new CollaborationManager(collabName);
  
        collabManager.subscribe()
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
      } else {
        collabManager = null;
        resolve();
      }
    })
    .then(async () => {
      // IDB
      indexedDBManager = new IndexedDBManager("TODO_APP", collaborating ? "collab_tasks" : "local_tasks");

      // TASK MANAGER
      taskManager = new TaskManager(indexedDBManager, collabManager);

      // BIND PUSHER
      if (collaborating) collabManager.bind(taskManager);

      // INITIALIZE UI MANAGER
      uiManager.init(taskManager);

      // GET OPERATIONS FROM DATABASE
      let hasOperationsBeenFetched = true;
      if (collaborating) {
        hasOperationsBeenFetched = await collabManager.getOperationsFromDatabase(taskManager, indexedDBManager);
      }
      console.log(hasOperationsBeenFetched);
  
      // INITIALIZE TASK MANAGER
      await taskManager.init();
      
      // FINISH BY DISPLAYING UI
      managersLoaded.value = true && hasOperationsBeenFetched;
    })
    .catch((err) => { // Catch subscribing pusher promise
      handleFetchError({ url: "/api/pusher/channel-auth", statusCode: err.status })
    });

  }
  catch(error) { // Catch initializing managers `TRY`
    console.log("Error during loading managers:", error);
    window.dispatchEvent(
      new CustomEvent('show-notification', {
        detail: "Something went wrong, please log in again."
      })
    );
    redirect("/join");
  }
}

// check for route change ( from collab to local cuz it didnt refresh managers )
watch(() => route.name, (newName, oldName) => {
  if ( newName !== oldName ) {
    managersLoaded.value = false;
    initializeManagers();
  }
})

const debouncedMouseUp = new Debounce(() => uiManager.mouseReleasedToggle = !uiManager.mouseReleasedToggle, 100);
onMounted(async () => {
  await initializeManagers(route);

  document.addEventListener('mouseup', debouncedMouseUp.run);
});
onUnmounted(() => {
  if (collaborating) collabManager.disconnect(); // Disconnect pusher to prevent bugs
})
</script>
<template>
  <div v-if="!managersLoaded" class="loading-managers"> {{ loadingText }} </div>
  <div class="wrapper" v-if="managersLoaded">

    <div class="nav">
      <BackButton
        @backPressed="uiManager.popParent"
      />
      <ParentTree
        :parents="uiManager.parentTree"
        @parent-clicked="uiManager.selectParentInTree"
      />
    </div>
    <div class="main">
      <div class="columns">
        <Column
          v-for="(taskStatusNumber, taskStatusName) in uiManager.TASK_STATUSES"
          :key="taskStatusNumber"
          :column-status-number="taskStatusNumber"
          :task-status-name="taskStatusName"
          @mouse-over-column="uiManager.mouseOverColumn"
        >
          <AddTaskButton
            v-if="taskStatusNumber === uiManager.TASK_STATUSES.TODO"
            @click="uiManager.addTaskClicked"/>
          <Task
            v-for="task in uiManager.currentTasks.filter(t => t.status === taskStatusNumber)"
            :key="task.id"
            :task="task"
            :mouse-released-toggle="uiManager.mouseReleasedToggle"
            :_dragging="task.id === uiManager.draggedTask?.id"
            :change-name="uiManager.changingTaskName?.id === task.id"
            :style="{ 'order': task.flexIndex }"
            @task-clicked="uiManager.taskClicked"
            @delete-task="uiManager.deleteTaskClicked"
            @mouse-over-task="uiManager.mouseOverTask"
            @start-dragging="uiManager.startDraggingTaskTriggered"
            @stop-dragging="uiManager.stopDraggingTaskTriggered"
            @options-clicked="uiManager.taskOptionsClicked"
            @change-name-blur="uiManager.changeTaskName"
          />
          <Task
            v-if="uiManager.creatingNewTask && taskStatusNumber === uiManager.TASK_STATUSES.TODO"
            :create-new="true"
            @new-task-blur="uiManager.newTaskBlur"
          />
        </Column>
      </div>
      <div class="description-container">
        <ShowDescriptionButton
          @show-description-toggle="uiManager.showDescription = !uiManager.showDescription"
          :is-description-shown="uiManager.showDescription"
          :disabled="uiManager.getCurrentParent() === null"
        />
        <Description
          v-if="uiManager.showDescription"
          :task="uiManager.getCurrentParent()"  
          @save-description="uiManager.updateDescription"
        />
      </div>
    </div>
    <Options
      v-if="uiManager.showOptions"
      :header="uiManager.optionsMenuData.header"
      :options="uiManager.optionsMenuData.options"
    />
    <div
      v-if="uiManager.showOptions"
      @click="uiManager.showOptions = false"
      class="options-overlay"
    ></div>
    <div
      v-if="uiManager.showDescription"
      @click="uiManager.showDescription = false"
      class="description-overlay"
    ></div>
  </div>
</template>

<style lang="sass" scoped>
  @use "@/assets/styles/common"

  *
    box-sizing: border-box

  %overlay
    position: fixed
    top: 0
    left: 0
    height: 100vh
    width: 100%
    z-index: 888

  .loading-managers
    display: flex
    justify-content: center
    align-items: center
    height: common.$main-height
    color: white
    font-weight: bold
    font-size: 1.5em

  .nav
    display: flex

    height: common.$nav-height
    background-color: common.$bg-color
    color: common.$nav-text-color
    border-bottom: common.$border

  .main
    position: relative

    display: flex

    height: common.$main-height
    min-height: 300px

    background-color: common.$bg-color
    color: common.$main-text-color


    .columns
      display: flex
      justify-content: space-evenly
      width: 100%

    .description-container
      display: flex
      align-items: center
      position: absolute
      right: 0

      z-index: 999

      height: 100%
      

  .options-overlay
    @extend %overlay

    background-color: common.$overlay-color
    opacity: .7
  
  .description-overlay
    @extend %overlay

    background-color: common.$overlay-color
    opacity: .3
</style>
