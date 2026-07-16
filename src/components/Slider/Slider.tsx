import {
    forwardRef,
    useCallback,
    useRef,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type HTMLAttributes,
    type KeyboardEvent,
    type PointerEvent as ReactPointerEvent,
} from 'react';
import { Input } from '../Input';
import { cn } from '../../utils/cn';
import styles from './Slider.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SliderProps
    extends Omit<HTMLAttributes<HTMLSpanElement>, 'defaultValue' | 'onChange'> {
    /** Controlled value. One number per thumb (e.g. `[50]` or `[25, 75]`). */
    value?: number[];

    /** Uncontrolled initial value (default: `[min]`). */
    defaultValue?: number[];

    /** Called with the next value array whenever a thumb moves. */
    onValueChange?: (value: number[]) => void;

    /** Lowest selectable value (default: 0). */
    min?: number;

    /** Highest selectable value (default: 100). */
    max?: number;

    /** Granularity the value snaps to (default: 1). */
    step?: number;

    /** Disables interaction and grays out the range. */
    disabled?: boolean;

    /** Stretches the slider to fill its container. */
    fullWidth?: boolean;

    /** Renders a numeric Input bound to the first thumb, before the track. */
    showStartInput?: boolean;

    /** Renders a numeric Input bound to the last thumb, after the track. */
    showEndInput?: boolean;

    /** Name applied to the hidden form-value inputs. */
    name?: string;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

/** Thumb width in px — used to keep the thumb inside the track bounds. */
const THUMB_WIDTH = 6;

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function getDecimalCount(step: number): number {
    const fraction = String(step).split('.')[1];
    return fraction ? fraction.length : 0;
}

/**
 * Only the first and last thumbs of a multi-thumb slider get a label
 * (matches Geist: "Minimum" / "Maximum"). A single-thumb slider is left
 * unlabeled so the consumer's own <label>/aria-label wins.
 */
function getThumbLabel(index: number, count: number): string | undefined {
    if (count <= 1) return undefined;
    if (index === 0) return 'Minimum';
    if (index === count - 1) return 'Maximum';
    return undefined;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Input to select a value from a given range.
 *
 * Rendered DOM (Geist production structure — Radix Slider):
 * ```html
 * <div class="outerWrapper">
 *   <div class="sliderWrapper">
 *     <!-- optional start Input -->
 *     <span dir="ltr" data-orientation="horizontal" aria-disabled="false"
 *           data-oxobz-slider="" data-version="v1" class="root">
 *       <span class="track" data-orientation="horizontal">
 *         <span class="range" style="left: 0%; right: 50%;" />
 *       </span>
 *       <span style="transform: translateX(-50%); position: absolute;
 *                    left: calc(50% + 0px);">
 *         <span role="slider" aria-valuemin="0" aria-valuemax="100"
 *               aria-valuenow="50" aria-orientation="horizontal"
 *               tabindex="0" class="thumb" />
 *         <input value="50" style="display:none" />
 *       </span>
 *     </span>
 *     <!-- optional end Input -->
 *   </div>
 * </div>
 * ```
 */
const Slider = forwardRef<HTMLSpanElement, SliderProps>(
    (
        {
            className,
            value,
            defaultValue,
            onValueChange,
            min = 0,
            max = 100,
            step = 1,
            disabled = false,
            fullWidth = false,
            showStartInput = false,
            showEndInput = false,
            name,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const rootRef = useRef<HTMLSpanElement | null>(null);
        const thumbRefs = useRef<(HTMLSpanElement | null)[]>([]);
        const draggingRef = useRef(false);
        const activeThumbRef = useRef(0);

        const [internalValues, setInternalValues] = useState<number[]>(
            () => defaultValue ?? [min],
        );
        const [focusedThumb, setFocusedThumb] = useState<number | null>(null);

        const isControlled = value !== undefined;
        const currentValues = value ?? internalValues;

        /* ---- ref merge (keep local ref + forward) ---- */
        const setRootRef = useCallback(
            (node: HTMLSpanElement | null) => {
                rootRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            },
            [ref],
        );

        /* ---- value math ---- */
        const getPercent = useCallback(
            (val: number): number => {
                if (max <= min) return 0;
                return clamp(((val - min) / (max - min)) * 100, 0, 100);
            },
            [min, max],
        );

        const snapToStep = useCallback(
            (val: number): number => {
                const steps = Math.round((val - min) / step);
                let snapped = min + steps * step;
                const decimals = getDecimalCount(step);
                if (decimals > 0) snapped = Number(snapped.toFixed(decimals));
                return clamp(snapped, min, max);
            },
            [min, max, step],
        );

        const commitValueAt = useCallback(
            (index: number, rawValue: number) => {
                const values = value ?? internalValues;
                const snapped = snapToStep(rawValue);
                const lower = index > 0 ? values[index - 1] : min;
                const upper =
                    index < values.length - 1 ? values[index + 1] : max;
                const next = clamp(snapped, lower, upper);
                if (next === values[index]) return;
                const nextValues = values.slice();
                nextValues[index] = next;
                if (!isControlled) setInternalValues(nextValues);
                onValueChange?.(nextValues);
            },
            [value, internalValues, snapToStep, min, max, isControlled, onValueChange],
        );

        const getValueFromPointer = useCallback(
            (clientX: number): number | null => {
                const el = rootRef.current;
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                if (rect.width === 0) return null;
                const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
                return snapToStep(min + ratio * (max - min));
            },
            [snapToStep, min, max],
        );

        const getClosestThumbIndex = useCallback(
            (target: number): number => {
                const values = value ?? internalValues;
                let closest = 0;
                let smallest = Infinity;
                values.forEach((val, index) => {
                    const distance = Math.abs(val - target);
                    if (distance < smallest) {
                        smallest = distance;
                        closest = index;
                    }
                });
                return closest;
            },
            [value, internalValues],
        );

        /* ---- pointer (drag) ---- */
        const handlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
            if (disabled) return;
            const nextValue = getValueFromPointer(event.clientX);
            if (nextValue === null) return;
            const index = getClosestThumbIndex(nextValue);
            activeThumbRef.current = index;
            draggingRef.current = true;
            event.currentTarget.setPointerCapture?.(event.pointerId);
            thumbRefs.current[index]?.focus();
            commitValueAt(index, nextValue);
        };

        const handlePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
            if (!draggingRef.current || disabled) return;
            const nextValue = getValueFromPointer(event.clientX);
            if (nextValue === null) return;
            commitValueAt(activeThumbRef.current, nextValue);
        };

        const handlePointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
            if (!draggingRef.current) return;
            draggingRef.current = false;
            event.currentTarget.releasePointerCapture?.(event.pointerId);
        };

        /* ---- keyboard ---- */
        const handleThumbKeyDown = (
            event: KeyboardEvent<HTMLSpanElement>,
            index: number,
        ) => {
            if (disabled) return;
            const current = currentValues[index];
            let next: number;
            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowUp':
                    next = current + step;
                    break;
                case 'ArrowLeft':
                case 'ArrowDown':
                    next = current - step;
                    break;
                case 'PageUp':
                    next = current + step * 10;
                    break;
                case 'PageDown':
                    next = current - step * 10;
                    break;
                case 'Home':
                    next = min;
                    break;
                case 'End':
                    next = max;
                    break;
                default:
                    return;
            }
            event.preventDefault();
            commitValueAt(index, next);
        };

        /* ---- numeric inputs (showStartInput / showEndInput) ---- */
        const handleInputChange = (index: number) => (
            event: ChangeEvent<HTMLInputElement>,
        ) => {
            if (event.target.value.trim() === '') return;
            const parsed = Number(event.target.value);
            if (Number.isNaN(parsed)) return;
            commitValueAt(index, parsed);
        };

        /* ---- range geometry ---- */
        const percents = currentValues.map(getPercent);
        const rangeLeft = currentValues.length > 1 ? Math.min(...percents) : 0;
        const rangeRight = percents.length ? 100 - Math.max(...percents) : 100;

        const disabledAttr = disabled ? { 'data-disabled': '' } : {};

        return (
            <div className={styles.outerWrapper}>
                <div className={styles.sliderWrapper}>
                    {showStartInput && (
                        <Input
                            disabled={disabled}
                            onChange={handleInputChange(0)}
                            size="small"
                            value={String(currentValues[0] ?? min)}
                        />
                    )}

                    <span
                        {...rest}
                        aria-disabled={disabled ? 'true' : 'false'}
                        className={cn(
                            styles.root,
                            fullWidth && styles.fullWidth,
                            className,
                        )}
                        data-orientation="horizontal"
                        data-oxobz-slider=""
                        data-version={dataVersion}
                        dir="ltr"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        ref={setRootRef}
                        {...disabledAttr}
                    >
                        <span
                            className={styles.track}
                            data-orientation="horizontal"
                            {...disabledAttr}
                        >
                            <span
                                className={styles.range}
                                data-orientation="horizontal"
                                style={{
                                    left: `${rangeLeft}%`,
                                    right: `${rangeRight}%`,
                                }}
                                {...disabledAttr}
                            />
                        </span>

                        {currentValues.map((val, index) => {
                            const percent = getPercent(val);
                            const offset = THUMB_WIDTH * (0.5 - percent / 100);
                            const thumbStyle: CSSProperties = {
                                transform: 'translateX(-50%)',
                                position: 'absolute',
                                left: `calc(${percent}% + ${offset}px)`,
                            };
                            return (
                                <span key={index} style={thumbStyle}>
                                    <span
                                        aria-disabled={
                                            disabled ? 'true' : undefined
                                        }
                                        aria-label={getThumbLabel(
                                            index,
                                            currentValues.length,
                                        )}
                                        aria-orientation="horizontal"
                                        aria-valuemax={max}
                                        aria-valuemin={min}
                                        aria-valuenow={val}
                                        className={cn(
                                            styles.thumb,
                                            focusedThumb === index &&
                                                styles.thumbFocused,
                                        )}
                                        data-orientation="horizontal"
                                        onBlur={() => setFocusedThumb(null)}
                                        onFocus={() => setFocusedThumb(index)}
                                        onKeyDown={(event) =>
                                            handleThumbKeyDown(event, index)
                                        }
                                        ref={(node) => {
                                            thumbRefs.current[index] = node;
                                        }}
                                        role="slider"
                                        tabIndex={disabled ? undefined : 0}
                                        {...disabledAttr}
                                    />
                                    <input
                                        name={name}
                                        readOnly
                                        style={{ display: 'none' }}
                                        value={val}
                                    />
                                </span>
                            );
                        })}
                    </span>

                    {showEndInput && (
                        <Input
                            disabled={disabled}
                            onChange={handleInputChange(
                                currentValues.length - 1,
                            )}
                            size="small"
                            value={String(
                                currentValues[currentValues.length - 1] ?? max,
                            )}
                        />
                    )}
                </div>
            </div>
        );
    },
);

Slider.displayName = 'Slider';

export { Slider };
