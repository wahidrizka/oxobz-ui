import {
    forwardRef,
    useId,
    type ReactNode,
    type SelectHTMLAttributes,
} from 'react';
import { ChevronDown, Stop } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Select.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SelectSize = 'small' | 'medium' | 'large';

export interface SelectProps
    extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'prefix'> {
    /** Size of the control — form heights 32 / 40 / 48px */
    size?: SelectSize;

    /**
     * Placeholder rendered as a disabled first option; it is the
     * initially selected option unless a value/defaultValue is given.
     */
    placeholder?: string;

    /** Decoration rendered inside the control, before the value */
    prefix?: ReactNode;

    /** Decoration rendered inside the control, replacing the chevron */
    suffix?: ReactNode;

    /** Text label rendered above the control */
    label?: string;

    /** Error message rendered below the control (sets aria-invalid) */
    error?: string;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display a dropdown list of items (wrapper around the native <select>).
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <label for="select-:r1:" data-version="v1">
 *   <div>My label</div>                            <!-- label -->
 *   <div class="container" data-oxobz-select="" data-version="v1">
 *     <span class="prefix">…</span>                <!-- prefix -->
 *     <select class="select" id="select-:r1:">…</select>
 *     <span class="suffix">…</span>                <!-- suffix / chevron -->
 *   </div>
 *   <div class="errorMessage" role="alert" data-oxobz-error="">…</div>
 * </label>
 * ```
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            children,
            className,
            defaultValue,
            disabled,
            error,
            id: idProp,
            label,
            placeholder,
            prefix,
            size = 'medium',
            suffix,
            value,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const autoId = useId();
        const selectId = idProp ?? `select-${autoId}`;
        const errorId = `${selectId}-error`;
        const hasError = error != null && error !== '';

        // Production behaviour: with a placeholder and no explicit value,
        // the (disabled) placeholder option is the initially selected one.
        const resolvedDefaultValue =
            placeholder != null && defaultValue === undefined
                ? placeholder
                : defaultValue;

        return (
            <label
                className={className}
                data-version={dataVersion}
                htmlFor={selectId}
            >
                {label != null && (
                    <div className={styles.labelText}>{label}</div>
                )}
                <div
                    className={cn(
                        styles.container,
                        disabled && styles.disabled,
                        hasError && styles.error,
                    )}
                    data-oxobz-select=""
                    data-version={dataVersion}
                >
                    {prefix != null && (
                        <span className={styles.prefix}>{prefix}</span>
                    )}
                    <select
                        {...rest}
                        aria-describedby={
                            hasError ? errorId : rest['aria-describedby']
                        }
                        aria-invalid={hasError ? 'true' : 'false'}
                        className={cn(
                            styles.select,
                            size !== 'medium' && styles[size],
                        )}
                        disabled={disabled}
                        id={selectId}
                        ref={ref}
                        {...(value !== undefined
                            ? { value }
                            : { defaultValue: resolvedDefaultValue })}
                    >
                        {placeholder != null && (
                            <option
                                className={styles.placeholder}
                                disabled
                                label={placeholder}
                                value={placeholder}
                            >
                                {placeholder}
                            </option>
                        )}
                        {children}
                    </select>
                    <span className={styles.suffix}>
                        {suffix ?? (
                            <ChevronDown className={styles.controlIcon} />
                        )}
                    </span>
                </div>
                {hasError && (
                    <div
                        aria-atomic="true"
                        className={cn(
                            styles.errorMessage,
                            size === 'large' && styles.errorLarge,
                        )}
                        data-oxobz-error=""
                        data-version={dataVersion}
                        id={errorId}
                        role="alert"
                        style={{ marginTop: 8 }}
                    >
                        <div aria-hidden="true" className={styles.errorIcon}>
                            <Stop color="var(--ds-red-900)" />
                        </div>
                        <div className={styles.errorText}>{error}</div>
                    </div>
                )}
            </label>
        );
    },
);

Select.displayName = 'Select';

export { Select };
