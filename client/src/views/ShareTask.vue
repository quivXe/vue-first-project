<script setup>
import { useRoute, useRouter } from 'vue-router';
import { handleError, ref } from 'vue';
import IndexedDBManager from '../services/IndexedDBManager'
import { fetchPost } from '../utils/fetchUtil';
import Debounce from '../utils/debounce'

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

function handleFetchError(error) {
    // TODO: handle more errors
    // TODO: ensure response status codes are correct
    let output;
    if (error.response && error.response.status) {
        switch(error.response.status) {
            case 401:
                output = "This collaboration name is already taken.";
                break
            case 422:
                output = "Invalid collaboration name."
            default:
                output = "An unexpected error happened.";
                break;
        };
    } else {
        output = "Network error. Please check your connection."
    }
    additionalInfo.value = output;
    debouncedResetAdditionalInfo.run();
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

    fetchPost("/api/collaborations/create", payload)
    .then(async data => {

        let currentCollabTaskId = 0;
        const exportTask = async (parentId, newParentId) => {
            const parent = await localIndexedDBManager.getObjectById(parentId);
            delete parent.id;
            parent.collabName = data.name;
            parent.parentId = newParentId;
            parent.collabTaskId = ++currentCollabTaskId;

            const createdParentId = await collabIndexedDBManager.addObject(parent);

            const addChildrenPromise = localIndexedDBManager.getTasksByParentId(parentId).then(children => {
                return Promise.all( children.map(child => exportTask( child.id, parent.collabTaskId )) );
            });
            return addChildrenPromise;
        }; 

        // export whole task to collab store
        await exportTask(taskIdFromRoute, -1);
    
        additionalInfo.value = "Collaboration created!";    
        setTimeout(() => router.push("/collaborations"), 2000);
    })
    .catch(error => {
        handleFetchError(error);
    })
    
}

/*

- get task id DONE
- (maybe) check if task exists DONE
- if so, get collab name and password from form DONE
- send collab name and password to server DONE
- handle response (name taken or unexpected error) DONE
- if everything is right, connect on server to channel, redirect to collaborations DONE
- add some indicator that this task is shared XX

*/
</script>
<template>
    <div class="container">
        <p>{{ tempOutput }}</p>
        <h1>Share task {{ taskName }}</h1>
        <p>When you will share it, whole task will be moved to <router-link to="/shared">Shared Tasks</router-link>. Everyone that has your password will be able to edit it.</p>
        <!-- copy style from https://codepen.io/NielsVoogt/pen/eYBQpPR -->
        <form id="share-form" @submit.prevent="onSubmit">
            <div class="field">
                <label for="collab-name">Collaboration's name</label>
                <input type="text" id="collab-name" v-model="collabName" @input="debouncedFilterName.run" required>
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input type="password" id="password" v-model="password" required>
            </div>
            <p>{{ additionalInfo }}</p>
            <input type="submit" value="Share it!">
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

        *
            box-sizing: border-box
            // margin: 10px

        form
            display: flex
            flex-direction: column

            gap: 20px

            .field
                display: flex
                flex-direction: column
                gap: 5px

                input
                    width: 100%
                    padding: 3px
                    background-color: common.$input-in-tile-bg
                    border: common.$border
                    outline: none
                    color: common.$input-in-tile-color

                    box-sizing: border-box
</style>