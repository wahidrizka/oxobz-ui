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
 * unlike raw Radix which omits it there). The public API is just
 * `orientation` — the documented Geist API exposes nothing else, so there is
 * no `decorative` prop and no `data-oxobz-*`/`data-version` markers (the live
 * div carries none).
 */
const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
    ({ orientation = 'horizontal', className, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            role="separator"
            aria-orientation={orientation}
            data-orientation={orientation}
            data-slot="separator"
            data-testid="geistcn/separator"
            className={cn(styles.root, className)}
        />
    ),
);

Separator.displayName = 'Separator';

export { Separator };
