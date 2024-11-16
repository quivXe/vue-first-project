<script setup>

const props = defineProps({
    "columnStatusNumber": Number,
    "taskStatusName": String
})
const emit = defineEmits([
    "mouseOverColumn"
])

</script>
<template>
    <div class="column-container"
        @mouseover="emit('mouseOverColumn', columnStatusNumber)"
    >
    
        <div class="column-header"><h3>{{ taskStatusName }}</h3></div>
        <div class="column-content">
            <slot></slot>
        </div>

    </div>
</template>
<style lang="sass" scoped>
    @use "@/assets/styles/common"

    .column-container 
        display: flex
        flex-direction: column

        width: calc(100% / 3)

        position: relative

        box-sizing: border-box

        border-radius: 15px
        border: common.$border
        overflow: hidden
        box-shadow: 0 0 4px 1px common.$box-shadow-color

        transition: all .1s ease-in-out

        &:hover
            transform: scale(1.003)
            box-shadow: 0 0 2px 0 common.$box-shadow-color-hover

            .column-header
                background-color: common.$bg-color-contrast-2

        .column-header
            text-align: center
            padding: 10px
            border-bottom: common.$border
            background-color: common.$bg-color-2

            transition: background-color .2s ease-in-out

            h3
                margin: 0

        .column-content
            padding: 10px
            display: flex
            flex-direction: column
            gap: 20px
            flex-grow: 1

            background: common.$bg-gradient
            overflow-y: scroll
            @extend %scrollbar
            

</style>