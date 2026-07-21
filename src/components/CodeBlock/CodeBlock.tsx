'use client';

import {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { Highlight, type PrismTheme } from 'prism-react-renderer';
import { Copy, Check, ChevronDown } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './CodeBlock.module.css';
import switcherStyles from './Switcher.module.css';

/* ------------------------------------------------------------------ */
/*  Register additional Prism languages not bundled by default         */
/*  (official pattern from prism-react-renderer docs)                  */
/*  Base set: markup, jsx, tsx, swift, kotlin, objectivec, js-extras,  */
/*  reason, rust, graphql, yaml, go, cpp, markdown, python, json       */
/*  + dependencies: clike, javascript, typescript, c, css              */
/* ------------------------------------------------------------------ */

/* prism-setup sets globalThis.Prism — MUST come before prismjs imports */
import './prism-setup';

/* Additional languages loaded from prismjs.
   Explicit .js extension is required: prismjs has no exports map, so
   extensionless subpaths fail to resolve for Node ESM consumers. */
import 'prismjs/components/prism-lua.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-markup-templating.js'; /* required by PHP */
import 'prismjs/components/prism-php.js';
import 'prismjs/components/prism-ruby.js';
import 'prismjs/components/prism-scss.js';
import 'prismjs/components/prism-diff.js';
import 'prismjs/components/prism-docker.js';
import 'prismjs/components/prism-toml.js';

/* ------------------------------------------------------------------ */
/*  Empty theme — all colors come from our CSS module, not inline      */
/* ------------------------------------------------------------------ */

const emptyTheme: PrismTheme = {
    plain: {},
    styles: [],
};


/* ------------------------------------------------------------------ */
/*  Switcher sub-component                                             */
/* ------------------------------------------------------------------ */

export interface SwitcherOption {
    /** Unique value for the option */
    value: string;
    /** Display label for the option */
    label: string;
}

/**
 * Config object for the language switcher / tabs, matching the official
 * Geist `switcher` / `tabs` prop shape: `{ options, value, onChange }`.
 */
export interface SwitcherConfig {
    options: SwitcherOption[];
    value: string;
    onChange: (value: string) => void;
}

/** Select-based language switcher (default variant). */
function Switcher({ options, value, onChange }: SwitcherConfig) {
    const currentLabel = options.find((o) => o.value === value)?.label ?? value;

    return (
        <div className={switcherStyles.container}>
            <div aria-hidden="true" className={switcherStyles.visible}>
                <span>{currentLabel}</span>
                <ChevronDown size={16} />
            </div>
            <select
                className={switcherStyles.select}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((opt) => (
                    <option
                        key={opt.value}
                        value={opt.value}
                        className="text-gray-1000"
                    >
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/** Tabbed language switcher (`tabs` variant). */
function Tabs({ options, value, onChange }: SwitcherConfig) {
    return (
        <div className={switcherStyles.tabs} role="tablist">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={opt.value === value}
                    className={switcherStyles.tab}
                    onClick={() => onChange(opt.value)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  CodeBlock Props                                                     */
/* ------------------------------------------------------------------ */

export interface CodeBlockProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Code content as children (string) */
    children: string;

    /** Language for prism class (e.g. 'jsx', 'tsx', 'js') */
    language?: string;

    /** Filename to display in header */
    filename?: string;

    /** Optional icon element to display next to filename */
    filenameIcon?: ReactNode;

    /** Line numbers to highlight (1-based) */
    highlightedLinesNumbers?: number[];

    /** Line numbers marked as added (1-based) */
    addedLinesNumbers?: number[];

    /** Line numbers marked as removed (1-based) */
    removedLinesNumbers?: number[];

    /** Hide line numbers entirely (default: false). Mirrors the Geist API. */
    hideLineNumbers?: boolean;

    /**
     * Select-based language switcher, rendered in the header.
     * Shape matches the official Geist `switcher` prop.
     */
    switcher?: SwitcherConfig;

    /**
     * Tabbed language switcher, rendered in the header.
     * Shape matches the official Geist `tabs` prop. When both `tabs` and
     * `switcher` are supplied, `tabs` takes precedence.
     */
    tabs?: SwitcherConfig;

    /**
     * Adds an "Open in v0" toolbar action ('ask' | 'build').
     * Accepted for API parity with Geist; the v0.dev integration itself is a
     * Vercel-product-specific feature and is intentionally not wired here.
     * Declared so the value never leaks onto the DOM via {...rest}.
     */
    v0?: 'ask' | 'build';
}

/* ------------------------------------------------------------------ */
/*  Copy button sub-component                                          */
/* ------------------------------------------------------------------ */

interface CopyButtonProps {
    text: string;
    floating?: boolean;
}

function CopyButton({ text, floating }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setCopied(false), 1500);
        });
    }, [text]);

    return (
        <button
            aria-label="Copy code"
            className={cn(
                styles.copyButton,
                floating && styles.copyFloatingButton,
                copied && styles.copyButtonCopied,
            )}
            type="button"
            onClick={handleCopy}
        >
            <Copy size={16} aria-hidden />
            <Check size={16} aria-hidden />
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Referenced lines — stable per-block id from code content           */
/* ------------------------------------------------------------------ */

/**
 * Deterministic 32-bit FNV-1a hash of the code, rendered as 8 hex chars.
 * Used to build the per-line anchor ids (`C<hash>-L<n>`) that back the
 * "Referenced lines" feature, so a shared URL resolves to the same line.
 */
function hashCode(input: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

/* ------------------------------------------------------------------ */
/*  CodeBlock                                                           */
/* ------------------------------------------------------------------ */

/**
 * Code Block component — syntax-highlighted code display.
 *
 * Production DOM structure:
 * ```html
 * <div aria-label="..." class="relative wrapper [hasFileName]"
 *      data-oxobz-code-block="">
 *   <!-- With filename: header with copy button -->
 *   <div class="header">
 *     <div class="fileName">
 *       <div class="iconWrapper">...</div>
 *       <span class="filenameP">Table.jsx</span>
 *     </div>
 *     <div class="actions">
 *       [Switcher?]
 *       <button class="copyButton">...</button>
 *     </div>
 *   </div>
 *   <!-- Without filename: floating copy button -->
 *   <button class="copyButton copyFloatingButton">...</button>
 *   <!-- Code content -->
 *   <pre class="prism-code language-jsx pre">
 *     <code class="code" data-oxobz-code-block="true">
 *       <div class="line" data-oxobz-code-block-line="true" ...>
 *         <button class="lineNumber">1</button>
 *         <div class="token-line">
 *           <span class="token keyword">...</span>
 *         </div>
 *       </div>
 *     </code>
 *   </pre>
 * </div>
 * ```
 */
const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
    (
        {
            children,
            language = 'jsx',
            filename,
            filenameIcon,
            highlightedLinesNumbers = [],
            addedLinesNumbers = [],
            removedLinesNumbers = [],
            hideLineNumbers = false,
            switcher,
            tabs,
            v0,
            className,
            ...rest
        },
        ref,
    ) => {
        const hasFileName = !!filename;
        const codeText = children;

        /* Accepted for API parity; the v0.dev action is intentionally omitted. */
        void v0;

        const highlightSet = new Set(highlightedLinesNumbers);
        const addedSet = new Set(addedLinesNumbers);
        const removedSet = new Set(removedLinesNumbers);

        /* Stable per-block id backing the referenced-lines anchors. */
        const blockId = useMemo(() => `C${hashCode(codeText)}`, [codeText]);

        /* Active (referenced) line, driven by the URL hash. */
        const [activeLineId, setActiveLineId] = useState<string | null>(null);

        useEffect(() => {
            const sync = () => {
                setActiveLineId(window.location.hash.slice(1) || null);
            };
            sync();
            window.addEventListener('hashchange', sync);
            return () => window.removeEventListener('hashchange', sync);
        }, []);

        const handleLineAnchor = useCallback((lineId: string) => {
            if (typeof window !== 'undefined') {
                window.location.hash = lineId;
            }
            setActiveLineId(lineId);
        }, []);

        return (
            <div
                {...rest}
                ref={ref}
                aria-label={rest['aria-label']}
                className={cn(
                    'relative',
                    styles.wrapper,
                    hasFileName && styles.hasFileName,
                    hideLineNumbers && styles.hideLineNumbers,
                    className,
                )}
                data-oxobz-code-block=""
            >
                {/* Header (with filename) */}
                {hasFileName && (
                    <div className={styles.header}>
                        <div className={styles.fileName}>
                            {filenameIcon && (
                                <div aria-hidden="true" className={styles.iconWrapper}>
                                    {filenameIcon}
                                </div>
                            )}
                            <span className={styles.filenameP}>{filename}</span>
                        </div>
                        <div className={styles.actions}>
                            {tabs ? (
                                <Tabs {...tabs} />
                            ) : switcher ? (
                                <Switcher {...switcher} />
                            ) : null}
                            <CopyButton text={codeText} />
                        </div>
                    </div>
                )}

                {/* Floating copy button (without filename) */}
                {!hasFileName && <CopyButton text={codeText} floating />}

                {/* Code content — tokenized by prism-react-renderer */}
                <Highlight
                    code={codeText.replace(/\n$/, '')}
                    language={language}
                    theme={emptyTheme}
                >
                    {({ className: preClassName, tokens, getLineProps, getTokenProps }) => (
                        <pre className={cn(preClassName, styles.pre)}>
                            <code className={styles.code} data-oxobz-code-block="true">
                                {tokens.map((line, i) => {
                                    const lineNum = i + 1;
                                    const lineId = `${blockId}-L${lineNum}`;
                                    const isHighlighted = highlightSet.has(lineNum);
                                    const isAdded = addedSet.has(lineNum);
                                    const isRemoved = removedSet.has(lineNum);
                                    const isActive = activeLineId === lineId;
                                    const lineProps = getLineProps({ line });

                                    return (
                                        <div
                                            key={lineNum}
                                            {...lineProps}
                                            id={lineId}
                                            className="line"
                                            style={{
                                                fontFeatureSettings: '"liga" 0',
                                            }}
                                            data-oxobz-code-block-line="true"
                                            data-highlighted={
                                                isHighlighted ? 'true' : undefined
                                            }
                                            data-added={isAdded ? 'true' : undefined}
                                            data-removed={isRemoved ? 'true' : undefined}
                                            data-active={isActive ? 'true' : undefined}
                                        >
                                            <button
                                                aria-hidden="true"
                                                tabIndex={-1}
                                                type="button"
                                                aria-label="Add line anchor to the URL"
                                                className={styles.lineNumber}
                                                onClick={() => handleLineAnchor(lineId)}
                                            >
                                                {lineNum}
                                            </button>
                                            <div className="token-line">
                                                {line.map((token, j) => {
                                                    const tokenProps = getTokenProps({ token });
                                                    return (
                                                        <span
                                                            key={j}
                                                            {...tokenProps}
                                                            style={undefined}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </code>
                        </pre>
                    )}
                </Highlight>
            </div>
        );
    },
);

CodeBlock.displayName = 'CodeBlock';

export { CodeBlock };
