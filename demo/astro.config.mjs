// @ts-check
import { defineConfig } from 'astro/config';
import photosuite from 'astro-photosuite';

export default defineConfig({
  integrations: [
    photosuite({
      glightbox: true,
      glightboxOptions: {
        zoomable: true,
        descPosition: 'left',
      }
    })
  ],
  server: {
    port: 4444
  },
  vite: {
    server: {
      strictPort: true
    }
  },
});
