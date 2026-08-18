'use client';

import { forwardRef, useMemo, useRef, type HTMLAttributes } from 'react';
import { useButton, useCalendarCell, useCalendarGrid, useLocale, useRangeCalendar } from 'react-aria';
import type { AriaButtonProps } from 'react-aria';
import { useRangeCalendarState } from 'react-stately';
import {
    CalendarDate,
    createCalendar,
    getWeeksInMonth,
    type DateValue as IntlDateValue,
} from '@internationalized/date';
import { ChevronLeft, ChevronRight } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './CalendarGrid.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * A single date value.
 *
 * Production builds Calendar on `@internationalized/date`, and this component
 * now does the same internally. The PUBLIC prop type stays a native `Date` so
 * the surrounding Calendar chrome (its text inputs, presets and timezone
 * select) keeps working unchanged; conversion happens at this boundary only.
 * Day-granularity maths is exactly what `CalendarDate` is for, so nothing is
 * lost here. Migrating the outer Calendar to zoned types is tracked separately
 * in tasks/todo.md.
 */
export type DateValue = Date;

/** Inclusive `{ start, end }` range, mirroring `RangeValue<DateValue>` from Geist. */
export interface RangeValue<T> {
    start: T;
    end: T;
}

/** Grid size (`large` default or `small`), matching Geist. */
export type CalendarGridSize = 'large' | 'small';

/** 0 = Sunday … 6 = Saturday. */
export type WeekDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CalendarGridProps
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
    size?: CalendarGridSize;
    /** First day of the week. Default 0 (Sunday), matching production. */
    weekStartsOn?: WeekDayIndex;
    /** Month rendered first when uncontrolled and no value is set. */
    defaultFocusedMonth?: DateValue;
    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Date <-> CalendarDate bridge                                       */
/* ------------------------------------------------------------------ */

const toCal = (d: Date): CalendarDate =>
    new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());

const toDate = (d: IntlDateValue): Date => new Date(d.year, d.month - 1, d.day);

const toCalRange = (r: RangeValue<Date> | null | undefined) =>
    r ? { start: toCal(r.start), end: toCal(r.end) } : null;

/** react-aria takes the week start as a weekday code, not a number. */
const WEEK_START = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/* ------------------------------------------------------------------ */
/*  Cell                                                               */
/* ------------------------------------------------------------------ */

type CalendarState = ReturnType<typeof useRangeCalendarState>;

function Cell({ state, date }: { state: CalendarState; date: CalendarDate }) {
    const ref = useRef<HTMLSpanElement>(null);
    const { cellProps, buttonProps, isSelected, isDisabled, isUnavailable, isOutsideVisibleRange, formattedDate } =
        useCalendarCell({ date }, state, ref);

    const range = state.highlightedRange;
    const isStart = !!range && date.compare(range.start) === 0;
    const isEnd = !!range && date.compare(range.end) === 0;
    const isEndpoint = isStart || isEnd;
    const isMiddle = isSelected && !isEndpoint;

    const dow = toDate(date).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isToday = isSameAsToday(date);
    const blocked = isDisabled || isUnavailable;

    return (
        <td
            {...cellProps}
            className={cn(
                styles.cell,
                isStart && !isEnd && styles.firstInRange,
                isEnd && !isStart && styles.lastInRange,
            )}
        >
            <span
                {...buttonProps}
                ref={ref}
                data-date={date.toString()}
                data-testid={`calendar/cell/date-${date.day}`}
                className={cn(
                    styles.day,
                    isWeekend && styles.weekend,
                    isOutsideVisibleRange && styles.outsideMonth,
                    isMiddle && styles.inRange,
                    isToday && !isEndpoint && styles.highlight,
                    isEndpoint && styles.selected,
                    blocked && styles.disabled,
                )}
            >
                {formattedDate}
            </span>
        </td>
    );
}

/**
 * Tombol navigasi bulan.
 *
 * `useRangeCalendar` mengembalikan prop untuk `useButton`, BUKAN atribut DOM:
 * isinya `onPress` dan `isDisabled`, bukan `onClick` dan `disabled`. Menyebarnya
 * langsung ke <button> membuat tombolnya diam saja dan tidak pernah nonaktif.
 * Jadi props itu harus dilewatkan dulu lewat useButton.
 */
function NavButton({
    label,
    className,
    children,
    ...props
}: AriaButtonProps<'button'> & { label: string; className?: string; children: React.ReactNode }) {
    const ref = useRef<HTMLButtonElement>(null);
    const { buttonProps } = useButton(props, ref);
    return (
        <button {...buttonProps} ref={ref} type="button" aria-label={label} className={className}>
            {children}
        </button>
    );
}

/** Today in the local zone, compared at day granularity. */
function isSameAsToday(date: CalendarDate): boolean {
    const n = new Date();
    return date.year === n.getFullYear() && date.month === n.getMonth() + 1 && date.day === n.getDate();
}

/* ------------------------------------------------------------------ */
/*  Grid                                                               */
/* ------------------------------------------------------------------ */

/**
 * The month grid.
 *
 * Rebuilt on react-aria (18 Aug 2026). Production's own calendar is built on
 * the same hooks, proven from the live DOM: the table carries `role="grid"`
 * and `aria-multiselectable`, every cell is a `role="gridcell"` wrapping a
 * `role="button"` with a full-date aria-label, and the month heading and the
 * Previous / Next buttons all carry react-aria generated ids and
 * `data-react-aria-pressable`.
 *
 * What that buys over the hand-rolled version this replaces: real keyboard
 * navigation (arrows, page up/down, home/end), correct focus management,
 * screen-reader announcements, and date arithmetic that does not drift across
 * daylight-saving boundaries.
 *
 * Rendered shape, unchanged from before so the stylesheet still applies:
 *   <div class="contentWrapper">
 *     <div class="header">
 *       <div class="monthTitleWrap"><h2 class="currentMonth">July 2026</h2></div>
 *       <button class="caretButton" aria-label="Previous">…</button>
 *       <button class="caretButton" aria-label="Next">…</button>
 *     </div>
 *     <table role="grid" aria-multiselectable="true">
 *       <caption class="oxobz-sr-only" />
 *       <thead><tr><th abbr="Sunday">S</th>…</tr></thead>
 *       <tbody>…</tbody>
 */
const CalendarGrid = forwardRef<HTMLDivElement, CalendarGridProps>(
    (
        {
            value,
            defaultValue,
            onChange,
            minValue,
            maxValue,
            isDateUnavailable,
            isDisabled,
            size = 'large',
            weekStartsOn = 0,
            defaultFocusedMonth,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const { locale } = useLocale();
        const firstDayOfWeek = WEEK_START[weekStartsOn];

        const state = useRangeCalendarState({
            locale,
            createCalendar,
            firstDayOfWeek,
            isDisabled,
            value: value === undefined ? undefined : toCalRange(value),
            defaultValue: toCalRange(defaultValue),
            minValue: minValue ? toCal(minValue) : undefined,
            maxValue: maxValue ? toCal(maxValue) : undefined,
            isDateUnavailable: isDateUnavailable
                ? (d: IntlDateValue) => isDateUnavailable(toDate(d))
                : undefined,
            defaultFocusedValue: defaultFocusedMonth ? toCal(defaultFocusedMonth) : undefined,
            onChange: onChange
                ? (r) => onChange({ start: toDate(r.start), end: toDate(r.end) })
                : undefined,
        });

        const localRef = useRef<HTMLDivElement>(null);
        const { calendarProps, prevButtonProps, nextButtonProps, title } = useRangeCalendar(
            { isDisabled },
            state,
            localRef,
        );
        const { gridProps, headerProps, weekDays } = useCalendarGrid({ firstDayOfWeek }, state);

        const weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale, firstDayOfWeek);
        const weeks = useMemo(() => [...new Array(weeksInMonth).keys()], [weeksInMonth]);

        /*
         * react-aria hanya memberi nama hari versi pendek ("S", "M", …).
         * Produksi juga menaruh nama panjangnya di atribut `abbr` supaya
         * pembaca layar menyebut "Sunday", bukan huruf "S", jadi nama panjang
         * itu dihitung dari tanggal-tanggal minggu pertama.
         */
        const longWeekDays = useMemo(() => {
            const fmt = new Intl.DateTimeFormat(locale, { weekday: 'long' });
            return state
                .getDatesInWeek(0)
                .map((d) => (d ? fmt.format(toDate(d)) : ''));
        }, [locale, state]);

        return (
            <div
                {...calendarProps}
                {...rest}
                ref={(node) => {
                    localRef.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
                }}
                className={cn(styles.contentWrapper, className)}
                data-oxobz-calendar=""
                data-version={dataVersion}
                data-size={size}
                data-disabled={isDisabled || undefined}
            >
                <div className={styles.header}>
                    <div className={styles.monthTitleWrap}>
                        <h2 className={styles.currentMonth}>{title}</h2>
                    </div>
                    <NavButton {...prevButtonProps} label="Previous" className={styles.caretButton}>
                        <ChevronLeft size={16} />
                    </NavButton>
                    <NavButton {...nextButtonProps} label="Next" className={styles.caretButton}>
                        <ChevronRight size={16} />
                    </NavButton>
                </div>

                <table {...gridProps} className={styles.table}>
                    <caption className="oxobz-sr-only" />
                    <thead {...headerProps}>
                        <tr>
                            {weekDays.map((day, i) => (
                                <th key={i} abbr={longWeekDays[i]} scope="col" className={styles.weekday}>
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((weekIndex) => (
                            <tr key={weekIndex}>
                                {state
                                    .getDatesInWeek(weekIndex)
                                    .map((date, i) =>
                                        date ? (
                                            <Cell key={date.toString()} state={state} date={date as CalendarDate} />
                                        ) : (
                                            <td key={i} />
                                        ),
                                    )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    },
);

CalendarGrid.displayName = 'CalendarGrid';

export { CalendarGrid };
