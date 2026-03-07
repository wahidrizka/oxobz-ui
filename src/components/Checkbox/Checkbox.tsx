import {
    forwardRef,
    useId,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Checkbox.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CheckboxProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Label content rendered next to the checkbox */
    children?: ReactNode;

    /** Visually marks the checkbox as indeterminate (dash icon) */
    indeterminate?: boolean;

    /** Forces the inverted visual style (dark checkbox outline) */
    inverted?: boolean;

    /** Makes the checkbox + label take 100 % width */
    fullWidth?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                          */
/* ------------------------------------------------------------------ */

/** Internal SVG used inside the checkbox icon — checkmark + dash */
function CheckboxSvg() {
    return (
        <svg fill="none" height="16" viewBox="0 0 20 20" width="16">
            {/* Checkmark path — hidden by default, visible when checked */}
            <path
                d="M14 7L8.5 12.5L6 10"
                stroke="var(--oxobz-background)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
            />
            {/* Indeterminate dash line — visible when .indeterminate class applied */}
            <line
                stroke="var(--checkbox-color)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="5"
                x2="15"
                y1="10"
                y2="10"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    (
        {
            children,
            className,
            disabled,
            id: idProp,
            indeterminate = false,
            inverted = false,
            fullWidth = false,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const autoId = useId();
        const inputId = idProp ?? `checkbox-${autoId}`;

        return (
            <label
                className={cn(
                    styles.container,
                    disabled && styles.disabled,
                    fullWidth && styles.fullWidth,
                    className,
                )}
                data-version={dataVersion}
                htmlFor={inputId}
            >
                <span className={styles.check}>
                    {/* Zero-width space keeps the span from collapsing */}
                    &#8203;
                    <input
                        {...rest}
                        className={cn('oxobz-sr-only', styles.input)}
                        disabled={disabled}
                        id={inputId}
                        ref={ref}
                        type="checkbox"
                    />
                    <span
                        aria-hidden="true"
                        className={cn(
                            styles.icon,
                            indeterminate && 'indeterminate',
                            inverted && 'inverted',
                            disabled && styles.disabled,
                        )}
                    >
                        <CheckboxSvg />
                    </span>
                </span>
                {children != null && (
                    <span className={styles.text}>{children}</span>
                )}
            </label>
        );
    },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
