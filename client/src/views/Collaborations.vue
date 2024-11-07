<script setup>
import IndexedDBManager from '../services/IndexedDBManager';
import { ref } from 'vue';

const collabNames = ref(null);

const indexedDBManager = new IndexedDBManager("TODO_APP", "collab_tasks");

indexedDBManager.getTasksByParentId(-1)
.then(res => {
    collabNames.value = new Set(res.map(task => task.collabName));
});

// TODO:
// - add loading indicator
// - add error handling for idb
// - add text when no tasks (maybe with link to join and tutorial on how to share one)
// - add remove button that will remove collab from idb

</script>

<template>
    <div class="container">
        <h1>Collaborations</h1>
        <router-link
            :to="`/join/${collabName}`" 
            class="link"
            v-for="collabName in collabNames"
        >
            {{ collabName }}
        </router-link>
    </div>
</template>
<style lang="sass" scoped>
    @use "@/assets/styles/common"

    .container
        background-color: common.$bg-color
        color: common.$text-color

        height: calc(100vh - common.$header-height)
        width: 100%
        padding: 20px
        box-sizing: border-box

        display: flex
        flex-direction: column
        gap: 10px
        align-items: center

        .link
            color: common.$text-color
            text-decoration: none
            border: common.$border
            padding: 10px
            text-align: center
            width: 20%
</style>