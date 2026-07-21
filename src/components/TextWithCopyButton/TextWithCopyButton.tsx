'use client';

import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type MouseEventHandler,
} from 'react';
import { Check, Copy } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './TextWithCopyButton.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TextWithCopyButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onCopy'> {
    /** String written to the clipboard when the button is clicked. */
    textToCopy: string;

    /** Visible label shown before the button is clicked. */
    textLabel: string;

    /** Label shown in place of `textLabel` while the copied feedback is active. */
    successMessage: string;

    /**
     * Truncate `textLabel`/`successMessage` with an ellipsis instead of
     * letting it overflow the button (geist-ellipsis: text-overflow
     * ellipsis, white-space nowrap, max-width 100%). Both captured Geist
     * examples ("Default", "With Small and Tertiary") pass this — there is
     * no captured example of the un-truncated look, but the prop clearly
     * gates the `geist-ellipsis` class, so it defaults to false here
     * (opt-in) rather than assuming it is always on.
     */
    ellipsis?: boolean;

    /**
     * Controlled copied state. When provided, the label/icon feedback is
     * driven by this prop instead of the internal 2s timer (same
     * controlled/uncontrolled split as CopyButton and Snippet).
     */
    copied?: boolean;

    /** Called with the copied string after a successful copy. */
    onCopy?: (text: string) => void;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Auto-revert delay of the internal (uncontrolled) copied state. */
const COPIED_RESET_MS = 2000;

/**
 * Resolve the animation class for one icon layer — identical scheme to
 * CopyButton's `getLayerClassName` (copy-button-module__8qN89q timing),
 * reused here for consistency across every copy-feedback control in this
 * package: `.initial` before any interaction (no entrance animation on
 * mount), `.visible`/`.hidden` afterwards.
 */
function getLayerClassName(isShown: boolean, hasInteracted: boolean): string | undefined {
    if (isShown) return hasInteracted ? styles.visible : undefined;
    return hasInteracted ? styles.hidden : styles.initial;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display text alongside a button that copies the text to the clipboard.
 *
 * Rendered DOM (Geist production / geistcn structure,
 * text-with-copy-button.html — plain Tailwind utility classes, no
 * `*-module__hash` component module exists for this control):
 * ```html
 * <button type="button" data-oxobz-text-with-copy-button="" data-version="v1">
 *   <span class="content">
 *     <p class="label [ellipsis]">Copy</p>
 *     <span class="iconWrap">
 *       <span class="icon …"><Copy/></span>
 *       <span class="icon …"><Check/></span>
 *     </span>
 *   </span>
 * </button>
 * ```
 *
 * Ground truth: the snapshot only ever captures the pre-click ("Copy" +
 * Copy-icon, opacity:1/transform:none) resting state — no mid-click frame
 * was ever captured, so the icon cross-fade timing/easing is NOT verified
 * for this specific control. It is modelled on the sibling CopyButton /
 * Snippet controls (0.15s ease-out fade, same `.initial/.visible/.hidden`
 * scheme) for consistency, minus the scale keyframe those use — the
 * snapshot's resolved `transform: none` (no scale listed) rules out a
 * scale component here, so this component fades opacity only.
 *
 * The label swap (`textLabel` -> `successMessage` while copied) has no
 * captured animation either; it is a plain text swap, no transition
 * invented for it.
 */
const TextWithCopyButton = forwardRef<HTMLButtonElement, TextWithCopyButtonProps>(
    (
        {
            textToCopy,
            textLabel,
            successMessage,
            ellipsis = false,
            copied,
            onCopy,
            className,
            onClick,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const isControlled = copied !== undefined;
        const [internalCopied, setInternalCopied] = useState(false);
        const [hasInteracted, setHasInteracted] = useState(false);
        const showCopied = isControlled ? copied : internalCopied;

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
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    void navigator.clipboard.writeText(textToCopy);
                }
                onCopy?.(textToCopy);
                setHasInteracted(true);
                if (!isControlled) {
                    setInternalCopied(true);
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(
                        () => setInternalCopied(false),
                        COPIED_RESET_MS,
                    );
                }
            },
            [onClick, textToCopy, onCopy, isControlled],
        );

        return (
            <button
                {...rest}
                ref={ref}
                type="button"
                className={cn(styles.button, className)}
                data-oxobz-text-with-copy-button=""
                data-version={dataVersion}
                onClick={handleClick}
            >
                <span className={styles.content}>
                    <p className={cn(styles.label, ellipsis && styles.labelEllipsis)}>
                        {showCopied ? successMessage : textLabel}
                    </p>
                    <span className={styles.iconWrap}>
                        <span
                            className={cn(styles.icon, getLayerClassName(!showCopied, hasInteracted))}
                        >
                            <Copy size={16} />
                        </span>
                        <span
                            className={cn(styles.icon, getLayerClassName(showCopied, hasInteracted))}
                        >
                            <Check size={16} />
                        </span>
                    </span>
                </span>
            </button>
        );
    },
);

TextWithCopyButton.displayName = 'TextWithCopyButton';

export { TextWithCopyButton };
