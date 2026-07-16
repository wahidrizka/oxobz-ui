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

/** Below this threshold the spinner uses 8 bars instead of 12. */
const SMALL_THRESHOLD = 16;

/** Bars / timing for small spinners (size ≤ 16px). */
const SMALL_BARS = 8;
const SMALL_DURATION = 1000; // ms

/** Bars / timing for normal/large spinners (size > 16px). */
const NORMAL_BARS = 12;
const NORMAL_DURATION = 1200; // ms

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
        const isSmall = px <= SMALL_THRESHOLD;
        const barCount = isSmall ? SMALL_BARS : NORMAL_BARS;
        const duration = isSmall ? SMALL_DURATION : NORMAL_DURATION;
        const step = 360 / barCount; // rotation degrees per bar

        // Bar dimensions — small uses fixed px, larger uses percentages (from inspect)
        const barHeight = isSmall ? '1.5px' : '8%';
        const barWidth = isSmall ? '3px' : '24%';

        const bars = [];
        for (let i = 0; i < barCount; i++) {
            const rotation = step * i;
            // Stagger: first bar starts at -(duration - step_time), last at 0
            const delay = -duration + (duration / barCount) * (i + 1);

            bars.push(
                <div
                    key={i}
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

        return (
            <div
                ref={ref}
                className={cn(styles.spinner, className)}
                data-oxobz-spinner=""
                data-version="v1"
                style={{ height: px, width: px, ...style }}
                {...props}
            >
                <div
                    className={styles.inner}
                    style={{
                        height: px,
                        width: px,
                        ...(color ? { color, '--spinner-color': color } as React.CSSProperties : { color: 'var(--ds-gray-700)' }),
                    }}
                >
                    {bars}
                </div>
            </div>
        );
    },
);

Spinner.displayName = 'Spinner';
