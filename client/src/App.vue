<script setup>
import { onMounted } from 'vue'
import TodoParentTree from './components/nav/todoParentTree.vue'
import TodoItem from "./components/todoColumn/todoItem/todoItem.vue"
import TodoBackButton from "./components/nav/todoBackButton.vue"
import TodoColumn from "./components/todoColumn/todoColumn.vue"
import TodoItemAdd from "./components/todoColumn/todoItem/todoItemAdd.vue"
import Options from "./components/options.vue"
import Description from './components/todoDescription/description.vue'
import ShowDescriptionButton from './components/todoDescription/showDescriptionButton.vue'

import TaskManager from './services/TaskManager.js'
import UIManager from './services/UIManager.js'
import IndexedDBManager from './services/IndexedDBManager.js'

const indexedDBManager = new IndexedDBManager("TODO_APP", "tasks");
const taskManager = new TaskManager(indexedDBManager);
taskManager.init();
const uiManager = new UIManager(taskManager);

onMounted(() => {
  document.addEventListener('mouseup', () => { uiManager.mouseReleasedToggle = !uiManager.mouseReleasedToggle });
})
</script>
<template>
  <div class="header">
    TODO APP
  </div>
  <div class="nav">
    <TodoBackButton
      @backPressed="uiManager.popParent"
    />
    <TodoParentTree
      :parents="uiManager.parentTree"
      @parent-clicked="uiManager.selectParentInTree"
    />
  </div>
  <div class="main">
    <div class="columns">
      <TodoColumn
        v-for="(taskStatusNumber, taskStatusName) in uiManager.TASK_STATUSES"
        :key="taskStatusNumber"
        :column-status-number="taskStatusNumber"
        :task-status-name="taskStatusName"
        @mouse-over-column="uiManager.mouseOverColumn"
      >
        <TodoItemAdd
          v-if="taskStatusNumber === uiManager.TASK_STATUSES.TODO"
          @click="uiManager.addTaskClicked"/>
        <TodoItem
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
        <TodoItem
          v-if="uiManager.creatingNewTask && taskStatusNumber === uiManager.TASK_STATUSES.TODO"
          :create-new="true"
          @new-task-blur="uiManager.newTaskBlur"
        />
      </TodoColumn>
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
  <div class="footer">
    Icons by <a href="https://icons8.com">Icons8</a>
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
  
  .header
    display: flex
    justify-content: center
    align-items: center
    font-size: 2em

    height: common.$header-height
    background-color: common.$bg-color
    color: common.$header-text-color

    border-bottom: common.$border

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
      

  .footer
    display: none

  .options-overlay
    @extend %overlay

    background-color: common.$overlay-color
    opacity: .7
  
  .description-overlay
    @extend %overlay

    background-color: common.$overlay-color
    opacity: .3
</style>
