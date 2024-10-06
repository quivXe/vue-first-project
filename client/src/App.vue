<script setup></script>
<template>
  <div class="header">
    TODO APP
  </div>
  <router-view></router-view>
  <div class="footer"></div>
</template>
<style lang="sass" scoped>
  @use "@/assets/styles/common"

  .header
      display: flex
      justify-content: center
      align-items: center
      font-size: 2em

      height: common.$header-height
      background-color: common.$bg-color
      color: common.$header-text-color
      box-sizing: border-box

      border-bottom: common.$border

  .footer
    display: none
</style>