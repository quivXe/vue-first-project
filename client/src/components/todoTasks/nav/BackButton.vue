<script setup>
const emit = defineEmits([
    "backPressed"
])
</script>

<template>
    <div
        @click="emit('backPressed')"
    >
        <img src="@/assets/images/arrow-left.svg" alt="<">
    </div>
</template>

<style lang="sass" scoped>
@use "@/assets/styles/common"

div
    box-sizing: border-box
    cursor: pointer
    // border-right: common.$border
    display: flex
    align-items: center
    user-select: none
    @extend %not-hovered
    padding: 0 .5rem
    

    img
      font-family: 'Comic Sans MS', serif
      font-size: 1.85em
      color: common.$text-color

    &:hover
        @extend %hovered
        transform: scale(1.1)
</style>
