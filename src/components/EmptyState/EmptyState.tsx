import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './EmptyState.module.css';

/**
 * EmptyState — centered empty-content placeholder (icon/illustration +
 * title + description + optional action(s)).
 *
 * Rendered DOM (from empty-state.html, "Blank Slate" / "Informational"
 * examples — the JSX API itself was never expanded ("Show code" stayed
 * collapsed in the snapshot), so this is a faithful DOM-order compound
 * built from the visible markup rather than a guess at Geist's real prop
 * names):
 * ```html
 * <div class="root" data-oxobz-empty-state="" data-version="v1">
 *   <div aria-hidden="true" class="icon">{icon svg}</div>
 *   <div class="content">
 *     <div class="title">Title</div>
 *     <div class="description">A message conveying the state of the product.</div>
 *   </div>
 *   <!-- optional actions, e.g. a Button then a "Learn more" link,
 *        rendered as further direct children and spaced by the root's
 *        flex gap, exactly as in the "Informational" example -->
 * </div>
 * ```
 *
 * Note: the snapshot wraps the icon box in one extra classless `<div>`
 * (`<div><div aria-hidden ...>`). It carries no styling/attributes and is
 * indistinguishable from an MDX/docs-rendering artifact, so it is not
 * reproduced here — EmptyStateIcon renders the single styled box directly.
 */

/* ------------------------------------------------------------------ */
/*  EmptyState (root)                                                  */
/* ------------------------------------------------------------------ */

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ className, children, ...props }, ref) => (
        <div
            {...props}
            ref={ref}
            className={cn(styles.root, className)}
            data-oxobz-empty-state=""
            data-version="v1"
        >
            {children}
        </div>
    ),
);
EmptyState.displayName = 'EmptyState';

/* ------------------------------------------------------------------ */
/*  EmptyStateIcon                                                     */
/* ------------------------------------------------------------------ */

export interface EmptyStateIconProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/**
 * EmptyStateIcon — the bordered icon/illustration box. `aria-hidden`
 * defaults to `true` (matching the snapshot) since the icon is decorative
 * next to the title/description text; pass `aria-hidden={false}` to opt out.
 */
export const EmptyStateIcon = forwardRef<HTMLDivElement, EmptyStateIconProps>(
    ({ className, children, 'aria-hidden': ariaHidden = true, ...props }, ref) => (
        <div
            {...props}
            ref={ref}
            className={cn(styles.icon, className)}
            aria-hidden={ariaHidden}
            data-oxobz-empty-state-icon=""
        >
            {children}
        </div>
    ),
);
EmptyStateIcon.displayName = 'EmptyStateIcon';

/* ------------------------------------------------------------------ */
/*  EmptyStateTitle                                                    */
/* ------------------------------------------------------------------ */

export interface EmptyStateTitleProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/** EmptyStateTitle — `text-heading-16` at font-weight 500, centered. */
export const EmptyStateTitle = forwardRef<HTMLDivElement, EmptyStateTitleProps>(
    ({ className, children, ...props }, ref) => (
        <div
            {...props}
            ref={ref}
            className={cn('text-heading-16', styles.title, className)}
            data-oxobz-empty-state-title=""
        >
            {children}
        </div>
    ),
);
EmptyStateTitle.displayName = 'EmptyStateTitle';

/* ------------------------------------------------------------------ */
/*  EmptyStateDescription                                              */
/* ------------------------------------------------------------------ */

export interface EmptyStateDescriptionProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/** EmptyStateDescription — `text-copy-14`, centered, muted color. */
export const EmptyStateDescription = forwardRef<HTMLDivElement, EmptyStateDescriptionProps>(
    ({ className, children, ...props }, ref) => (
        <div
            {...props}
            ref={ref}
            className={cn('text-copy-14', styles.description, className)}
            data-oxobz-empty-state-description=""
        >
            {children}
        </div>
    ),
);
EmptyStateDescription.displayName = 'EmptyStateDescription';
