import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Separator.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Axis the divider line is drawn along. */
export type SeparatorOrientation = 'horizontal' | 'vertical';

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
    /** Axis of the divider line (default: 'horizontal'). */
    orientation?: SeparatorOrientation;
    /**
     * For a divider that meets a 1px frame painted over the content: reserves
     * 1px at each end and switches to solid gray-400 (default: false).
     */
    inset?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A visual divider that separates content into distinct sections, with
 * support for horizontal and vertical orientations.
 *
 * Rendered DOM matches the live geistcn output measured at
 * vercel.com/geist/separator (9 Sep 2026):
 * ```html
 * <div data-orientation="horizontal" role="separator"
 *      aria-orientation="horizontal" data-slot="separator"
 *      data-testid="geistcn/separator"
 *      class="bg-gray-200 shrink-0 h-px w-full"></div>
 * ```
 *
 * Every separator is semantic: `role="separator"` and an `aria-orientation`
 * that always matches `orientation` (production emits it for horizontal too,
 * unlike raw Radix which omits it there). The public API is `orientation`
 * plus `inset` (added by production in Nov 2026), exactly what the production
 * source takes. There is no `decorative` prop and no `data-oxobz-*` or
 * `data-version` marker, because the live div carries none.
 */
const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
    ({ orientation = 'horizontal', inset = false, className, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            role="separator"
            aria-orientation={orientation}
            data-orientation={orientation}
            data-slot="separator"
            data-testid="geistcn/separator"
            className={cn(styles.root, inset && styles.inset, className)}
        />
    ),
);

Separator.displayName = 'Separator';

export { Separator };
