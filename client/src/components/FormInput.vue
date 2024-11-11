<script setup>
    import { ref, watch } from "vue";
    import Debounce from "../utils/debounce";

    const props = defineProps({
      id: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, default: "text" },
      value: { type: [String, Number], default: "" },
      placeholder: { type: String, default: "" },
      required: { type: Boolean, default: false },
      info: { type: String, default: null }, // Optional tooltip info
      showTooltipToggle: { type: Boolean, default: false },
    });
  
    const emit = defineEmits(["input", "focus", "blur"]);

    const _showTooltip = ref(false);
    
    const hideTooltip = new Debounce(() => _showTooltip.value = false, 3000);

    watch(() => props.showTooltipToggle, () => {
        _showTooltip.value = true;
        hideTooltip.run();
    });

</script>
<template>
    <div class="field">
      <label :for="id" class="label">{{ label }}</label>
      <div class="input-container">
        <input
          :type="type"
          :id="id"
          :value="value"
          :placeholder="placeholder"
          :required="required"
          @input="event => emit('input', event.target.value)"
          @focus="emit('focus')"
          @blur="emit('blur')"
          class="input"
        />
        <!-- Optional Tooltip Icon -->
         <!-- TODO: Change icon (and maybe add class that that adds boxshadow when showTooltip == true)-->
        <span 
            v-if="info"
            class="info-icon"
            @mouseover="{ hideTooltip.stop(); _showTooltip = true }"
            @mouseleave="_showTooltip = false"
        >
          ℹ️
          <Transition> <div v-if="_showTooltip" class="tooltip">{{ info }}</div> </Transition>
        </span>
      </div>
    </div>
  </template>
  <style scoped lang="sass">
  @use "@/assets/styles/common"
  .field 
    display: flex
    flex-direction: column
    gap: 5px
    
  .input-container 
    position: relative
    display: flex
    align-items: center

  .input 
    padding: 12px 15px
    font-size: 1rem
    width: 100%

    @extend %input
  
  
  .info-icon 
    cursor: pointer
    position: absolute
    left: calc(100% + 5px)
  
  
  .tooltip 
    position: absolute

    top: calc(100% + 10px)
    background-color: common.$bg-color-3
    color: common.$text-color
    padding: 5px 10px
    border-radius: 4px
    font-size: 0.9rem
    white-space: nowrap

  .v-enter-active, .v-leave-active
    transition: opacity .2s ease
  .v-enter-from, .v-leave-to
    opacity: 0
  .v-enter-to
    opacity: 1
  </style>
  