import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Stop } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Error.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Controls font-size/line-height and the icon's vertical offset. */
export type ErrorSize = 'small' | 'medium' | 'large';

export interface ErrorProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Bold label rendered before the message, e.g. `label="Email Error:"`.
     * Omit for a plain message (default).
     */
    label?: ReactNode;

    /** Size of the message text and icon offset. Default `'medium'`. */
    size?: ErrorSize;

    /** The error message content. */
    children?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

export interface ErrorActionProps extends HTMLAttributes<HTMLSpanElement> {}

/* ------------------------------------------------------------------ */
/*  Error.Action (inline action/link wrapper)                          */
/* ------------------------------------------------------------------ */

/**
 * Wraps an inline action (typically a link) inside the error message so it
 * flows correctly with the surrounding text.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <span class="action-link"><a href="...">Contact Us</a></span>
 * ```
 */
const ErrorAction = forwardRef<HTMLSpanElement, ErrorActionProps>(
    ({ className, ...rest }, ref) => (
        <span
            {...rest}
            className={cn(styles['action-link'], className)}
            ref={ref}
        />
    ),
);

ErrorAction.displayName = 'Error.Action';

/* ------------------------------------------------------------------ */
/*  Error                                                               */
/* ------------------------------------------------------------------ */

/**
 * Display an error message block/callout — an icon paired with a message,
 * used for section- or page-level failures (Geist docs: "Error").
 *
 * Rendered DOM (Geist production / geistcn structure, geist→oxobz rename):
 * ```html
 * <div aria-atomic="true" class="error" data-oxobz-error="" data-version="v1" role="alert">
 *   <div aria-hidden="true" class="icon"><svg>...</svg></div>
 *   <div class="text">
 *     <b class="label">Email Error:</b>   <!-- only when label -->
 *     This email address is already in use.
 *   </div>
 * </div>
 * ```
 */
const ErrorRoot = forwardRef<HTMLDivElement, ErrorProps>(
    (
        {
            children,
            className,
            label,
            size = 'medium',
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <div
                {...rest}
                aria-atomic="true"
                className={cn(
                    styles.error,
                    size === 'small' && styles.small,
                    size === 'large' && styles.large,
                    className,
                )}
                data-oxobz-error=""
                data-version={dataVersion}
                ref={ref}
                role="alert"
            >
                <div aria-hidden="true" className={styles.icon}>
                    <Stop color="var(--ds-red-900)" size={16} />
                </div>
                <div className={styles.text}>
                    {label != null && (
                        <b className={styles.label}>{label}</b>
                    )}
                    {children}
                </div>
            </div>
        );
    },
);

ErrorRoot.displayName = 'Error';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const Error = Object.assign(ErrorRoot, {
    Action: ErrorAction,
});

export { Error };
