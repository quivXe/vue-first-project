<template>
    <div class="notifications">
      <div v-for="notification in notifications" :key="notification.id" class="notification-container">

        <Transition>
          <div class="notification" v-if="notification.visible">
            <div v-for="(line, index) in notification.message" :key="index">{{ line }}</div>
          </div>
        </Transition>

      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, nextTick } from 'vue';
  
  const notifications = ref([]);
  
  let id = 0;
  function showNotification(newMessage) {
    const message = breakText(newMessage);
    const notification = {
      id: id++,
      message,
      visible: ref(false)
    }


    notifications.value.push(notification);
    
    nextTick(() => {
      notification.visible.value = true;

      // Hide the notification after 3 seconds
      setTimeout(() => {
        notification.visible.value = false;
  
        setTimeout(() => {
          notifications.value = notifications.value.filter(n => n.id !== notification.id); // remove after 500ms to let transition finish
        }, 500);
      }, 3000);
    })
  }
  
/**
 * Breaks a given text into multiple lines, so that no line exceeds
 * the given maximum number of characters.
 * @param {string} text - The text to break
 * @param {number} [maxCharacters=20] - The maximum number of characters to allow per line
 * @returns {string[]} - An array of strings, each representing a line of text
 */
  function breakText(text, maxCharacters = 20) {
  const words = text.split(' ');
  let result = [];
  let line = '';

  words.forEach(word => {
    // Check if adding the current word to the line exceeds the max length
    if ((line + word).length > maxCharacters) {
      // If line is not empty, add it to the result and start a new line
      if (line) {
        result.push(line.trim()); // Add the line to the result
      }
      // Start a new line with the current word
      line = word + ' ';
    } else {
      // Add the current word to the line
      line += word + ' ';
    }
  });

  // Add any remaining text in the line to the result
  if (line) {
    result.push(line.trim()); // Add the final line to the result
  }
  
  return result;
}

  // Listen for events from the event bus
  onMounted(() => {
    window.addEventListener('show-notification', (event) => {
      showNotification(event.detail);
    });
  });
  
  // Clean up the event listener
  onUnmounted(() => {
    window.removeEventListener('show-notification', () => {});
  });
  </script>
  
  <style scoped lang="sass">
  @use "@/assets/styles/common"

  .notifications 
    display: flex
    flex-direction: column-reverse
    gap: 10px

    position: fixed
    top: 10px
    right: 10px

    z-index: 9999
  

  .notification 
    background-color: common.$notification-bg-color
    color: common.$notification-text-color
    padding: 10px 20px
    font-weight: bold
    border-radius: 5px

    box-sizing: border-box

    display: flex
    flex-direction: column
    gap: .3em
  
  .v-enter-active, .v-leave-active 
      transition: all .5s ease
  
  .v-enter-from 
    transform: translateX(100%)
    opacity: 0
  
  .v-enter-to 
    transform: translateX(0)
    opacity: 1
  
  .v-leave-to 
    transform: translateX(100%)
    opacity: 0
  
  </style>
  