<script setup>
import { ref } from 'vue'

const props = defineProps({
    "columnStatusNumber": Number,
    "taskStatusName": String
})
const emit = defineEmits([
    "mouseOverColumn"
])

const showNewItemInput = ref(false);

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
    @use "@/assets/common"

    .column-container 
        display: flex
        flex-direction: column

        border-right: common.$border

        width: calc(100% / 3)

        position: relative

        &:last-child
            border-right: 0

        .column-header
            text-align: center
            padding: 10px
            border-bottom: common.$border
            background-color: common.$column-header-bg

            h3
                margin: 0

        .column-content
            padding: 10px
            display: flex
            flex-direction: column
            gap: 20px
            flex-grow: 1

            overflow-y: scroll
            @extend %scrollbar

</style>