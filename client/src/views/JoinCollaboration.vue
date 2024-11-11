<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchPost } from '../utils/fetchUtil';
import { handleFetchError } from '../utils/handleErrorUtil';
import FormInput from '@/components/FormInput.vue';
import FormWrapper from '@/components/FormWrapper.vue';

const route = useRoute();
const router = useRouter();

const collabName = ref(route.params.collaborationName || '');
const password = ref('');
const loading = ref(false);

// Same check as in ShareTask.vue filterName() - to prevent unnecessary requests
function isNameCorrect() {
    // Maximum length: 156
    if (collabName.value.length > 156) return false;
        
    // Allowed characters: letters, numbers, _ - = @ , . ;
    const regex = /^[a-zA-Z0-9_\-=@,.;]*$/;
    if (!regex.test(collabName.value)) return false;

    return true;
}

function onSubmit() {
    const url = '/api/collaborations/join';

    const payload = {
        name: collabName.value,
        password: password.value
    };
    
    if (!isNameCorrect()) {
        handleFetchError({ url, statusCode: 401 }) // Name or password incorrect
        return;
    }

    loading.value = true;
    fetchPost(url, payload)
    .then(data => {
        collabName.value = '';
        password.value = '';
        router.push(`/collaborations/${data.name}`);
    })
    .catch(error => {
        handleFetchError({ url, statusCode: error.status });
        loading.value = false;
    });
}

</script>
<template>
    <div class="container">
        <h1 class="title">Join collaboration</h1>
        <p class="info-text">Here you can join your or another user's collaboration.<br>
            Please enter the collaboration's name and password.
        </p>
        <FormWrapper
            id="join-form"
            :submitButtonText="'Join!'"
            :loading="loading"
            @onSubmit="onSubmit"
        >
            <FormInput 
                id="collab-name"
                label="Collaboration's name"
                :required="true"
                :value="collabName"
                @input="value => collabName = value"
            />
            <FormInput
                id="password"
                label="Password"
                type="password"
                :required="true"
                :value="password"
                @input="value => password = value"
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

</style>