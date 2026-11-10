'use client';

import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { Check, Copy } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import {
    Button,
    CustomButton,
    type ButtonShape,
    type ButtonSize,
    type ButtonVariant,
    type CustomButtonColors,
} from '../Button';
import { useToasts } from '../Toast';
import styles from './CopyButton.module.css';

/*
 * Port of production's own CopyButton, read from the live bundle of
 * vercel.com/geist on 10 Nov 2026 (turbopack module 700680).
 *
 * What it does, as there: writes `textToCopy` to the clipboard; on success
 * shows the check mark for 1000ms and announces `copiedLabel` to screen
 * readers; on failure calls `onCopyError`, or shows the error toast
 * "Failed to copy to clipboard" when there is none; `onClick` runs last,
 * whether the copy worked or not.
 *
 * Not ported: production also forwards a `type` color preset to its Button.
 * Our Button has no such prop (its presets are variants).
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CopyButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'prefix' | 'onClick'> {
    /** The string written to the clipboard on click. */
    textToCopy: string;

    /** Accessible name of the button. */
    label?: string;

    /** Announced to screen readers while the check mark shows. */
    copiedLabel?: string;

    /** Forces the copied state (check mark) from outside. */
    copied?: boolean;

    /** Icon shown instead of the copy icon. */
    icon?: ReactNode;

    variant?: ButtonVariant;

    shape?: ButtonShape;

    size?: ButtonSize;

    /** Custom colors. Passing any of the three renders a CustomButton. */
    normal?: CustomButtonColors;

    hover?: CustomButtonColors;

    active?: CustomButtonColors;

    /** Runs after every click, once the copy has succeeded or failed. */
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;

    onCopySuccess?: () => void;

    /** Replaces the default error toast. */
    onCopyError?: (error: unknown) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
    (
        {
            className,
            textToCopy,
            onClick,
            onCopySuccess,
            onCopyError,
            copiedLabel = 'Copied!',
            label,
            title,
            variant = 'secondary',
            normal,
            hover,
            active,
            shape = 'square',
            size,
            icon,
            copied,
            ...rest
        },
        ref,
    ) => {
        const toasts = useToasts();
        const [copiedText, setCopiedText] = useState<string | null>(null);
        /* True until the first click or the first forced `copied`. */
        const [untouched, setUntouched] = useState(true);
        const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        const isCopied = copied || copiedText === textToCopy;
        const resting = untouched && !copied;

        useEffect(() => {
            if (copied) setUntouched(false);
        }, [copied]);

        const handleClick = useCallback(
            (event: MouseEvent<HTMLButtonElement>) => {
                setUntouched(false);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                /*
                 * Production calls navigator.clipboard.writeText unguarded. The
                 * guard only routes a missing Clipboard API (insecure context,
                 * jsdom) into the same failure path instead of a TypeError; in
                 * a browser the two behave identically.
                 */
                const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
                const write = clipboard
                    ? clipboard.writeText(textToCopy)
                    : Promise.reject(new Error('Clipboard API unavailable'));
                write
                    .then(() => {
                        setCopiedText(textToCopy);
                        onCopySuccess?.();
                        timeoutRef.current = setTimeout(() => {
                            setCopiedText(null);
                        }, 1000);
                    })
                    .catch((error: unknown) => {
                        if (onCopyError) onCopyError(error);
                        else toasts.error('Failed to copy to clipboard');
                    })
                    .finally(() => onClick?.(event));
            },
            [textToCopy, toasts, onCopySuccess, onCopyError, onClick],
        );

        const showCheck = !resting && isCopied;
        const icons = (
            <div className={styles.iconStack}>
                <div className={cn(styles.icon, showCheck ? styles.iconShown : styles.iconHidden)}>
                    <Check />
                </div>
                <div className={cn(styles.icon, showCheck ? styles.iconHidden : styles.iconShown)}>
                    {icon || <Copy />}
                </div>
            </div>
        );

        if (normal || hover || active) {
            return (
                <CustomButton
                    active={active}
                    aria-label={label}
                    className={className}
                    data-testid="copy/button"
                    hover={hover}
                    normal={normal}
                    onClick={handleClick}
                    shape={shape}
                    size={size}
                    svgOnly
                    title={title}
                    typeName="button"
                    {...rest}
                    ref={ref}
                >
                    {icons}
                </CustomButton>
            );
        }

        return (
            <Button
                aria-label={label}
                className={className}
                data-testid="copy/button"
                onClick={handleClick}
                shape={shape}
                size={size}
                svgOnly
                title={title}
                typeName="button"
                variant={variant}
                {...rest}
                ref={ref}
            >
                {isCopied ? (
                    <div aria-live="assertive" className="oxobz-sr-only" role="status">
                        {copiedLabel}
                    </div>
                ) : null}
                {icons}
            </Button>
        );
    },
);

CopyButton.displayName = 'CopyButton';

export { CopyButton };
