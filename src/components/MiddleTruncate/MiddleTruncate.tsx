import {
    forwardRef,
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
    type ClipboardEvent,
    type HTMLAttributes,
    type MutableRefObject,
    type Ref,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './MiddleTruncate.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MiddleTruncateProps extends HTMLAttributes<HTMLSpanElement> {
    /** The full string to render, truncated in the middle when it overflows. */
    value: string;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ELLIPSIS = '…';

/** Merge several refs into a single ref callback (pattern from Combobox.tsx). */
function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): (node: T | null) => void {
    return (node: T | null) => {
        for (const r of refs) {
            if (!r) continue;
            if (typeof r === 'function') r(node);
            else (r as MutableRefObject<T | null>).current = node;
        }
    };
}

/**
 * Binary-searches the widest head+tail split of `value` (joined by a single
 * `…`) that fits inside `availableWidth`, per middle-truncate.md,
 * "Behavior": "renders a single ellipsis glyph rather than three periods."
 *
 * `measure` is injected so the algorithm itself is unit-testable without a
 * real canvas/DOM (see MiddleTruncate.test.tsx).
 *
 * Exported for testing only — not re-exported from the package barrel.
 */
export function computeMiddleTruncatedText(
    value: string,
    measure: (text: string) => number,
    availableWidth: number,
): string {
    if (availableWidth <= 0 || value.length <= 1) return value;
    if (measure(value) <= availableWidth) return value;

    const ellipsisWidth = measure(ELLIPSIS);
    if (ellipsisWidth >= availableWidth) return ELLIPSIS;

    // mid = total visible characters kept (head + tail), split so the head
    // gets the extra character on odd counts.
    let lo = 0;
    let hi = value.length;
    let best = ELLIPSIS;

    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const headLen = Math.ceil(mid / 2);
        const tailLen = mid - headLen;
        const candidate =
            tailLen > 0
                ? `${value.slice(0, headLen)}${ELLIPSIS}${value.slice(value.length - tailLen)}`
                : `${value.slice(0, headLen)}${ELLIPSIS}`;

        if (measure(candidate) <= availableWidth) {
            best = candidate;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    return best;
}

/**
 * Builds a canvas-based `measure` function using the visible span's computed
 * font, so width comparisons never force a synchronous layout/reflow.
 * Returns `null` when canvas 2D is unavailable (e.g. jsdom in tests) — the
 * component falls back to rendering the untruncated value, matching the
 * pre-hydration state captured in middletruncate.html (all three spans hold
 * the full string until client JS can measure).
 */
function createMeasurer(font: string): ((text: string) => number) | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.font = font;
    return (text: string) => ctx.measureText(text).width;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Truncates a string in the middle, keeping its start and end, when it
 * overflows its container width.
 *
 * Rendered DOM (geistcn production / middletruncate.html structure):
 * ```html
 * <span class="wrapper" data-oxobz-middle-truncate="" data-version="v1">
 *   <span aria-hidden="true" class="sizer">{full value}</span>
 *   <span class="visible">{displayValue}</span>
 *   <span aria-hidden="true" class="copySource">{full value}</span>
 * </span>
 * ```
 *
 * Notes:
 * - The snapshot's outer span carries no `aria-label`/`title` of its own —
 *   those are left as plain passthrough props (best-practice guidance in
 *   middle-truncate.md is for the *consumer* to add one when embedding this
 *   inside a focusable control, not something the component injects).
 * - `useId()` is intentionally omitted: unlike Combobox/RadioGroup, there is
 *   no label↔control pairing here to wire up.
 * - Width tracking uses `ResizeObserver` (feature-detected — absent in
 *   jsdom, so tests exercise `computeMiddleTruncatedText` directly).
 * - Copying the truncated text yields the full original string, never the
 *   visible ellipsis form (middle-truncate.md, "Behavior").
 */
const MiddleTruncate = forwardRef<HTMLSpanElement, MiddleTruncateProps>(
    (
        { value, className, onCopy, 'data-version': dataVersion = 'v1', ...rest },
        forwardedRef,
    ) => {
        const wrapperRef = useRef<HTMLSpanElement>(null);
        const visibleRef = useRef<HTMLSpanElement>(null);
        const [displayValue, setDisplayValue] = useState(value);

        const recalculate = useCallback(() => {
            const wrapper = wrapperRef.current;
            const visible = visibleRef.current;
            if (!wrapper || !visible) return;

            const measure = createMeasurer(window.getComputedStyle(visible).font);
            if (!measure) {
                setDisplayValue(value);
                return;
            }

            setDisplayValue(
                computeMiddleTruncatedText(value, measure, wrapper.clientWidth),
            );
        }, [value]);

        useLayoutEffect(() => {
            recalculate();

            const wrapper = wrapperRef.current;
            if (!wrapper || typeof ResizeObserver === 'undefined') return undefined;

            const observer = new ResizeObserver(() => recalculate());
            observer.observe(wrapper);
            return () => observer.disconnect();
        }, [recalculate]);

        const handleCopy = useCallback(
            (event: ClipboardEvent<HTMLSpanElement>) => {
                event.preventDefault();
                event.clipboardData.setData('text/plain', value);
                onCopy?.(event);
            },
            [value, onCopy],
        );

        return (
            <span
                {...rest}
                ref={mergeRefs(forwardedRef, wrapperRef)}
                className={cn(styles.wrapper, className)}
                onCopy={handleCopy}
                data-oxobz-middle-truncate=""
                data-version={dataVersion}
            >
                <span aria-hidden="true" className={styles.sizer}>
                    {value}
                </span>
                <span className={styles.visible} ref={visibleRef}>
                    {displayValue}
                </span>
                <span aria-hidden="true" className={styles.copySource}>
                    {value}
                </span>
            </span>
        );
    },
);

MiddleTruncate.displayName = 'MiddleTruncate';

export { MiddleTruncate };
