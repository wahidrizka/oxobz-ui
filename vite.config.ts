import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { cpSync, writeFileSync } from 'fs';
import MagicString from 'magic-string';

// Rollup strips module-level "use client" directives when bundling (and warns).
// This plugin records which source modules declared the directive (stripping it
// pre-transform so Rollup/esbuild don't choke), then re-prepends it to the
// matching output chunk so RSC consumers (Next.js App Router) treat our
// interactive components as Client Components. Same job as
// rollup-preserve-directives, inlined to avoid a new dependency; magic-string
// is already in the Vite/Rollup tree so sourcemaps stay accurate.
function preserveUseClient(): Plugin {
    const DIRECTIVE = /^\s*(['"])use client\1\s*;?/;
    const clientModules = new Set<string>();
    return {
        name: 'oxobz:preserve-use-client',
        enforce: 'pre',
        apply: 'build',
        transform(code, id) {
            if (!/\.tsx?$/.test(id)) return null;
            const match = code.match(DIRECTIVE);
            if (!match) return null;
            clientModules.add(id);
            const s = new MagicString(code);
            s.remove(0, match[0].length);
            return { code: s.toString(), map: s.generateMap({ hires: true }) };
        },
        renderChunk(code, chunk) {
            if (!chunk.moduleIds.some((mid) => clientModules.has(mid))) return null;
            const s = new MagicString(code);
            s.prepend(`'use client';\n`);
            return { code: s.toString(), map: s.generateMap({ hires: true }) };
        },
    };
}

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
        preserveUseClient(),
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
                /^react-stately/,
                /^@react-aria\//,
                /^@react-stately\//,
                /^@internationalized\//,
                /^@radix-ui\//,
                /^@base-ui\//,
                'cmdk',
                // Calendar parses and formats typed dates through Luxon, the
                // same library the Geist bundle uses for it.
                'luxon',
                // Kartu Feedback inline produksi adalah motion.div milik
                // framer-motion, dengan variants dan transition yang dibaca
                // langsung dari bundel Geist (30 Agu 2026).
                'framer-motion',
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
