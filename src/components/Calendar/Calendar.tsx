'use client';

import {
    forwardRef,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type HTMLAttributes,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { DateTime } from 'luxon';
import * as Popover from '@radix-ui/react-popover';
import { Skeleton } from '../Skeleton';
import { Command } from 'cmdk';
import { Drawer } from '@base-ui/react';
import { Calendar as CalendarIcon, ChevronDown, Cross } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';
import { CalendarGrid, type DateValue, type RangeValue, type WeekDayIndex } from './CalendarGrid';
import styles from './Calendar.module.css';

/**
 * Di layar sempit produksi tidak memakai popover melainkan drawer yang muncul
 * dari bawah dan bisa digeser untuk ditutup.
 *
 * Ambangnya DIUKUR, bukan diambil dari angka bawaan Tailwind: halaman live
 * membuka drawer pada lebar 600px dan popover pada 601px, jadi batasnya
 * `max-width: 600px`.
 */
const DRAWER_QUERY = '(max-width: 600px)';

function useIsSmallScreen(): boolean {
    const [kecil, setKecil] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia(DRAWER_QUERY);
        const perbarui = () => setKecil(mq.matches);
        perbarui();
        mq.addEventListener('change', perbarui);
        return () => mq.removeEventListener('change', perbarui);
    }, []);

    // Awalnya selalu false supaya render di server dan render pertama di
    // browser sama persis; media query baru dibaca setelah komponen terpasang.
    return kecil;
}

/*
 * Kunci gulir halaman saat drawer mobile terbuka.
 *
 * Base UI Drawer dengan modal="trap-focus" TIDAK mengunci gulir (di Base UI,
 * scroll-lock hanya jalan saat modal===true). Produksi Geist memakai util
 * scroll-lock TERPISAH di atas Base UI Drawer. Diambil apa adanya dari bundel
 * produksi (chunk 2h38obwtw-sfa.js), sebuah pengunci ber-hitung-acuan yang saat
 * mengunci menulis ke <html>: overflow:clip, border-right:<lebar scrollbar>px
 * solid transparent, dan scrollbar-width:none (menghapus gutter sehingga konten
 * melebar dari 360 ke 375), serta ke <body>: overflow:clip. Semua nilai inline
 * sebelumnya disimpan dan dikembalikan saat membuka kunci. Hitung-acuan memakai
 * modul supaya beberapa drawer di satu halaman tidak saling menimpa.
 */
let scrollLockCount = 0;
let savedBodyOverflow = '';
let savedHtmlOverflow = '';
let savedHtmlBorderRight = '';
let savedHtmlScrollbarWidth = '';

function useDrawerScrollLock(active: boolean): void {
    useEffect(() => {
        if (!active) return;
        if (scrollLockCount === 0) {
            const html = document.documentElement;
            const body = document.body;
            savedBodyOverflow = body.style.overflow;
            savedHtmlOverflow = html.style.overflow;
            savedHtmlBorderRight = html.style.borderRight;
            savedHtmlScrollbarWidth = html.style.getPropertyValue('scrollbar-width');
            const scrollbarWidth = window.innerWidth - html.clientWidth;
            body.style.overflow = 'clip';
            html.style.overflow = 'clip';
            html.style.borderRight = `${scrollbarWidth}px solid transparent`;
            html.style.setProperty('scrollbar-width', 'none');
        }
        scrollLockCount += 1;

        return () => {
            scrollLockCount -= 1;
            if (scrollLockCount === 0) {
                const html = document.documentElement;
                const body = document.body;
                body.style.overflow = savedBodyOverflow;
                html.style.overflow = savedHtmlOverflow;
                html.style.borderRight = savedHtmlBorderRight;
                html.style.setProperty('scrollbar-width', savedHtmlScrollbarWidth);
            }
        };
    }, [active]);
}

export type { DateValue, RangeValue, WeekDayIndex };

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Trigger size — `medium` (default) or `small`, mirroring Geist's form sizes. */
export type CalendarSize = 'medium' | 'small';

/** A single named preset range entry (see {@link CalendarPresets}). */
export interface CalendarPresetEntry {
    /** Title Case label shown in the preset listbox, e.g. `"Last 7 Days"`. */
    text: string;
    /** Range start applied when the preset is picked. */
    start: Date;
    /** Range end applied when the preset is picked. */
    end: Date;
}

/**
 * Named preset ranges keyed by a stable id (e.g. `"last-7-days"`); the
 * preset listbox displays them in the object's insertion order. Matches the
 * shape verified in the Geist docs source:
 * ```ts
 * const presets = {
 *   'last-7-days': { text: 'Last 7 Days', start: ..., end: ... },
 *   ...
 * };
 * ```
 */
export type CalendarPresets = Record<string, CalendarPresetEntry>;

export interface CalendarProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /** Controlled selected range. Pass `null` for an empty selection. */
    value?: RangeValue<DateValue> | null;
    /** Fired with the completed range when the grid commits a selection. */
    onChange?: (value: RangeValue<DateValue>) => void;

    /** Trigger size. Default `"medium"`. */
    size?: CalendarSize;
    /** Disable the trigger and the whole calendar. */
    disabled?: boolean;

    /** Earliest selectable date (inclusive), forwarded to the grid. */
    minValue?: DateValue;
    /** Latest selectable date (inclusive), forwarded to the grid. */
    maxValue?: DateValue;
    /** Mark individual days unavailable, forwarded to the grid. */
    isDateUnavailable?: (date: DateValue) => boolean;
    /** First day of the week, forwarded to the grid. Default 0 (Sunday). */
    weekStartsOn?: WeekDayIndex;

    /** Preset ranges. When provided, a preset combobox is rendered next to the trigger. */
    presets?: CalendarPresets;
    /**
     * Index into the preset entries (in `presets` insertion order) applied as
     * the initial range when the calendar is uncontrolled (`value` left
     * undefined). Applied once, as the initial selection — not re-applied on
     * later prop changes.
     */
    presetIndex?: number;

    /** Compact layout: preset combobox and trigger share one row (button rounded-left). */
    /**
     * Show the loading placeholder instead of the trigger. Default `false`.
     *
     * Production always renders the trigger inside a Skeleton and passes this
     * prop straight through as its `show`, so the wrapper element exists in
     * every state, loading or not.
     */
    skeleton?: boolean;
    compact?: boolean;
    /** Stacked layout: preset combobox on top, trigger below. */
    stacked?: boolean;
    /**
     * Align the input column horizontally beside the grid inside the popover
     * (Geist `horizontalLayout`).
     */
    horizontalLayout?: boolean;

    /** Show per-endpoint time inputs (HH:MM) next to the date inputs. Default `true`. */
    showTimeInput?: boolean;
    /**
     * Lock the timezone control to a fixed IANA zone, shown as read-only text
     * instead of the built-in select (Geist `pinnedTimezone`).
     */
    pinnedTimezone?: string;
    /**
     * Popover placement relative to the trigger (mirrors Radix's `align`,
     * reflected as `data-align` in the Geist snapshot). Only `"start"`
     * (default) and `"center"` are evidenced — no other value observed.
     */
    popoverAlignment?: 'start' | 'center';

    /** Render a clear button that empties the selection. */
    allowClear?: boolean;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const MONTH_ABBR = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
] as const;

/**
 * Trigger label when no range is selected. Hardcoded (verified: appears
 * verbatim throughout calendar-open.html) — Geist does not expose a
 * `placeholder` prop for it.
 */
const TRIGGER_PLACEHOLDER = 'Select Date Range';

/**
 * `"Jul 4, 2026"` — the date-input display format. The snapshot's committed
 * values carry NO leading zero on the day (`value="Jul 18, 2026"`, and the
 * user-visible `Jul 4, 2026`); only the static *placeholder* text is the
 * zero-padded `"Jan 01, 2025"`.
 */
function formatDate(date: Date): string {
    return `${MONTH_ABBR[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * A bare time of day for the time inputs when there is no range yet, using
 * the same shape as {@link formatTimeInZone} (2-digit, clock style from the
 * locale) so the two never disagree. No zone is applied because there is no
 * instant to convert, only an hour and a minute.
 *
 * Production always has a value here, so this fallback has no counterpart to
 * compare against.
 */
function formatTime(hours: number, minutes: number): string {
    try {
        return new Intl.DateTimeFormat(navigator.language, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: prefersTwelveHourClock(),
            numberingSystem: 'latn',
        }).format(new Date(2000, 0, 1, hours, minutes));
    } catch {
        return `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`;
    }
}

/**
 * Time of day as the *trigger label* writes it, which is not the same shape
 * as the time inputs.
 *
 * Measured on the live Geist docs in two locales:
 * - en-US  → `2:14am - 11:59pm`  (no leading zero, no space, lowercase)
 * - id-ID  → `12.45 - 23.59`     (24-hour, dot separator, no marker)
 *
 * One rule covers both: format with `hour: 'numeric'` and `minute: '2-digit'`
 * letting the locale pick the clock, then strip whitespace and lowercase.
 */
function formatRangeTime(date: Date): string {
    try {
        return new Intl.DateTimeFormat(navigator.language, {
            hour: 'numeric',
            minute: '2-digit',
        })
            .format(date)
            .replace(/\s+/g, '')
            .toLowerCase();
    } catch {
        return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
    }
}

/*
 * Date-input grammars, taken from production: exactly two Luxon token
 * formats are accepted, `LLL d, yyyy` ("Aug 18, 2026") and `LLLL d, yyyy`
 * ("August 18, 2026"). Parsing happens in UTC so the calendar-day maths
 * cannot drift, which is what production does too.
 */
const DATE_INPUT_FORMATS = ['LLL d, yyyy', 'LLLL d, yyyy'] as const;

/** The typed date text as a Luxon date, or `null` when it fits no format. */
function parseDateInput(text: string): DateTime | null {
    for (const format of DATE_INPUT_FORMATS) {
        const parsed = DateTime.fromFormat(text, format, { zone: 'UTC' });
        if (parsed.isValid) return parsed;
    }
    return null;
}

/**
 * Wording production shows when an input cannot be used. Kept in one place so
 * the strings stay verbatim.
 */
const ERROR_TEXT = {
    dateFormat: 'Invalid date format',
    timeFormat: 'Invalid time format',
    time: 'Invalid time',
    outOfRange: 'Outside of allowed range',
    startAfterEnd: 'Start date cannot be after end date',
    endBeforeStart: 'End time must be after start time',
} as const;

/** Seconds and milliseconds dropped, as production does before comparing. */
function toMinutePrecision(date: Date): Date {
    const copy = new Date(date);
    copy.setSeconds(0, 0);
    return copy;
}

/**
 * Typed date text plus typed time text, resolved into a real instant in the
 * chosen zone. Mirrors production: the date is read as a plain calendar day,
 * the time is layered on top inside that zone, and the result comes back as a
 * normal `Date`.
 */
function combineDateAndTime(
    dateText: string,
    timeText: string,
    timeZone: string,
): Date | null {
    const isoDate = parseDateInput(dateText)?.toISODate();
    if (!isoDate) return null;
    const parts = parseTimeParts(timeText);
    if (!parts) return null;
    const combined = DateTime.fromISO(isoDate, { zone: timeZone }).set({
        hour: parts[0],
        minute: parts[1],
        second: 0,
        millisecond: 0,
    });
    if (!combined.isValid) return null;
    return combined.toJSDate();
}

/*
 * Time-input grammars, copied from production: whitespace is stripped, the
 * text is lowercased, and an am/pm marker decides which pattern applies.
 *
 * One deliberate widening: production matches the `:` separator only, while
 * the value it renders comes from `Intl` and therefore uses `.` in locales
 * such as id-ID ("23.59"). Accepting both keeps Apply working there. Every
 * string production accepts is still accepted, unchanged.
 */
const TIME_12H =
    /^(?<hours>0?[0-9]|1[0-2])[:.](?<minutes>[0-5][0-9])(?<period>am|pm)$/i;
const TIME_24H = /^(?<hours>0?[0-9]|1[0-9]|2[0-3])[:.](?<minutes>[0-5][0-9])$/;

/**
 * Parse a time-input string into `[hours, minutes]` in 24-hour form, or
 * `null` when malformed / out of range. Handles both the 12-hour text the
 * viewer's locale may produce ("1:00PM", "12:00 AM") and 24-hour text.
 */
function parseTimeParts(value: string): [number, number] | null {
    const text = value.replace(/\s+/g, '').toLowerCase();
    const twelveHour = /am|pm/.test(text);
    const match = (twelveHour ? TIME_12H : TIME_24H).exec(text);
    if (!match?.groups) return null;
    let hours = Number.parseInt(match.groups.hours, 10);
    const minutes = Number.parseInt(match.groups.minutes, 10);
    if (twelveHour) {
        const isPm = match.groups.period?.toLowerCase() === 'pm';
        if (hours === 12) hours = isPm ? 12 : 0;
        else if (isPm) hours += 12;
    }
    return [hours, minutes];
}

/**
 * Does the viewer's locale use a 12-hour clock?
 *
 * Reproduces production byte for byte: format 13:00 with `hour12` left
 * undefined so the locale decides, then look for a PM marker in the result.
 * Production uses the outcome for both the time-input placeholder and the
 * `hour12` option of the time formatter below.
 *
 * Source: `ua()` in the live Geist bundle (chunk 3waw-tvb0x__9.js).
 */
function prefersTwelveHourClock(): boolean {
    try {
        const sample = new Intl.DateTimeFormat(navigator.language, {
            hour: 'numeric',
            hour12: undefined,
        }).format(new Date(2020, 0, 1, 13, 0, 0));
        return sample.includes('PM') || sample.includes('pm');
    } catch {
        return false;
    }
}

/**
 * The Start/End *time* inputs, rendered in the selected timezone.
 *
 * Verified live against the Geist docs with the browser pinned to
 * Asia/Jakarta (UTC+7): the default range shows `12:00 AM` / `11:59 PM`,
 * switching the select to UTC turns it into `05:00 PM` / `04:59 PM`, and the
 * `pinnedTimezone="America/Los_Angeles"` example shows `10:00 AM` /
 * `09:59 AM`. The *date* inputs stay in the viewer's own zone in all three
 * cases, which is why {@link formatDate} is left alone.
 *
 * Source: `ui()` in the live Geist bundle (chunk 3waw-tvb0x__9.js).
 */
function formatTimeInZone(date: Date, timeZone: string): string {
    try {
        return new Intl.DateTimeFormat(navigator.language, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: prefersTwelveHourClock(),
            timeZone,
            numberingSystem: 'latn',
        }).format(date);
    } catch {
        return '';
    }
}

const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/**
 * Trigger label. Rules observed live on the Geist docs (user-verified):
 * - different days                → `"Jul 4 - 18"` / `"Jul 4 - Aug 2"`
 * - same day, full-day (00:00→23:59) → `"Sun, Jul 19"` (e.g. typing "today")
 * - same day, partial times       → `"12.45 - 23.59"` (locale time range,
 *   e.g. typing "45m")
 */
function formatRangeLabel(range: RangeValue<Date>): string {
    const { start, end } = range;
    if (isSameDay(start, end)) {
        const fullDay =
            start.getHours() === 0 &&
            start.getMinutes() === 0 &&
            end.getHours() === 23 &&
            end.getMinutes() === 59;
        if (fullDay) {
            return `${WEEKDAY_ABBR[start.getDay()]}, ${MONTH_ABBR[start.getMonth()]} ${start.getDate()}`;
        }
        return `${formatRangeTime(start)} - ${formatRangeTime(end)}`;
    }
    const left = `${MONTH_ABBR[start.getMonth()]} ${start.getDate()}`;
    const right =
        start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
            ? `${end.getDate()}`
            : `${MONTH_ABBR[end.getMonth()]} ${end.getDate()}`;
    return `${left} - ${right}`;
}

/**
 * The viewer's IANA timezone, resolved once at module load — backs the
 * built-in timezone select's "Local (...)" option. There is no dependency on
 * a date/timezone library; `Intl` is a JS runtime built-in.
 */
const LOCAL_TIMEZONE: string = (() => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'UTC';
    }
})();

/**
 * The built-in timezone select always offers exactly these two options —
 * verified against the Geist snapshot:
 * `<option value="UTC">UTC</option><option value="Asia/Jakarta">Local (Asia/Jakarta)</option>`
 * (the second option is the *viewer's own* resolved timezone, not a fixed
 * "Asia/Jakarta" — that was simply the capturing machine's zone). There is
 * no `timezones` prop; the list is not customizable.
 */
const TIMEZONE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'UTC', label: 'UTC' },
    { value: LOCAL_TIMEZONE, label: `Local (${LOCAL_TIMEZONE})` },
];

/**
 * The combobox prefix glyph — a clock (circle + hand), NOT the calendar
 * icon: path taken verbatim from the "Select Period" input's prefix SVG in
 * calendar-open.html. No icon in @oxobz/icons matches this path (the
 * existing `Clock` uses different ring/hand geometry), so it is inlined
 * here. TODO: move into @oxobz/icons (new SVG + `npm run generate`) on the
 * next icons release, then swap this for the generated component.
 */
function ClockGlyph({ className }: { className?: string }): React.JSX.Element {
    return (
        <svg
            viewBox="0 0 16 16"
            height={16}
            width={16}
            data-slot="oxobz-icon"
            data-glyph="circular"
            style={{ color: 'var(--ds-gray-700)' }}
            className={className}
        >
            <path
                fill="currentColor"
                d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0m0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13m.75 6.12 1.7 1.28.6.45-.9 1.2-.6-.45-1.9-1.43a1 1 0 0 1-.4-.8V3.5h1.5z"
            />
        </svg>
    );
}

/**
 * Combobox placeholder — hardcoded in production
 * (`placeholder="Select Period"` on every non-compact combobox input).
 */
const COMBOBOX_PLACEHOLDER = 'Select Period';

/** Hint-panel chips, verbatim from the two-column preset dropdown. */
const RELATIVE_CHIPS = ['45m', '12 hours', '10d', '2 weeks', 'last month', 'yesterday', 'today'] as const;
const FIXED_CHIPS = ['Jan 1', 'Jan 1 - Jan 2', '1/1', '1/1 - 1/2'] as const;

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** `"Jan 1"` / `"jan 1"` → a Date in the current year, or null. */
function parseFixedSingle(text: string, now: Date): Date | null {
    const monthDay = /^([a-z]{3,9})\s+(\d{1,2})$/i.exec(text);
    if (monthDay) {
        const monthIndex = MONTH_ABBR.findIndex((m) =>
            monthDay[1].toLowerCase().startsWith(m.toLowerCase()),
        );
        const day = Number(monthDay[2]);
        if (monthIndex >= 0 && day >= 1 && day <= 31) {
            return new Date(now.getFullYear(), monthIndex, day);
        }
        return null;
    }
    const slash = /^(\d{1,2})\/(\d{1,2})$/.exec(text);
    if (slash) {
        const month = Number(slash[1]);
        const day = Number(slash[2]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return new Date(now.getFullYear(), month - 1, day);
        }
    }
    return null;
}

/**
 * Parse the combobox's free-typed period text into a range. Understands the
 * exact families the production hint panel advertises:
 * - relative: `45m`, `12 hours`, `10d`, `2 weeks`, `last month`,
 *   `yesterday`, `today`
 * - fixed: `Jan 1`, `Jan 1 - Jan 2`, `1/1`, `1/1 - 1/2`
 * Returns null for anything else. The RESULTING range semantics (e.g.
 * "45m" = the trailing 45 minutes ending now) are a documented
 * interpretation — the static snapshot proves the chips and input, not the
 * computed dates.
 */
function parsePeriodInput(raw: string, now: Date): RangeValue<Date> | null {
    const text = raw.trim().toLowerCase();
    if (!text) return null;

    if (text === 'today') return { start: startOfDay(now), end: now };
    if (text === 'yesterday') {
        const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        return { start: startOfDay(y), end: endOfDay(y) };
    }
    if (text === 'last month') {
        return {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
        };
    }

    const relative = /^(\d+)\s*(m|min|mins|minutes?|h|hr|hrs|hours?|d|days?|w|weeks?)$/.exec(text);
    if (relative) {
        const amount = Number(relative[1]);
        const unit = relative[2][0];
        const minutes =
            unit === 'm' && !relative[2].startsWith('mo')
                ? amount
                : unit === 'h'
                    ? amount * 60
                    : unit === 'd'
                        ? amount * 60 * 24
                        : amount * 60 * 24 * 7; // w
        return { start: new Date(now.getTime() - minutes * 60_000), end: now };
    }

    const rangeParts = raw.split('-').map((p) => p.trim());
    if (rangeParts.length === 2) {
        const start = parseFixedSingle(rangeParts[0], now);
        const end = parseFixedSingle(rangeParts[1], now);
        if (start && end) return { start: startOfDay(start), end: endOfDay(end) };
        return null;
    }

    const single = parseFixedSingle(raw.trim(), now);
    if (single) return { start: startOfDay(single), end: endOfDay(single) };
    return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Calendar — the trigger + popover "chrome" around the {@link CalendarGrid}
 * month grid: a button (or button + preset combobox) that opens a popover
 * containing the Start/End date (+ time) inputs, a timezone control, and
 * the grid.
 *
 * The grid core is reused verbatim from {@link CalendarGrid}; only the
 * surrounding chrome (trigger, popover, presets, layouts, time/timezone,
 * clear) lives in this file.
 *
 * Note on `isDocsPage`: every example in the Geist docs source passes an
 * `isDocsPage` prop to `<Calendar>`. That is docs-site harness chrome
 * (e.g. stabilizing screenshots), unrelated to the component's real
 * behaviour, and is intentionally NOT part of this API — there is nothing
 * meaningful to replicate for a real consumer.
 *
 * Rendered DOM (mirrors the geistcn snapshots in calendar-open.html):
 * ```html
 * <div data-oxobz-calendar data-version="v1" style="--width: 250px">
 *   <button data-oxobz-button aria-haspopup="dialog" aria-expanded>Select Date Range</button>
 *   <div role="dialog" data-state="open">
 *     <div class="content">
 *       <div class="calendarContentWrapper">
 *         <div class="inputsWrapper">…Start/End date(+time) inputs, timezone…</div>
 *         <CalendarGrid />
 *       </div>
 *     </div>
 *   </div>
 * </div>
 * ```
 * The outer marker is `data-oxobz-calendar` (matches production's
 * `data-geist-calendar`; the earlier `data-oxobz-calendar-popover` was a
 * leftover from the pre-rename `CalendarPopover` and never existed in
 * production). Size is conveyed by a class (`.sizeSmall`), not a `data-size`
 * attribute, because production tags no size attribute on the root.
 */
const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
    (
        {
            value,
            onChange,
            size = 'medium',
            disabled = false,
            minValue,
            maxValue,
            isDateUnavailable,
            weekStartsOn = 0,
            presets,
            presetIndex,
            skeleton = false,
            compact = false,
            stacked = false,
            horizontalLayout = false,
            showTimeInput = true,
            pinnedTimezone,
            popoverAlignment = 'start',
            allowClear = false,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const presetEntries = useMemo<Array<[string, CalendarPresetEntry]>>(
            () => Object.entries(presets ?? {}),
            [presets],
        );

        const isControlled = value !== undefined;
        const [internalRange, setInternalRange] = useState<RangeValue<Date> | null>(
            () => {
                if (presetIndex == null) return null;
                const entry = presetEntries[presetIndex]?.[1];
                return entry ? { start: entry.start, end: entry.end } : null;
            },
        );
        const range = isControlled ? value : internalRange;

        const [isOpen, setIsOpen] = useState(false);
        const isSmallScreen = useIsSmallScreen();
        const [presetsOpen, setPresetsOpen] = useState(false);

        // Kunci gulir halaman hanya saat drawer mobile benar-benar terbuka,
        // meniru util scroll-lock terpisah milik produksi (Base UI trap-focus
        // sendiri tidak mengunci gulir).
        useDrawerScrollLock(isSmallScreen && isOpen);

        /*
         * Timezone the time inputs are rendered in. Seeded from
         * `pinnedTimezone` when given, otherwise the viewer's own zone, which
         * is exactly what production does: `useState(pinnedTimezone ??
         * Intl.DateTimeFormat().resolvedOptions().timeZone)`.
         */
        const [tzValue, setTzValue] = useState(pinnedTimezone ?? LOCAL_TIMEZONE);

        /*
         * Time inputs. Seeded from the range, rendered in `tzValue`, and
         * re-derived below whenever the range or the zone changes. Without a
         * range there is nothing to convert, so the day's bounds are shown.
         */
        const [startTime, setStartTime] = useState(() =>
            range ? formatTimeInZone(range.start, tzValue) : formatTime(0, 0),
        );
        const [endTime, setEndTime] = useState(() =>
            range ? formatTimeInZone(range.end, tzValue) : formatTime(23, 59),
        );

        /*
         * Keeping the displayed times in step with the value and the zone.
         * Depends on the timestamps rather than the range object so a consumer
         * that rebuilds `{start, end}` on every render cannot loop this, and
         * so typing in a time input (which changes neither) is left alone.
         */
        const startMs = range ? range.start.getTime() : null;
        const endMs = range ? range.end.getTime() : null;
        useEffect(() => {
            if (startMs == null || endMs == null) return;
            setStartTime(formatTimeInZone(new Date(startMs), tzValue));
            setEndTime(formatTimeInZone(new Date(endMs), tzValue));
        }, [startMs, endMs, tzValue]);

        /*
         * Date inputs. Editable, exactly as in production, where they read
         * `readOnly: false` and accept typed text.
         */
        /*
         * Saat belum ada rentang terpilih, kedua kolom tanggal TIDAK kosong:
         * produksi mengisinya dengan tanggal hari ini. Terukur pada popover
         * live yang belum dipilih apa pun, isinya
         * ["Aug 29, 2026", "12:00 AM", "Aug 29, 2026", "11:59 PM"], sedangkan
         * punya kita dulu ["", "12:00 AM", "", "11:59 PM"]. Kolom jamnya memang
         * sudah terisi sejak awal, hanya tanggalnya yang tertinggal.
         */
        const teksHariIni = () => formatDate(new Date());
        const [startDateText, setStartDateText] = useState(() =>
            range ? formatDate(range.start) : teksHariIni(),
        );
        const [endDateText, setEndDateText] = useState(() =>
            range ? formatDate(range.end) : teksHariIni(),
        );
        useEffect(() => {
            setStartDateText(startMs == null ? teksHariIni() : formatDate(new Date(startMs)));
            setEndDateText(endMs == null ? teksHariIni() : formatDate(new Date(endMs)));
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [startMs, endMs]);

        /*
         * Validation messages, keyed the way production keys them. Empty means
         * nothing is wrong. Production shows nothing while the user types and
         * only fills this in when Apply or Enter runs.
         */
        const [errors, setErrors] = useState<{
            startDate?: string;
            startTime?: string;
            startOutOfRange?: string;
            endDate?: string;
            endTime?: string;
            endOutOfRange?: string;
        }>({});

        // Combobox input text — the picked preset's label, or free-typed period
        // text ("45m", "Jan 1 - Jan 2", ...) awaiting Enter.
        const [comboText, setComboText] = useState<string>(() => {
            if (presetIndex == null) return '';
            return presetEntries[presetIndex]?.[1].text ?? '';
        });

        const rootRef = useRef<HTMLDivElement | null>(null);
        const dialogId = useId();
        const listboxId = useId();
        const tzSelectId = useId();
        const drawerTitleId = useId();

        /*
         * Pembalikan arah popover (buka ke atas saat ruang bawah habis)
         * dulu dihitung sendiri di sini dengan mengukur viewport. Sekarang
         * Radix yang menanganinya lewat data-side pada Popover.Content.
         */

        /**
         * Inline width of the timezone select.
         *
         * Production does not measure the text at all, it counts characters:
         * `label.length === 3 ? '54px' : `${8 + 6 * label.length + 18}px``.
         * "UTC" is the only 3-character label, so it gets 54px;
         * "Local (Asia/Jakarta)" is 20 characters and lands on 146px, which is
         * exactly the inline width read off the live popover. Measuring on a
         * canvas instead made the width depend on the machine's font.
         */
        /*
         * Placeholder kolom jam ikut jenis jam yang dipakai locale pembaca,
         * sama seperti produksi: `placeholder: ua() ? "1:00PM" : "13:00"`.
         */
        const timePlaceholder = useMemo(
            () => (prefersTwelveHourClock() ? '1:00PM' : '13:00'),
            [],
        );

        const tzWidth = useMemo(() => {
            const label =
                TIMEZONE_OPTIONS.find((tz) => tz.value === tzValue)?.label ?? tzValue;
            return label.length === 3 ? 54 : 8 + 6 * label.length + 18;
        }, [tzValue]);

        const small = size === 'small';

        const applyRange = useCallback(
            (next: RangeValue<Date>): void => {
                if (!isControlled) setInternalRange(next);
                onChange?.(next);
            },
            [isControlled, onChange],
        );

        const clearRange = useCallback((): void => {
            if (!isControlled) setInternalRange(null);
        }, [isControlled]);

        /**
         * Commits the typed Start/End time-of-day (HH:MM) onto the current
         * range, firing onChange. Wired to the Apply button's click and to
         * Enter inside any of the four inputs.
         *
         * The checks run in production's own order, taken from its bundle, so
         * that when two things are wrong at once the same message wins:
         * date format, then time format, then whether date and time combine
         * into a real instant, then min/max, then start-after-end, and finally
         * end-time-not-after-start on a single day. Nothing is committed unless
         * every check passes.
         */
        const commitTimeInputs = useCallback((): void => {
            const found: typeof errors = {};
            let ok = true;

            const startDate = parseDateInput(startDateText);
            if (!startDate) {
                found.startDate = ERROR_TEXT.dateFormat;
                ok = false;
            }
            const endDate = parseDateInput(endDateText);
            if (!endDate) {
                found.endDate = ERROR_TEXT.dateFormat;
                ok = false;
            }
            const startParts = parseTimeParts(startTime);
            if (!startParts) {
                found.startTime = ERROR_TEXT.timeFormat;
                ok = false;
            }
            const endParts = parseTimeParts(endTime);
            if (!endParts) {
                found.endTime = ERROR_TEXT.timeFormat;
                ok = false;
            }

            let nextStart: Date | null = null;
            let nextEnd: Date | null = null;
            if (startDate && startParts) {
                nextStart = combineDateAndTime(startDateText, startTime, tzValue);
                if (!nextStart || Number.isNaN(nextStart.getTime())) {
                    found.startTime = ERROR_TEXT.time;
                    ok = false;
                }
            }
            if (endDate && endParts) {
                nextEnd = combineDateAndTime(endDateText, endTime, tzValue);
                if (!nextEnd || Number.isNaN(nextEnd.getTime())) {
                    found.endTime = ERROR_TEXT.time;
                    ok = false;
                }
            }

            if (nextStart && minValue && nextStart < toMinutePrecision(minValue)) {
                found.startOutOfRange = ERROR_TEXT.outOfRange;
                ok = false;
            }
            if (nextEnd && maxValue && nextEnd > toMinutePrecision(maxValue)) {
                found.endOutOfRange = ERROR_TEXT.outOfRange;
                ok = false;
            }
            if (startDate && endDate && startDate > endDate) {
                found.startDate = ERROR_TEXT.startAfterEnd;
                ok = false;
            }
            if (
                nextStart &&
                nextEnd &&
                nextStart >= nextEnd &&
                startDate &&
                endDate &&
                startDate.equals(endDate)
            ) {
                found.endTime = ERROR_TEXT.endBeforeStart;
                ok = false;
            }

            setErrors(found);

            if (ok && nextStart && nextEnd) {
                // Typed text is rewritten in the canonical shape, as production
                // does once a value survives validation ("aug 18, 2026" becomes
                // "Aug 18, 2026").
                const tidyStart = startDate?.toFormat(DATE_INPUT_FORMATS[0]);
                if (tidyStart && tidyStart !== startDateText) setStartDateText(tidyStart);
                const tidyEnd = endDate?.toFormat(DATE_INPUT_FORMATS[0]);
                if (tidyEnd && tidyEnd !== endDateText) setEndDateText(tidyEnd);
                applyRange({ start: nextStart, end: nextEnd });
            }
        }, [
            startDateText,
            endDateText,
            startTime,
            endTime,
            tzValue,
            minValue,
            maxValue,
            applyRange,
        ]);

        const handleTimeKeyDown = useCallback(
            (event: KeyboardEvent<HTMLInputElement>): void => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    commitTimeInputs();
                }
            },
            [commitTimeInputs],
        );

        /** First message worth showing for one side of the form. */
        const startError =
            errors.startOutOfRange ?? errors.startDate ?? errors.startTime;
        const endError = errors.endOutOfRange ?? errors.endDate ?? errors.endTime;

        /*
         * Menutup daftar preset saat menekan di luar. Popover dan drawer TIDAK
         * ditangani di sini lagi: Radix dan Base UI sudah mengurus klik-di-luar,
         * tombol Escape, dan jebakan fokusnya masing-masing.
         */
        useEffect(() => {
            if (!presetsOpen) return;
            const onPointerDown = (event: PointerEvent): void => {
                const target = event.target as Node;
                if (rootRef.current?.contains(target)) return;
                setPresetsOpen(false);
            };
            document.addEventListener('pointerdown', onPointerDown, true);
            return () => document.removeEventListener('pointerdown', onPointerDown, true);
        }, [presetsOpen]);

        const handleTriggerKeyDown = useCallback(
            (event: KeyboardEvent<HTMLElement>): void => {
                if (event.key === 'Escape' && presetsOpen) {
                    event.preventDefault();
                    setPresetsOpen(false);
                }
            },
            [presetsOpen],
        );

        const triggerLabel = range ? formatRangeLabel(range) : TRIGGER_PLACEHOLDER;

        const pickPreset = useCallback(
            (preset: CalendarPresetEntry): void => {
                applyRange({ start: preset.start, end: preset.end });
                setComboText(preset.text);
                setPresetsOpen(false);
            },
            [applyRange],
        );

        /**
         * Free-typed period text (or a clicked hint chip) → parsed range.
         * The dropdown closes on a successful parse, same as picking a
         * preset; unparsable text is left in place (decision — the static
         * snapshot shows the input and chips, not the failure behaviour).
         */
        const commitPeriodText = useCallback(
            (text: string): void => {
                const parsed = parsePeriodInput(text, new Date());
                if (!parsed) return;
                applyRange(parsed);
                setPresetsOpen(false);
            },
            [applyRange],
        );

        const handleTimezoneChange = useCallback(
            (event: ChangeEvent<HTMLSelectElement>): void => {
                setTzValue(event.target.value);
            },
            [],
        );

        const wrapperClasses = cn(
            styles.calendar,
            presetEntries.length > 0 && styles.hasSelect,
            compact && styles.compact,
            stacked && styles.stacked,
            // Size lewat kelas, bukan data-size: produksi tidak memasang atribut
            // ukuran apa pun di root (diukur), hanya membedakan lewat kelas.
            small && styles.sizeSmall,
            // Mobile (drawer, <=600px): tata letak vertikal untuk non-compact +
            // combobox berbasis tombol. Digate di sini agar desktop tak tersentuh.
            isSmallScreen && styles.mobile,
            className,
        );

        /*
         * Lebar kontrol. Produksi menuliskannya sebagai
         * `width = compact ? "180px" : "250px"`, jadi yang menentukan adalah
         * tata letak COMPACT, bukan ukuran small/medium. Terukur di halaman
         * Sizes: baris small yang tidak compact tetap 250px, dan yang compact
         * tetap 180px di kedua baris.
         *
         * Di MOBILE (drawer, <=600px) non-compact memakai 100% dan mengisi
         * lebar kontainer (root `--width:100%; width:100%`), sedangkan compact
         * tetap 180px/auto seperti desktop. Terukur di halaman live 375px.
         */
        const widthVar = compact ? '180px' : isSmallScreen ? '100%' : '250px';
        const rootWidth = isSmallScreen && !compact ? '100%' : 'auto';

        /*
         * ---- Preset combobox (rendered only when presets are supplied) ----
         * A real text input (production: `cmdk-input` with
         * `placeholder="Select Period"`, aria-haspopup="dialog") whose
         * dropdown is a TWO-COLUMN dialog: the preset listbox on the left
         * and the "Type relative times" / "Type fixed times" hint chips on
         * the right — width `calc(trigger-width * 2 + 2px)`, min 370px.
         * The prefix glyph is a CLOCK (see ClockGlyph), absolutely placed at
         * top/left 9px; compact renders no prefix at all (pl-2 input).
         * Typing a period ("45m", "Jan 1 - Jan 2") and pressing Enter — or
         * clicking a hint chip — parses and applies the range.
         */
        const presetCombobox: ReactNode =
            presetEntries.length > 0 ? (
                /*
                 * Dropdown preset dibangun di atas cmdk, sama seperti produksi.
                 * Buktinya di DOM live: setiap combobox membawa `cmdk-root` dan
                 * `cmdk-input` walau tertutup, dan saat terbuka muncul
                 * `cmdk-list` berisi `cmdk-item`. Prop `label` itulah yang
                 * memunculkan <label cmdk-label> tersembunyi berbunyi
                 * "Combobox Menu"; penyaringan dimatikan karena daftar preset
                 * kita kelola sendiri.
                 */
                <Command
                    label="Combobox Menu"
                    shouldFilter={false}
                    className={styles.comboboxRoot}
                >
                <div className={styles.comboboxWrapper} data-open={presetsOpen || undefined}>
                    <Command.Input
                        role="combobox"
                        aria-haspopup="dialog"
                        aria-expanded={presetsOpen}
                        aria-controls={listboxId}
                        aria-autocomplete="list"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={disabled}
                        /*
                         * Atribut yang dibawa combobox produksi apa adanya:
                         * data-error dari komponen Input Geist, data-state dari
                         * pemicu popover-nya, dan gaya inline padding-right:0.
                         * Diukur di DOM live tiap combobox (tertutup).
                         */
                        data-error="false"
                        data-state={presetsOpen ? 'open' : 'closed'}
                        style={{ paddingRight: 0 }}
                        /*
                         * Compact tidak punya placeholder sama sekali, dan saat
                         * sebuah preset terpilih produksi menuliskan label
                         * preset itu sebagai placeholder (tertutup nilainya,
                         * jadi tidak terlihat). Keduanya terbaca dari halaman
                         * live.
                         */
                        placeholder={compact ? '' : comboText || COMBOBOX_PLACEHOLDER}
                        value={comboText}
                        data-testid="calendar/combobox-input"
                        className={cn(styles.comboboxInput, comboText && styles.comboboxInputFilled)}
                        onValueChange={setComboText}
                        onClick={() => setPresetsOpen(true)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                commitPeriodText(comboText);
                                return;
                            }
                            handleTriggerKeyDown(event);
                        }}
                    />
                    {/*
                     * Ikon ditempel LANGSUNG, tanpa pembungkus span. Di produksi
                     * svg-nya sendiri yang diberi position absolute dan ukuran
                     * 14px (--ds-control-decoration-size). Pembungkus span
                     * membuat kotaknya jadi 16px dan svg di dalamnya static.
                     */}
                    {!compact ? <ClockGlyph className={styles.comboboxInputPrefix} /> : null}
                    {/* Ikon 16px (atribut svg), diperkecil ke 14px lewat CSS
                        --ds-control-decoration-size, persis produksi. */}
                    <ChevronDown size={16} color="gray-700" className={styles.comboboxInputSuffix} />
                    {/*
                     * Garis 1px di tepi kanan combobox. Selalu ada, tembus
                     * pandang (opacity 0) sampai dibutuhkan; ukurannya menempel
                     * pada kotak input dengan sisi -1px di tiga arah.
                     */}
                    <div aria-hidden="true" className={styles.comboboxDivider} />
                    {presetsOpen ? (
                        <div
                            role="dialog"
                            aria-label="Select a period"
                            className={styles.comboboxPopover}
                        >
                            <Command.List
                                aria-label="Suggestions"
                                id={listboxId}
                                className={styles.suggestions}
                            >
                                {presetEntries.map(([id, preset]) => (
                                    <Command.Item
                                        key={id}
                                        value={preset.text}
                                        className={styles.comboboxItem}
                                        data-testid={`calendar/preset/${id}`}
                                        onSelect={() => pickPreset(preset)}
                                        onClick={() => pickPreset(preset)}
                                    >
                                        {preset.text}
                                    </Command.Item>
                                ))}
                            </Command.List>
                            <div className={styles.hintPanel}>
                                <p className={styles.hintTitle}>Type relative times</p>
                                <div className={styles.hintChips}>
                                    {RELATIVE_CHIPS.map((chip) => (
                                        <button
                                            key={chip}
                                            type="button"
                                            className={styles.hintChip}
                                            onClick={() => {
                                                setComboText(chip);
                                                commitPeriodText(chip);
                                            }}
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>
                                <p className={styles.hintTitle}>Type fixed times</p>
                                <div className={styles.hintChips}>
                                    {FIXED_CHIPS.map((chip) => (
                                        <button
                                            key={chip}
                                            type="button"
                                            className={styles.hintChip}
                                            onClick={() => {
                                                setComboText(chip);
                                                commitPeriodText(chip);
                                            }}
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
                </Command>
            ) : null;

        /*
         * ---- Preset combobox: varian MOBILE (drawer, <=600px) ----
         * Di layar sempit produksi TIDAK memakai cmdk. Comboboxnya jadi sebuah
         * <button> polos (teks "Select Period") yang membuka drawer preset,
         * dibungkus <div> biasa (bukan cmdk-root), plus ikon jam/chevron dan
         * garis tepi. Diukur dari DOM live 375: button tanpa data-testid/aria,
         * hanya type=button + gaya inline `text-align:left; padding-right:0`.
         * Non-compact mengisi lebar (w-full), compact menyusut jadi kotak
         * chevron (width --ds-size-small, teks transparan).
         */
        const presetComboboxMobile: ReactNode =
            presetEntries.length > 0 ? (
                <div
                    className={styles.comboboxMobile}
                    style={compact ? undefined : { width: 'var(--width)' }}
                >
                    <button
                        type="button"
                        className={cn(
                            styles.comboboxMobileButton,
                            comboText && styles.comboboxInputFilled,
                        )}
                        style={{ textAlign: 'left', paddingRight: 0 }}
                        onClick={() => setIsOpen(true)}
                    >
                        {comboText || COMBOBOX_PLACEHOLDER}
                    </button>
                    {!compact ? <ClockGlyph className={styles.comboboxInputPrefix} /> : null}
                    <ChevronDown size={16} color="gray-700" className={styles.comboboxInputSuffix} />
                    <div aria-hidden="true" className={styles.comboboxDivider} />
                </div>
            ) : null;

        /*
         * ---- Trigger button ----
         * Extracted to a variable (rather than inlined in the JSX below) so
         * it can swap render order with `presetCombobox`: production's
         * "Compact" example places the BUTTON first (its left edge rounded,
         * right edge square) and the combobox second (left square, right
         * rounded) — the opposite of the default/"Stacked" order, where the
         * combobox comes first. Verified from calendar-open.html via the
         * `rounded-l-*`/`rounded-r-*` pairs on each element (the wrapper's
         * own arbitrary-variant classes are overridden by these `!important`
         * utilities, so the element's own class list is what actually wins).
         */
        const triggerButton: ReactNode = (
            <Button
                variant="secondary"
                typeName="submit"
                size={small ? 'small' : 'medium'}
                prefix={<CalendarIcon size={16} color="gray-700" className={styles.triggerIcon} />}
                disabled={disabled}
                /*
                 * Di MOBILE (drawer) produksi TIDAK memasang atribut dialog di
                 * pemicu: tanpa aria-haspopup/aria-expanded/aria-controls,
                 * data-state, data-testid, atau title (itu milik pemicu popover
                 * desktop). Diukur di DOM live 375. Di desktop semua tetap ada.
                 */
                aria-haspopup={isSmallScreen ? undefined : 'dialog'}
                aria-expanded={isSmallScreen ? undefined : isOpen}
                aria-controls={isSmallScreen ? undefined : dialogId}
                data-state={isSmallScreen ? undefined : isOpen ? 'open' : 'closed'}
                data-testid={isSmallScreen ? undefined : 'calendar/trigger/button'}
                title={isSmallScreen ? undefined : triggerLabel}
                className={cn(styles.trigger, !range && styles.triggerPlaceholder)}
                onClick={() => setIsOpen((o) => !o)}
                onKeyDown={handleTriggerKeyDown}
            >
                {triggerLabel}
            </Button>
        );

        /*
         * ---- Date / time / timezone inputs (popover header) ----
         * Always rendered: the Geist snapshot shows the Start/End date rows
         * and a timezone control (built-in select, or pinned read-only text)
         * in every captured popover — including `horizontalLayout
         * showTimeInput={false}`, which hides only the two time sub-inputs,
         * not the date row or the timezone control. Neither is gated behind
         * a prop.
         */
        const inputsSection: ReactNode = (
            <div className={styles.inputsWrapper}>
                {/*
                 * Produksi membungkus keempat baris (Start / End / Apply /
                 * timezone) dalam satu div `space-y-2`. Jaraknya lahir dari
                 * margin-bottom tiap baris (kecuali timezone yang pakai mt-1),
                 * bukan dari margin-top: lihat `.inputGroups` di CSS.
                 */}
                <div className={styles.inputGroups}>
                <div>
                    <div className={styles.inputGroupHeader}>
                        <label data-version="v1">
                            <div className={styles.inputGroupLabel}>Start</div>
                        </label>
                        {startError ? (
                            <div className={styles.inputError}>{startError}</div>
                        ) : null}
                    </div>
                    <div className={styles.inputRow}>
                        <Input
                            size="small"
                            placeholder="Jan 01, 2025"
                            value={startDateText}
                            error={
                                errors.startDate ?? errors.startOutOfRange
                                    ? ' '
                                    : undefined
                            }
                            showErrorMessage={false}
                            onChange={(e) => {
                                setStartDateText(e.target.value);
                                setErrors((prev) => ({
                                    ...prev,
                                    startDate: undefined,
                                    startOutOfRange: undefined,
                                }));
                            }}
                            onKeyDown={handleTimeKeyDown}
                            className={styles.dateInput}
                            innerWrapperClassName={styles.dateInputWrapper}
                            aria-labelledby="start-date"
                        />
                        {showTimeInput ? (
                            <Input
                                size="small"
                                placeholder={timePlaceholder}
                                value={startTime}
                                className={styles.timeInput}
                                aria-labelledby="time"
                                error={errors.startTime ? ' ' : undefined}
                                showErrorMessage={false}
                                onChange={(e) => {
                                    setStartTime(e.target.value);
                                    setErrors((prev) => ({ ...prev, startTime: undefined }));
                                }}
                                onKeyDown={handleTimeKeyDown}
                            />
                        ) : null}
                    </div>
                </div>

                <div>
                    <div className={styles.inputGroupHeader}>
                        <label data-version="v1">
                            <div className={styles.inputGroupLabel}>End</div>
                        </label>
                        {endError ? (
                            <div className={styles.inputError}>{endError}</div>
                        ) : null}
                    </div>
                    <div className={styles.inputRow}>
                        <Input
                            size="small"
                            placeholder="Jan 01, 2025"
                            value={endDateText}
                            error={
                                errors.endDate ?? errors.endOutOfRange ? ' ' : undefined
                            }
                            showErrorMessage={false}
                            onChange={(e) => {
                                setEndDateText(e.target.value);
                                setErrors((prev) => ({
                                    ...prev,
                                    endDate: undefined,
                                    endOutOfRange: undefined,
                                }));
                            }}
                            onKeyDown={handleTimeKeyDown}
                            className={styles.dateInput}
                            innerWrapperClassName={styles.dateInputWrapper}
                            aria-labelledby="end-date"
                        />
                        {showTimeInput ? (
                            <Input
                                size="small"
                                placeholder={timePlaceholder}
                                value={endTime}
                                className={styles.timeInput}
                                aria-labelledby="time"
                                error={errors.endTime ? ' ' : undefined}
                                showErrorMessage={false}
                                onChange={(e) => {
                                    setEndTime(e.target.value);
                                    setErrors((prev) => ({ ...prev, endTime: undefined }));
                                }}
                                onKeyDown={handleTimeKeyDown}
                            />
                        ) : null}
                    </div>
                </div>

                {/*
                 * ---- Apply (commits typed time onto the range) ----
                 * Evidenced in every one of the 32 Start/End popovers
                 * surveyed in calendar-open.html (with time inputs, with
                 * pinnedTimezone, and even the two `showTimeInput={false}`
                 * horizontalLayout instances) — always directly below the
                 * End row, always directly above the timezone row. Rendered
                 * unconditionally here to match; the click/Enter → commit
                 * wiring (not closing the popover) is a documented decision,
                 * not something the static snapshot can prove.
                 */}
                <div>
                    <Button
                        variant="secondary"
                        typeName="submit"
                        size="small"
                        disabled={disabled}
                        className={styles.applyButton}
                        onClick={commitTimeInputs}
                    >
                        Apply
                        <span className={styles.applyHint}>↵</span>
                    </Button>
                </div>

                {/*
                 * Timezone row. Select variant: `mt-1 flex justify-center pl-4`
                 * with a geist-GHOST select (no ring until hover, gray-800
                 * text, sibling chevron) — NOT the bordered form Select.
                 * Pinned variant: a bare `text-xs text-gray-800` span, no pl-4.
                 */}
                <div
                    className={cn(
                        styles.timezoneRow,
                        !pinnedTimezone && styles.timezoneRowSelect,
                    )}
                >
                    {pinnedTimezone ? (
                        <span
                            className={styles.pinnedTimezone}
                            data-testid="calendar/pinned-timezone"
                        >
                            {pinnedTimezone}
                        </span>
                    ) : (
                        /*
                         * Produksi = komponen Geist Select varian ghost:
                         * <label for><div data-geist-select><select><span chevron>.
                         * Select-nya TANPA aria-label (label pembungkus kosong),
                         * jadi kita tiru persis: label -> div penanda -> select.
                         */
                        <label
                            className={styles.timezoneLabel}
                            htmlFor={tzSelectId}
                            data-version="v1"
                        >
                            <div
                                className={styles.timezoneSelectWrapper}
                                data-oxobz-select=""
                                data-version="v1"
                            >
                                <select
                                    id={tzSelectId}
                                    aria-invalid="false"
                                    className={styles.timezoneSelect}
                                    style={{ '--tz-width': `${tzWidth}px` } as React.CSSProperties}
                                    value={tzValue}
                                    onChange={handleTimezoneChange}
                                >
                                    {TIMEZONE_OPTIONS.map((tz) => (
                                        <option
                                            key={tz.value}
                                            className={styles.timezoneOption}
                                            value={tz.value}
                                        >
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                                <span className={styles.timezoneSelectChevron}>
                                    {/* Produksi: <svg height/width=16 class="size-(--ds-control-decoration-size)">
                                        jadi atribut 16 tapi computed 14px lewat kelas. */}
                                    <ChevronDown
                                        size={16}
                                        className={styles.timezoneChevronIcon}
                                    />
                                </span>
                            </div>
                        </label>
                    )}
                </div>
                </div>
            </div>
        );

        /*
         * Inti panel (input + grid). Pembungkus di sekelilingnya BERBEDA antar
         * wadah: popover memakai `.content` (relative, rounded 6, padding 12),
         * drawer memakai <div> polos (kotak & padding disediakan body drawer).
         */
        const panelInner = (
            <div
                className={
                    horizontalLayout
                        ? styles.calendarContentWrapperHorizontal
                        : styles.calendarContentWrapper
                }
            >
                {inputsSection}
                <CalendarGrid
                    value={range}
                    onChange={applyRange}
                    minValue={minValue}
                    maxValue={maxValue}
                    isDateUnavailable={isDateUnavailable}
                    weekStartsOn={weekStartsOn}
                    defaultFocusedMonth={range?.start}
                    autoFocus
                />
            </div>
        );

        /*
         * Panel POPOVER (desktop): diawali tombol kosong khusus pembaca layar,
         * anak PERTAMA popover. Produksi menuliskannya persis begini: <button
         * type="button" class="sr-only"></button>, jadi sasaran fokus pertama.
         * Drawer produksi TIDAK memakai tombol ini (diukur di DOM live 375).
         */
        const panel = (
            <>
                <button
                    type="button"
                    className={cn('oxobz-sr-only', styles.srOnlyButton)}
                />
                <div className={styles.content}>{panelInner}</div>
            </>
        );

        /*
         * Tombol pemicu dibungkus Skeleton (span data-testid="legacy/skeleton",
         * lebarnya var(--width)). Di DESKTOP ada satu lapis lagi: div
         * `relative inline-flex` (produksi `group/calendar`) yang menahan tinggi
         * pada tata letak stacked dan jadi jangkar popover. Di MOBILE (drawer)
         * produksi TIDAK memakai lapis ini — tombolnya anak langsung Skeleton.
         */
        const pemicuTerbungkus = (
            <Skeleton show={skeleton} style={{ width: 'var(--width)' }}>
                {isSmallScreen ? (
                    triggerButton
                ) : (
                    <div className={styles.calendarRoot}>{triggerButton}</div>
                )}
            </Skeleton>
        );

        const kontrol = (
            <div
                {...rest}
                ref={(node) => {
                    rootRef.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) ref.current = node;
                }}
                className={wrapperClasses}
                data-oxobz-calendar=""
                data-version={dataVersion}
                data-disabled={disabled || undefined}
                style={{ '--width': widthVar, width: rootWidth, ...rest.style } as React.CSSProperties}
            >
                {compact ? (
                    <>
                        {pemicuTerbungkus}
                        {isSmallScreen ? presetComboboxMobile : presetCombobox}
                    </>
                ) : (
                    <>
                        {isSmallScreen ? presetComboboxMobile : presetCombobox}
                        {pemicuTerbungkus}
                    </>
                )}

                {allowClear && range ? (
                    <button
                        type="button"
                        aria-label="Clear"
                        data-testid="calendar/clear"
                        className={cn(styles.clearButton, small && styles.clearButtonSmall)}
                        onClick={(e) => {
                            e.stopPropagation();
                            clearRange();
                        }}
                    >
                        <Cross size={16} />
                    </button>
                ) : null}

            </div>
        );

        /*
         * Layar sempit: drawer Base UI yang muncul dari bawah dan bisa digeser
         * ke bawah untuk ditutup, persis seperti produksi (penanda di DOM live:
         * data-base-ui-focusable dan data-swipe-direction="down").
         */
        if (isSmallScreen) {
            /*
             * Struktur drawer produksi (DOM live 375): Portal > Backdrop +
             * Viewport(presentation) > Popup(dialog) yang berisi handle geser,
             * judul <h3> "Select Date Range", lalu body pembungkus panel. Judul
             * memberi nama dialog via aria-labelledby (bukan aria-label). Penanda
             * data-oxobz-modal(-title/-body) menormalkan ke data-ds-modal seperti
             * data-geist-modal produksi.
             *
             * modal="trap-focus" (bukan default true): forensik bundel produksi
             * (chunk 2h38obwtw-sfa.js) membuktikan Geist memakai nilai ini. Di
             * Base UI, InternalBackdrop hanya dirender saat modal===true strict,
             * dan scroll-lock hanya aktif saat open && modal===true. Nilai
             * "trap-focus" mematikan keduanya (produksi cuma punya Backdrop +
             * Viewport, tanpa InternalBackdrop terpisah, dan tanpa kompensasi
             * scrollbar) sambil tetap menjebak fokus.
             */
            return (
                <Drawer.Root open={isOpen} onOpenChange={setIsOpen} modal="trap-focus">
                    {kontrol}
                    <Drawer.Portal>
                        <Drawer.Backdrop className={styles.drawerBackdrop} />
                        <Drawer.Viewport className={styles.drawerViewport}>
                            <Drawer.Popup
                                id={dialogId}
                                aria-labelledby={drawerTitleId}
                                data-oxobz-modal=""
                                className={styles.drawer}
                            >
                                {/* Pembungkus handle: produksi memakai INLINE
                                    style (bukan class) — sticky, top 0, z 10. */}
                                <div
                                    style={{
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                    }}
                                >
                                    <div className={styles.drawerHandleGradient} />
                                </div>
                                <h3
                                    id={drawerTitleId}
                                    data-oxobz-modal-title=""
                                    className={cn(
                                        'text-heading-20',
                                        'oxobz-sr-only',
                                        styles.drawerTitle,
                                    )}
                                >
                                    Select Date Range
                                </h3>
                                <div
                                    data-oxobz-modal-body=""
                                    className={cn(
                                        'text-copy-14',
                                        styles.drawerBody,
                                    )}
                                    style={
                                        {
                                            '--modal-padding': '20px',
                                        } as CSSProperties
                                    }
                                >
                                    {/* Pembungkus polos (live [2/0]): kotak &
                                        padding ada di body drawer, bukan di
                                        sini. */}
                                    <div>{panelInner}</div>
                                    {/*
                                     * Dua sentinel setinggi 1px (sasaran
                                     * IntersectionObserver bayangan gulir),
                                     * persis DOM live: atas absolute, bawah
                                     * statis; aria-hidden, pointer-events-none.
                                     */}
                                    <div
                                        aria-hidden="true"
                                        className={styles.scrollSentinelTop}
                                    />
                                    <div
                                        aria-hidden="true"
                                        className={styles.scrollSentinelBottom}
                                    />
                                </div>
                            </Drawer.Popup>
                        </Drawer.Viewport>
                    </Drawer.Portal>
                </Drawer.Root>
            );
        }

        /*
         * Layar lebar: Radix Popover. Pemosisian, klik-di-luar, tombol Escape,
         * dan pembalikan arah saat ruang bawah habis kini urusan Radix, bukan
         * CSS dan efek buatan sendiri lagi.
         *
         * sideOffset 8px, bukan 6px seperti sebelumnya: diukur di halaman live
         * sebagai jarak antara sisi bawah pemicu dan sisi atas popover.
         */
        return (
            <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
                <Popover.Anchor asChild>{kontrol}</Popover.Anchor>
                <Popover.Portal>
                    <Popover.Content
                        id={dialogId}
                        side="bottom"
                        align={popoverAlignment}
                        sideOffset={8}
                        collisionPadding={16}
                        className={cn(styles.popover, horizontalLayout && styles.popoverHorizontal)}
                        onKeyDown={handleTriggerKeyDown}
                    >
                        {panel}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        );
    },
);

Calendar.displayName = 'Calendar';

export { Calendar };
