'use client';

import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ElementType,
    type FocusEvent,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    type Ref,
    type RefObject,
} from 'react';
import { Portal } from '@radix-ui/react-portal';
import { cn } from '../../utils/cn';
import styles from './Tooltip.module.css';

/*
 * Port of production's own Tooltip, read from the live bundle of
 * vercel.com/geist/tooltip on 10 Nov 2026 (turbopack module 684445). The
 * logic below follows that source statement by statement, including its
 * quirks, and each behaviour was also measured on the live page:
 *   - hover opens it, leaving closes it 100ms later
 *   - focus alone does NOT open it (only with `sticky`); Enter or Space does
 *   - Escape closes it, and so does any scroll
 *   - the popup is rendered through Radix Portal into <body>
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TooltipPosition = 'auto' | 'top' | 'bottom' | 'left' | 'right';

export type TooltipBoxAlign = 'auto' | 'left' | 'center' | 'right';

export type TooltipType = 'success' | 'error' | 'warning' | 'violet';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLElement>, 'tabIndex'> {
    /** Ref to the trigger element. See the note on the component: it replaces the Tooltip's own. */
    ref?: Ref<HTMLElement>;

    /** Content of the floating box. A trailing period on a plain string is dropped. */
    text?: ReactNode;

    /** Element used for the trigger. */
    as?: ElementType;

    /** Side of the trigger the box appears on. `auto` picks top or bottom from the trigger's place on screen. */
    position?: TooltipPosition;

    /** Alignment of the box against the trigger. `auto` shifts it when the trigger sits within 100px of a screen edge. */
    boxAlign?: TooltipBoxAlign;

    /** Centers the text. */
    center?: boolean;

    /** Cursor shown over the trigger. */
    cursor?: CSSProperties['cursor'];

    /** `false` removes the fade-in delay. */
    delay?: boolean;

    /** Milliseconds to wait before opening (only when `delay` is on). */
    delayTime?: number;

    /** Ignore touch input. */
    desktopOnly?: boolean;

    /** Never open, and render only the children when closed. */
    disableTriggers?: boolean;

    /** Selects the filled variant of the `type` preset. */
    fill?: boolean;

    /** Closes the box and drops focus as soon as the trigger gains focus. */
    hideOnClick?: boolean;

    maxWidth?: CSSProperties['maxWidth'];

    padding?: CSSProperties['padding'];

    /** Initial open state, as the bit mask production uses (0 closed, 1 hover, 2 focus, 4 touch). */
    shown?: number;

    /** Open on focus too. */
    sticky?: boolean;

    /** `null` leaves the trigger out of the tab order. */
    tabIndex?: number | null;

    /** Shows the arrow. */
    tip?: boolean;

    /** Class for the floating box. */
    tooltipClassName?: string;

    /** Style for the floating box. */
    tooltipStyle?: CSSProperties;

    /** Color preset. */
    type?: TooltipType;

    /** Lets long text break and keeps its line breaks. */
    wrap?: boolean;

    /** Measure the trigger's parent instead of the trigger. */
    useParentForBoundingRect?: boolean;

    /** Uses the short (100ms) fade-in delay. */
    lowerDelay?: boolean;

    /** Keeps the box out of the page even while open. */
    forceHide?: boolean;

    /** `type` attribute of the trigger, for `as="button"`. */
    htmlType?: string;

    /** Element to render the box into, instead of <body>. */
    containerRef?: RefObject<HTMLElement | null>;

    /** Renders the box in the opposite theme. */
    invertTheme?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/* Open-state bits, as in production. */
const HOVER = 1;
const FOCUS = 2;
const TOUCH = 4;
const ALL = HOVER | FOCUS | TOUCH;

const INTERACTIVE = 'a[href],input,button,select';
const ARROW_OFFSET = 'var(--tooltip-arrow-offset)';

interface TriggerRect {
    top: number;
    left: number;
    right: number;
    width: number;
    height: number;
}

interface TouchStart {
    onWindow: boolean;
    x: number;
    y: number;
}

/* Runs at most once per `wait` ms, on the leading and the trailing edge. */
function throttle(fn: () => void, wait: number): () => void {
    let last = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
        last = Date.now();
        timer = undefined;
        fn();
    };
    return () => {
        const remaining = wait - (Date.now() - last);
        if (remaining <= 0) {
            if (timer) clearTimeout(timer);
            run();
        } else if (!timer) {
            timer = setTimeout(run, remaining);
        }
    };
}

/* The four arrows are four separate drawings in production, not one rotated. */
const ARROW_PATH = {
    top: 'M13.8284 0H0.17157C0.702003 0 1.21071 0.210714 1.58578 0.585787L5.58578 4.58579C6.36683 5.36684 7.63316 5.36683 8.41421 4.58579L12.4142 0.585786C12.7893 0.210714 13.298 0 13.8284 0Z',
    bottom: 'M0.17157 6L13.8284 6C13.298 6 12.7893 5.78929 12.4142 5.41422L8.41421 1.41422C7.63316 0.633168 6.36683 0.633168 5.58578 1.41422L1.58578 5.41422C1.21071 5.78929 0.702003 6 0.17157 6Z',
    left: 'M8.33551e-07 13.8284L0 0.17157C2.31859e-08 0.702003 0.210714 1.21071 0.585787 1.58578L4.58579 5.58578C5.36684 6.36683 5.36683 7.63316 4.58579 8.41421L0.585787 12.4142C0.210715 12.7893 8.10365e-07 13.298 8.33551e-07 13.8284Z',
    right: 'M6 13.8284L6 0.171575C6 0.702008 5.78929 1.21072 5.41422 1.58579L1.41422 5.58579C0.633167 6.36684 0.633168 7.63317 1.41422 8.41422L5.41422 12.4142C5.78929 12.7893 6 13.298 6 13.8284Z',
} as const;

type Side = keyof typeof ARROW_PATH;
type Align = 'left' | 'center' | 'right';

function Arrow({ side }: { side: Side }) {
    const vertical = side === 'top' || side === 'bottom';
    return (
        <svg
            height={vertical ? '6' : '14'}
            viewBox={vertical ? '0 0 14 6' : '0 0 6 14'}
            width={vertical ? '14' : '6'}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path className={styles.arrowPath} d={ARROW_PATH[side]} />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A floating label that gives more context about an element.
 *
 * Note on `ref`: like production, this is a plain function component that
 * takes `ref` as an ordinary prop (React 19) and spreads the remaining props
 * AFTER its own ref. So any `ref` prop that is present, even `null`, replaces
 * the ref the Tooltip measures its trigger with. The box then never learns
 * where the trigger is and stays at the page's top-left corner.
 * That is exactly what happens on vercel.com/geist/colors, where a Radix
 * `asChild` trigger wraps each Tooltip and its Slot hands down `ref: null`
 * (measured 10 Nov 2026: the box sits at `top: 0px; left: 0px`).
 * `forwardRef` is deliberately not used: it cannot tell "ref: null was
 * passed" from "no ref at all", so it could not reproduce this.
 */
function Tooltip({
    as,
    boxAlign = 'auto',
    center = true,
    children,
    className,
    cursor,
    delay = true,
    delayTime = 0,
    desktopOnly = false,
    disableTriggers = false,
    fill = true,
    hideOnClick = false,
    maxWidth = '250px',
    padding,
    position = 'top',
    shown = 0,
    sticky = false,
    style,
    tabIndex = 0,
    text,
    tip = true,
    tooltipClassName,
    type,
    wrap = true,
    useParentForBoundingRect = false,
    lowerDelay = false,
    forceHide = false,
    tooltipStyle,
    htmlType,
    containerRef,
    invertTheme = true,
    ...rest
}: TooltipProps) {
    const [shownBits, setShownBits] = useState(shown);

    const [align, setAlign] = useState<Align>(boxAlign === 'auto' ? 'center' : boxAlign);
    useEffect(() => {
        setAlign(boxAlign === 'auto' ? 'center' : boxAlign);
    }, [boxAlign]);

    const [side, setSide] = useState<Side>(position === 'auto' ? 'top' : position);
    useEffect(() => {
        if (position !== 'auto') setSide(position);
    }, [position]);

    const [rect, setRect] = useState<TriggerRect>({
        top: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
    });

    const triggerRef = useRef<HTMLElement | null>(null);
    const tooltipId = `tooltip-${useId()}`;
    const autoAlign = (side === 'top' || side === 'bottom') && boxAlign === 'auto';

    const measure = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const target =
            useParentForBoundingRect && trigger.parentElement ? trigger.parentElement : trigger;
        const box = target.getBoundingClientRect();
        let { top, left } = box;
        let fromRight = document.documentElement.clientWidth - box.right;
        if (position === 'auto') {
            setSide(box.top < window.innerHeight / 2 ? 'bottom' : 'top');
        }
        top += window.scrollY;
        left += window.scrollX;
        fromRight -= window.scrollX;
        setRect({ top, right: fromRight, left, height: box.height, width: box.width });
        if (autoAlign) {
            if (left < 100) setAlign('left');
            else if (fromRight < 100) setAlign('right');
            else setAlign('center');
        }
    }, [useParentForBoundingRect, autoAlign, position]);

    const show = useCallback(
        (bit: number) => {
            if (disableTriggers) return;
            measure();
            setShownBits((bits) => bits | bit);
        },
        [measure, disableTriggers],
    );

    const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const scheduleShow = useCallback(
        (bit: number) => {
            showTimer.current = setTimeout(() => show(bit), delay ? delayTime : 0);
        },
        [delay, delayTime, show],
    );
    useEffect(
        () => () => {
            if (showTimer.current) clearTimeout(showTimer.current);
        },
        [],
    );

    const hide = useCallback(
        (bit: number) => {
            if (disableTriggers) return;
            if (showTimer.current) clearTimeout(showTimer.current);
            setShownBits((bits) => bits & ~bit);
        },
        [disableTriggers],
    );

    /* Leaving the trigger closes the box 100ms later. */
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(
        () => () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
        },
        [],
    );
    const hideSoon = (bit: number) => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => hide(bit), 100);
    };

    useEffect(() => {
        measure();
        setShownBits(shown);
    }, [measure, shown]);

    const onWindowKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') hide(ALL);
        },
        [hide],
    );

    const touchStart = useRef<TouchStart | null>(null);
    const onWindowTouchStart = useCallback((event: TouchEvent) => {
        const [{ clientX, clientY }] = event.touches;
        touchStart.current = { onWindow: true, x: clientX, y: clientY };
    }, []);

    const onWindowTouchEnd = useCallback(
        (event: TouchEvent) => {
            const start = touchStart.current;
            if (!start) return;
            const [{ clientX, clientY }] = event.changedTouches;
            const moved = Math.sqrt((clientX - start.x) ** 2 + (clientY - start.y) ** 2) >= 16;
            if (!start.onWindow && !moved) {
                show(TOUCH);
                return;
            }
            touchStart.current = null;
            if (!moved) {
                /* Production also bails out here when the touched link or
                   control sits inside an element with the global class
                   `tooltip`. Its own box carries no such class, and
                   neither does ours, so that branch is not reproduced. */
                event.stopPropagation();
                event.preventDefault();
            }
            requestAnimationFrame(() => hide(ALL));
        },
        [show, hide],
    );

    const onWindowResize = useMemo(() => throttle(measure, 150), [measure]);
    const onWindowScroll = useCallback(() => {
        hide(ALL);
    }, [hide]);

    useEffect(() => {
        window.addEventListener('touchend', onWindowTouchEnd);
        if (!shownBits) {
            return () => {
                window.removeEventListener('touchend', onWindowTouchEnd);
            };
        }
        window.addEventListener('keydown', onWindowKeyDown);
        window.addEventListener('touchstart', onWindowTouchStart);
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('scroll', onWindowScroll, { capture: true, passive: true });
        return () => {
            window.removeEventListener('keydown', onWindowKeyDown);
            window.removeEventListener('touchstart', onWindowTouchStart);
            window.removeEventListener('touchend', onWindowTouchEnd);
            window.removeEventListener('resize', onWindowResize);
            window.removeEventListener('scroll', onWindowScroll, { capture: true });
        };
    }, [
        onWindowKeyDown,
        onWindowTouchStart,
        onWindowTouchEnd,
        onWindowResize,
        onWindowScroll,
        shownBits,
    ]);

    const transform = useMemo(() => {
        let shift = '0';
        if (autoAlign && align !== 'center') {
            shift =
                align === 'left'
                    ? `calc(${Math.ceil(rect.width / 2)}px - ${ARROW_OFFSET})`
                    : `calc(${ARROW_OFFSET} - ${Math.ceil(rect.width / 2)}px)`;
        }
        switch (side) {
            case 'top':
                if (align !== 'center') return `translate(${shift}, calc(-100% - 10px))`;
                return `translate(calc(-50% + ${Math.ceil(rect.width / 2)}px), calc(-100% - 10px))`;
            case 'bottom':
                if (align !== 'center') return `translate(${shift}, calc(${rect.height}px + 10px))`;
                return `translate(calc(-50% + ${Math.ceil(rect.width / 2)}px), calc(${rect.height}px + 10px))`;
            case 'left':
                return `translate(calc(-100% - 10px), calc(-50% + ${Math.ceil(rect.height / 2)}px))`;
            case 'right':
                return `translate(calc(${Math.ceil(rect.width)}px + 10px), calc(-50% + ${Math.ceil(rect.height / 2)}px))`;
            default:
                return '';
        }
    }, [side, autoAlign, align, rect]);

    const boxStyle = useMemo<CSSProperties>(
        () =>
            (side === 'bottom' || side === 'top') && align === 'right'
                ? { padding, maxWidth, transform, top: rect.top, right: rect.right }
                : { padding, maxWidth, transform, top: rect.top, left: rect.left },
        [align, rect.left, rect.right, rect.top, maxWidth, padding, side, transform],
    );

    if ((shownBits === 0 && disableTriggers) || text === undefined) {
        return <>{children}</>;
    }

    const Tag: ElementType = as || 'span';

    return (
        <Tag
            aria-describedby={shownBits ? tooltipId : undefined}
            className={cn(styles.container, className)}
            data-testid="legacy/tooltip-trigger"
            data-version="v1"
            onBlur={() => hide(FOCUS)}
            onFocus={(event: FocusEvent<HTMLElement>) => {
                if (hideOnClick) {
                    hide(HOVER);
                    event.target.blur();
                }
                if (event.target === triggerRef.current && sticky && !disableTriggers) {
                    scheduleShow(FOCUS);
                }
            }}
            onKeyDown={(event: ReactKeyboardEvent<HTMLElement>) => {
                switch (event.key) {
                    case 'Enter':
                    case ' ':
                        scheduleShow(HOVER);
                        break;
                    case 'Escape':
                        hide(FOCUS);
                        break;
                    default:
                }
            }}
            onPointerEnter={(event: ReactPointerEvent<HTMLElement>) => {
                if (event.pointerType !== 'touch') {
                    scheduleShow(HOVER);
                    return;
                }
                if (desktopOnly) return;
                const inner = triggerRef.current?.querySelector<
                    HTMLAnchorElement | HTMLInputElement | HTMLButtonElement | HTMLSelectElement
                >(INTERACTIVE);
                const usable = inner && !('disabled' in inner && inner.disabled);
                if (!usable && !touchStart.current) {
                    touchStart.current = {
                        onWindow: false,
                        x: event.clientX,
                        y: event.clientY,
                    };
                }
            }}
            onPointerLeave={(event: ReactPointerEvent<HTMLElement>) => {
                if (event.pointerType !== 'touch') hideSoon(HOVER);
            }}
            ref={triggerRef}
            style={{ cursor, ...style }}
            tabIndex={tabIndex !== null ? tabIndex : undefined}
            type={htmlType}
            /* May carry `ref`, which then takes the place of ours. */
            {...rest}
        >
            {shownBits > 0 && !forceHide ? (
                <Portal container={containerRef?.current}>
                    {(shownBits & TOUCH) > 0 && <div className={styles.overlay} />}
                    <div
                        className={cn(
                            styles.tooltip,
                            styles[side],
                            (lowerDelay || (shownBits & TOUCH) > 0) && styles.faster,
                            !delay && styles.noDelay,
                            wrap && styles.wrap,
                            center && styles.center,
                            type && styles[type],
                            type && fill && styles.fill,
                            tooltipClassName,
                            invertTheme && 'invert-theme',
                        )}
                        id={tooltipId}
                        role="tooltip"
                        style={{ ...boxStyle, ...tooltipStyle }}
                    >
                        {tip ? (
                            <div
                                className={cn(
                                    styles.arrow,
                                    styles[`arrow-${side}`],
                                    (side === 'top' || side === 'bottom') &&
                                        styles[`arrow-${side}-${align}`],
                                )}
                            >
                                <Arrow side={side} />
                            </div>
                        ) : null}
                        {typeof text === 'string' && text.endsWith('.')
                            ? text.slice(0, -1)
                            : text}
                    </div>
                </Portal>
            ) : null}
            {children}
        </Tag>
    );
}

Tooltip.displayName = 'Tooltip';

export { Tooltip };
