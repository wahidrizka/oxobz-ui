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
     * Whether the separator is purely visual (default: true). Decorative
     * separators are hidden from the accessibility tree (`role="none"`).
     * Set to `false` when the separator carries semantic meaning between
     * distinct content sections (`role="separator"`), per the "Accessibility
     * Variants" example in the snapshot.
     */
    decorative?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A visual divider that separates content into distinct sections, with
 * support for horizontal and vertical orientations.
 *
 * Rendered DOM (Geist production / geistcn structure):
 * ```html
 * <div data-orientation="horizontal" role="none"
 *      data-oxobz-separator="" data-version="v1"
 *      class="root"></div>
 * ```
 *
 * `decorative` (default `true`) mirrors the Radix Separator primitive the
 * snapshot is built on: decorative separators get `role="none"` and no
 * `aria-orientation`; semantic separators (`decorative={false}`) get
 * `role="separator"` and `aria-orientation="vertical"` only when vertical
 * (horizontal is the ARIA default for the separator role, so it is omitted).
 */
const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
    (
        {
            orientation = 'horizontal',
            decorative = true,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const semanticProps = decorative
            ? { role: 'none' as const }
            : {
                  role: 'separator' as const,
                  'aria-orientation':
                      orientation === 'vertical' ? ('vertical' as const) : undefined,
              };

        return (
            <div
                {...rest}
                {...semanticProps}
                className={cn(styles.root, className)}
                data-orientation={orientation}
                data-oxobz-separator=""
                data-version={dataVersion}
                ref={ref}
            />
        );
    },
);

Separator.displayName = 'Separator';

export { Separator };
