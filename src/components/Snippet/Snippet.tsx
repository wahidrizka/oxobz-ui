'use client';

import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { Check, Copy } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Snippet.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Color variant of the snippet. Only the three demonstrated in the Geist
 * docs ("Variants" example) have dedicated colors; omit for the default
 * gray look. Sets the shared `--themed-*` custom properties consumed by
 * the root.
 */
export type SnippetType = 'success' | 'error' | 'warning';

export interface SnippetProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onCopy'> {
    /**
     * Command(s) to display and copy. A string renders a single line; an
     * array renders one `<pre>` per item (multi-line). Rich nodes are
     * allowed but then `copyText` should carry the plain-text payload.
     */
    text: ReactNode;

    /** CSS width applied inline, e.g. "300px" or "100%". */
    width?: string;

    /** Inverted (dark) color scheme. */
    dark?: boolean;

    /** Render the leading "$ " shell prompt (default: true). */
    prompt?: boolean;

    /** Color variant. Omit for the default look. */
    type?: SnippetType;

    /**
     * Plain-text payload written to the clipboard. Only needed when `text`
     * contains rich nodes; for a string/array `text` it is redundant.
     */
    copyText?: string;

    /**
     * Informational empty-state text, shown dimmed when `text` is empty.
     * The placeholder itself is never copied.
     */
    placeholder?: string;

    /**
     * Controlled copied state. When provided, the checkmark feedback is
     * driven by this prop instead of the internal timer.
     */
    copied?: boolean;

    /** Called with the copied string after a successful copy. */
    onCopy?: (text: string) => void;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Resolve the plain-text clipboard payload. `copyText` wins; otherwise a
 * string/number `text` is used verbatim and an array is joined with
 * newlines (matching the multi-line rendering).
 */
function resolveClipboardText(text: ReactNode, copyText?: string): string {
    if (copyText != null) return copyText;
    if (typeof text === 'string') return text;
    if (typeof text === 'number') return String(text);
    if (Array.isArray(text)) {
        return text
            .filter(
                (line): line is string | number =>
                    typeof line === 'string' || typeof line === 'number',
            )
            .join('\n');
    }
    return '';
}

/** Auto-revert delay of the internal (uncontrolled) copied state. */
const COPIED_RESET_MS = 2000;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display a snippet of copyable code for the command line.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <div class="snippet [prompt] [dark] [type] [isUsingPlaceholder]"
 *      data-oxobz-snippet="" data-version="v1" style="width:…;height:auto">
 *   <pre>{line}</pre>
 *   <button class="copyIcon" type="button" aria-label="Copy to clipboard">
 *     <span class="iconStack">
 *       <span class="iconLayer …">{check}</span>
 *       <span class="iconLayer …">{copy}</span>
 *     </span>
 *   </button>
 * </div>
 * ```
 */
const Snippet = forwardRef<HTMLDivElement, SnippetProps>(
    (
        {
            className,
            copied,
            copyText,
            dark = false,
            onCopy,
            placeholder,
            prompt = true,
            style,
            text,
            type,
            width,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const isControlled = copied !== undefined;
        const [internalCopied, setInternalCopied] = useState(false);
        const showCopied = isControlled ? copied : internalCopied;

        const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        useEffect(
            () => () => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            },
            [],
        );

        const handleCopy = useCallback(() => {
            const value = resolveClipboardText(text, copyText);
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                void navigator.clipboard.writeText(value);
            }
            onCopy?.(value);
            if (!isControlled) {
                setInternalCopied(true);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(
                    () => setInternalCopied(false),
                    COPIED_RESET_MS,
                );
            }
        }, [text, copyText, onCopy, isControlled]);

        const isEmpty =
            text == null ||
            text === '' ||
            (Array.isArray(text) && text.length === 0);
        const usePlaceholder = isEmpty && placeholder != null;

        const lines = usePlaceholder ? (
            <pre>{placeholder}</pre>
        ) : Array.isArray(text) ? (
            text.map((line: ReactNode, index: number) => (
                <pre key={index}>{line}</pre>
            ))
        ) : (
            <pre>{text}</pre>
        );

        return (
            <div
                {...rest}
                className={cn(
                    styles.snippet,
                    prompt && styles.prompt,
                    dark && styles.dark,
                    type && styles[type],
                    usePlaceholder && styles.isUsingPlaceholder,
                    className,
                )}
                data-oxobz-snippet=""
                data-version={dataVersion}
                ref={ref}
                style={{ width, height: 'auto', ...style }}
            >
                {lines}
                <button
                    type="button"
                    className={styles.copyIcon}
                    aria-label="Copy to clipboard"
                    onClick={handleCopy}
                >
                    <span className={styles.iconStack}>
                        <span
                            className={cn(
                                styles.iconLayer,
                                showCopied
                                    ? styles.iconVisible
                                    : styles.iconHidden,
                            )}
                        >
                            <Check size={16} />
                        </span>
                        <span
                            className={cn(
                                styles.iconLayer,
                                showCopied
                                    ? styles.iconHidden
                                    : styles.iconVisible,
                            )}
                        >
                            <Copy size={16} />
                        </span>
                    </span>
                </button>
            </div>
        );
    },
);

Snippet.displayName = 'Snippet';

export { Snippet };
