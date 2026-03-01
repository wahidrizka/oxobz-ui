import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            include: ['src'],
            exclude: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es', 'cjs'],
            fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                preserveModules: true,
                preserveModulesRoot: 'src',
            },
        },
        cssCodeSplit: true,
        sourcemap: true,
    },
});
