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
import { Button } from '../Button';
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
 * The root IS a Button: production composes this out of a `secondary`,
 * `shape="square"`, `size="medium"` Button, which is where
 * `data-geist-button`, `data-react-aria-pressable`, `data-prefix`,
 * `data-suffix`, `data-version` and `--geist-icon-size` all come from. An
 * older build here hand-rolled the button element and re-implemented those
 * styles in this module instead; the measured DOM shows production does not.
 *
 * Rendered DOM, measured off the live page on 11 Sep 2026:
 * ```html
 * <button aria-label="copy text" data-testid="copy/button" data-oxobz-button="" …>
 *   <span class="content flex">
 *     <div class="iconStack">
 *       <div class="icon iconHidden">{check}</div>
 *       <div class="icon iconShown">{copy}</div>
 *     </div>
 *   </span>
 * </button>
 * ```
 * Check comes FIRST in the DOM and Copy second; only their opacity/scale
 * swap when the copied state flips.
 */
const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
    ({ textToCopy, label = 'copy text', copied, onCopy, className, onClick, ...rest }, ref) => {
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
            <Button
                {...rest}
                ref={ref}
                aria-label={label}
                className={className}
                data-testid="copy/button"
                onClick={handleClick}
                shape="square"
                svgOnly
                typeName="button"
                variant="secondary"
            >
                <div className={styles.iconStack}>
                    <div
                        className={cn(
                            styles.icon,
                            showCopied ? styles.iconShown : styles.iconHidden,
                        )}
                    >
                        <Check size={16} />
                    </div>
                    <div
                        className={cn(
                            styles.icon,
                            showCopied ? styles.iconHidden : styles.iconShown,
                        )}
                    >
                        <Copy size={16} />
                    </div>
                </div>
            </Button>
        );
    },
);

CopyButton.displayName = 'CopyButton';

export { CopyButton };
