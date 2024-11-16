<script setup>
import IndexedDBManager from '../services/IndexedDBManager';
import Loading from '@/components/Loading.vue';
import { ref } from 'vue';
import { useConfirm } from '@/composables/useConfirm';

const collabNames = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const indexedDBManager = new IndexedDBManager("TODO_APP", "collab_tasks");

function deleteCollab(collabName) {

    useConfirm({
        title: "Delete Collaboration",
        message: `Are you sure you want to delete '${collabName}'? It will erase your local copy, but you can still login to it later.`
    })
    .then(() => {
        // Delete all tasks collaboration.
        indexedDBManager.deleteObjectsByCollabName(collabName)
            .then(() => {
              collabNames.value.delete(collabName);
              window.dispatchEvent(
                  new CustomEvent('show-notification', {
                    detail: 'Collaboration deleted.'
                  })
              )
            })
            .catch((err) => {
              console.warn(err);
              window.dispatchEvent(
                  new CustomEvent('show-notification', {
                    detail: "Something went wrong."
                  })
              );
            })
    })
    .catch(() => {
        console.log("cancel");
    })
}

indexedDBManager.getTasksByParentId(-1)
.then(res => {
    collabNames.value = new Set(res.map(task => task.collabName));
})
.catch(() => {
    errorMessage.value = "Failed to load collaborations. Please try again.";
})
.finally(() => {
    loading.value = false;
});


</script>

<template>
    <div class="container">
      <h1 class="title">Collaborations</h1>
      <p class="info-text">
        Here is you saved collaboration list.<br>
        You can
        <router-link to="/join">join</router-link>
        new collaboration or share your own
        <router-link to="/">here</router-link>.
    </p>

      <Loading v-if="loading"/>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <p v-if="!loading && collabNames && collabNames.size === 0" class="empty-message">
        No collaborations found.
      </p>

      <div class="links" v-if="!loading && collabNames">
          <router-link
            v-for="collabName in collabNames"
            :key="collabName"
            :to="`/join/${collabName}`"
            class="collab-link"
          >
            <span>{{ collabName }}</span>
            <div class="img-wrapper" @click.prevent="">
                <img src="@/assets/images/trashcan.svg" alt="delete" @click.prevent="deleteCollab(collabName)">
            </div>
          </router-link>
      </div>
    </div>
  </template>

<style lang="sass" scoped>
@use "@/assets/styles/common"

.container
    color: common.$text-color
    padding: 20px 0
    box-sizing: border-box
    display: flex
    flex-direction: column
    align-items: center
    gap: 20px

    width: 100%

    height: calc(100vh - common.$header-height)

    .title
        font-size: 2.5rem
        font-weight: 600
        margin: 0

    .info-text
        font-size: 1rem
        text-align: center
        margin: 0
        color: common.$subtle-text-color
        line-height: 1.5rem

        a
            color: common.$link-color
            text-decoration: none

            &:hover
                text-decoration: underline

    .error-message
        color: common.$notification-text-color
        background-color: common.$notification-bg-color
        padding: 10px
        border-radius: 5px

    .empty-message
        color: common.$subtle-text-color
        text-align: center
        font-size: 1.1em

    .links
        display: flex
        flex-direction: column
        align-items: center
        gap: 20px
        width: 30%
        padding-bottom: 10px

    .collab-link
        color: common.$text-color
        text-decoration: none
        background-color: common.$bg-color-3
        padding: 12px 20px
        width: 100%
        text-align: center
        border-radius: 8px
        transition: transform 0.2s, box-shadow 0.3s ease
        box-shadow: 0 4px 6px common.$box-shadow-color-2
        box-sizing: border-box

        position: relative

        &:hover
            background-color: common.$bg-color-contrast
            transform: scale(1.05)
            box-shadow: 0 4px 8px common.$box-shadow-color-2-hover

            .img-wrapper
                display: unset

        .img-wrapper
            position: absolute
            right: 0
            top: 50%
            transform: translateY(-50%) translateX(100%)
            align-items: center
            justify-content: center
            padding: 7px
            display: none

            img
                transform: scale(.8)
                background-color: common.$bg-color-contrast-2
                border-radius: 100%
                padding: 10px
                box-shadow: 0 0 3px 0 common.$box-shadow-color

                transition: all .2s ease-in-out

                &:hover
                    background-color: common.$notification-bg-color
                    box-shadow: 0 0 3px 1px common.$box-shadow-color-hover

.container
    >:first-child
        margin-top: auto
    >:last-child
        margin-bottom: auto


</style>