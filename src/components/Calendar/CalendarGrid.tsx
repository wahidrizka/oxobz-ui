'use client';

import { forwardRef, useEffect, useId, useMemo, useRef, type HTMLAttributes } from 'react';
import {
    useButton,
    useCalendarGrid,
    useDateFormatter,
    useLocale,
    usePress,
    useRangeCalendar,
} from 'react-aria';
import type { AriaButtonProps } from 'react-aria';
import { useRangeCalendarState } from 'react-stately';
import {
    CalendarDate,
    createCalendar,
    getWeeksInMonth,
    isSameDay,
    isToday as isTodayIntl,
    type DateValue as IntlDateValue,
} from '@internationalized/date';
import { ChevronLeft, ChevronRight } from '@oxobz/icons';
import { Button } from '../Button';
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
    /**
     * Move focus onto a day cell as soon as the grid mounts.
     *
     * Production does this inside the popover: opening it puts the focus ring
     * on today's cell straight away, which is also what makes the arrow keys
     * work without clicking first.
     */
    autoFocus?: boolean;
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

/*
 * A single date cell.
 *
 * Production does NOT use react-aria's `useCalendarCell`. Proven across 15
 * published @react-aria/calendar releases (3.0-3.10): every one emits the range
 * prompt as a hidden `useDescription` <div> in the document body and only sets
 * `aria-selected` when a date is actually selected. Production's DOM differs on
 * all three points: `aria-selected` is ALWAYS on the <td> ("true"/"false"), the
 * range prompt is appended to the focused cell's own aria-label (no body <div>),
 * and adjacent-month days stay selectable. So the cell is built directly on
 * `usePress` + the react-stately state, mirroring useCalendarCell's behaviour
 * while producing production's exact DOM. The press handlers are ported from
 * useCalendarCell so range selection, dragging, and keyboard behave the same.
 */
const RANGE_START_PROMPT = 'Click to start selecting date range';
const RANGE_FINISH_PROMPT = 'Click to finish selecting date range';

function Cell({
    state,
    date,
    minValue,
    maxValue,
    calendarDisabled,
}: {
    state: CalendarState;
    date: CalendarDate;
    minValue?: CalendarDate;
    maxValue?: CalendarDate;
    calendarDisabled?: boolean;
}) {
    const ref = useRef<HTMLSpanElement>(null);

    const dateFormatter = useDateFormatter({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: state.timeZone,
    });
    const nativeDate = useMemo(() => date.toDate(state.timeZone), [date, state.timeZone]);

    /*
     * Production only disables cells truly out of range (min/max) or flagged
     * unavailable; adjacent-month days stay selectable, unlike react-aria's
     * default which disables everything outside the visible month.
     */
    const isUnavailable = state.isCellUnavailable(date);
    const outOfRange =
        (minValue != null && date.compare(minValue) < 0) ||
        (maxValue != null && date.compare(maxValue) > 0);
    const isDisabled = Boolean(calendarDisabled) || isUnavailable || outOfRange;
    const isSelectable = !isDisabled;
    const isSelected = state.isSelected(date) && isSelectable;
    const isFocused = state.isCellFocused(date);
    const isTodayCell = isTodayIntl(date, state.timeZone);
    const isOutsideVisibleRange =
        date.compare(state.visibleRange.start) < 0 || date.compare(state.visibleRange.end) > 0;

    const range = state.highlightedRange;
    const isStart = !!range && date.compare(range.start) === 0;
    const isEnd = !!range && date.compare(range.end) === 0;
    const isEndpoint = isStart || isEnd;
    const isMiddle = isSelected && !isEndpoint;
    const dow = toDate(date).getDay();
    const isWeekend = dow === 0 || dow === 6;

    /* aria-label mirrors useCalendarCell, except the range prompt is appended
       inline (production) instead of living in a hidden body <div>. */
    let label = dateFormatter.format(nativeDate);
    if (isTodayCell) label = `Today, ${label}`;
    else if (isSelected) label = `${label} selected`;
    if (isFocused && !state.isReadOnly && isSelectable) {
        label += state.anchorDate ? ` (${RANGE_FINISH_PROMPT})` : ` (${RANGE_START_PROMPT})`;
    }

    const isAnchorPressed = useRef(false);
    const isRangeBoundaryPressed = useRef(false);
    const touchDragTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    /*
     * Press handlers ported verbatim from react-aria's useCalendarCell so range
     * selection, dragging, keyboard, and touch behave identically. The mouse /
     * touch branch only runs on the FIRST press of a range (`!anchorDate`); the
     * second press and keyboard / virtual (click) presses are completed in
     * onPressUp. Doing the mouse selection here but the virtual selection there
     * is what keeps a single click from selecting twice.
     */
    const { pressProps } = usePress({
        shouldCancelOnPointerExit: !!state.anchorDate,
        preventFocusOnPress: true,
        isDisabled: !isSelectable || state.isReadOnly,
        onPressStart(e) {
            if (state.isReadOnly) {
                state.setFocusedDate(date);
                state.setFocused(true);
                return;
            }
            if (
                !state.anchorDate &&
                (e.pointerType === 'mouse' || e.pointerType === 'touch')
            ) {
                // Dragging the start or end of an existing range modifies it
                // rather than starting a new selection.
                if (state.highlightedRange) {
                    if (isSameDay(date, state.highlightedRange.start)) {
                        state.setAnchorDate(state.highlightedRange.end);
                        state.setFocusedDate(date);
                        state.setFocused(true);
                        state.setDragging(true);
                        isRangeBoundaryPressed.current = true;
                        return;
                    }
                    if (isSameDay(date, state.highlightedRange.end)) {
                        state.setAnchorDate(state.highlightedRange.start);
                        state.setFocusedDate(date);
                        state.setFocused(true);
                        state.setDragging(true);
                        isRangeBoundaryPressed.current = true;
                        return;
                    }
                }
                const startDragging = () => {
                    state.setDragging(true);
                    touchDragTimer.current = undefined;
                    state.selectDate(date);
                    state.setFocusedDate(date);
                    state.setFocused(true);
                    isAnchorPressed.current = true;
                };
                // On touch, delay to tell a tap from a scroll.
                if (e.pointerType === 'touch') {
                    touchDragTimer.current = setTimeout(startDragging, 200);
                } else {
                    startDragging();
                }
            }
        },
        onPressEnd() {
            isRangeBoundaryPressed.current = false;
            isAnchorPressed.current = false;
            clearTimeout(touchDragTimer.current);
            touchDragTimer.current = undefined;
        },
        onPressUp(e) {
            if (state.isReadOnly) return;
            // Quick touch tap before the drag timer fired: select on touch up.
            if (state.anchorDate && touchDragTimer.current) {
                state.selectDate(date);
                state.setFocusedDate(date);
                state.setFocused(true);
            }
            if (isRangeBoundaryPressed.current) {
                state.setAnchorDate(date);
            } else if (state.anchorDate && !isAnchorPressed.current) {
                state.selectDate(date);
                state.setFocusedDate(date);
                state.setFocused(true);
            } else if (e.pointerType === 'keyboard' && !state.anchorDate) {
                state.selectDate(date);
                state.focusNearestAvailableDate(date);
            } else if (e.pointerType === 'virtual') {
                state.selectDate(date);
                state.setFocusedDate(date);
                state.setFocused(true);
            }
        },
    });

    useEffect(() => {
        if (isFocused && ref.current) ref.current.focus();
    }, [isFocused]);

    const tabIndex = isDisabled ? undefined : isSameDay(date, state.focusedDate) ? 0 : -1;

    return (
        <td
            role="gridcell"
            aria-selected={isSelected ? 'true' : 'false'}
            aria-disabled={!isSelectable || undefined}
            className={cn(
                styles.cell,
                isStart && !isEnd && styles.firstInRange,
                isEnd && !isStart && styles.lastInRange,
            )}
        >
            <span
                {...pressProps}
                ref={ref}
                role="button"
                tabIndex={tabIndex}
                aria-label={label}
                aria-disabled={!isSelectable || undefined}
                data-react-aria-pressable="true"
                data-testid={`calendar/cell/date-${date.day}`}
                onFocus={() => {
                    if (!isDisabled) {
                        state.setFocusedDate(date);
                        state.setFocused(true);
                    }
                }}
                onPointerEnter={() => {
                    if (isSelectable) state.highlightDate(date);
                }}
                className={cn(
                    styles.day,
                    isWeekend && styles.weekend,
                    isOutsideVisibleRange && styles.outsideMonth,
                    isMiddle && styles.inRange,
                    isTodayCell && !isEndpoint && styles.highlight,
                    isEndpoint && styles.selected,
                    isDisabled && styles.disabled,
                )}
            >
                {String(date.day)}
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
    /*
     * useButton menyetel type="button"; produksi memakai type="submit" (bawaan
     * Button Geist). type dilepas di sini agar `typeName="submit"` yang dipakai.
     */
    const { buttonProps: rawButtonProps } = useButton(props, ref);
    const { type: _navType, ...buttonProps } = rawButtonProps;
    /*
     * Ini komponen Button, bukan <button> polos. Produksi memakainya dengan
     * `type="unstyled" shape="circle" svgOnly`, dan ukurannya lahir dari
     * isinya: ikon + 12px (padding span isi) + 4px (padding tombol). Panah
     * kiri berikon 14px jadi 30x30, panah kanan berikon 16px jadi 32x32.
     * Tombol polos setinggi 24px membuat seluruh isi popover naik 8px.
     */
    return (
        <Button
            {...buttonProps}
            ref={ref}
            typeName="submit"
            variant="unstyled"
            shape="circle"
            svgOnly
            aria-label={label}
            className={className}
        >
            {children}
        </Button>
    );
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
            autoFocus,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const { locale } = useLocale();
        const firstDayOfWeek = WEEK_START[weekStartsOn];
        const gridLabelId = useId();
        const captionId = useId();
        const minCal = minValue ? toCal(minValue) : undefined;
        const maxCal = maxValue ? toCal(maxValue) : undefined;

        const state = useRangeCalendarState({
            locale,
            createCalendar,
            autoFocus,
            firstDayOfWeek,
            isDisabled,
            value: value === undefined ? undefined : toCalRange(value),
            defaultValue: toCalRange(defaultValue),
            minValue: minCal,
            maxValue: maxCal,
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
                /*
                 * react-aria menyetel role="application" lewat calendarProps.
                 * Produksi TIDAK memakainya: seluruh popover-nya hanya punya
                 * peran grid, gridcell, dan button. Jadi peran itu dilepas
                 * supaya pohon aksesibilitasnya sama.
                 */
                role={undefined}
                /*
                 * Produksi: pembungkus kisi POLOS, tanpa class dan tanpa id
                 * (react-aria memberi id lewat calendarProps, jadi dilepas).
                 * `position:relative` tak diperlukan: cincin/band jangkar ke sel.
                 */
                id={undefined}
                aria-label={undefined}
                className={className}
                data-disabled={isDisabled || undefined}
            >
                <div className={styles.header} style={{ margin: '-3px 0' }}>
                    {/* Produksi memberi pembungkus judul gaya inline tanpa kelas. */}
                    <div
                        style={{
                            overflow: 'hidden',
                            marginLeft: '-16px',
                            paddingLeft: '16px',
                            flex: '1 1 0%',
                        }}
                    >
                        <h2
                            id={gridLabelId}
                            className={styles.currentMonth}
                            style={{ whiteSpace: 'nowrap', opacity: 1, transform: 'none' }}
                        >
                            {title}
                        </h2>
                    </div>
                    {/*
                     * Ukuran ikon kedua panah SENGAJA berbeda, persis produksi:
                     * kiri 14px (kelas `size-(--ds-control-decoration-size)`),
                     * kanan 16px tanpa kelas itu, plus digeser 1px ke kanan.
                     */}
                    <NavButton
                        {...prevButtonProps}
                        label="Previous"
                        className={cn(styles.caretButton, styles.caretButtonPrev)}
                    >
                        <ChevronLeft
                            size={16}
                            className={styles.navIconPrev}
                            style={{ transform: 'translateX(0)' }}
                        />
                    </NavButton>
                    <NavButton {...nextButtonProps} label="Next" className={styles.caretButton}>
                        <ChevronRight
                            size={16}
                            className={styles.navIcon}
                            style={{ transform: 'translateX(1px)' }}
                        />
                    </NavButton>
                </div>

                {/* Pemisah 8px; produksi memakai <span class="h-2 block"> di sini. */}
                <span aria-hidden="true" className={styles.headerSpacer} />

                {/*
                 * Produksi memberi label grid lewat `aria-labelledby` ke judul
                 * bulan (H2), bukan `aria-label`+`id` seperti default react-aria.
                 * Jadi aria-label dan id bawaan gridProps dilepas dan diganti
                 * labelledby ke H2.
                 */}
                <table
                    {...gridProps}
                    aria-label={undefined}
                    aria-labelledby={gridLabelId}
                    id={undefined}
                    className={styles.table}
                >
                    <caption id={captionId} className="oxobz-sr-only" />
                    {/* Produksi tak menaruh aria-hidden di thead (react-aria menaruhnya). */}
                    <thead {...headerProps} aria-hidden={undefined} className={styles.thead}>
                        <tr className={styles.row}>
                            {weekDays.map((day, i) => (
                                <th key={i} abbr={longWeekDays[i]} className={styles.weekday}>
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody
                        className={styles.tbody}
                        style={{ opacity: 1, transform: 'none' }}
                    >
                        {weeks.map((weekIndex) => (
                            <tr key={weekIndex} className={styles.row}>
                                {state
                                    .getDatesInWeek(weekIndex)
                                    .map((date, i) =>
                                        date ? (
                                            <Cell
                                                key={date.toString()}
                                                state={state}
                                                date={date as CalendarDate}
                                                minValue={minCal}
                                                maxValue={maxCal}
                                                calendarDisabled={isDisabled}
                                            />
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
