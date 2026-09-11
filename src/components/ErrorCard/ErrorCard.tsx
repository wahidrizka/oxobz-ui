import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Stop } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './ErrorCard.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ErrorCardProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /**
     * Title shown next to the icon (Geist `title` prop). Required — the
     * snapshot's only documented usage always passes it.
     */
    title: ReactNode;

    /**
     * Supplementary error detail (Geist `message` prop).
     *
     * Production accepts it and renders nothing for it. Re-confirmed against
     * the live page on 11 Sep 2026, which passes `message="Lorem ipsum…"` and
     * renders only the icon and the title: the string appears in the page
     * exactly once, inside the "Show code" block, and never in the card. No
     * text node, no `title` attribute, no `aria-label`/`aria-describedby`.
     *
     * An earlier build exposed it as visually-hidden text so it would at
     * least reach assistive tech. That added an element production does not
     * have, so it is gone: the prop is kept for API parity and has no DOM
     * footprint, the same way `label` behaves on Feedback.
     */
    message?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A card used to communicate an error state with a title and message
 * (Geist docs: "Error Card").
 *
 * Rendered DOM, measured off the live page on 11 Sep 2026. The root carries
 * NO component marker and NO data-version, and the icon carries no
 * `aria-hidden` — all three were in an older build and none exist in
 * production:
 * ```html
 * <div class="root">
 *   <div class="content">
 *     <svg data-slot="oxobz-icon">...</svg>
 *     <h3 class="text-copy-16 title">No credits left</h3>
 *   </div>
 * </div>
 * ```
 */
const ErrorCard = forwardRef<HTMLDivElement, ErrorCardProps>(
    ({ className, message: _message, title, ...rest }, ref) => {
        return (
            <div {...rest} className={cn(styles.root, className)} ref={ref}>
                <div className={styles.content}>
                    <Stop size={16} />
                    <h3 className={cn('text-copy-16', styles.title)}>
                        {title}
                    </h3>
                </div>
            </div>
        );
    },
);

ErrorCard.displayName = 'ErrorCard';

export { ErrorCard };
