import { forwardRef, type LabelHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Label.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    /** Label content */
    children?: ReactNode;

    /** Adds cursor:text style (used when label is associated with a text input) */
    isInput?: boolean;

    /** Applies text-transform: capitalize */
    capitalize?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A form field label.
 *
 * Production DOM:
 * ```html
 * <label class="label capitalize">Choicebox group disabled</label>
 * ```
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(
    (
        {
            children,
            className,
            isInput = false,
            capitalize = false,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <label
                {...rest}
                className={cn(
                    styles.label,
                    isInput && styles.input,
                    capitalize && styles.capitalize,
                    className,
                )}
                data-version={dataVersion}
                ref={ref}
            >
                {children}
            </label>
        );
    },
);

Label.displayName = 'Label';

export { Label };
