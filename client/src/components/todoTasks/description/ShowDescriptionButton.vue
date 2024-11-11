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
        :title="isDescriptionShown ? 'Hide description' : 'Show description'"
    >
    <img src="@/assets/images/arrow-left.svg" alt="<"/> 
    </div>
</template>
<style lang="sass" scoped>
    @use "@/assets/styles/common"
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

        box-shadow: 0 0 3px 2px common.$box-shadow-color-hover
        background-color: common.$bg-color
        transition: box-shadow .2s
        
        &:hover:not(.disabled)
            box-shadow: 0 0 3px 2px common.$box-shadow-color-active

        img
            padding-right: 2px // idk it seems more centered with that
    .disabled
        opacity: 25%
        cursor: default

    .is-description-shown
        transform: rotate(180deg)
</style>