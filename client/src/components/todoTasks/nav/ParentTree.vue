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
            <img src="@/assets/images/home.svg" alt="home">
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
    @use "@/assets/styles/common"

    .container
        display: flex
        align-items: center
        box-sizing: border-box
        color: common.$text-color

        padding: 20px 0

        overflow-x: auto
        overflow-y: hidden
        @extend %scrollbar
        flex-grow: 1
    
        %nav-element-last-or-hovered
            text-decoration: underline
            @extend %hovered

        .nav-element
            padding: 0 10px
            cursor: pointer
            white-space: nowrap
            border-left: common.$border
            @extend %not-hovered

            &:hover, &:last-child
                @extend %nav-element-last-or-hovered

        
        .home
            padding-right: 10px
            cursor: pointer
            @extend %not-hovered
            box-sizing: border-box

            &:hover, &:last-child
                @extend %nav-element-last-or-hovered

            display: flex
            align-items: center
            justify-content: center

            img
                flex-shrink: 1
                height: 100%
    
</style>