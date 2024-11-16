<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure you want to proceed?' },
});

const emit = defineEmits(['confirm', 'cancel']);

const confirm = () => {
  emit('confirm');
};

const cancel = () => {
  emit('cancel');
};

const handleBackgroundClick = (event) => {
  if (event.target.classList.contains('modal-overlay')) {
    cancel();
  }
};
</script>


 <template>
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click="handleBackgroundClick">
        <div class="modal-content">
          <header class="modal-header">
            <h3>{{ title }}</h3>
            <button class="close-btn" @click="cancel">✕</button>
          </header>
          <div class="modal-body">
            <slot>
              <p>{{ message }}</p>
            </slot>
          </div>
          <footer class="modal-footer">
            <button class="btn btn-cancel" @click="cancel">Cancel</button>
            <button class="btn btn-confirm" @click="confirm">Confirm</button>
          </footer>
        </div>
      </div>
    </transition>
  </template>
  
  <style scoped lang="sass">
  @use "@/assets/styles/common"
  @use "sass:color"
  
  * 
    margin: 0
    padding: 0

  .modal-overlay
    position: fixed
    top: 0
    left: 0
    width: 100vw
    height: 100vh
    display: flex
    align-items: center
    justify-content: center
    background-color: rgba(0, 0, 0, 0.6)
    z-index: 1000
  
  .modal-content
    background-color: common.$bg-color-2
    padding: 20px
    width: 90%
    max-width: 400px
    border-radius: 8px
    box-shadow: 0 4px 8px common.$box-shadow-color
    transition: transform 0.3s ease
    display: flex
    flex-direction: column
    color: common.$text-color
    border: common.$border
  
  .modal-header
    display: flex
    justify-content: space-between
    align-items: center
    margin-bottom: 15px
  
  .modal-body
    margin-bottom: 20px
    text-align: center
    padding: 20px
  
  .modal-footer
    display: flex
    justify-content: space-between
  
  .close-btn
    border: none
    background: none
    font-size: 1.2em
    cursor: pointer
    color: common.$subtle-text-color
    @extend %not-hovered
  
    &:hover
      @extend %hovered
  
  .btn
    padding: 10px 20px
    border: none
    border-radius: 5px
    cursor: pointer
    font-weight: bold
    color: common.$text-color
    @extend %scrollbar
  
  .btn-cancel
    background-color: common.$notification-bg-color
    color: common.$notification-text-color
    transition: background-color 0.2s

    &:hover
      background-color: color.adjust(common.$notification-bg-color, $lightness: -10%)
  
  .btn-confirm
    background-color: common.$bg-color-contrast
    color: common.$text-color
    transition: background-color 0.2s

    &:hover
      background-color: color.adjust(common.$bg-color-contrast, $lightness: 10%)
  
  // Transition effect for modal fade
  .modal-fade-enter-active, .modal-fade-leave-active
    transition: opacity 0.3s ease
  
  .modal-fade-enter, .modal-fade-leave-to /* .modal-fade-leave-active for <2.1.8 */
    opacity: 0
  </style>
  