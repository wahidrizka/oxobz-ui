import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { InformationFillSmall } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Tooltip } from '../Tooltip';
import styles from './Description.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DescriptionProps
    extends Omit<HTMLAttributes<HTMLDListElement>, 'title' | 'content'> {
    /** Title Case key label rendered in `<dt>` (e.g. "Last Deployed"). */
    title: ReactNode;

    /** Value rendered in `<dd>` — the answer to the title's key. */
    content: ReactNode;

    /**
     * One-sentence definition shown in an info-icon tooltip next to the
     * title. Pass only when the title alone is ambiguous and a single
     * sentence resolves it (Best Practices, description.html).
     */
    tooltip?: ReactNode;

    /** Right-aligns the title and content. Default left. */
    right?: boolean;

    /**
     * Truncates the title and content with an ellipsis instead of
     * wrapping. Requires the parent to constrain the width.
     */
    ellipsis?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Displays a brief heading and subheading to communicate any additional
 * information or context a user needs to continue.
 *
 * Renders `<dl>`/`<dt>`/`<dd>` so screen readers announce the title/content
 * pair as a definition — do not wrap it in extra paragraphs that would
 * break the list semantics (Best Practices, description.html).
 *
 * Rendered DOM (Geist production / snapshot structure):
 * ```html
 * <dl class="description [right] [ellipsis]"
 *     data-oxobz-description="" data-version="v1">
 *   <dt data-oxobz-description-title="">
 *     {title}
 *     <span class="icon">…tooltip trigger…</span>   <!-- only when tooltip -->
 *   </dt>
 *   <dd data-oxobz-description-content="">{children}</dd>
 * </dl>
 * ```
 */
const Description = forwardRef<HTMLDListElement, DescriptionProps>(
    (
        {
            title,
            content,
            tooltip,
            right = false,
            ellipsis = false,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <dl
                {...rest}
                className={cn(
                    styles.description,
                    right && styles.right,
                    ellipsis && styles.ellipsis,
                    className,
                )}
                data-oxobz-description=""
                data-version={dataVersion}
                ref={ref}
            >
                <dt data-oxobz-description-title="">
                    {title}
                    {tooltip != null && (
                        <span className={styles.icon}>
                            <Tooltip text={tooltip}>
                                <InformationFillSmall size={14} />
                            </Tooltip>
                        </span>
                    )}
                </dt>
                <dd data-oxobz-description-content="">{content}</dd>
            </dl>
        );
    },
);

Description.displayName = 'Description';

export { Description };
