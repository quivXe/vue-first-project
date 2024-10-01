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
    
        <h3>{{ taskStatusName }}</h3>
        <slot></slot>

    </div>
</template>
<style lang="sass" scoped>
    @use "@/assets/common"

    .column-container 
        display: flex
        flex-direction: column
        gap: 20px
        padding: 20px
        background-color: lightblue

        width: calc(100% / 3)
    
</style>