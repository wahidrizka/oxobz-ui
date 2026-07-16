import {
    forwardRef,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Gauge.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type GaugeSize = 'tiny' | 'small' | 'medium' | 'large';

/**
 * Arc layout priority.
 * - `primary` (default): the primary arc starts at the top; the gap sits
 *   entirely on the secondary side. Use for a single-percentage reading.
 * - `equal`: the gap is split evenly between both arcs, so a value of 50
 *   reads as exactly half. Use for true ratios.
 *
 * (The Geist prose sometimes calls this `arc`; the runnable docs code uses
 * `arcPriority`, which is the actual prop name mirrored here.)
 */
export type GaugeArcPriority = 'primary' | 'equal';

/**
 * Colors for the gauge arcs. Two shapes are accepted (matching Geist):
 * - Named: `{ primary, secondary }` for fixed arc colors.
 * - Threshold map: numeric-string keys → color applied when
 *   `value >= key` (e.g. `{ '0': red, '50': amber, '100': green }`).
 *   The color of the greatest key not exceeding `value` wins.
 *
 * When only a threshold map is given, the secondary arc keeps its default
 * gray. `primary`/`secondary` keys are never treated as thresholds.
 */
export interface GaugeColors {
    /** Fixed primary (foreground) arc color. */
    primary?: string;
    /** Fixed secondary (background) arc color. Defaults to gray-alpha-400. */
    secondary?: string;
    /** Threshold stop: numeric-string key → color for `value >= key`. */
    [threshold: string]: string | undefined;
}

export interface GaugeProps extends HTMLAttributes<HTMLDivElement> {
    /** Percentage the gauge conveys, 0–100 (clamped). */
    value: number;

    /** Diameter preset (default: medium). */
    size?: GaugeSize;

    /** Render the numeric value in the center (default: false). */
    showValue?: boolean;

    /** Arc colors — named colors or a threshold map. */
    colors?: GaugeColors;

    /** Arc layout priority (default: primary). */
    arcPriority?: GaugeArcPriority;

    /**
     * Loading state: renders a full, gray, value-less ring and drops
     * `aria-valuenow`. Pair with explanatory copy nearby.
     */
    indeterminate?: boolean;

    /** Icon overlay rendered in the center (takes precedence over the value). */
    children?: ReactNode;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Geometry — verified against gauge.html snapshot                    */
/* ------------------------------------------------------------------ */

/**
 * Per-size geometry. `px` is the rendered SVG width/height; the viewBox is
 * always 0 0 100 100 (`--circle-size: 100px`). `strokeWidth` and `gap` are
 * taken directly from the snapshot; the base gap only applies while both
 * arcs are visible (0 < value < 100).
 */
const SIZE_CONFIG: Record<
    GaugeSize,
    { px: number; strokeWidth: number; gap: number }
> = {
    tiny: { px: 20, strokeWidth: 15, gap: 9 },
    small: { px: 32, strokeWidth: 10, gap: 6 },
    medium: { px: 64, strokeWidth: 10, gap: 5 },
    large: { px: 128, strokeWidth: 10, gap: 5 },
};

/** Center value typography per size (inline in production). Tiny omits it. */
const VALUE_FONT: Record<
    Exclude<GaugeSize, 'tiny'>,
    { fontSize: number; fontWeight: number }
> = {
    small: { fontSize: 11, fontWeight: 500 },
    medium: { fontSize: 18, fontWeight: 500 },
    large: { fontSize: 32, fontWeight: 600 },
};

/** Default threshold scale when no `colors` prop is supplied. */
const DEFAULT_COLOR_SCALE: GaugeColors = {
    0: 'var(--ds-red-800)',
    34: 'var(--ds-amber-700)',
    67: 'var(--ds-green-700)',
};

const DEFAULT_SECONDARY_COLOR = 'var(--ds-gray-alpha-400)';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/** Pick the color of the greatest numeric threshold not exceeding `value`. */
function thresholdColor(value: number, colors: GaugeColors): string {
    const stops = Object.keys(colors)
        .map((key) => ({ stop: Number(key), color: colors[key] }))
        .filter(
            (entry): entry is { stop: number; color: string } =>
                Number.isFinite(entry.stop) && typeof entry.color === 'string',
        )
        .sort((a, b) => a.stop - b.stop);

    if (stops.length === 0) return DEFAULT_SECONDARY_COLOR;

    let color = stops[0].color;
    for (const entry of stops) {
        if (value >= entry.stop) color = entry.color;
        else break;
    }
    return color;
}

function resolveArcColors(
    value: number,
    colors?: GaugeColors,
): { primary: string; secondary: string } {
    if (!colors) {
        return {
            primary: thresholdColor(value, DEFAULT_COLOR_SCALE),
            secondary: DEFAULT_SECONDARY_COLOR,
        };
    }

    const secondary = colors.secondary ?? DEFAULT_SECONDARY_COLOR;
    const namedPrimary = colors.primary;

    return {
        primary:
            namedPrimary !== undefined
                ? namedPrimary
                : thresholdColor(value, colors),
        secondary,
    };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A circular visual for conveying a percentage.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <div role="progressbar" aria-valuemin="0" aria-valuemax="100"
 *      aria-valuenow="50" data-oxobz-progress-circle="" data-version="v1"
 *      class="circle animate" style="--circle-size:100px; --circumference:…;
 *      --percent-to-px:…px; --gap-percent:…; --offset-factor:…;">
 *   <svg aria-hidden="true" fill="none" viewBox="0 0 100 100" width="64" height="64">
 *     <circle class="arcSecondary" cx="50" cy="50" r="45" … />
 *     <circle class="arc" data-oxobz-progress-circle-fg="" cx="50" cy="50" r="45" … />
 *   </svg>
 *   <div aria-hidden="true" class="content">…</div>
 * </div>
 * ```
 */
const Gauge = forwardRef<HTMLDivElement, GaugeProps>(
    (
        {
            value: rawValue,
            size = 'medium',
            showValue = false,
            colors,
            arcPriority = 'primary',
            indeterminate = false,
            children,
            className,
            style,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const value = clamp(rawValue, 0, 100);
        const { px, strokeWidth, gap } = SIZE_CONFIG[size];

        // Circle drawn in a 100×100 viewBox; radius leaves room for the stroke.
        const radius = 50 - strokeWidth / 2;
        const circumference = 2 * Math.PI * radius;
        const percentToPx = circumference / 100;

        // `equal` splits the gap between both arcs; `primary` keeps it on the
        // secondary side. Verified: offset-factor 0.5 for equal, 0 otherwise.
        const offsetFactor = arcPriority === 'equal' ? 0.5 : 0;

        // The gap collapses when only one arc is visible (value 0 or 100).
        const gapPercent = value <= 0 || value >= 100 ? 0 : gap;

        // Primary length = value, shifted inward by the gap share it owns.
        const rawPrimary = value - 2 * gapPercent * offsetFactor;
        const primaryStrokePercent = Math.max(rawPrimary, 0);
        const primaryOpacity = rawPrimary > 0 ? 1 : 0;

        // Secondary length = the remainder minus its gap share. Capped at 99 so
        // the background never closes into a seamless ring (snapshot: value 0).
        const rawSecondary = 100 - value - 2 * gapPercent * (1 - offsetFactor);
        const secondaryStrokePercent = clamp(rawSecondary, 0, 99);
        const secondaryOpacity = rawSecondary > 0 ? 1 : 0;

        const arcColors = resolveArcColors(value, colors);

        const rootStyle = {
            '--circle-size': '100px',
            '--circumference': circumference,
            '--percent-to-px': `${percentToPx}px`,
            '--gap-percent': gapPercent,
            '--offset-factor': offsetFactor,
            ...style,
        } as CSSProperties;

        const primaryStyle = {
            opacity: primaryOpacity,
            '--stroke-percent': primaryStrokePercent,
        } as CSSProperties;

        const secondaryStyle = {
            opacity: secondaryOpacity,
            '--stroke-percent': secondaryStrokePercent,
        } as CSSProperties;

        const showContent = showValue || children != null;
        const valueFont = size === 'tiny' ? undefined : VALUE_FONT[size];

        return (
            <div
                {...rest}
                className={cn(
                    styles.circle,
                    styles.animate,
                    indeterminate && styles.indeterminate,
                    className,
                )}
                data-oxobz-progress-circle=""
                data-version={dataVersion}
                ref={ref}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={indeterminate ? undefined : value}
                style={rootStyle}
            >
                <svg
                    aria-hidden="true"
                    fill="none"
                    height={px}
                    strokeWidth={2}
                    viewBox="0 0 100 100"
                    width={px}
                >
                    <circle
                        className={styles.arcSecondary}
                        cx={50}
                        cy={50}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke={arcColors.secondary}
                        style={secondaryStyle}
                    />
                    <circle
                        className={styles.arc}
                        data-oxobz-progress-circle-fg=""
                        cx={50}
                        cy={50}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke={arcColors.primary}
                        style={primaryStyle}
                    />
                </svg>
                {showContent && (
                    <div aria-hidden="true" className={styles.content}>
                        {children != null ? (
                            children
                        ) : valueFont ? (
                            <p
                                className={cn('text-copy-14', styles.value)}
                                style={{
                                    fontSize: valueFont.fontSize,
                                    fontWeight: valueFont.fontWeight,
                                }}
                            >
                                {value}
                            </p>
                        ) : null}
                    </div>
                )}
            </div>
        );
    },
);

Gauge.displayName = 'Gauge';

export { Gauge };
