// @ts-check
import { defineConfig } from 'astro/config';
import photosuite from 'astro-photosuite';

export default defineConfig({
  integrations: [
    photosuite({
      exif: false,
    }),
  ],
  server: { port: 4444 },
  vite: { server: { strictPort: true } },
});
