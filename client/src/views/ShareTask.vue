<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import IndexedDBManager from '../services/IndexedDBManager'
import { fetchPost } from '../utils/fetchUtil';
import Debounce from '../utils/debounce'
import { migrateTaskTree } from '../utils/taskTransferUtils';
import { setCookie } from '../utils/cookieUtils';
import { handleFetchError } from '../utils/handleErrorUtil';

const localIndexedDBManager = new IndexedDBManager("TODO_APP", "local_tasks");
const collabIndexedDBManager = new IndexedDBManager("TODO_APP", `collab_tasks`);

const collabName = ref('');
const password = ref('');
const additionalInfo = ref("");
const tempOutput = ref("");

const debouncedResetAdditionalInfo = new Debounce(() => {
    additionalInfo.value = "";
}, 4500);
const debouncedFilterName = new Debounce(() => {
    filterName();
}, 80);

const route = useRoute();
const router = useRouter();
const taskIdFromRoute = parseInt(route.params.taskId);
const taskName = ref("");

// validate taskId and set taskName
(async () => {
    if (isNaN(taskIdFromRoute)) {
        router.push("/not-found");
    }
    const task = await localIndexedDBManager.getObjectById(taskIdFromRoute);
    if (task === undefined) {
        router.push("/not-found");
    }
    else {
        taskName.value = task.name;
    }
})();

function filterName() {

    // Allowed characters: letters, numbers, _ - = @ , . ;
    // Maximum length: 156
    // TODO: add info that user used not allowed character

    if (collabName.value.length > 156) {
        collabName.value = collabName.value.slice(0, 156);
    }

    const regex = /^[a-zA-Z0-9_\-=@,.;]*$/;
    
    if (!regex.test(collabName.value)) {
        collabName.value = collabName.value.replaceAll(/[^a-zA-Z0-9_\-=@,.;]/g, '');
        additionalInfo.value = "Invalid character";
        debouncedResetAdditionalInfo.run();
    }
}

async function validateAndGetPayload() {
    filterName();
    let name = collabName.value.trim();
    const tasksWithGivenCollabName = await collabIndexedDBManager.getTasksByCollabName(name);
    
    if (tasksWithGivenCollabName.length > 0) {
        return false;
    }

    return {
        name: name,
        password: password.value.trim()
    };
}
async function onSubmit() {

    const payload = await validateAndGetPayload();
    if (!payload) {
        handleFetchError(new Error("collaboration with name already exists"));
        return;
    }
    additionalInfo.value = "Loading...";
    fetchPost("/api/collaborations/create", payload)
    .then(async data => {
 
        // export whole task to collab store
        await migrateTaskTree(localIndexedDBManager, collabIndexedDBManager, data.name, taskIdFromRoute);
        
        const payload = {
            collabName: data.name,
            operationType: "init",
            details: {},
            operation_part: 1, 
            operation_max_part: 1 
        };
        
        fetchPost("/api/operations/log", payload)
        .then(operation => {
            setCookie(`lastUpdate-${data.name}`, operation.createdAt, { path: '/', expires: 365 });
            window.dispatchEvent(
                new CustomEvent('show-notification', {
                    detail: "Collaboration created! Redirecting..."
                })
            );
            setTimeout(() => router.push(`/collaborations/${data.name}`), 1000);
        })
        .catch(err => {
            console.log("error while logging initial operation", err);
            handleFetchError({ url: "/api/operations/log", statusCode: err.status });
        })
    })
    .catch(error => {
        console.log(error);
        handleFetchError({ url: "/api/collaborations/create", statusCode: error.status });
    })
    
}
</script>

<template>
  <div class="container">
    <p>{{ tempOutput }}</p>
    <h1 class="title">Share Task: {{ taskName }}</h1>
    <p class="info-text">
      When you share it, the whole task will be moved to 
      <router-link to="/shared" class="link">Shared Tasks</router-link>. 
      Anyone with your password will be able to edit it.
    </p>
    
    <form id="share-form" @submit.prevent="onSubmit" class="form">
      <div class="field">
        <label for="collab-name" class="label">Collaboration's Name</label>
        <input type="text" id="collab-name" v-model="collabName" @input="debouncedFilterName.run" required class="input">
      </div>
      
      <div class="field">
        <label for="password" class="label">Password</label>
        <input type="password" id="password" v-model="password" required class="input">
      </div>

      <p class="additional-info">{{ additionalInfo }}</p>
      
      <button type="submit" class="submit-btn">Share it!</button>
    </form>
  </div>
</template>

<style lang="sass" scoped>
@use "@/assets/styles/common"

.container
  background-color: common.$bg-color
  color: common.$text-color
  width: 100%
  height: calc(100vh - common.$header-height)
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  padding: 20px

.title
  font-size: 2.5rem
  font-weight: 600
  margin-bottom: 20px

.info-text
  font-size: 1rem
  text-align: center
  margin-bottom: 20px
  color: common.$subtle-text-color

.link
  color: common.$link-color
  text-decoration: none
  &:hover
    text-decoration: underline

.form
  display: flex
  flex-direction: column
  gap: 15px
  width: 100%
  max-width: 500px

.field
  display: flex
  flex-direction: column
  gap: 5px

.label
  font-size: 1rem
  font-weight: 500

.input
  padding: 12px 15px
  border: 1px solid common.$border
  border-radius: 8px
  font-size: 1rem
  background-color: common.$input-bg-color
  color: common.$text-color
  outline: none
  transition: border-color 0.3s ease
  &:focus
    border-color: common.$focus-border-color

.additional-info
  font-size: 0.9rem
  color: common.$error-color
  text-align: center

.submit-btn
  padding: 12px 20px
  font-size: 1.1rem
  background-color: common.$button-bg-color
  color: white
  border: none
  border-radius: 8px
  cursor: pointer
  transition: background-color 0.3s ease
  &:hover
    background-color: common.$button-hover-bg-color
</style>
