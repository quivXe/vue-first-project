<template>
<div class="loading-spinner"></div>
</template>
<style lang="sass" scoped>
@use "@/assets/styles/common"

.loading-spinner
    border: 4px solid rgba(255, 255, 255, 0.3)
    border-top: 4px solid common.$link-color
    border-radius: 50%
    width: 30px
    height: 30px
    animation: spin 1s linear infinite
@keyframes spin
  0%
    transform: rotate(0deg)
  100%
    transform: rotate(360deg)
</style>