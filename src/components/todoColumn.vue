<script setup>
const props = defineProps({
    "columnStatusNumber": Number
})
const emit = defineEmits([
    "mouseOverColumn"
])
</script>
<template>
    <div class="column-container"
        @mouseover="emit('mouseOverColumn', columnStatusNumber)"
    >
        <slot></slot>
    </div>
</template>
<style scoped>
    .column-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        background-color: lightblue;
        width: 20vw;
    }
</style>