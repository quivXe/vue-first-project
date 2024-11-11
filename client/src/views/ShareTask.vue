<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import IndexedDBManager from '../services/IndexedDBManager'
import { fetchPost } from '../utils/fetchUtil';
import Debounce from '../utils/debounce'
import { migrateTaskTree } from '../utils/taskTransferUtils';
import { setCookie } from '../utils/cookieUtils';
import { handleFetchError } from '../utils/handleErrorUtil';
import FormInput from '@/components/FormInput.vue';
import FormWrapper from '@/components/FormWrapper.vue';

const localIndexedDBManager = new IndexedDBManager("TODO_APP", "local_tasks");
const collabIndexedDBManager = new IndexedDBManager("TODO_APP", `collab_tasks`);

const collabName = ref('');
const password = ref('');
const loading = ref(false);


const debouncedFilterName = new Debounce(() => {
    filterName();
}, 80);

const route = useRoute();
const router = useRouter();
const taskIdFromRoute = parseInt(route.params.taskId);
const taskName = ref("");
const showNameTooltipToggle = ref(false);

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

    if (collabName.value.length > 156) {
        collabName.value = collabName.value.slice(0, 156);
    }

    const regex = /^[a-zA-Z0-9_\-=@,.;]*$/;
    
    if (!regex.test(collabName.value)) {
        collabName.value = collabName.value.replaceAll(/[^a-zA-Z0-9_\-=@,.;]/g, '');
        showNameTooltipToggle.value = !showNameTooltipToggle.value;
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
    handleFetchError({url: "/api/collaborations/create", statusCode: 409}); // name is taken (locally)
    loading.value = false;
    return;
  }

  loading.value = true;

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
            loading.value = false;
        })
    })
    .catch(error => {
        console.log(error);
        handleFetchError({ url: "/api/collaborations/create", statusCode: error.status });
        loading.value = false;
    })
    
}
</script>

<template>
  <div class="container">
    <h1 class="title">Share Task: {{ taskName }}</h1>
    <p class="info-text">
      When you share it, the whole task will be moved to the new collaboration.<br>
      You can log in to it from
      <router-link to="/join" class="link">Connect</router-link>. 
      Anyone with your password will be able to edit it.
    </p>
    
    <FormWrapper
        id="share-form"
        :submitButtonText="'Share it!'"
        :loading="loading"
        @onSubmit="onSubmit"
    >
      <FormInput
        id="collab-name"
        label="Collaboration's Name"
        :required="true"
        :value="collabName"
        info="Allowed characters: letters numbers _ - = @ , . ;"
        :showTooltipToggle="showNameTooltipToggle"
        @input="value => { collabName = value; debouncedFilterName.run() }"
      />

      <FormInput
        id="password"
        label="Password"
        type="password"
        :value="password"
        @input="value => password = value"
        :required="true"
      />

    </FormWrapper>
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
  box-sizing: border-box

.title
  font-size: 2.5rem
  font-weight: 600
  margin-bottom: 20px

.info-text
  font-size: 1rem
  text-align: center
  margin: 0
  margin-bottom: 20px
  color: common.$subtle-text-color
  line-height: 1.5rem

.link
  color: common.$link-color
  text-decoration: none
  &:hover
    text-decoration: underline

</style>
