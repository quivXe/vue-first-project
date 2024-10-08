<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Debounce from '../../../utils/debounce';

// TODO: style for task.name in header

marked.use({
    breaks: true
})

const props = defineProps({
    "task": Object
})
const emit = defineEmits([
    "saveDescription"
])

const delayedSave = new Debounce(() => {
    saving.value = false;
    emit("saveDescription", props.task, descContent.value);
}, 1000)

const saving = ref(false);
const editing = ref(false);
const descContent = ref(props.task.description);

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
    saving.value = true;
    delayedSave.run();
}

// if closing description occurs before data was saved, save immediately before unmounting
onBeforeUnmount(() => {
    delayedSave.now();
});

</script>
<template>
    <div class="container">
        <div class="info-bar">
            <h4>Description - {{ props.task.name }}</h4>
            <div class="status-container">
                <div class="edit-status">
                    <div v-if="editing" @click="showResult" class="show-result"><img src="@/assets/images/show.svg" alt="result"></div>
                    <div v-else @click="showEdit" class="show-edit"><img src="@/assets/images/edit.svg" alt="edit"></div>
                </div>
                <div class="saving-status">
                    <div v-if="saving" class="saving" title="saving">saving</div>
                    <div v-else class="saved" title="saved">saved</div>
                </div>
            </div>
        </div>
        <div class="content">
            <textarea v-if="editing" v-model="descContent" @input="onInput"></textarea>
            <div v-else class="output" v-html="output"></div>
        </div>
    </div>
</template>
<style lang="sass" scoped>
    @use "@/assets/styles/common"

    $info-bar-height: 12%

    .container
        
        width: 30vw
        min-width: 250px
        padding: 10px
        padding-top: 0

        margin-left: 8px

        display: flex
        flex-direction: column

        height: 95%
        background-color: common.$description-container-bg-color
        box-shadow: 0px 0px 4px 2px rgba(100, 100, 100, 0.681)
        border-radius: 5px

        .info-bar
            display: flex
            gap: 20px
            user-select: none
            cursor: default
            height: $info-bar-height

            align-items: center
            justify-content: space-between

            padding-right: 5px

            h4
                margin: 0

            .status-container
                display: flex
                justify-content: space-between
                align-items: center
                width: 20%

                .edit-status
                    cursor: pointer

                    *
                        display: flex
                        align-items: center

                .saving-status
                    opacity: 50%
        .content
            width: 100%
            display: flex
            height: 100% - $info-bar-height
            
            textarea
                width: 100%
                padding: 5px
                border-radius: 3px

                outline: 0

                background-color: common.$textarea-bg-color
                font-family: common.$textarea-font

                @extend %scrollbar

            .output
                width: 100%
                padding: 5px
                border-radius: 3px

                background-color: common.$output-bg-color
                color: common.$output-text-color

                overflow-y: auto
                @extend %scrollbar
                flex-grow: 0

                *
                    margin: 0
                    margin-bottom: 5px
</style>