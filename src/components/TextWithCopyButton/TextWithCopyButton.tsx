'use client';

import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type CSSProperties,
    type ElementType,
    type MouseEventHandler,
} from 'react';
import { Check, Copy } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Swap } from '../../utils/phase';
import { useToasts } from '../Toast';
import { Tooltip } from '../Tooltip';
import styles from './TextWithCopyButton.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TextWithCopyButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'style'> {
    /** String written to the clipboard when the button is clicked. */
    textToCopy: string;

    /** Visible label. It never changes: the copied feedback is the icon swap plus a toast. */
    textLabel: string;

    /** Text of the toast shown once the clipboard write succeeds. */
    successMessage: string;

    /**
     * Truncate the label with an ellipsis instead of letting it overflow
     * (production's global `geist-ellipsis` class). Off by default.
     */
    ellipsis?: boolean;

    /** Element rendered for the label. Default `p`. */
    as?: ElementType;

    /** Show `textToCopy` in a tooltip while hovering. Off by default. */
    showTooltip?: boolean;

    /** Inline style for the LABEL: production puts `style` there, not on the button. */
    style?: CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** How long the check icon stays before swapping back (production: 1e3). */
const COPIED_MS = 1000;

/** Swap exit fallback when no transition event arrives (production: 400). */
const EXIT_FALLBACK_MS = 400;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display text alongside a button that copies the text to the clipboard.
 *
 * Rebuilt 12 Sep 2026 from the production source (chunk 0jv75r7jllo1w) and
 * the live page, which disagree with the old build on three counts:
 *
 * - `successMessage` is NOT swapped into the label. The label stays put and
 *   the message goes to `toasts.message(...)`; a failed write toasts
 *   "Failed to copy to clipboard".
 * - The icons are not two stacked layers cross-fading. A `Swap` keeps ONE
 *   layer in the DOM: the copy icon exits (150ms, scale .5 + fade), then the
 *   check icon mounts and enters from that same starting style. It swaps
 *   back after 1s.
 * - The root carries no component marker and no data-version.
 *
 * Rendered DOM at rest:
 * ```html
 * <button type="button" class="button">
 *   <div class="row">
 *     <p class="[ellipsis] label">Copy</p>
 *     <div class="swap"><div class="state" data-phase="entered"><svg/></div></div>
 *   </div>
 * </button>
 * ```
 * With `showTooltip`, production wraps the row in its Tooltip. That path has
 * no live example (both docs demos leave it off, and the tooltip then renders
 * no wrapper at all), so the enabled look is unverified against production.
 */
const TextWithCopyButton = forwardRef<HTMLButtonElement, TextWithCopyButtonProps>(
    (
        {
            textToCopy,
            textLabel,
            successMessage,
            ellipsis = false,
            as: Label = 'p',
            showTooltip = false,
            style,
            className,
            onClick,
            ...rest
        },
        ref,
    ) => {
        const toasts = useToasts();
        const [copied, setCopied] = useState(false);

        const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        useEffect(
            () => () => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            },
            [],
        );

        const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
            (event) => {
                onClick?.(event);
                if (!textToCopy) return;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setCopied(true);
                /*
                 * Production calls navigator.clipboard.writeText unguarded. The
                 * guard here only routes a missing Clipboard API (insecure
                 * context, jsdom) into the same failure toast instead of a
                 * TypeError; in a browser the two behave identically.
                 */
                const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
                const write = clipboard
                    ? clipboard.writeText(textToCopy)
                    : Promise.reject(new Error('Clipboard API unavailable'));
                write
                    .then(() => toasts.message(successMessage))
                    .catch(() => toasts.error('Failed to copy to clipboard'));
                timeoutRef.current = setTimeout(() => setCopied(false), COPIED_MS);
            },
            [onClick, textToCopy, toasts, successMessage],
        );

        // Production renders nothing without something to copy.
        if (!textToCopy) return null;

        const row = (
            <div className={styles.row}>
                <Label className={cn(ellipsis && styles.ellipsis, styles.label)} style={style}>
                    {textLabel}
                </Label>
                <Swap active={copied ? 'check' : 'copy'} className={styles.swap} exitDuration={EXIT_FALLBACK_MS}>
                    <Swap.State className={styles.state} id="copy">
                        <Copy size={16} />
                    </Swap.State>
                    <Swap.State className={styles.state} id="check">
                        <Check size={16} />
                    </Swap.State>
                </Swap>
            </div>
        );

        return (
            <button {...rest} ref={ref} className={cn(styles.button, className)} onClick={handleClick} type="button">
                {showTooltip ? <Tooltip text={textToCopy}>{row}</Tooltip> : row}
            </button>
        );
    },
);

TextWithCopyButton.displayName = 'TextWithCopyButton';

export { TextWithCopyButton };
