import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Card.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Flex direction of the card's content (Geist `direction` prop). */
export type CardDirection = 'row' | 'column';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Draw the 1px border (via the `--ds-shadow-border` token). */
    border?: boolean;

    /** Draw dividers between direct children (divide-y column / divide-x row). */
    borderBetween?: boolean;

    /** Lay children out in a row instead of a column. Default `'column'`. */
    direction?: CardDirection;

    /** Grow the shadow on hover (animates in 150ms when combined with `shadow`). */
    hoverable?: boolean;

    /** Use the secondary surface (`--ds-background-200`) instead of the default. */
    secondary?: boolean;

    /** Add the resting drop shadow + shadow transition. */
    shadow?: boolean;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A surface that groups related content. Padding is NOT intrinsic — the Geist
 * source passes it via `className` (`<Card border borderBetween className="p-4"
 * direction="row" hoverable shadow>`), so consumers control spacing.
 *
 * Rendered DOM:
 * ```html
 * <div class="root [secondary] [row] [border] [borderBetween] [shadow] [hoverable]"
 *      data-oxobz-card="" data-version="v1">{children}</div>
 * ```
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            border = false,
            borderBetween = false,
            direction = 'column',
            hoverable = false,
            secondary = false,
            shadow = false,
            className,
            children,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <div
                {...rest}
                className={cn(
                    styles.root,
                    secondary && styles.secondary,
                    direction === 'row' && styles.row,
                    border && styles.border,
                    borderBetween && styles.borderBetween,
                    shadow && styles.shadow,
                    hoverable && styles.hoverable,
                    className,
                )}
                data-oxobz-card=""
                data-version={dataVersion}
                ref={ref}
            >
                {children}
            </div>
        );
    },
);

Card.displayName = 'Card';

export { Card };
