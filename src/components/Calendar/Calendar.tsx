import {
    forwardRef,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type HTMLAttributes,
    type KeyboardEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Calendar.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * A single date value. Geist's Calendar is built on
 * `@internationalized/date` (`DateValue`); the oxobz build has no date
 * dependency, so a native `Date` stands in for it while keeping the Geist
 * prop name (`value` / `minValue` / `maxValue`).
 */
export type DateValue = Date;

/** Inclusive `{ start, end }` range — mirrors `RangeValue<DateValue>` from Geist. */
export interface RangeValue<T> {
    start: T;
    end: T;
}

/** Calendar size — `large` (default) or `small`, matching Geist. */
export type CalendarSize = 'large' | 'small';

/** 0 = Sunday … 6 = Saturday. */
export type WeekDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CalendarProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
    /** Controlled selected range. Pass `null` for an empty selection. */
    value?: RangeValue<DateValue> | null;
    /** Uncontrolled initial range. */
    defaultValue?: RangeValue<DateValue> | null;
    /** Fired with the completed range on the second click of a selection. */
    onChange?: (value: RangeValue<DateValue>) => void;
    /** Earliest selectable date (inclusive). Days before it are disabled. */
    minValue?: DateValue;
    /** Latest selectable date (inclusive). Days after it are disabled. */
    maxValue?: DateValue;
    /** Predicate to mark individual days unavailable. */
    isDateUnavailable?: (date: DateValue) => boolean;
    /** Disable the whole calendar. */
    isDisabled?: boolean;
    /** Size token (kept for Geist API parity; the day grid is 32px either way). */
    size?: CalendarSize;
    /** First day of the week. Default 0 (Sunday), matching the Geist snapshot. */
    weekStartsOn?: WeekDayIndex;
    /** Month rendered first when uncontrolled and no value is set. */
    defaultFocusedMonth?: DateValue;
    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Date helpers (day-granularity, local time)                        */
/* ------------------------------------------------------------------ */

const WEEKDAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
] as const;

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
] as const;

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Numeric day key (YYYYMMDD) for cheap ordering / comparison. */
function dayKey(date: Date): number {
    return date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
}

function orderRange(a: Date, b: Date): RangeValue<Date> {
    return dayKey(a) <= dayKey(b) ? { start: a, end: b } : { start: b, end: a };
}

function toISO(date: Date): string {
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
}

/** Weeks (rows of 7) covering the given month, aligned to `weekStartsOn`. */
function buildWeeks(month: Date, weekStartsOn: WeekDayIndex): Date[][] {
    const first = startOfMonth(month);
    const leading = (first.getDay() - weekStartsOn + 7) % 7;
    const gridStart = addDays(first, -leading);

    const weeks: Date[][] = [];
    let cursor = gridStart;
    // Emit whole weeks until we have covered the last day of the month.
    // A month spans at most 6 weeks.
    for (let w = 0; w < 6; w++) {
        const week: Date[] = [];
        for (let d = 0; d < 7; d++) {
            week.push(cursor);
            cursor = addDays(cursor, 1);
        }
        weeks.push(week);
        // Stop once we've emitted a full week that ends in the next month.
        if (week[6].getMonth() !== month.getMonth() && week[6] > first) {
            break;
        }
    }
    return weeks;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Calendar — the month-grid date-range picker panel.
 *
 * Rendered DOM (mirrors the geistcn snapshot in calendar-popovers.html):
 * ```html
 * <div data-oxobz-calendar data-version="v1">
 *   <div class="header">
 *     <div class="monthTitleWrap"><h2 class="currentMonth">July 2026</h2></div>
 *     <button class="caretButton" aria-label="Previous">…</button>
 *     <button class="caretButton" aria-label="Next">…</button>
 *   </div>
 *   <table role="grid" aria-multiselectable="true">
 *     <caption class="oxobz-sr-only" />
 *     <thead><tr><th abbr="Sunday">S</th>…</tr></thead>
 *     <tbody><tr><td role="gridcell"><span role="button">1</span></td>…</tbody>
 *   </table>
 * </div>
 * ```
 *
 * Scope note: this is the grid panel that renders inside Geist's popover — the
 * fully-grounded, dependency-free core. The combobox trigger, presets sidebar,
 * timezone/time inputs and the compact/stacked/horizontal chrome are NOT
 * included; they require react-aria + @internationalized/date. See the agent
 * report for the recapture list.
 *
 * Selection is two-click range (Geist default): first click anchors the start,
 * hovering previews, the second click commits and fires `onChange`.
 */
const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
    (
        {
            value,
            defaultValue = null,
            onChange,
            minValue,
            maxValue,
            isDateUnavailable,
            isDisabled = false,
            size = 'large',
            weekStartsOn = 0,
            defaultFocusedMonth,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const isControlled = value !== undefined;
        const [internalRange, setInternalRange] = useState<RangeValue<Date> | null>(
            defaultValue,
        );
        const range = isControlled ? value : internalRange;

        // Pending first click of a range + the day currently hovered (preview).
        const [anchor, setAnchor] = useState<Date | null>(null);
        const [hoverDate, setHoverDate] = useState<Date | null>(null);

        const initialMonth =
            defaultFocusedMonth ?? range?.start ?? new Date();
        const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
            startOfMonth(initialMonth),
        );
        const [focusedDate, setFocusedDate] = useState<Date>(() =>
            startOfDay(range?.start ?? new Date()),
        );

        const rootRef = useRef<HTMLDivElement | null>(null);
        const gridId = useId();
        const captionId = useId();

        // Move DOM focus onto the focused day after a keyboard navigation.
        const focusTick = useRef(0);
        const pendingFocus = useRef(false);
        useEffect(() => {
            if (!pendingFocus.current) return;
            pendingFocus.current = false;
            const node = rootRef.current?.querySelector<HTMLSpanElement>(
                `[data-date="${toISO(focusedDate)}"]`,
            );
            node?.focus();
        });

        const today = startOfDay(new Date());
        const min = minValue ? startOfDay(minValue) : null;
        const max = maxValue ? startOfDay(maxValue) : null;

        const isDayDisabled = useCallback(
            (date: Date): boolean => {
                if (isDisabled) return true;
                if (min && dayKey(date) < dayKey(min)) return true;
                if (max && dayKey(date) > dayKey(max)) return true;
                if (isDateUnavailable?.(date)) return true;
                return false;
            },
            [isDisabled, min, max, isDateUnavailable],
        );

        // The range to paint: the committed range, or the live preview while a
        // start is anchored.
        const displayRange: RangeValue<Date> | null =
            anchor !== null ? orderRange(anchor, hoverDate ?? anchor) : range;

        const commit = useCallback(
            (next: RangeValue<Date>): void => {
                if (!isControlled) setInternalRange(next);
                onChange?.(next);
            },
            [isControlled, onChange],
        );

        const selectDate = useCallback(
            (date: Date): void => {
                if (isDayDisabled(date)) return;
                if (anchor === null) {
                    setAnchor(date);
                    setHoverDate(date);
                } else {
                    const next = orderRange(anchor, date);
                    setAnchor(null);
                    setHoverDate(null);
                    commit(next);
                }
                setFocusedDate(date);
            },
            [anchor, commit, isDayDisabled],
        );

        const moveFocus = useCallback(
            (next: Date): void => {
                setFocusedDate(next);
                if (!isSameMonth(next, visibleMonth)) {
                    setVisibleMonth(startOfMonth(next));
                }
                pendingFocus.current = true;
                focusTick.current += 1;
            },
            [visibleMonth],
        );

        const handleKeyDown = useCallback(
            (e: KeyboardEvent<HTMLTableElement>): void => {
                let next: Date | null = null;
                switch (e.key) {
                    case 'ArrowLeft':
                        next = addDays(focusedDate, -1);
                        break;
                    case 'ArrowRight':
                        next = addDays(focusedDate, 1);
                        break;
                    case 'ArrowUp':
                        next = addDays(focusedDate, -7);
                        break;
                    case 'ArrowDown':
                        next = addDays(focusedDate, 7);
                        break;
                    case 'Home':
                        next = addDays(focusedDate, -focusedDate.getDay());
                        break;
                    case 'End':
                        next = addDays(focusedDate, 6 - focusedDate.getDay());
                        break;
                    case 'PageUp':
                        next = addMonths(focusedDate, -1);
                        break;
                    case 'PageDown':
                        next = addMonths(focusedDate, 1);
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        selectDate(focusedDate);
                        return;
                    default:
                        return;
                }
                e.preventDefault();
                moveFocus(next);
            },
            [focusedDate, moveFocus, selectDate],
        );

        const goToMonth = useCallback((delta: number): void => {
            setVisibleMonth((m) => addMonths(m, delta));
        }, []);

        const weeks = buildWeeks(visibleMonth, weekStartsOn);

        // Ordered weekday labels starting at weekStartsOn.
        const weekdayOrder: WeekDayIndex[] = Array.from(
            { length: 7 },
            (_, i) => (((weekStartsOn + i) % 7) as WeekDayIndex),
        );

        // Roving tabindex target: the focused day if it is visible, else the
        // first day of the visible month.
        const tabbableDate = isSameMonth(focusedDate, visibleMonth)
            ? focusedDate
            : startOfMonth(visibleMonth);

        const prevDisabled =
            isDisabled ||
            (min !== null &&
                dayKey(addDays(startOfMonth(visibleMonth), -1)) < dayKey(min));
        const nextDisabled =
            isDisabled ||
            (max !== null &&
                dayKey(startOfMonth(addMonths(visibleMonth, 1))) > dayKey(max));

        return (
            <div
                {...rest}
                ref={(node) => {
                    rootRef.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) ref.current = node;
                }}
                className={cn(styles.contentWrapper, className)}
                data-oxobz-calendar=""
                data-version={dataVersion}
                data-size={size}
                data-disabled={isDisabled || undefined}
            >
                <div className={styles.header}>
                    <div className={styles.monthTitleWrap}>
                        <h2 className={styles.currentMonth} id={gridId}>
                            {`${MONTH_NAMES[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`}
                        </h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Previous"
                        className={styles.caretButton}
                        disabled={prevDisabled}
                        onClick={() => goToMonth(-1)}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        type="button"
                        aria-label="Next"
                        className={styles.caretButton}
                        disabled={nextDisabled}
                        onClick={() => goToMonth(1)}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                <table
                    role="grid"
                    aria-labelledby={gridId}
                    aria-multiselectable="true"
                    className={styles.table}
                    onKeyDown={handleKeyDown}
                >
                    <caption className="oxobz-sr-only" id={captionId} />
                    <thead>
                        <tr>
                            {weekdayOrder.map((wd) => (
                                <th
                                    key={wd}
                                    abbr={WEEKDAY_NAMES[wd]}
                                    scope="col"
                                    className={styles.weekday}
                                >
                                    {WEEKDAY_NAMES[wd].charAt(0)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((week) => (
                            <tr key={toISO(week[0])}>
                                {week.map((date) => {
                                    const disabled = isDayDisabled(date);
                                    const outside = !isSameMonth(date, visibleMonth);
                                    const weekend =
                                        date.getDay() === 0 || date.getDay() === 6;
                                    const isToday = isSameDay(date, today);

                                    const rangeStart =
                                        displayRange !== null &&
                                        isSameDay(date, displayRange.start);
                                    const rangeEnd =
                                        displayRange !== null &&
                                        isSameDay(date, displayRange.end);
                                    const inBand =
                                        displayRange !== null &&
                                        dayKey(date) >= dayKey(displayRange.start) &&
                                        dayKey(date) <= dayKey(displayRange.end);
                                    const isEndpoint = rangeStart || rangeEnd;
                                    const isMiddle = inBand && !isEndpoint;

                                    const isTabbable = isSameDay(date, tabbableDate);
                                    const isFocused =
                                        isSameDay(date, focusedDate) &&
                                        isSameMonth(date, visibleMonth);

                                    const label = `${WEEKDAY_NAMES[date.getDay()]}, ${
                                        MONTH_NAMES[date.getMonth()]
                                    } ${date.getDate()}, ${date.getFullYear()}${
                                        isEndpoint ? ' selected' : ''
                                    }`;

                                    return (
                                        <td
                                            key={toISO(date)}
                                            role="gridcell"
                                            aria-selected={inBand || undefined}
                                            className={cn(
                                                styles.cell,
                                                rangeStart &&
                                                    !rangeEnd &&
                                                    styles.firstInRange,
                                                rangeEnd &&
                                                    !rangeStart &&
                                                    styles.lastInRange,
                                            )}
                                        >
                                            <span
                                                role="button"
                                                tabIndex={isTabbable ? 0 : -1}
                                                aria-label={label}
                                                aria-disabled={disabled || undefined}
                                                data-date={toISO(date)}
                                                data-testid={`calendar/cell/date-${date.getDate()}`}
                                                className={cn(
                                                    styles.day,
                                                    weekend && styles.weekend,
                                                    outside && styles.outsideMonth,
                                                    isMiddle && styles.inRange,
                                                    isToday &&
                                                        !isEndpoint &&
                                                        styles.highlight,
                                                    isEndpoint && styles.selected,
                                                    disabled && styles.disabled,
                                                    isFocused && styles.focused,
                                                )}
                                                onClick={() =>
                                                    !disabled && selectDate(date)
                                                }
                                                onPointerEnter={() => {
                                                    if (anchor !== null && !disabled) {
                                                        setHoverDate(date);
                                                    }
                                                }}
                                            >
                                                {date.getDate()}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    },
);

Calendar.displayName = 'Calendar';

export { Calendar };
