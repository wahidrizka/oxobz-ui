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

(typeof globalThis !== 'undefined' ? globalThis : window).Prism = Prism;
