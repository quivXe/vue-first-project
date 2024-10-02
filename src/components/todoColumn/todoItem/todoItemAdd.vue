<script setup>

import { ref } from 'vue'

const emit = defineEmits([
    "click"
])
const inputValue = ref("");

function onBlur() {
    if (inputValue.value === "") return;
    emit('newTaskBlur', inputValue.value);
    inputValue.value = "";
}

</script>
<template>
    <div 
        @click="emit('click')"
        class="container"
    >
        <div class="content">Add task</div>
    </div>
</template>

<style scoped lang="sass">
    @use "@/assets/common"

    .container
        box-sizing: border-box
        width: 100%
        padding: 5px 10px
        display: flex
        box-shadow: -1px 1px 4px rgba(0, 0, 0, 0.681)
        order: -1
        position: relative
        background-color: common.$add-new-button-bg
        border: common.$border
        user-select: none
        cursor: pointer

        .content
            flex-grow: 1
            padding: 5px 10px
            overflow-wrap: anywhere
            color: common.$tile-unhovered-color
            
            &:hover
                color: common.$tile-hovered-color
</style>