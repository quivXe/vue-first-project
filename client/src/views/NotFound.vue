<script setup>
</script>
<template>
    <div class="not-found">
      <h1>404 - Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <router-link to="/">Go back to Home</router-link>
    </div>
</template>  
<style scoped lang="sass">
    @use "@/assets/styles/common"

    .not-found
        display: flex
        flex-direction: column
        align-items: center
        justify-content: center
        background-color: common.$bg-color
        color: common.$text-color

        height: calc( 100vh - common.$header-height )

        a
            color: common.$link-color
</style>