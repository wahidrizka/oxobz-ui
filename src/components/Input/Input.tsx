'use client';

import {
    forwardRef,
    useId,
    type CSSProperties,
    type InputHTMLAttributes,
    type KeyboardEventHandler,
    type ReactNode,
} from 'react';
import { Stop } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Input.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type InputSize = 'small' | 'medium' | 'large';

export interface InputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
    /** Visual size of the field (default: 'medium') */
    size?: InputSize;

    /** Content rendered before the input (icon or text) */
    prefix?: ReactNode;

    /** Content rendered after the input (icon or text) */
    suffix?: ReactNode;

    /**
     * Gray background + divider on the prefix. Pass false to render the
     * prefix flush on the input background (default: true).
     */
    prefixStyling?: boolean;

    /**
     * Gray background + divider on the suffix. Pass false to render the
     * suffix flush on the input background (default: true).
     */
    suffixStyling?: boolean;

    /**
     * Wraps the suffix in its default container element. Pass false to
     * render the suffix node directly inside the wrapper (default: true).
     */
    suffixContainer?: boolean;

    /**
     * Error message rendered below the field. When set, the outline turns
     * red and the message is announced via role="alert".
     */
    error?: string;
    /**
     * Extra class for the wrapper that draws the ring, not for the <input>.
     * Production uses it the same way, e.g. `innerWrapperClassName="w-full"`
     * on the Calendar's date field.
     */
    innerWrapperClassName?: string;

    /**
     * Render the error message block below the field. Set `false` to keep the
     * red outline and `aria-invalid` while placing the message somewhere else
     * yourself, which is what Geist's Calendar does: it shows the wording next
     * to the field's label instead of underneath the input.
     */
    showErrorMessage?: boolean;

    /** Label text rendered above the field (wraps the field in a <label>) */
    label?: string;

    /** Pill shape (fully rounded corners) */
    rounded?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * --geist-icon-size set inline on the wrapper in production. The map is
 * only consulted when the size prop is explicitly passed — an implicit
 * (default) size renders 16px even though the field itself is medium,
 * exactly like production output.
 */
const ICON_SIZE: Record<InputSize, string> = {
    small: '16px',
    medium: '20px',
    large: '24px',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Retrieve text input from a user.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <!-- with label, the whole field is wrapped: -->
 * <label data-version="v1" for="input-:id:">
 *   <div class="labelText">Label</div>
 *   ...
 * </label>
 *
 * <div class="container" data-oxobz-input-wrapper="" data-version="v1"
 *   style="--oxobz-icon-size: 16px;">
 *   <input class="input" data-oxobz-input="" id="input-:id:" type="text"
 *     spellcheck="false" autocapitalize="none" autocomplete="off"
 *     autocorrect="off" aria-invalid="false" />
 *   <label aria-hidden="true" class="affix" data-oxobz-input-prefix=""
 *     for="input-:id:">…</label>
 *   <label aria-hidden="true" class="affix" data-oxobz-input-suffix=""
 *     for="input-:id:">…</label>
 * </div>
 * <!-- only with error -->
 * <div aria-atomic="true" class="errorMessage" data-oxobz-error=""
 *   data-version="v1" id="input-:id:-error" role="alert">
 *   <div aria-hidden="true" class="errorIcon">…stop icon…</div>
 *   <div class="errorText">An error message.</div>
 * </div>
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            'aria-describedby': ariaDescribedBy,
            className,
            disabled,
            error,
            innerWrapperClassName,
            id: idProp,
            label,
            prefix,
            prefixStyling = true,
            rounded = false,
            showErrorMessage = true,
            size,
            suffix,
            suffixContainer = true,
            suffixStyling = true,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const autoId = useId();
        const inputId = idProp ?? `input-${autoId}`;
        const errorId = `${inputId}-error`;
        const hasError = error != null && error !== '';
        const hasPrefix = prefix != null;
        const hasSuffix = suffix != null;

        // Geist behaviour: a search input clears itself when Escape is pressed.
        // Uses the native value setter + input event so both controlled and
        // uncontrolled consumers see the change.
        const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
            rest.onKeyDown?.(e);
            if (
                rest.type === 'search' &&
                e.key === 'Escape' &&
                !e.defaultPrevented &&
                !disabled
            ) {
                const input = e.currentTarget;
                const setValue = Object.getOwnPropertyDescriptor(
                    HTMLInputElement.prototype,
                    'value',
                )?.set;
                setValue?.call(input, '');
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };

        const field = (
            <>
                <div
                    className={cn(
                        styles.container,
                        size === 'small' && styles.small,
                        size === 'large' && styles.large,
                        rounded && styles.rounded,
                        hasError && styles.error,
                        hasPrefix && styles.prefix,
                        hasSuffix && styles.suffix,
                        hasPrefix && !prefixStyling && styles.noPrefixStyle,
                        hasSuffix && !suffixStyling && styles.noSuffixStyle,
                        innerWrapperClassName,
                    )}
                    data-oxobz-input-wrapper=""
                    data-version={dataVersion}
                    style={
                        {
                            '--oxobz-icon-size': size
                                ? ICON_SIZE[size]
                                : '16px',
                        } as CSSProperties
                    }
                >
                    <input
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        type="text"
                        {...rest}
                        aria-describedby={
                            hasError && showErrorMessage ? errorId : ariaDescribedBy
                        }
                        aria-invalid={hasError ? 'true' : 'false'}
                        className={cn(styles.input, className)}
                        data-oxobz-input=""
                        disabled={disabled}
                        id={inputId}
                        onKeyDown={handleKeyDown}
                        ref={ref}
                    />
                    {hasPrefix && (
                        <label
                            aria-hidden="true"
                            className={styles.affix}
                            data-oxobz-input-prefix=""
                            htmlFor={inputId}
                        >
                            {prefix}
                        </label>
                    )}
                    {hasSuffix &&
                        (suffixContainer ? (
                            <label
                                aria-hidden="true"
                                className={styles.affix}
                                data-oxobz-input-suffix=""
                                htmlFor={inputId}
                            >
                                {suffix}
                            </label>
                        ) : (
                            suffix
                        ))}
                </div>
                {hasError && showErrorMessage && (
                    <div
                        aria-atomic="true"
                        className={styles.errorMessage}
                        data-oxobz-error=""
                        data-version="v1"
                        id={errorId}
                        role="alert"
                        style={{ marginTop: 'var(--oxobz-gap-quarter)' }}
                    >
                        <div aria-hidden="true" className={styles.errorIcon}>
                            <Stop color="red-900" size={16} />
                        </div>
                        <div className={styles.errorText}>{error}</div>
                    </div>
                )}
            </>
        );

        if (label != null) {
            return (
                <label data-version={dataVersion} htmlFor={inputId}>
                    <div className={styles.labelText}>{label}</div>
                    {field}
                </label>
            );
        }

        return field;
    },
);

Input.displayName = 'Input';

export { Input };
