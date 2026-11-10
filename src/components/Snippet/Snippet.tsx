'use client';

import { forwardRef, memo, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { CopyButton } from '../CopyButton';
import styles from './Snippet.module.css';

/*
 * Port of production's own Snippet, read from the live bundle of
 * vercel.com/geist on 10 Nov 2026 (turbopack module 19020). The copy control
 * is production's CopyButton inside a positioned wrapper, so copying, the
 * check mark and the failure toast all come from there.
 *
 * Not ported:
 *   - `fill` and `variant`, which only pick other --themed-* presets from
 *     production's shared helper classes.
 *     ponytail: add them when a page needs a filled snippet.
 *   - the `DisabledContext` provider around the copy button. Nothing in this
 *     library provides that context, so there is nothing to shield from.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SnippetType = 'success' | 'error' | 'warning';

export interface SnippetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onCopy'> {
    /** One line, or an array of lines. */
    text?: ReactNode;

    /** Copied instead of `text`. */
    copyText?: string;

    /** Runs after every click on the copy button. */
    onCopy?: () => void;

    /** Width of the snippet, e.g. "300px". */
    width?: string;

    /** Fixed 36px height. */
    compact?: boolean;

    /** Shows the `$ ` prompt before each line. */
    prompt?: boolean;

    /** Shows the copy button. */
    icon?: boolean;

    /** Inverted color scheme. */
    dark?: boolean;

    /** Color preset. */
    type?: SnippetType;

    /** Shown, dimmed, while there is no text. */
    placeholder?: string;

    /** Disables the copy button. */
    notFocusable?: boolean;

    /** Forces the copied state of the copy button. */
    copied?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Snippet = memo(
    forwardRef<HTMLDivElement, SnippetProps>(
        (
            {
                text,
                copyText,
                onCopy,
                width,
                compact = false,
                prompt = true,
                icon = true,
                dark,
                type,
                className,
                placeholder,
                notFocusable,
                copied,
                style,
                ...rest
            },
            ref,
        ) => {
            const textToCopy = useMemo(() => {
                if (copyText) return copyText;
                if (Array.isArray(text)) return text.join('\n');
                return typeof text === 'string' ? text : '';
            }, [text, copyText]);

            const usesPlaceholder = !!(!text && placeholder);

            return (
                <div
                    className={cn(
                        styles.snippet,
                        prompt && styles.prompt,
                        dark && styles.dark,
                        usesPlaceholder && styles.isUsingPlaceholder,
                        type && styles[type],
                        className,
                    )}
                    {...rest}
                    data-oxobz-snippet=""
                    data-version="v1"
                    ref={ref}
                    style={{ width, height: compact ? '36px' : 'auto', ...style }}
                >
                    {Array.isArray(text) ? (
                        text.map((line: ReactNode, index: number) => (
                            <pre className={styles.line} key={index}>
                                {line}
                            </pre>
                        ))
                    ) : (
                        <pre
                            className={styles.line}
                            style={compact ? { height: '36px', lineHeight: 1 } : undefined}
                        >
                            {text || placeholder}
                        </pre>
                    )}
                    {icon ? (
                        <div className={styles.copy}>
                            <CopyButton
                                className={styles.copyButton}
                                copied={copied}
                                disabled={notFocusable}
                                label="Copy to clipboard"
                                onClick={() => {
                                    onCopy?.();
                                }}
                                shape="square"
                                size="small"
                                textToCopy={textToCopy}
                                variant="secondary"
                            />
                        </div>
                    ) : null}
                </div>
            );
        },
    ),
);

Snippet.displayName = 'Snippet';

export { Snippet };
