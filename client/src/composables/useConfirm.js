// useConfirm.js
import { createApp, h } from 'vue';
import Confirmation from '@/components/Confirmation.vue';

export function useConfirm({ title = 'Confirm Action', message = 'Are you sure?' } = {}) {
  return new Promise((resolve, reject) => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp({
      render() {
        return h(Confirmation, {
          show: true,
          title,
          message,
          onConfirm: () => {
            cleanup();
            resolve();
          },
          onCancel: () => {
            cleanup();
            reject();
          },
        });
      },
    });

    const cleanup = () => {
      app.unmount();
      document.body.removeChild(container);
    };

    app.mount(container);
  });
}
