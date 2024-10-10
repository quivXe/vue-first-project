<script setup>
import { onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPusher } from '../services/pusherClient.js';

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


const router = useRouter();
const route = useRoute();
let collabName = route.name === "TaskCollaboration" ? route.params.collaborationName : null;
let collaborating = collabName !== null;

let indexedDBManager = null;
let taskManager = null;
let collabManager = null;
const uiManager = new UIManager();

const managersLoaded = ref(false);
const initializeManagers = async () => {
  // todo: if in collab, check if it exists if no, pusher ask for whole version
  try {
    // has to create new cuz it wasnt refreshed 
    collabName = route.name === "TaskCollaboration" ? route.params.collaborationName : null;
    collaborating = collabName !== null;

    new Promise((resolve, reject) => {
      if (collaborating) {
        collabManager = new CollaborationManager(collabName);
  
        collabManager.subscribe()
        .then(() => {
          console.log("subscription succeeded");
          resolve();
        })
        .catch((err) => {
          console.log(err); // Object { type: "AuthError", error: "Unable to retrieve auth string from channel-authorization endpoint - received status: 401 from /api/pusher/channel-auth. Clients must be authorized to join private or presence channels. See: https://pusher.com/docs/channels/server_api/authorizing-users/", status: 401 }
          // OR ERROR 500 if session not initialized
          router.push("/join"); // TODO: add popup
          reject();
        });
      } else {
        resolve();
      }
    })
    .then(async () => {
      // IDB
      indexedDBManager = new IndexedDBManager("TODO_APP", collaborating ? "collab_tasks" : "local_tasks");

      // TASK MANAGER
      taskManager = new TaskManager(indexedDBManager, collabManager);
      await taskManager.init();

      // BIND PUSHER
      if (collaborating) collabManager.bind(taskManager);

      // INITIALIZE UI MANAGER
      uiManager.init(taskManager);
  
      // FINISH BY DISPLAYING UI
      managersLoaded.value = true;
    })

  }
  catch(error) {
    console.log("Error during loading managers:", error);
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
})
</script>
<template>
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
    z-index: 8888

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

      z-index: 9999

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
