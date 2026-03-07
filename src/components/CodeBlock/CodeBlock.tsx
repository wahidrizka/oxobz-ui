import {
    forwardRef,
    useCallback,
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

/* Additional languages loaded from prismjs */
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup-templating'; /* required by PHP */
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-toml';

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

interface SwitcherProps {
    options: SwitcherOption[];
    value: string;
    onChange: (value: string) => void;
}

function Switcher({ options, value, onChange }: SwitcherProps) {
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
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
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

    /** Whether to show line numbers (default: true) */
    showLineNumbers?: boolean;

    /** Language switcher options */
    switcherOptions?: SwitcherOption[];

    /** Current switcher value */
    switcherValue?: string;

    /** Switcher change handler */
    onSwitcherChange?: (value: string) => void;
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
/*  CodeBlock                                                           */
/* ------------------------------------------------------------------ */

/**
 * Code Block component — syntax-highlighted code display.
 *
 * Production DOM structure:
 * ```html
 * <div aria-label="..." class="relative wrapper [hasFileName]"
 *      data-geist-code-block="">
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
 *     <code class="code" data-geist-code-block="true">
 *       <div class="line" data-geist-code-block-line="true" ...>
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
            showLineNumbers = true,
            switcherOptions,
            switcherValue,
            onSwitcherChange,
            className,
            ...rest
        },
        ref,
    ) => {
        const hasFileName = !!filename;
        const codeText = children;

        const highlightSet = new Set(highlightedLinesNumbers);
        const addedSet = new Set(addedLinesNumbers);
        const removedSet = new Set(removedLinesNumbers);

        return (
            <div
                {...rest}
                ref={ref}
                aria-label={rest['aria-label']}
                className={cn(
                    'relative',
                    styles.wrapper,
                    hasFileName && styles.hasFileName,
                    !showLineNumbers && styles.hideLineNumbers,
                    className,
                )}
                data-geist-code-block=""
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
                            {switcherOptions && switcherValue && onSwitcherChange && (
                                <Switcher
                                    options={switcherOptions}
                                    value={switcherValue}
                                    onChange={onSwitcherChange}
                                />
                            )}
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
                            <code className={styles.code} data-geist-code-block="true">
                                {tokens.map((line, i) => {
                                    const lineNum = i + 1;
                                    const isHighlighted = highlightSet.has(lineNum);
                                    const isAdded = addedSet.has(lineNum);
                                    const isRemoved = removedSet.has(lineNum);
                                    const lineProps = getLineProps({ line });

                                    return (
                                        <div
                                            key={lineNum}
                                            {...lineProps}
                                            className="line"
                                            style={{
                                                fontFeatureSettings: '"liga" 0',
                                            }}
                                            data-geist-code-block-line="true"
                                            data-highlighted={
                                                isHighlighted ? 'true' : undefined
                                            }
                                            data-added={isAdded ? 'true' : undefined}
                                            data-removed={isRemoved ? 'true' : undefined}
                                        >
                                            <button
                                                aria-hidden="true"
                                                tabIndex={-1}
                                                type="button"
                                                aria-label="Add line anchor to the URL"
                                                className={styles.lineNumber}
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
