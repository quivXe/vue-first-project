<script setup>
const emit = defineEmits([
    "backPressed"
])
</script>

<template>
    <div
        @click="emit('backPressed')"
        class="kik"
    >
        <span><</span>
    </div>
</template>

<style lang="sass" scoped>
@use "@/assets/styles/common"

div
    padding: 10px 30px
    box-sizing: border-box
    cursor: pointer
    border-right: common.$border
    display: flex
    align-items: center
    user-select: none

    span
        font-family: 'Comic Sans MS'
        font-size: 1.85em

        filter: brightness(.6)

    &:hover
        :deep(span)
            filter: brightness(1)
</style>
