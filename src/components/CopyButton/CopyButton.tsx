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
import styles from './CopyButton.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CopyButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onCopy'> {
    /** String written to the clipboard when the button is clicked. */
    text: string;

    /**
     * Controlled copied state. When provided, the checkmark feedback is
     * driven by this prop instead of the internal 2s timer.
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

/** Auto-revert delay of the internal (uncontrolled) copied state. */
const COPIED_RESET_MS = 2000;

/**
 * Resolve the animation class for one icon layer.
 * - Before the first interaction, a hidden layer uses `.initial` so it
 *   never plays an entrance animation on mount.
 * - After the first interaction, `.visible` / `.hidden` drive the 150ms
 *   fade+scale keyframes (copy-button-module__8qN89q).
 * - A shown layer that has never been hidden needs no class — it is
 *   naturally opaque.
 */
function getLayerClassName(isShown: boolean, hasInteracted: boolean): string | undefined {
    if (isShown) return hasInteracted ? styles.visible : undefined;
    return hasInteracted ? styles.hidden : styles.initial;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A button that copies a given string to the clipboard and provides
 * feedback when copied by cross-fading a Copy icon into a Check icon.
 *
 * Rendered DOM (Geist production structure, copy-button.html):
 * ```html
 * <button aria-label="copy text" data-oxobz-copy-button="" data-version="v1">
 *   <span class="iconStack">
 *     <span class="icon …">{copy}</span>
 *     <span class="icon …">{check}</span>
 *   </span>
 * </button>
 * ```
 */
const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
    (
        {
            text,
            copied,
            onCopy,
            className,
            onClick,
            'aria-label': ariaLabel = 'copy text',
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
                    void navigator.clipboard.writeText(text);
                }
                onCopy?.(text);
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
            [onClick, text, onCopy, isControlled],
        );

        return (
            <button
                {...rest}
                ref={ref}
                type="button"
                aria-label={ariaLabel}
                className={cn(styles.copyButtonIcon, className)}
                data-oxobz-copy-button=""
                data-version={dataVersion}
                onClick={handleClick}
            >
                <span className={styles.iconStack}>
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
            </button>
        );
    },
);

CopyButton.displayName = 'CopyButton';

export { CopyButton };
