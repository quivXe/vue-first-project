<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Debounce from '../../../utils/debounce';

marked.use({
    breaks: true
})

const props = defineProps({
    "task": Object,
});

const emit = defineEmits([
    "saveDescription"
]);

const delayedSave = new Debounce(() => {
    saving.value = false;
    emit("saveDescription", props.task, descContent.value);
}, 5000)

const saving = ref(false);
const editing = ref(false);
const descContent = ref(props.task?.description);
const container = ref(null);
const output = computed(() => {
    let parsed = marked.parse(descContent.value);
    return DOMPurify.sanitize(parsed, { USE_PROFILES: { html: true } });
});

function showEdit() {
    editing.value = true;
}
function showResult() {
    editing.value = false;
}
function onInput() {
    if (descContent.value.length >= 2000) {
        descContent.value = descContent.value.slice(0, 2000);
        window.dispatchEvent(
            new CustomEvent("show-notification", {
                detail: "Description is too long, only first 2000 characters will be saved."
            })
        );    
    }
    saving.value = true;
    delayedSave.run();
}

// if closing description occurs before data was saved, save immediately before unmounting
onBeforeUnmount(() => {
    delayedSave.now();
});


</script>
<template>
    <div class="container" ref="container">
        <div class="info-bar">
            <h4 class="title">Description - {{ props.task.name }}</h4>
            <div class="status-container">
                <div class="edit-status">
                    <div v-if="editing" @click="showResult" class="show-result"><img src="@/assets/images/show.svg" alt="Show Result"></div>
                    <div v-else @click="showEdit" class="show-edit"><img src="@/assets/images/edit.svg" alt="Edit"></div>
                </div>
            </div>
        </div>
        <div class="content">
            <textarea
                v-if="editing"
                v-model="descContent"
                @input="onInput"
            ></textarea>
            <div v-else class="output" v-html="output"></div>
            <div class="saving-status" title="Description is saved after few seconds or after you leave.">
                <span v-if="saving" class="saving">Saving...</span>
                <span v-else class="saved">Saved</span>
            </div>
        </div>
    </div>
</template>

<style lang="sass" scoped>
    @use "@/assets/styles/common"

    .container
        width: 30vw
        min-width: 250px
        padding: 15px
        background-color: common.$description-container-bg-color
        box-shadow: 0 0 4px 2px common.$box-shadow-color-hover
        border-radius: 8px
        display: flex
        flex-direction: column
        gap: 10px
        height: 100%

        margin-left: 7px // for ShowDescriptionButton

    .info-bar
        display: flex
        justify-content: space-between
        align-items: center
        padding: 0 5px
        gap: 10px
        flex-shrink: 0

        .title
            font-size: 1.1rem
            font-weight: bold
            color: common.$text-color
            margin: 0
            max-height: 4rem
            overflow-y: auto
            word-break: break-word

        .status-container
            display: flex
            gap: 10px

            .edit-status
                cursor: pointer

    .content
        position: relative
        flex-grow: 1
        display: flex
        flex-direction: column
        background-color: common.$textarea-bg-color
        border-radius: 5px
        overflow: hidden

        textarea
            width: 100%
            height: 100%
            padding: 10px
            border-radius: 5px
            background-color: common.$textarea-bg-color
            font-family: common.$textarea-font
            outline: none
            resize: none
            box-sizing: border-box
            color: common.$output-text-color
            overflow-y: auto
            @extend %scrollbar

        .output
            width: 100%
            height: 100%
            padding: 10px
            color: common.$output-text-color
            background-color: common.$output-bg-color
            border-radius: 5px
            overflow: auto
            @extend %scrollbar

            >:first-child
                margin-top: 0
            >:last-child
                margin-bottom: 0

        .saving-status
            position: absolute
            bottom: 5px
            right: 15px
            font-size: 0.9rem
            color: common.$subtle-text-color
            user-select: none

</style>
