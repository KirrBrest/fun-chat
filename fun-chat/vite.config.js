import { defineConfig } from 'vite';
export default defineConfig({
    base: '/',
    server: {
        port: 5173,
        open: true,
        proxy: {
            '/garage': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/winners': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/engine': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: function (path) { return path; },
            },
        },
    },
});
