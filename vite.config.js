import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join } from 'path'

const PROJECT_ROOT = process.cwd();

export default defineConfig({
    root: join(PROJECT_ROOT, 'src/renderer'),
    base: '/',
    build: {
        outDir: join(PROJECT_ROOT, 'dist'),
        emptyOutDir: true,
    },
    server: {
        proxy: {
            '/api': 'http://localhost:3000',
            '/uploads': 'http://localhost:3000'
        }
    },
    plugins: [
        react()
    ],
})
