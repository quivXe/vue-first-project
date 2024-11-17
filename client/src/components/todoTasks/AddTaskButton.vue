<script setup>

defineProps({
  "centerText": Boolean,
});

const emit = defineEmits([
    "click"
])
</script>
<template>
    <div 
        @click="emit('click')"
        class="container"
    >
        <div class="content" :style="{ 'text-align': centerText ? 'center' : 'left' } ">Add task</div>
    </div>
</template>

<style scoped lang="sass">
    @use "@/assets/styles/common"

    .container
        box-sizing: border-box
        width: 100%
        display: flex
        box-shadow: -1px 1px 4px common.$box-shadow-color
        order: -1
        position: relative
        background-color: common.$bg-color-3 
        border: common.$border
        user-select: none
        cursor: pointer
        
        border-radius: 10px
        
        color: common.$text-color

        &:hover
            
            box-shadow: 0 0 3px 1px common.$box-shadow-color-hover

            .content
                @extend %hovered

        .content
            flex-grow: 1
            padding: 10px 15px
            overflow-wrap: anywhere
            
            @extend %not-hovered
            
</style>