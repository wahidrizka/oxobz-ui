import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './LoadingDots.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Dot diameter preset (matches the geistcn LoadingDots `size` prop).
 * The docs examples pass `size="sm" | "md" | "lg"` = 2 / 3 / 4px.
 */
export type LoadingDotsSize = 'sm' | 'md' | 'lg';

export interface LoadingDotsProps extends HTMLAttributes<HTMLSpanElement> {
    /**
     * Dot diameter preset. `sm` = 2px, `md` = 3px, `lg` = 4px.
     *
     * Default is `sm` (the smallest). Note: the live docs never render a
     * size-less example, so the default is not verifiable from the reference;
     * `sm` preserves the previous behavior (2px) and every demo passes `size`
     * explicitly anyway.
     */
    size?: LoadingDotsSize;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Indicate an action running in the background. Three dots blink together
 * (opacity 0.2 -> 1 -> 0.2, 1.4s loop); an optional trailing label (via
 * `children`) is rendered before the dots.
 *
 * Rendered DOM measured live at vercel.com/geist/loading-dots (9 Sep 2026),
 * geistcn generation:
 * ```html
 * <span class="inline-flex items-center" aria-label="Loading"
 *       data-testid="geistcn/loading-dots">
 *   <div class="mr-2">{children}</div>            <!-- only with children -->
 *   <span class="... animate-blink size-[3px]"></span> x3
 * </span>
 * ```
 * No `data-oxobz-*` / `data-version` marker and no `aria-live`. The dots are
 * staggered (dot 2 = 0.2s, dot 3 = 0.4s): the dots carry no delay class, but
 * their computed animation-delay is 0.2s / 0.4s (measured live), so the CSS
 * module applies it via nth-of-type.
 */
const LoadingDots = forwardRef<HTMLSpanElement, LoadingDotsProps>(
    (
        {
            children,
            className,
            size = 'sm',
            'aria-label': ariaLabel = 'Loading',
            ...rest
        },
        ref,
    ) => {
        return (
            <span
                {...rest}
                ref={ref}
                aria-label={ariaLabel}
                data-testid="geistcn/loading-dots"
                className={cn(styles.root, className)}
            >
                {children != null && <div className={styles.label}>{children}</div>}
                <span className={cn(styles.dot, styles[size])} />
                <span className={cn(styles.dot, styles[size])} />
                <span className={cn(styles.dot, styles[size])} />
            </span>
        );
    },
);

LoadingDots.displayName = 'LoadingDots';

export { LoadingDots };
