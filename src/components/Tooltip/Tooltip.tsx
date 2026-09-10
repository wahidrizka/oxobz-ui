'use client';

import {
    forwardRef,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type CSSProperties,
    type FocusEvent,
    type HTMLAttributes,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import styles from './Tooltip.module.css';

/** Gap between the trigger and the popup (matches the 10px hover bridge). */
const GAP = 10;

/**
 * Position the portaled popup from the trigger's viewport rect, replicating
 * live geistcn's inline placement (measured 10 Sep 2026 for `top`):
 *   top:  trigger.top,  left: trigger.left,
 *   transform: translate(calc(-50% + <halfWidth>px), calc(-100% - 10px))
 * i.e. anchored to the trigger's top-left, then shifted so the popup is
 * centered on the trigger centre and lifted above it with a 10px gap. The
 * bottom / left / right variants mirror this by symmetry (only `top` is
 * verified against live; the others are the symmetric inference).
 */
function computePopupStyle(
    r: DOMRect,
    position: TooltipPosition,
): CSSProperties {
    const top = r.top + window.scrollY;
    const left = r.left + window.scrollX;
    const halfW = r.width / 2;
    const halfH = r.height / 2;
    switch (position) {
        case 'bottom':
            return {
                top: r.bottom + window.scrollY,
                left,
                transform: `translate(calc(-50% + ${halfW}px), ${GAP}px)`,
            };
        case 'left':
            return {
                top,
                left,
                transform: `translate(calc(-100% - ${GAP}px), calc(-50% + ${halfH}px))`,
            };
        case 'right':
            return {
                top,
                left: r.right + window.scrollX,
                transform: `translate(${GAP}px, calc(-50% + ${halfH}px))`,
            };
        case 'top':
        default:
            return {
                top,
                left,
                transform: `translate(calc(-50% + ${halfW}px), calc(-100% - ${GAP}px))`,
            };
    }
}

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
            style,
            tabIndex,
            text,
            tip = true,
            type = 'default',
            wrap = false,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        forwardedRef,
    ) => {
        const autoId = useId();
        const tooltipId = `tooltip-${autoId}`;

        // Own ref to measure the trigger, merged with the forwarded ref.
        const triggerRef = useRef<HTMLSpanElement | null>(null);
        const setRefs = useCallback(
            (node: HTMLSpanElement | null) => {
                triggerRef.current = node;
                if (typeof forwardedRef === 'function') forwardedRef(node);
                else if (forwardedRef) forwardedRef.current = node;
            },
            [forwardedRef],
        );

        const [visible, setVisible] = useState(false);
        const [faster, setFaster] = useState(false);
        const [popupStyle, setPopupStyle] = useState<CSSProperties>({});

        const reposition = useCallback(() => {
            if (triggerRef.current) {
                setPopupStyle(
                    computePopupStyle(triggerRef.current.getBoundingClientRect(), position),
                );
            }
        }, [position]);

        const show = () => {
            if (!visible) {
                setFaster(Date.now() - lastHiddenAt < FASTER_WINDOW_MS);
                reposition();
                setVisible(true);
            }
        };

        const hide = () => {
            if (visible) {
                lastHiddenAt = Date.now();
                setVisible(false);
            }
        };

        /* While open: Escape closes it, and the portaled popup tracks the
           trigger as the page scrolls or resizes (it lives at document level,
           so it must follow the trigger's moving rect). Focus never leaves the
           trigger (the popup is not focusable) so it needs no restore. */
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
            const handleReflow = () => reposition();
            document.addEventListener('keydown', handleKeyDown);
            window.addEventListener('scroll', handleReflow, true);
            window.addEventListener('resize', handleReflow);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('scroll', handleReflow, true);
                window.removeEventListener('resize', handleReflow);
            };
        }, [visible, reposition]);

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
                /*
                 * Atribut pemicu (re-ukur 10 Sep 2026, DUA konteks berbeda):
                 *   - Standalone (mis. Description): span HANYA punya
                 *     data-testid="legacy/tooltip-trigger" + data-version +
                 *     tabindex. TANPA data-state, TANPA style.
                 *   - Dibungkus context-menu (mis. swatch Colors): Radix
                 *     ContextMenu.Trigger asChild yang MENYUNTIKKAN data-state
                 *     ("closed"/"open") + style -webkit-touch-callout lewat
                 *     {...rest}/style, BUKAN tooltip ini.
                 * Jadi tooltip TIDAK lagi meng-hardcode data-state/callout
                 * (dulu keliru dipasang di semua konteks). Posisi popup saat
                 * terbuka dipicu kelas `.open` (dari `visible`), bukan
                 * data-state, supaya lepas dari data-state milik Radix.
                 */
                data-testid="legacy/tooltip-trigger"
                data-version={dataVersion}
                style={style}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                ref={setRefs}
                tabIndex={tabIndex ?? 0}
            >
                {children}
                {visible &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        /* Portaled to <body> like live geistcn: the popup is NOT a
                           child of the trigger. The empty wrapper <div> mirrors
                           live's portal host; the popup itself is positioned by
                           JS (top/left/transform from the trigger rect). */
                        <div>
                            <div
                                className={cn(
                                    styles.tooltip,
                                    // live geistcn: popup default carries the GLOBAL
                                    // `invert-theme` class — every --ds-* token inside the
                                    // popup flips (dark bg in light theme), matching live's
                                    // computed rgb(10,10,10). Token scope in tokens/colors.css.
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
                                style={popupStyle}
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
                        </div>,
                        document.body,
                    )}
            </span>
        );
    },
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
