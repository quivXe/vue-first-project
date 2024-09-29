<script setup>
import { ref } from 'vue'

const props = defineProps({
    title: String
})



</script>

<template>
    <h1>{{ title }}</h1>
</template>