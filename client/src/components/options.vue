<script setup>
const props = defineProps({
    "header": String,
    "options": Array
})

</script>
<template>
    <div class="options-menu">
        <h3 class="header">{{ header }}</h3>
        <hr>
        <div class="options">
            <div 
                v-for="option in options" 
                @click="option.callback"   
                class="option"
            >
                {{ option.name }}
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
    z-index: 9999
    transform: translate(-50%, -50%)

    background-color: common.$options-bg
    padding: 20px

    display: flex
    flex-direction: column
    gap: 20px

    width: 15vw
    min-width: 250px

    border: common.$border
    color: common.$options-color

    .options
      flex-grow: 1

      display: flex
      flex-direction: column
      align-items: center
      gap: 18px

      .option
        user-select: none
        cursor: pointer

    .header
      text-align: center
      cursor: default
      margin: 0
    
    hr
      border: 0
      border-top: common.$border
      width: 100%
      margin: 0
</style>