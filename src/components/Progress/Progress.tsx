import {
    forwardRef,
    type CSSProperties,
    type ProgressHTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Progress.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Themed fill color of the bar. Each value maps to a Geist semantic color
 * token (verified against the `Themed` example in progress.md). Omit for the
 * default foreground fill.
 */
export type ProgressType = 'secondary' | 'success' | 'error' | 'warning';

/**
 * Dynamic threshold colors. Keys are percentage thresholds (0–100), values are
 * any CSS color. The bar takes the color of the highest threshold that is less
 * than or equal to the current percentage (see the `Dynamic colors` example in
 * progress.md). Overrides `type` when both are provided.
 */
export type ProgressColors = Record<number, string>;

export interface ProgressProps
    extends Omit<
        ProgressHTMLAttributes<HTMLProgressElement>,
        'value' | 'max' | 'color'
    > {
    /** Current progress amount (default: 0). Clamped to the `0..max` range. */
    value?: number;

    /**
     * Upper bound the percentage is computed against (default: 100). Use the
     * real ceiling (e.g. `files.length`) rather than a hardcoded 100.
     */
    max?: number;

    /** Themed fill color. Ignored when `colors` is provided. */
    type?: ProgressType;

    /** Threshold → color map for a value-dependent fill color. */
    colors?: ProgressColors;

    /** Bar width. A number is treated as pixels; a string is used verbatim. */
    width?: number | string;

    /** Bar height in pixels (default: 10, from the module CSS). */
    height?: number;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Fill color resolution                                             */
/* ------------------------------------------------------------------ */

/**
 * Geist semantic color tokens per `type`, translated to the oxobz `--oxobz-*`
 * equivalents (same mapping used by Toggle/CodeBlock):
 * --geist-secondary/success/error/warning → --oxobz-secondary/success/error/warning.
 */
const TYPE_COLOR: Record<ProgressType, string> = {
    secondary: 'var(--oxobz-secondary)',
    success: 'var(--oxobz-success)',
    error: 'var(--oxobz-error)',
    warning: 'var(--oxobz-warning)',
};

/** Default fill (no `type`, no `colors`) — the Geist foreground token. */
const DEFAULT_FG = 'var(--oxobz-foreground)';

/**
 * Pick the color of the highest threshold that is <= `percent`. Returns
 * undefined when `percent` is below every threshold.
 */
function resolveDynamicColor(
    colors: ProgressColors,
    percent: number,
): string | undefined {
    let chosen: string | undefined;
    let chosenThreshold = -Infinity;
    for (const key of Object.keys(colors)) {
        const threshold = Number(key);
        if (percent >= threshold && threshold > chosenThreshold) {
            chosenThreshold = threshold;
            chosen = colors[threshold];
        }
    }
    return chosen;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display progress relative to a limit or related to a task.
 *
 * Rendered DOM (Geist production structure — native <progress>):
 * ```html
 * <progress class="progress" data-oxobz-progress="" data-version="v1"
 *   role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="30"
 *   value="30" max="100" style="--fg: var(--oxobz-foreground)"></progress>
 * ```
 *
 * The bar fill is driven by the native `value`/`max` attributes (which also
 * animate the `width` transition from the module CSS); `role` and the
 * `aria-value*` attributes are set explicitly so the reported value can be
 * throttled independently, per the accessibility notes in progress.md.
 */
const Progress = forwardRef<HTMLProgressElement, ProgressProps>(
    (
        {
            className,
            colors,
            height,
            max = 100,
            style,
            type,
            value = 0,
            width,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const clampedValue = Math.max(0, Math.min(value, max));
        const percent = max > 0 ? (clampedValue / max) * 100 : 0;

        let fg = DEFAULT_FG;
        if (type) fg = TYPE_COLOR[type];
        if (colors) {
            const dynamic = resolveDynamicColor(colors, percent);
            if (dynamic) fg = dynamic;
        }

        const mergedStyle: CSSProperties = {
            '--fg': fg,
            ...(width !== undefined
                ? {
                      width:
                          typeof width === 'number' ? `${width}px` : width,
                  }
                : {}),
            ...(height !== undefined ? { height: `${height}px` } : {}),
            ...style,
        } as CSSProperties;

        return (
            <progress
                {...rest}
                className={cn(styles.progress, className)}
                data-oxobz-progress=""
                data-version={dataVersion}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={clampedValue}
                value={clampedValue}
                max={max}
                style={mergedStyle}
                ref={ref}
            />
        );
    },
);

Progress.displayName = 'Progress';

export { Progress };
