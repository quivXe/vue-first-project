<script setup>
const props = defineProps({
  header: String,
  options: Array
})
</script>

<template>
  <div class="options-menu">
    <h3 class="header">{{ header }}</h3>
    <div class="options">
      <div 
        v-for="option in options" 
        :key="option.name"
        @click="option.callback"
        class="option"
      >
        <!-- <span class="option-icon">🔹</span> -->
        <span class="option-name">{{ option.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
  @use "@/assets/styles/common"

  .options-menu
    position: absolute
    top: 50%
    left: 50%
    z-index: 999
    transform: translate(-50%, -50%)
    background: common.$bg-gradient
    padding: 20px
    border-radius: 10px
    display: flex
    flex-direction: column
    gap: 15px
    width: 20vw
    min-width: 280px
    max-width: 300px   // Ensures menu stays within a reasonable width
    border: 1px solid rgba(255, 255, 255, 0.1)
    box-shadow: 0px 8px 16px common.$box-shadow-color
    color: common.$text-color
    overflow: hidden      // Prevents overflow issues

  .options
    display: flex
    flex-direction: column
    gap: 10px
    align-items: flex-start

  .option
    display: flex
    align-items: center
    width: 100%
    padding: 10px 15px
    border-radius: 6px
    cursor: pointer
    background-color: rgba(255, 255, 255, 0.05)
    transition: all 0.3s ease // Removed transform transition to prevent jumping
    border: 1px solid transparent
    box-sizing: border-box
    justify-content: center

    &:hover
      background-color: common.$bg-color-2
      color: common.$link-color
      border: common.$border

    .option-icon
      margin-right: 8px
      font-size: 1.2rem

    .option-name
      font-size: 1rem
      font-weight: 500

  .header
    text-align: center
    font-size: 1.3rem
    font-weight: bold
    cursor: default
    color: common.$text-color
    margin: 0
    padding-bottom: 10px
</style>
