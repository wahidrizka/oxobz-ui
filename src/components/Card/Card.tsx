import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Card.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Background variant (Default vs Secondary sections in card.html). */
export type CardType = 'default' | 'secondary';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Background variant. Omit for the default surface. */
    type?: CardType;

    /**
     * Enables the interactive elevated-shadow look: a subtle resting
     * elevation that grows on hover, with a 150ms ease-in-out transition
     * (Border / Border Between / Secondary sections). Omit for the plain
     * border-only card with no hover behaviour (Default section).
     */
    hover?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A container that groups related content and actions on a surface.
 *
 * Rendered DOM (Geist production structure — card.html has no dedicated
 * *-module class; production is a plain container styled with raw Tailwind
 * utilities, folded here into a CSS Module):
 * ```html
 * <div class="card [secondary] [hover]" data-oxobz-card="" data-version="v1">
 *   {children}
 * </div>
 * ```
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            type = 'default',
            hover = false,
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
                    styles.card,
                    type === 'secondary' && styles.secondary,
                    hover && styles.hover,
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
