import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import styles from './LoadMoreButton.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LoadMoreButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'prefix'> {
    /**
     * Show the loading spinner and disable the button (forwarded to the
     * underlying Button, which swaps its prefix slot for a Spinner).
     */
    loading?: boolean;

    /**
     * Remove the 16px top margin the button carries by default so it sits
     * flush against the paginated list above it.
     */
    noGap?: boolean;

    /** Render with square corners instead of the default 6px radius. */
    noBorderRadius?: boolean;

    /** Button label. */
    children?: ReactNode;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A full-width button used to append more items to a paginated list, with
 * loading and styling variants.
 *
 * Composed from Button (`variant="secondary"`, full width, 16px top gap by
 * default) — loading state, spinner, and disabled behavior all come from
 * Button itself; LoadMoreButton only adds the full-width/gap/radius layout.
 *
 * Rendered DOM (Geist production / geistcn structure, load-more-button.html):
 * ```html
 * <button data-oxobz-button="" data-oxobz-load-more-button="" data-version="v1"
 *         class="… secondary … loadMoreButton">
 *   <span class="content">Load More</span>
 * </button>
 * ```
 */
const LoadMoreButton = forwardRef<HTMLButtonElement, LoadMoreButtonProps>(
    (
        {
            loading = false,
            noGap = false,
            noBorderRadius = false,
            className,
            children,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <Button
                {...rest}
                ref={ref}
                variant="secondary"
                loading={loading}
                data-oxobz-load-more-button=""
                data-version={dataVersion}
                className={cn(
                    styles.loadMoreButton,
                    noGap && styles.noGap,
                    noBorderRadius && styles.noBorderRadius,
                    className,
                )}
            >
                {children}
            </Button>
        );
    },
);

LoadMoreButton.displayName = 'LoadMoreButton';

export { LoadMoreButton };
