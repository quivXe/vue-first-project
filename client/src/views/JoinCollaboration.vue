<script setup>
import { handleError, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchPost } from '../utils/fetchUtil';
import Debounce from '../utils/debounce';

const route = useRoute();
const router = useRouter();

const debouncedResetAdditionalInfo = new Debounce(() => additionalInfo.value = '', 4500);

const collabName = ref(route.params.collaborationName || '');
const password = ref('');
const additionalInfo = ref('');

function handleFetchError(error) {
    if (error.type === "not-json-response") {
        output = error.message;
    }
    else if (error.response && error.response.status) {
        switch (error.response.status) {
            case 400:
                output = "Wrong collaboration's name or password.";
                break;
            default:
                output = "An unexpected error happened.";
                break;
        }
    } else {
        output = "Network error. Please check your connection."
    }
    additionalInfo.value = output;
    debouncedResetAdditionalInfo.run();
}

function onSubmit() {
    const payload = {
        name: collabName.value,
        password: password.value
    };

    fetchPost('/api/collaborations/join', payload)
    .then(data => {
        collabName.value = '';
        password.value = '';
        router.push(`/collaborations/${data.name}`);
    })
    .catch(error => {
        handleFetchError(error);
    });
}

</script>
<template>
    <div class="container">
        <h1>Join collaboration</h1>
        <form id="join-form" @submit.prevent="onSubmit">
            <div class="field">
                <label for="collab-name">Collaboration's name</label>
                <input type="text" id="collab-name" v-model="collabName" @input=filterName required>
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input type="password" id="password" v-model="password" required>
            </div>
            <p>{{ additionalInfo }}</p>
            <input type="submit" value="Join!">
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