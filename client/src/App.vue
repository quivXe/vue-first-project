<script setup>

import Notification from './components/Notification.vue';

</script>
<template>
  <Notification />
  <div class="header">
    <div class="logo">
      <router-link to="/"><img src="@/assets/images/logo.svg" alt="Logo"></router-link>
    </div>
    <div class="main-nav">
      <ul>
        <li>
          <router-link :key="$route.fullPath" to="/">
            <img src="@/assets/images/local_tasks.svg" alt="">
            <span>Your tasks</span>
          </router-link>
        </li>
        <li>
          <router-link to="/collaborations">
            <img src="@/assets/images/shared_tasks.svg" alt="">
            <span>Collaborations</span>
          </router-link>
        </li>
        <li>
          <router-link to="/join">
            <img src="@/assets/images/join1.svg" alt="">
            <span>Connect</span>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
  <div class="main-container">
    <router-view></router-view>
  </div>
  <div class="footer"></div>
</template>
<style lang="sass" scoped>
  @use "@/assets/styles/common"

  .header
    width: 100%
    height: common.$header-height
    box-sizing: border-box
    border-bottom: common.$border
    background-color: common.$bg-color
    font-weight: bold
    color: common.$text-color
    
    display: flex
    justify-content: space-between
    align-items: center

    *
      height: 100%
      box-sizing: border-box
      margin: 0

    .logo
      display: flex
      
      img
        padding: 10px 20px

    .main-nav
      flex-grow: 1
      user-select: none

      ul
        display: flex
        list-style: none
        justify-content: center
        align-items: center
        column-gap: 50px
        text-align: center

        li
          text-align: center

          a
            color: common.$text-color
            text-decoration: none
            padding: 20px
            text-align: center
            display: flex
            align-items: center
            gap: 7px

            border-bottom: 1px solid transparent

            &:hover
              border-bottom: 1px solid common.$text-color

            img
              max-height: 30px

            span
              height: fit-content



  .main-container
    background-color: common.$bg-color
    width: 100%
    height: calc(100vh - common.$header-height)
    min-height: 410px
    display: flex
    align-items: center
    justify-content: center
    
  .footer
    display: none
</style>