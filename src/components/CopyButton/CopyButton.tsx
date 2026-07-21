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
import styles from './CopyButton.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CopyButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onCopy'> {
    /** String written to the clipboard when the button is clicked. */
    textToCopy: string;

    /** Accessible label of the button. Default `'copy text'`. */
    label?: string;

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
            textToCopy,
            label = 'copy text',
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
                aria-label={label}
                className={cn(styles.copyButtonIcon, className)}
                data-oxobz-copy-button=""
                data-version={dataVersion}
                onClick={handleClick}
            >
                <span className={styles.iconStack}>
                    <span
                        className={cn(
                            styles.icon,
                            showCopied ? styles.iconHidden : styles.iconShown,
                        )}
                    >
                        <Copy size={16} />
                    </span>
                    <span
                        className={cn(
                            styles.icon,
                            showCopied ? styles.iconShown : styles.iconHidden,
                        )}
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
