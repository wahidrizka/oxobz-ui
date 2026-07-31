'use client';

import {
    forwardRef,
    useEffect,
    useId,
    useState,
    type FocusEvent,
    type HTMLAttributes,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Tooltip.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TooltipType = 'default' | 'success' | 'error' | 'warning' | 'violet';

export type TooltipBoxAlign = 'left' | 'center' | 'right';

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
    /** Content shown inside the floating tooltip box */
    text: ReactNode;

    /** Side of the trigger the tooltip appears on */
    position?: TooltipPosition;

    /** Color preset of the tooltip box */
    type?: TooltipType;

    /** Alignment of the tooltip box relative to the trigger */
    boxAlign?: TooltipBoxAlign;

    /** Entry delay before fading in; pass false to show immediately */
    delay?: boolean;

    /** Shows the triangle tip indicator */
    tip?: boolean;

    /** Centers the tooltip text */
    center?: boolean;

    /**
     * Allows the tooltip text to wrap onto multiple lines.
     * Present in the production CSS module (.wrap) although the current
     * Geist docs do not demo it.
     */
    wrap?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Shared "faster" state                                              */
/* ------------------------------------------------------------------ */

/**
 * Production shows subsequent tooltips with a shorter entry delay (.faster,
 * 100ms instead of 400ms) when another tooltip was hidden moments before —
 * sweeping across a toolbar should not re-wait the full delay each time.
 * The timestamp is shared module-wide, like production's global state.
 * The 300ms window is not verifiable from the reference and is our choice.
 */
let lastHiddenAt = 0;
const FASTER_WINDOW_MS = 300;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A floating label that appears on hover or focus to provide additional
 * context about an element. Hides on mouse leave, blur, and Escape (focus
 * stays on the trigger, matching the documented behaviour).
 *
 * Rendered DOM (trigger per Geist production snapshot; popup follows the
 * production module class chain — it is portaled to <body> in production
 * but anchored inside the trigger here, positioned with CSS only):
 * ```html
 * <span class="container" data-oxobz-tooltip="" data-version="v1" tabindex="0">
 *   {children}
 *   <!-- while visible -->
 *   <div class="absolute">
 *     <div class="relative">
 *       <div class="tooltip top center delay tip" id="..." role="tooltip">
 *         {text}
 *         <span aria-hidden="true" class="triangle"></span>
 *       </div>
 *     </div>
 *   </div>
 * </span>
 * ```
 */
const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(
    (
        {
            boxAlign = 'center',
            center = true,
            children,
            className,
            delay = true,
            onBlur,
            onFocus,
            onMouseEnter,
            onMouseLeave,
            position = 'top',
            tabIndex,
            text,
            tip = true,
            type = 'default',
            wrap = false,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const autoId = useId();
        const tooltipId = `tooltip-${autoId}`;

        const [visible, setVisible] = useState(false);
        const [faster, setFaster] = useState(false);

        const show = () => {
            if (!visible) {
                setFaster(Date.now() - lastHiddenAt < FASTER_WINDOW_MS);
                setVisible(true);
            }
        };

        const hide = () => {
            if (visible) {
                lastHiddenAt = Date.now();
                setVisible(false);
            }
        };

        /* Escape closes the tooltip; focus never leaves the trigger (the
           popup is not focusable) so it needs no explicit restore. */
        useEffect(() => {
            if (!visible) {
                return undefined;
            }
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    lastHiddenAt = Date.now();
                    setVisible(false);
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }, [visible]);

        const handleMouseEnter = (event: MouseEvent<HTMLSpanElement>) => {
            onMouseEnter?.(event);
            show();
        };

        const handleMouseLeave = (event: MouseEvent<HTMLSpanElement>) => {
            onMouseLeave?.(event);
            hide();
        };

        const handleFocus = (event: FocusEvent<HTMLSpanElement>) => {
            onFocus?.(event);
            show();
        };

        const handleBlur = (event: FocusEvent<HTMLSpanElement>) => {
            onBlur?.(event);
            hide();
        };

        return (
            <span
                {...rest}
                aria-describedby={visible ? tooltipId : undefined}
                className={cn(styles.container, className)}
                data-oxobz-tooltip=""
                data-version={dataVersion}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                ref={ref}
                tabIndex={tabIndex ?? 0}
            >
                {children}
                {visible && (
                    <div className={styles.absolute}>
                        <div className={styles.relative}>
                            <div
                                className={cn(
                                    styles.tooltip,
                                    // live geistcn (26 Jul): popup default membawa kelas
                                    // GLOBAL `invert-theme` — semua token --ds-* di dalam
                                    // popup terbalik (bg gelap di tema terang), persis
                                    // computed live rgb(10,10,10). Scope token
                                    // .invert-theme diimplement di tokens/colors.css.
                                    type === 'default' && 'invert-theme',
                                    styles[position],
                                    type !== 'default' && styles[type],
                                    boxAlign !== 'center' &&
                                        styles[`box-align-${boxAlign}`],
                                    center && styles.center,
                                    tip && styles.tip,
                                    delay && styles.delay,
                                    faster && styles.faster,
                                    wrap && styles.wrap,
                                )}
                                id={tooltipId}
                                role="tooltip"
                            >
                                {text}
                                {/* Arrow live = SVG 14×6 berlekuk (bukan segitiga border),
                                    fill --ds-background-100 (ikut terbalik oleh
                                    invert-theme). Bukti hanya untuk posisi top; posisi
                                    lain memutar svg yang sama (inferensi, ditandai). */}
                                <span aria-hidden="true" className={styles.triangle}>
                                    <svg
                                        height="6"
                                        viewBox="0 0 14 6"
                                        width="14"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            className={styles.trianglePath}
                                            d="M13.8284 0H0.17157C0.702003 0 1.21071 0.210714 1.58578 0.585787L5.58578 4.58579C6.36683 5.36684 7.63316 5.36683 8.41421 4.58579L12.4142 0.585786C12.7893 0.210714 13.298 0 13.8284 0Z"
                                        />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </span>
        );
    },
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
