<script setup>

const props = defineProps({
    parents: Array
})
const emit = defineEmits([
    "parentClicked"
])



</script>

<template>
    <div class="container">
        <div 
            @click="emit('parentClicked', null)"
            class="home">
            home
        </div>
        <div
            v-for="parent in parents"
            :key="parent.id"
            @click="emit('parentClicked', parent)"
            class="nav-element"
        >
            {{ parent.name }}
        </div>
    </div>
</template>
<style lang="sass" scoped>
    @use "@/assets/common"

    .container
        display: flex
        align-items: center
        box-sizing: border-box

        padding: 20px 30px

        overflow-x: auto
        @extend %scrollbar
    
        %nav-element-last 
            text-decoration: underline
            color: common.$nav-last-child-text-color

        .nav-element
            padding: 0 10px
            cursor: pointer
            white-space: nowrap
            border-left: common.$border

            &:hover, &:last-child
                @extend %nav-element-last

        
        .home
            padding-right: 10px
            cursor: pointer

            &:hover, &:last-child
                @extend %nav-element-last
    
</style>