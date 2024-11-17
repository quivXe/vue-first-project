<script setup>
import {onMounted, watch, ref, onUnmounted} from 'vue'
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
import Loading from '@/components/Loading.vue'

import TaskManager from '../services/TaskManager.js'
import UIManager from '../services/UIManager.js'
import IndexedDBManager from '../services/IndexedDBManager.js'
import CollaborationManager from '../services/CollaborationManager.js'
import Debounce from '../utils/debounce.js';
import { handleFetchError, redirect } from '../utils/handleErrorUtil.js';
import {setCookie, getCookie, removeCookie} from "@/utils/cookieUtils.js";

// Managers

let indexedDBManager = null;
let taskManager = null;
let collabManager = null;
const uiManager = new UIManager();

const managersLoaded = ref(false);
const initializeManagers = async () => {
  try {

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

      // PARENT TREE FROM COOKIES
      let parentTree = await getParentTreeFromCookie(collabName, indexedDBManager);

      // TASK MANAGER
      taskManager = new TaskManager(indexedDBManager, collabManager, parentTree);

      // BIND PUSHER
      if (collaborating) collabManager.bind(taskManager);

      // INITIALIZE UI MANAGER
      uiManager.init(taskManager);

      // GET OPERATIONS FROM DATABASE
      let hasOperationsBeenFetched = true;
      if (collaborating) {
        hasOperationsBeenFetched = await collabManager.getOperationsFromDatabase(taskManager, indexedDBManager);
      }

      // INITIALIZE TASK MANAGER
      await taskManager.init();

      // FINISH BY DISPLAYING UI
      managersLoaded.value = hasOperationsBeenFetched;
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


// Route / Collaboration name

const route = useRoute();
let { collabName, collaborating } = getCollaborationInfo(route);
// check for route change ( from collab to local cuz it didnt trigger on(Un)Mounted )
watch(() => route.name, async (newName, oldName) => {
  if ( newName !== oldName ) {
    saveParentTreeToCookie(collabName, uiManager.parentTree);

    managersLoaded.value = false;
    ({ collabName, collaborating } = getCollaborationInfo(route));
    await initializeManagers();
  }
})


// Functions

async function getParentTreeFromCookie(collabName=null, idb) {
  const { prefix, separator } = getParentTreeCookiePrefixAndSeparator(collabName);

  let parentTree = [];
  const cookieName = `${prefix}-taskId-parent-tree`;
  const cookieValue = getCookie(cookieName);
  if (!cookieValue) return [];

  // Get parent tree from idb based on IDs from cookie
  let taskIds;
  try {
    taskIds = cookieValue.split(separator).map(id => parseInt(id));
    parentTree = await idb.getObjectsByIds(taskIds);
  } catch(err) {
    removeCookie(cookieName);
    return [];
  }

  if (parentTree.includes(undefined)) {
    removeCookie(cookieName);
    return [];
  }

  // Orders it cuz it may be not ordered as idb.getObjectsByIds() is async func.
  parentTree = taskIds.map(id => parentTree.find(task => task.id === id));

  return parentTree;
}

function saveParentTreeToCookie(collabName=null, parentTree) {
  const taskIds = parentTree.map(task => task.id);

  const { prefix, separator } = getParentTreeCookiePrefixAndSeparator(collabName);
  const cookieName = `${prefix}-taskId-parent-tree`;
  const cookieValue = taskIds.join(separator);
  console.log(cookieValue);

  setCookie(cookieName, cookieValue, { expires: 28, path: '/' });
}

/**
 * Saves parent tree to cookie
 */
function beforeUnloadHandler() {
  saveParentTreeToCookie(collabName, uiManager.parentTree);
}

// Helper functions
function getCollaborationInfo(route) {
  let collabName = route.name === "TaskCollaboration" ? route.params.collaborationName : null;
  let collaborating = collabName !== null;
  return { collabName, collaborating };
}
function getParentTreeCookiePrefixAndSeparator(collabName) {
  const prefix = collabName === null ?
      '#local' :
      collabName;
  console.log(prefix);
  return { prefix, separator: "," };
}

// for-transition
const freezeDescriptionTitle = () => {
  const descContainer = document.querySelector('.description-container');
  const title = descContainer.querySelector('.title');

  // setting width in clone
  const descContainerClone = descContainer.cloneNode(true);
  descContainerClone.classList.add("description-container-clone");
  descContainerClone.querySelector(".container").style.width = "30vw"; // update when style updates
  descContainerClone.querySelector(".container").style.padding = "15px"; // update when
  document.querySelector(".main-container .main").appendChild(descContainerClone);

  // setting width in original while in transition
  const w = descContainerClone.querySelector(".title").getBoundingClientRect().width;
  title.style.minWidth = `${w}px`;
}
const unfreezeDescriptionTitle = () => {
  const title = document.querySelector('.description-container .title');
  title.style.minWidth = "unset";
}


// onMounted / onUnmounted

const debouncedMouseUp = new Debounce(
    () => uiManager.mouseReleasedToggle = !uiManager.mouseReleasedToggle, 100
);
onMounted(async () => {

  // Initialize managers
  await initializeManagers();

  // Add event listeners
  document.addEventListener('mouseup', debouncedMouseUp.run);
  document.addEventListener('touchend', debouncedMouseUp.run);
  window.addEventListener("beforeunload", beforeUnloadHandler); // Saves parent tree cookie before unload

});
onUnmounted(() => {
  // Remove event listeners
  window.removeEventListener("mouseup", debouncedMouseUp.run);
  window.removeEventListener("touchend", debouncedMouseUp.run);
  window.removeEventListener("beforeunload", beforeUnloadHandler);

  saveParentTreeToCookie(collabName, uiManager.parentTree);
  if (collaborating) collabManager.disconnect(); // Disconnect pusher to prevent bugs
})

</script>
<template>
  <div v-if="!managersLoaded" class="loading-managers"> <Loading/> </div>
  <div class="wrapper" v-if="managersLoaded" @contextmenu.prevent="">

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
            :center-text="uiManager.isTouchScreen"
            @click="uiManager.addTaskClicked"/>
          <Task
            v-for="task in uiManager.currentTasks.filter(t => t.status === taskStatusNumber)"
            :key="task.id"
            :task="task"
            :mouse-released-toggle="uiManager.mouseReleasedToggle"
            :_holding="task.id === uiManager.draggedTask?.id"
            :change-name="uiManager.changingTaskName?.id === task.id"
            :style="{ 'order': task.flexIndex }"
            :is-touch-screen="uiManager.isTouchScreen"
            @task-clicked="uiManager.taskClicked"
            @mouse-over-task="uiManager.mouseOverTask"
            @start-hold="uiManager.startHoldingTaskTriggered"
            @stop-hold="uiManager.stopHoldingTaskTriggered"
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
        <Transition
          name="description-transition"
          @enter="freezeDescriptionTitle()"
          @after-enter="unfreezeDescriptionTitle()"
          @before-leave="freezeDescriptionTitle()"
        >
            <Description
              v-if="uiManager.showDescription"
              :task="uiManager.getCurrentParent()"
              @save-description="uiManager.updateDescription"
            />
        </Transition>
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

  $main-padding: 10px

  $nav-height: 70px
  // $main-padding*3 cuz top and bottom padding + gap between main and nav
  $main-height: calc(100vh - common.$header-height - $nav-height - $main-padding * 3)

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
    height: $main-height
    color: common.$text-color

  .wrapper
    display: flex
    //height: 100%
    width: 100%
    flex-direction: column
    gap: $main-padding
    padding: $main-padding
    box-sizing: border-box
    background-color: common.$bg-color

  .nav
    display: flex

    height: $nav-height
    background: linear-gradient(135deg, common.$bg-color-2, common.$bg-color)

    gap: $main-padding

    border: common.$border
    border-radius: 15px
    padding: 0 $main-padding
    align-items: stretch

    box-shadow: 0 0 4px 1px common.$box-shadow-color

    transition: all .1s ease

  .main
    position: relative

    display: flex

    height: $main-height
    //min-height: 300px

    background-color: common.$bg-color
    color: common.$text-color


    .columns
      display: flex
      justify-content: space-evenly
      width: 100%
      gap: $main-padding

    .description-container
      display: flex
      align-items: center
      position: absolute // handle position fixed to get rid of scrollbars
      right: calc(-1 * $main-padding + 2px)

      z-index: 999

      height: 70%
      top: 50%
      transform: translateY(-50%)

  .options-overlay
    @extend %overlay

    background-color: common.$overlay-color
    opacity: .7

  .description-overlay
    @extend %overlay

    background-color: common.$overlay-color
    opacity: .3

  .description-transition-enter-active, .description-transition-leave-active
      transition: all .4s ease-in-out
      overflow: hidden

  .description-transition-enter-from,
  .description-transition-leave-to
      opacity: 0
      width: 0
      min-width: 0
      padding-left: 0
      padding-right: 0

  .description-transition-leave-to
      margin: 0

  .description-transition-enter-to,
  .description-transition-leave-from
      opacity: 1
      width: 30vw
      min-width: 250px
</style>

<style>
/* for width calculation in transition */
  .description-container-clone {
      visibility: hidden;
      display: flex;
      align-items: center;
      position: absolute;
      right: 0;

      z-index: 999;

      height: 70%;
      top: 50%;
      transform: translateY(-50%);

  }

</style>