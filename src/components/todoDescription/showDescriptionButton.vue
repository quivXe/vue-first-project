<script setup>

const props = defineProps({
    "disabled": Boolean,
    "isDescriptionShown": Boolean
})

const emit = defineEmits([
    "showDescriptionToggle"
])

</script>
<template>
    <div 
        @click="!disabled ? emit('showDescriptionToggle') : null"
        :class="{ disabled: disabled, 'is-description-shown': isDescriptionShown }"
    >
    <img src="C:\Users\sgrab\Downloads\arrow.png" alt="circled-chevron-left"/>
    </div>
</template>
<style lang="sass" scoped>
    div
        font-size: 5em
        font-family: 'Comic Sans MS'
        cursor: pointer

        width: 24px
        height: 24px
        border-radius: 50%
        
        margin-right: 2px

        display: flex
        align-items: center
        justify-content: center

        box-shadow: 0 0 3px 2px rgba(255, 255, 255, .3)
        background-color: white

    .disabled
        opacity: 25%
        cursor: default

    .is-description-shown
        transform: rotate(180deg)
</style>