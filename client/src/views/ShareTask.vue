<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import IndexedDBManager from '../services/IndexedDBManager'
import TaskManager from '../services/TaskManager'

const localIndexedDBManager = new IndexedDBManager("TODO_APP", "local_tasks");
const localTaskManager = new TaskManager(localIndexedDBManager);

const collabName = ref('');
const password = ref('');
const additionalInfo = ref("");
const tempOutput = ref("");


const route = useRoute();
const router = useRouter();
const taskIdFromRoute = parseInt(route.params.taskId);
const taskName = ref("");

// validate taskId and set taskName
(async () => {
    if (isNaN(taskIdFromRoute)) {
        router.push("/not-found");
    }
    const task = await localTaskManager.getTaskById(taskIdFromRoute);
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
        setTimeout(() => { additionalInfo.value = "" }, 2000);
    }
}

function onSubmit() {
    
    filterName();
    let name = collabName.value.trim();
    const payload = JSON.stringify({
        'name': name,
        'password': password.value.trim()
    })
    fetch("/api/collaborations/create", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    })
    .then(async res => {
        if (!res.ok) {

            
            // collaboration name is taken
            if (res.status === 400) {
                additionalInfo.value = "Name is taken";
                setTimeout(() => { additionalInfo.value = "" }, 2000);
            } 
            
            else {
                try {
                    const errorData = await res.json();
                }
                catch {
                    // return {'name': name} // temp
                   throw new Error("Cannot connect to server"); 
                }
                throw new Error(errorData.error || "Something went wrong");
            }
        }
        return res.json();
    })
    .then(async data => {
        // everything's right

        const collabIndexedDBManager = new IndexedDBManager("TODO_APP", `collab_tasks`);

        async function exportTask(parentId) {
            const parent = await localTaskManager.getTaskById(parentId);
            delete parent.id;
            parent.collabName = data.name;

            const addSelfPromise = collabIndexedDBManager.addObject(parent);
            const addChildrenPromise = localIndexedDBManager.getTasksByParentId(parentId).then(children => {
                return Promise.all( children.map(child => exportTask( child.id )) );
            });
            return Promise.all([ addSelfPromise, addChildrenPromise ]);
        } 
        
        // export whole task to collab store
        exportTask(taskIdFromRoute)
        .then(() => {
            tempOutput.value = JSON.stringify(data);
            additionalInfo.value = "Collaboration created!"
        })
        .catch(error => {
            throw new Error("Something went wrong while saving", error);
        })

    })
    .catch(error => {
        console.log("Error:", error.message);
        additionalInfo.value = error.message;

    })
    
}

/*

- get task id DONE
- (maybe) check if task exists DONE
- if so, get collab name and password from form DONE
- send collab name and password to server DONE
- handle response (name taken or unexpected error) DONE
- if everything is right, connect on server to channel, redirect to collaborations XX
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
                <input type="text" id="collab-name" v-model="collabName" @input=filterName required>
                <p>{{ additionalInfo }}</p>
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input type="password" id="password" v-model="password" required>
            </div>
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