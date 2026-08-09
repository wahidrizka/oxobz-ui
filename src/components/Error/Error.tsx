import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { ExternalSmall, Stop } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Error.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Controls font-size/line-height and the icon's vertical offset. */
export type ErrorSize = 'small' | 'medium' | 'large';

export interface ErrorProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Bold label rendered before the message. A colon is appended
     * automatically (`label="Email Error"` renders `Email Error:`) —
     * production DOM: `<b class="font-medium mr-2">Email Error:</b>`.
     * Pass `false` (or omit) to render no label at all.
     */
    label?: ReactNode;

    /** Size of the message text and icon offset. Default `'medium'`. */
    size?: ErrorSize;

    /**
     * Structured error: renders `message`, then `action` as an external
     * link to `link` (underlined, external icon — Geist's
     * "With an error property" example). When set, `children` is ignored.
     */
    error?: { message: ReactNode; action?: ReactNode; link?: string };

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
            error,
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
                    <Stop color="red-900" size={16} />
                </div>
                <div className={styles.text}>
                    {label != null && label !== false && (
                        <b className={styles.label}>{label}:</b>
                    )}
                    {error ? (
                        <>
                            {error.message}
                            {error.action != null && error.link != null && (
                                <>
                                    {' '}
                                    <span className={styles['action-link']}>
                                        <a
                                            className={styles.errorLink}
                                            href={error.link}
                                            rel="noopener"
                                            target="_blank"
                                        >
                                            {error.action}
                                            <ExternalSmall size={16} />
                                        </a>
                                    </span>
                                </>
                            )}
                        </>
                    ) : (
                        children
                    )}
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
