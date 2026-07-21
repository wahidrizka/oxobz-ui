import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './EmptyState.module.css';

/**
 * EmptyState — centered empty-content placeholder (icon/illustration +
 * title + description + optional action(s)).
 *
 * Public API matches Geist's Show-code (empty-state.md, live 2026-07-21):
 * ```tsx
 * <EmptyState
 *   description="A message conveying the state of the product."
 *   icon={<EmptyStateIcon icon={<IconChartBarPeak size={32} />} />}
 *   title="Title"
 * >
 *   <Button variant="secondary">Primary Action</Button>
 * </EmptyState>
 * ```
 *
 * Rendered DOM (live SSR):
 * ```html
 * <div class="root" data-oxobz-empty-state="" data-version="v1">
 *   <div><div aria-hidden="true" class="icon">{icon svg}</div></div>
 *   <div class="content">
 *     <div class="title">Title</div>
 *     <div class="description">A message …</div>
 *   </div>
 *   <!-- children (CTA button / link) as further direct children,
 *        spaced by the root's flex gap -->
 * </div>
 * ```
 * The plain wrapper `<div>` around the icon is real production structure
 * (the `icon` prop is rendered inside an unstyled div), reproduced here.
 */

/* ------------------------------------------------------------------ */
/*  EmptyState (root)                                                  */
/* ------------------------------------------------------------------ */

export interface EmptyStateProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Heading text (`text-heading-16`, weight 500, centered). */
    title: string;

    /** Supporting copy under the title (`text-copy-14`, muted). */
    description: string;

    /** Icon slot — typically `<EmptyStateIcon icon={<Icon size={32} />} />`. */
    icon?: ReactNode;

    /** Optional call-to-action area (Button / link), spaced by the root gap. */
    children?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ className, title, description, icon, children, ...props }, ref) => (
        <div
            {...props}
            ref={ref}
            className={cn(styles.root, className)}
            data-oxobz-empty-state=""
            data-version="v1"
        >
            {icon != null && <div>{icon}</div>}
            <div className={styles.content}>
                <div className={cn('text-heading-16', styles.title)}>{title}</div>
                <div className={cn('text-copy-14', styles.description)}>
                    {description}
                </div>
            </div>
            {children}
        </div>
    ),
);
EmptyState.displayName = 'EmptyState';

/* ------------------------------------------------------------------ */
/*  EmptyStateIcon                                                     */
/* ------------------------------------------------------------------ */

export interface EmptyStateIconProps extends HTMLAttributes<HTMLDivElement> {
    /** The icon element (Geist passes e.g. `<IconChartBarPeak size={32} />`). */
    icon?: ReactNode;
}

/**
 * EmptyStateIcon — the bordered icon/illustration box. `aria-hidden`
 * defaults to `true` (matching production) since the icon is decorative
 * next to the title/description text; pass `aria-hidden={false}` to opt out.
 */
export const EmptyStateIcon = forwardRef<HTMLDivElement, EmptyStateIconProps>(
    ({ className, icon, 'aria-hidden': ariaHidden = true, ...props }, ref) => (
        <div
            {...props}
            ref={ref}
            className={cn(styles.icon, className)}
            aria-hidden={ariaHidden}
            data-oxobz-empty-state-icon=""
        >
            {icon}
        </div>
    ),
);
EmptyStateIcon.displayName = 'EmptyStateIcon';
