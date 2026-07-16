import {
    forwardRef,
    type CSSProperties,
    type HTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './LoadingDots.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Dot diameter preset (matches the geistcn LoadingDots `size` prop).
 * The docs examples pass `size="sm" | "md" | "lg"`.
 */
export type LoadingDotsSize = 'sm' | 'md' | 'lg';

/**
 * Dot diameter in px per size, verified from the loading-dots.html snapshot:
 * sm → `size-0.5` (2px), md → `size-[3px]` (3px), lg → `size-1` (4px).
 * The default (size omitted) resolves to the CSS `--loading-dots-size: 2px`.
 */
const DOT_DIAMETER_PX: Record<LoadingDotsSize, number> = {
    sm: 2,
    md: 3,
    lg: 4,
};

export interface LoadingDotsProps extends HTMLAttributes<HTMLSpanElement> {
    /**
     * Dot diameter preset. Omit to use the production default (2px).
     * `sm` = 2px, `md` = 3px, `lg` = 4px.
     */
    size?: LoadingDotsSize;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Indicate an action running in the background. The three dots blink in a
 * staggered loop; an optional trailing label (via `children`) is rendered
 * before the dots inside a spacer.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <span class="loading" data-oxobz-loading-dots="" data-version="v1"
 *       aria-label="Loading" style="--loading-dots-size: 3px">
 *   <div class="spacer">{children}</div>   <!-- only when children present -->
 *   <span></span>
 *   <span></span>
 *   <span></span>
 * </span>
 * ```
 */
const LoadingDots = forwardRef<HTMLSpanElement, LoadingDotsProps>(
    (
        {
            children,
            className,
            size,
            style,
            'aria-label': ariaLabel = 'Loading',
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        // Dot size is driven by the --loading-dots-size custom property, exactly
        // like the loading-dots-module. Left unset (CSS default 2px) when the
        // size prop is omitted; the explicit prop wins over a user-set value.
        const rootStyle: CSSProperties & Record<string, string | number> = {
            ...style,
        };
        if (size) {
            rootStyle['--loading-dots-size'] = `${DOT_DIAMETER_PX[size]}px`;
        }

        return (
            <span
                {...rest}
                aria-label={ariaLabel}
                className={cn(styles.loading, className)}
                data-oxobz-loading-dots=""
                data-version={dataVersion}
                ref={ref}
                style={rootStyle}
            >
                {children != null && (
                    <div className={styles.spacer}>{children}</div>
                )}
                <span />
                <span />
                <span />
            </span>
        );
    },
);

LoadingDots.displayName = 'LoadingDots';

export { LoadingDots };
