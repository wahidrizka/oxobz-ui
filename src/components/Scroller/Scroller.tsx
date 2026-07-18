import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type MutableRefObject,
    type ReactNode,
    type Ref,
} from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import styles from './Scroller.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Scroll axis/axes the container allows, matching Geist's `overflow` prop. */
export type ScrollerOverflow = 'x' | 'y' | 'both';

export interface ScrollerProps extends HTMLAttributes<HTMLDivElement> {
    /** Which axis (or both) may scroll. Default `'y'`. */
    overflow?: ScrollerOverflow;
    /** Container height. A number is treated as pixels. Default `'100%'`. */
    height?: number | string;
    /** Container width. A number is treated as pixels. Default `'100%'`. */
    width?: number | string;
    /**
     * Renders a row of round auto-scroll buttons that jump to the first/last
     * *direct* child of the scroller — nested wrapper elements are not
     * found (see the "Behavior" note on the Geist docs page).
     */
    withButtons?: boolean;
    /** className applied to the direct-children flex wrapper. */
    childrenContainerClassName?: string;
    children?: ReactNode;
}

interface EdgeState {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
}

const NO_EDGES: EdgeState = { top: false, right: false, bottom: false, left: false };

/** Sub-pixel rounding slack so the fade doesn't flicker while at rest. */
const EDGE_EPSILON = 1;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Assigns a value to a forwarded ref of either shape (function or object). */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref != null) {
        (ref as MutableRefObject<T | null>).current = value;
    }
}

function toCssSize(value: number | string): string {
    return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Which edges currently have hidden content past them, i.e. which edge
 * fades should be visible. Not literally captured in the snapshot (its two
 * `overflow="y"` examples freeze with different edges lit, which reads as a
 * scroll-position artifact of the capture rather than a fixed value) — this
 * follows the standard "fade the edge you can still scroll toward" contract
 * that the module's before/after gradient split (top+left vs bottom+right)
 * is built for.
 */
function measureEdges(el: HTMLDivElement, overflow: ScrollerOverflow): EdgeState {
    const canScrollY = overflow === 'y' || overflow === 'both';
    const canScrollX = overflow === 'x' || overflow === 'both';
    return {
        top: canScrollY && el.scrollTop > EDGE_EPSILON,
        bottom: canScrollY && el.scrollTop < el.scrollHeight - el.clientHeight - EDGE_EPSILON,
        left: canScrollX && el.scrollLeft > EDGE_EPSILON,
        right: canScrollX && el.scrollLeft < el.scrollWidth - el.clientWidth - EDGE_EPSILON,
    };
}

function measureOverflowing(el: HTMLDivElement, overflow: ScrollerOverflow): boolean {
    const overflowsY = el.scrollHeight > el.clientHeight + EDGE_EPSILON;
    const overflowsX = el.scrollWidth > el.clientWidth + EDGE_EPSILON;
    if (overflow === 'y') return overflowsY;
    if (overflow === 'x') return overflowsX;
    return overflowsY || overflowsX;
}

type ScrollEdge = 'top' | 'bottom' | 'left' | 'right';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Scroller — an overflowing list container with edge-fade affordances and
 * (optionally) auto-scroll buttons.
 *
 * Rendered DOM (Geist production / geistcn structure), no buttons:
 * ```html
 * <div class="overlayContainer [isHorizontal]" data-oxobz-scroller="" data-version="v1">
 *   <div class="overlay [top left bottom right]" data-oxobz-scroller-overlay="" />
 *   <div class="scroller" data-oxobz-scroller-container="" data-overflow="x|y|both"
 *        [data-oxobz-scroller-overflowing]>
 *     <div class="[childrenContainerClassName]">{children}</div>
 *   </div>
 * </div>
 * ```
 * With `withButtons`, the round scroll buttons render as a sibling of the
 * container above (not nested inside it) — before it for `overflow="y"`/
 * `"both"`, after it for `overflow="x"` (matching the "vertical/horizontal
 * with buttons" snapshot examples and the adjacent-sibling
 * `.isHorizontal + .buttons` selector that left-aligns the horizontal row).
 */
export const Scroller = forwardRef<HTMLDivElement, ScrollerProps>(
    (
        {
            overflow = 'y',
            height = '100%',
            width = '100%',
            withButtons = false,
            childrenContainerClassName,
            className,
            children,
            ...props
        },
        forwardedRef,
    ) => {
        const rootRef = useRef<HTMLDivElement | null>(null);
        const containerRef = useRef<HTMLDivElement | null>(null);
        const [edges, setEdges] = useState<EdgeState>(NO_EDGES);
        const [overflowing, setOverflowing] = useState(false);

        const setRootRef = useCallback(
            (node: HTMLDivElement | null) => {
                rootRef.current = node;
                assignRef(forwardedRef, node);
            },
            [forwardedRef],
        );

        const remeasure = useCallback(() => {
            const el = containerRef.current;
            if (!el) return;
            setEdges(measureEdges(el, overflow));
            setOverflowing(measureOverflowing(el, overflow));
        }, [overflow]);

        useEffect(() => {
            const el = containerRef.current;
            if (!el) return undefined;

            remeasure();
            el.addEventListener('scroll', remeasure, { passive: true });

            // Feature-detected: jsdom (unit tests) has no ResizeObserver.
            const resizeObserver =
                typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(remeasure);
            resizeObserver?.observe(el);
            if (el.firstElementChild) resizeObserver?.observe(el.firstElementChild);

            return () => {
                resizeObserver?.disconnect();
                el.removeEventListener('scroll', remeasure);
            };
            // Re-measure whenever content or axis changes.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [remeasure, children]);

        const scrollToEdge = useCallback((edge: ScrollEdge) => {
            const container = containerRef.current;
            const wrapper = container?.firstElementChild ?? null;
            if (!wrapper) return;

            const target =
                edge === 'top' || edge === 'left' ? wrapper.firstElementChild : wrapper.lastElementChild;
            if (!target) return;

            target.scrollIntoView({
                behavior: 'smooth',
                block: edge === 'top' ? 'start' : edge === 'bottom' ? 'end' : 'nearest',
                inline: edge === 'left' ? 'start' : edge === 'right' ? 'end' : 'nearest',
            });
        }, []);

        const isHorizontalOnly = overflow === 'x';

        const overlayContainerStyle = {
            width: toCssSize(width),
            height: toCssSize(height),
        } as CSSProperties;

        const overlayClassName = cn(
            styles.overlay,
            edges.top && styles.top,
            edges.right && styles.right,
            edges.bottom && styles.bottom,
            edges.left && styles.left,
        );

        const scroller = (
            <div
                {...props}
                ref={setRootRef}
                className={cn(styles.overlayContainer, isHorizontalOnly && styles.isHorizontal, className)}
                data-oxobz-scroller=""
                data-version="v1"
                style={{ ...overlayContainerStyle, ...props.style }}
            >
                <div aria-hidden="true" className={overlayClassName} data-oxobz-scroller-overlay="" />
                <div
                    ref={containerRef}
                    className={styles.scroller}
                    data-oxobz-scroller-container=""
                    data-overflow={overflow}
                    {...(overflowing ? { 'data-oxobz-scroller-overflowing': '' } : {})}
                >
                    <div className={childrenContainerClassName}>{children}</div>
                </div>
            </div>
        );

        if (!withButtons) {
            return scroller;
        }

        const buttons = isHorizontalOnly ? (
            <div className={styles.buttons} data-oxobz-scroller-buttons="">
                <Button aria-label="scroll left" onClick={() => scrollToEdge('left')} shape="circle" size="small" svgOnly>
                    <ChevronLeft size={16} />
                </Button>
                <Button aria-label="scroll right" onClick={() => scrollToEdge('right')} shape="circle" size="small" svgOnly>
                    <ChevronRight size={16} />
                </Button>
            </div>
        ) : (
            <div className={styles.buttons} data-oxobz-scroller-buttons="">
                <Button aria-label="scroll top" onClick={() => scrollToEdge('top')} shape="circle" size="small" svgOnly>
                    <ChevronUp size={16} />
                </Button>
                <Button aria-label="scroll bottom" onClick={() => scrollToEdge('bottom')} shape="circle" size="small" svgOnly>
                    <ChevronDown size={16} />
                </Button>
                {overflow === 'both' && (
                    <>
                        <Button aria-label="scroll left" onClick={() => scrollToEdge('left')} shape="circle" size="small" svgOnly>
                            <ChevronLeft size={16} />
                        </Button>
                        <Button aria-label="scroll right" onClick={() => scrollToEdge('right')} shape="circle" size="small" svgOnly>
                            <ChevronRight size={16} />
                        </Button>
                    </>
                )}
            </div>
        );

        // Snapshot DOM order: buttons precede the scroller for y/both,
        // follow it for x (so the `.isHorizontal + .buttons` selector applies).
        return isHorizontalOnly ? (
            <>
                {scroller}
                {buttons}
            </>
        ) : (
            <>
                {buttons}
                {scroller}
            </>
        );
    },
);

Scroller.displayName = 'Scroller';
