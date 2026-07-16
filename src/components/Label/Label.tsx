import { forwardRef, type LabelHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Label.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    /**
     * The text content of the label. Mirrors the Geist `value` prop from the
     * official Label docs (`<Label id="test-input" value="This is a label" />`).
     */
    value?: ReactNode;

    /**
     * Fallback content. Prefer `value`; `children` is only rendered when
     * `value` is omitted, kept for backward compatibility during migration.
     */
    children?: ReactNode;

    /**
     * Applies `cursor: text`, used when the label is associated with a text
     * input. Mirrors the Geist `withInput` prop.
     */
    withInput?: boolean;

    /**
     * Opts out of the default `text-transform: capitalize` styling. Casing is
     * applied by default; pass `bypassCasing` to disable it. Mirrors the Geist
     * `bypassCasing` prop (opt-out — inverse polarity of a `capitalize` flag).
     */
    bypassCasing?: boolean;

    /** `data-version` attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * An accessible text label for form controls.
 *
 * Text is provided via the `value` prop (per the Geist API); casing is
 * capitalized by default and can be disabled with `bypassCasing`.
 *
 * @example
 * <Label id="email" value="Email address" withInput />
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(
    (
        {
            value,
            children,
            className,
            withInput = false,
            bypassCasing = false,
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
                    withInput && styles.input,
                    !bypassCasing && styles.capitalize,
                    className,
                )}
                data-version={dataVersion}
                ref={ref}
            >
                {value ?? children}
            </label>
        );
    },
);

Label.displayName = 'Label';

export { Label };
