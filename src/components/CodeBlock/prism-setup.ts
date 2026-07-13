/**
 * Prism Setup — sets the Prism instance to global scope
 * so that prismjs language components can register themselves.
 *
 * This file MUST be imported before any prismjs/components/* imports.
 * (ESM `import` hoisting applies — import order is file-import order)
 *
 * Official pattern from prism-react-renderer docs:
 * https://github.com/FormidableLabs/prism-react-renderer#custom-language-support
 */

import { Prism } from 'prism-react-renderer';

// This module is side-effect only, so it MUST stay listed in package.json
// "sideEffects" ("**/prism-setup.*") — otherwise Vite's build (and consumer
// bundlers) treeshake it away and prismjs language components crash on the
// missing `Prism` global.
(globalThis as typeof globalThis & { Prism: typeof Prism }).Prism = Prism;
