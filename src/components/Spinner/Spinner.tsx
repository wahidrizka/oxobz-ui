import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Spinner.module.css';

// ---- Types ----

/**
 * Named size tokens matching the official Geist Spinner API.
 * Source of truth: https://vercel.com/geist/spinner.md ("## Sizes").
 */
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Spinner size. Accepts a named Geist token (`sm`…`4xl`) or a raw pixel
     * number. Defaults to `20` (equivalent to the `lg` token).
     */
    size?: SpinnerSize | number;
    /**
     * Override the spinner color. This is an intentional oxobz extension:
     * the upstream Geist API colors the spinner via `className` text color
     * (`bg-current`). Passing `color` sets both the inner `color` and the
     * `--spinner-color` custom property. When omitted, the default is
     * `var(--ds-gray-700)`, identical to production.
     */
    color?: string;
}

// ---- Size tokens ----

/**
 * Named-token → pixel map, verified from the production Geist Spinner
 * container size classes (cva `size` variants, chunk 2aacxal9r7gff.js):
 *   sm → size-3 (12px), md → size-4 (16px), lg → size-5 (20px),
 *   xl → size-6 (24px), 2xl → size-8 (32px), 3xl → size-10 (40px),
 *   4xl → size-14 (56px).
 */
const SIZE_MAP: Record<SpinnerSize, number> = {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 56,
};

// ---- Constants (from spinner.html inspect) ----

/**
 * Per-size bar parameters, measured from EVERY spinner instance in the
 * fresh geistcn capture (spinner-jul2026.html — the March snapshot's
 * spinner-module generation is gone from production):
 *   12px → 8 bars (45° step), 1000ms, bar 1.5×3px
 *   16px → 10 bars (36°),     1000ms, bar 1.5×4px
 *   20px → 12 bars (30°),     1200ms, bar 2×5px
 *   24px → 12 bars (30°),     1200ms, bar 2.5×6px
 *   32px → 15 bars (24°),     1200ms, bar 2.5×8px
 * Bars are placed with `rotate(Ndeg) translate(146%)` at every size.
 * 40/56px have no captured example — they extrapolate the 32px row
 * (documented inference, largest evidenced tier).
 */
interface BarParams {
    bars: number;
    duration: number;
    barHeight: string;
    barWidth: string;
}

function getBarParams(px: number): BarParams {
    if (px <= 12) return { bars: 8, duration: 1000, barHeight: '1.5px', barWidth: '3px' };
    if (px <= 16) return { bars: 10, duration: 1000, barHeight: '1.5px', barWidth: '4px' };
    if (px <= 20) return { bars: 12, duration: 1200, barHeight: '2px', barWidth: '5px' };
    if (px <= 24) return { bars: 12, duration: 1200, barHeight: '2.5px', barWidth: '6px' };
    return { bars: 15, duration: 1200, barHeight: '2.5px', barWidth: '8px' };
}

/**
 * Spinner component — Geist activity indicator.
 *
 * Renders an activity-indicator style spinner using rotated bars.
 * Each bar fades from full opacity → 0.15 in a staggered loop. Bar geometry,
 * timing and keyframes are byte-for-byte identical to the production snapshot
 * (_nextstatic/component-inspect-element/spinner.html). The `size` prop mirrors
 * the official Geist API (named tokens `sm`…`4xl`) while remaining
 * backward-compatible with raw pixel numbers.
 *
 * Data attributes (oxobz branding of Geist's `data-geist-spinner`):
 * data-oxobz-spinner, data-version="v1".
 */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
    ({ size = 20, color, className, style, ...props }, ref) => {
        const px = typeof size === 'number' ? size : SIZE_MAP[size];
        const { bars: barCount, duration, barHeight, barWidth } = getBarParams(px);
        const step = 360 / barCount; // rotation degrees per bar

        const bars = [];
        for (let i = 0; i < barCount; i++) {
            const rotation = step * i;
            // Stagger measured from the capture: first bar -900ms … last 0ms
            // at 10 bars/1000ms, i.e. -(duration) + slot*(i+1).
            const delay = -duration + (duration / barCount) * (i + 1);

            bars.push(
                <div
                    key={i}
                    aria-hidden="true"
                    className={styles.line}
                    style={{
                        height: barHeight,
                        width: barWidth,
                        '--animation-delay': `${delay}ms`,
                        '--animation-duration': `${duration}ms`,
                        transform: `rotate(${rotation}deg) translate(146%)`,
                    } as React.CSSProperties}
                />,
            );
        }

        // Production root (geistcn generation): a single element — no inner
        // wrapper — with role/aria-label and the testid (geistcn→oxobz brand).
        return (
            <div
                ref={ref}
                role="status"
                aria-label="Loading"
                className={cn(styles.spinner, className)}
                data-oxobz-spinner=""
                data-testid="oxobz/spinner"
                data-version="v1"
                style={{
                    height: px,
                    width: px,
                    ...(color ? ({ color, '--spinner-color': color } as React.CSSProperties) : {}),
                    ...style,
                }}
                {...props}
            >
                {bars}
            </div>
        );
    },
);

Spinner.displayName = 'Spinner';
