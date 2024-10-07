<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const collabName = ref(route.params.collaborationName || '');
const password = ref('');
const additionalInfo = ref('');

function onSubmit() {
    const payload = JSON.stringify({
        name: collabName.value,
        password: password.value
    });

    fetch('/api/collaborations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    })
    .then(res => {
        if (!res.ok) {
            if (res.status === 400) {
                // collaboration name or password incorrect
                throw new Error("Collaboration name or password are incorrect");

            } else {
                throw new Error("Something went wrong"); 
            }
        }
        else {
            return res.json();
        }
    })
    .then(data => {
        // everything's right

        additionalInfo.value = "Successfully joined collaboration! " + data.name;
    })
    .catch(error => {
        console.log(error);
        additionalInfo.value = error.message;
    })
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