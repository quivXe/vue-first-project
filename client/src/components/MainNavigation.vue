<script setup>

import {computed, onMounted, onUnmounted, ref} from "vue";

const mainNavBreakpoint = 750;
let currentWidth = ref(window.innerWidth);
const isSmallScreen = computed(() => {
  return currentWidth.value <= mainNavBreakpoint
});

const isNavShowed = ref(false);

function resizeHandler() {
    currentWidth.value = window.innerWidth;
}
onMounted(() => {
  window.addEventListener('resize', resizeHandler)
})
onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler);
})

</script>

<template>
  <div class="container">
    <ul :class="{ isSmallScreen }" v-if="!isSmallScreen || isNavShowed">
      <li @click="isNavShowed=false">
        <router-link :key="$route.fullPath" to="/">
          <img src="@/assets/images/local_tasks.svg" alt="">
          <span>Your tasks</span>
        </router-link>
      </li>
      <li @click="isNavShowed=false">
        <router-link to="/collaborations">
          <img src="@/assets/images/shared_tasks.svg" alt="">
          <span>Collaborations</span>
        </router-link>
      </li>
      <li @click="isNavShowed=false">
        <router-link to="/join">
          <img src="@/assets/images/join1.svg" alt="">
          <span>Connect</span>
        </router-link>
      </li>
    </ul>
    <img src="@/assets/images/burger.svg" alt="menu" class="burger" @click="isNavShowed = !isNavShowed" v-if="isSmallScreen">
  </div>
  <div id="overlay" v-if="isNavShowed && isSmallScreen"></div>
</template>

<style scoped lang="sass">
@use "@/assets/styles/common"
%overlay
  position: fixed
  top: common.$header-height
  left: 0
  height: calc(100vh - common.$header-height)
  width: 100%
  z-index: 888

$main-nav-breakpoint: 750px
*
  height: 100%
  box-sizing: border-box
  margin: 0

.container
  flex-grow: 1
  user-select: none
  align-items: center

  ul
    display: flex
    list-style: none
    justify-content: center
    align-items: center
    column-gap: 50px
    text-align: center
    padding: 0

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

  ul.isSmallScreen
    position: absolute
    top: calc( 100% + .5rem )
    right: .5rem
    height: calc(100vh - common.$header-height - 1rem)
    flex-direction: column
    background-color: common.$bg-color
    justify-content: start
    z-index: 999
    border: common.$border
    padding: 10px
    gap: 10px
    border-radius: 10px

    li
      width: 100%
      height: unset
      background: common.$bg-gradient
      border-radius: 10px
      border: common.$border

      a
        border-bottom: 0

  .burger
    height: 50px

    position: absolute
    top: 50%
    transform: translateY(-50%)
    right: 1rem

#overlay
  @extend %overlay
  background-color: common.$overlay-color
  opacity: .8

</style>