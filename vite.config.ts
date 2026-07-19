import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { cpSync, writeFileSync } from 'fs';

// The package ships CSS separately from JS ("files": ["dist"]), so tokens +
// fonts must be copied into dist and stitched together with the extracted
// component CSS — otherwise the "./styles" export breaks after publish.
function copyStyles(): Plugin {
    return {
        name: 'oxobz:copy-styles',
        apply: 'build',
        closeBundle() {
            cpSync(resolve(__dirname, 'src/tokens'), resolve(__dirname, 'dist/tokens'), { recursive: true });
            writeFileSync(
                resolve(__dirname, 'dist/styles.css'),
                "@import './tokens/index.css';\n@import './index.css';\n",
            );
        },
    };
}

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            include: ['src'],
            exclude: ['src/**/*.test.tsx', 'src/**/*.test.ts', 'src/test-setup.ts'],
        }),
        copyStyles(),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es', 'cjs'],
            fileName: (format, entryName) => format === 'es' ? `${entryName}.js` : `${entryName}.cjs`,
            cssFileName: 'index',
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                '@oxobz/icons',
                /^prismjs/,
                /^prism-react-renderer/,
                // Primitive libraries mirroring Geist production (approved 19 Jul 2026)
                /^react-aria/,
                /^@react-aria\//,
                /^@react-stately\//,
                /^@internationalized\//,
                /^@radix-ui\//,
                /^@base-ui\//,
                'cmdk',
            ],
            output: {
                preserveModules: true,
                preserveModulesRoot: 'src',
            },
        },
        cssCodeSplit: false,
        sourcemap: true,
    },
});
