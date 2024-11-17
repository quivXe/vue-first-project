<script setup>

import Notification from './components/Notification.vue';
import MainNavigation from "@/components/MainNavigation.vue";

</script>
<template>
  <Notification />
  <div class="header">
    <div class="logo">
      <router-link to="/"><img src="@/assets/images/logo.svg" alt="Logo"></router-link>
    </div>
    <MainNavigation />
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

    position: relative

    *
      height: 100%
      box-sizing: border-box
      margin: 0

    .logo
      display: flex
      position: absolute
      top: 50%
      transform: translateY(-50%)
      height: 50px
      left: 1rem


  .main-container
    background-color: common.$bg-color
    width: 100%
    height: calc(100vh - common.$header-height)
    //min-height: 410px
    display: flex
    align-items: center
    justify-content: center
    
  .footer
    display: none


</style>