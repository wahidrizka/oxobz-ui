import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Spinner.module.css';

// ---- Types ----

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
    /** Spinner size in pixels. Default = 20. */
    size?: number;
    /** Override the spinner color via CSS variable. */
    color?: string;
}

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
 * Spinner component — 100% consistent with production Geist.
 *
 * Renders an activity-indicator style spinner using rotated bars.
 * Each bar fades from full opacity → 0.15 in a staggered loop.
 *
 * Production data attributes: data-oxobz-spinner, data-version="v1"
 */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
    ({ size = 20, color, className, style, ...props }, ref) => {
        const isSmall = size <= SMALL_THRESHOLD;
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
                style={{ height: size, width: size, ...style }}
                {...props}
            >
                <div
                    className={styles.inner}
                    style={{
                        height: size,
                        width: size,
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
