<script setup>
    import Loading from "@/components/Loading.vue";
    import { onMounted, ref } from "vue";

    const props = defineProps({
        id: { type: String, required: true },
        submitButtonText: { type: String, default: "Submit" },
        loading: { type: Boolean, default: false },
    });

    const emit = defineEmits(["onSubmit"]);
    const height = ref("0px");

    onMounted(() => {
        height.value = document.querySelector(`button.submit-btn`).offsetHeight + "px";
    })
</script>

<template>
    <form :id="id" @submit.prevent="emit('onSubmit')" class="form">
        <slot></slot>
        <button v-if="!loading" type="submit" class="submit-btn">{{ submitButtonText }}</button>
        <div class="loading-wrapper" v-else :style="{ height }"><Loading/></div>
    </form>
</template>

<style scoped lang="sass">

@use "@/assets/styles/common"

.form
  display: flex
  flex-direction: column
  gap: 15px
  width: 100%
  max-width: 500px

.submit-btn
  padding: 12px 20px
  font-size: 1.1rem
  background-color: common.$bg-color-3
  color: white
  border: none
  border-radius: 8px
  cursor: pointer
  transition: background-color 0.3s ease
  &:hover
    background-color: common.$bg-color-contrast

.loading-wrapper
  display: flex
  justify-content: center
  align-items: center

</style>