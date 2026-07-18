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
     * NOTE (0% assumption, disclosed): in the captured production snapshot
     * (`error-card.html`, `<ErrorCard message="Lorem ipsum..." title="No
     * credits left" />`) this prop produces NO visible trace anywhere in the
     * rendered DOM — no text node, no `title` HTML attribute, no
     * `aria-label`/`aria-describedby`. Only the icon + `title` are ever
     * rendered. Rather than silently dropping consumer-supplied content or
     * inventing a visible placement that contradicts the verified snapshot,
     * `message` is exposed as visually-hidden (`oxobz-sr-only`) text after
     * the title so it stays available to assistive tech. See the
     * `needsRecapture` note in this component's task report — recapture the
     * real card with devtools open (including any hover/expanded state) to
     * confirm the true rendering and correct this if it differs.
     */
    message?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A card used to communicate an error state with a title and message
 * (Geist docs: "Error Card").
 *
 * Rendered DOM (Geist production / geistcn structure, geist→oxobz rename):
 * ```html
 * <div class="root" data-oxobz-error-card="" data-version="v1">
 *   <div class="content">
 *     <svg aria-hidden="true">...</svg>
 *     <h3 class="title">No credits left</h3>
 *     <span class="oxobz-sr-only">{message}</span>   <!-- see message note -->
 *   </div>
 * </div>
 * ```
 */
const ErrorCard = forwardRef<HTMLDivElement, ErrorCardProps>(
    (
        {
            className,
            message,
            title,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <div
                {...rest}
                className={cn(styles.root, className)}
                data-oxobz-error-card=""
                data-version={dataVersion}
                ref={ref}
            >
                <div className={styles.content}>
                    <Stop aria-hidden="true" size={16} />
                    <h3 className={cn('text-copy-16', styles.title)}>
                        {title}
                    </h3>
                    {message != null && (
                        <span className="oxobz-sr-only">{message}</span>
                    )}
                </div>
            </div>
        );
    },
);

ErrorCard.displayName = 'ErrorCard';

export { ErrorCard };
