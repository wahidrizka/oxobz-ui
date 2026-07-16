import {
    Children,
    forwardRef,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Skeleton.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
    /** Width of the placeholder. Numbers are treated as pixels. */
    width?: number | string;

    /** Height of the placeholder (min-height). Numbers are pixels. Default 24. */
    height?: number | string;

    /**
     * Total reserved box height. The extra space below the placeholder is
     * added as `margin-bottom` (boxHeight − height), so the shimmer stays at
     * `height` while the layout reserves `boxHeight`.
     */
    boxHeight?: number | string;

    /** Fully rounded shape (border-radius: 50%). */
    rounded?: boolean;

    /** Square corners (border-radius: 0). */
    squared?: boolean;

    /** Pill shape (border-radius: 9999px). */
    pill?: boolean;

    /**
     * Whether the skeleton is shown (loading). Default `true`. When wrapping
     * children, `false` reveals the children and removes the shimmer.
     */
    show?: boolean;

    /** Animate the shimmer. Default `true`; `false` renders a static block. */
    animated?: boolean;

    /** Extend the shimmer 1px past the edges to cover a button's border. */
    button?: boolean;

    /** Children measured/covered by the skeleton while loading. */
    children?: ReactNode;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const toNumeric = (value: number | string): number =>
    typeof value === 'number' ? value : Number.parseFloat(value);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display a placeholder whilst another component is loading.
 *
 * Three rendering modes (verified against skeleton.html):
 * - **plain** — no children: a shimmering block sized by `width`/`height`.
 * - **wrapper** — children without a fixed `width`: measures the children,
 *   hides them, and shows the shimmer over their footprint (`show` toggles
 *   the reveal).
 * - **loaded** — children with a fixed `width`: keeps the reserved
 *   `min-height`, drops the width to fit the children, and reveals them.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <span class="skeleton show" data-oxobz-skeleton="" data-version="v1"
 *       style="width: 160px; min-height: 24px;"></span>
 * ```
 */
const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(
    (
        {
            animated = true,
            boxHeight,
            button = false,
            children,
            className,
            height = 24,
            pill = false,
            rounded = false,
            show = true,
            squared = false,
            style,
            width,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const hasChildren = Children.count(children) > 0;
        const hasFixedWidth = width != null;
        // Children without a fixed width are measured by the wrapper; children
        // with a fixed width keep the reserved box but reveal (loaded).
        const isWrapper = hasChildren && !hasFixedWidth;
        const isLoaded = hasChildren && hasFixedWidth;

        // The wrapper derives its size from the children, so no inline
        // dimensions are emitted (matches the snapshot). Plain and loaded
        // modes carry width / min-height (+ boxHeight margin) inline.
        let mergedStyle: CSSProperties | undefined = style;
        if (!isWrapper) {
            const marginBottom =
                boxHeight != null
                    ? toNumeric(boxHeight) - toNumeric(height)
                    : Number.NaN;
            mergedStyle = {
                width,
                minHeight: height,
                ...(Number.isFinite(marginBottom) && marginBottom !== 0
                    ? { marginBottom }
                    : {}),
                ...style,
            };
        }

        return (
            <span
                {...rest}
                className={cn(
                    styles.skeleton,
                    show && styles.show,
                    isWrapper && styles.wrapper,
                    isLoaded && styles.loaded,
                    !animated && styles.noAnimation,
                    pill && styles.pill,
                    squared && styles.squared,
                    rounded && styles.rounded,
                    button && styles.button,
                    className,
                )}
                data-oxobz-skeleton=""
                data-version={dataVersion}
                ref={ref}
                style={mergedStyle}
            >
                {children}
            </span>
        );
    },
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
