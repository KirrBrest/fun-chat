import { defineConfig } from 'vite';

const FRONTEND_PORT = 3000;

export default defineConfig({
  base: '/',
  server: {
    port: FRONTEND_PORT,
    open: true,
  },
});
