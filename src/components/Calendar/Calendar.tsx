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
    type HTMLAttributes,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import * as Popover from '@radix-ui/react-popover';
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
function ClockGlyph(): React.JSX.Element {
    return (
        <svg viewBox="0 0 16 16" height={16} width={16} aria-hidden="true">
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
 * <div data-oxobz-calendar-popover data-version="v1" style="--width: 250px">
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
 * The outer `data-oxobz-calendar-popover` attribute name is kept as-is
 * (pre-dates this component's public rename to `Calendar`) — this pass
 * corrects props/API only, not already-verified DOM/data-attributes.
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

        // Combobox input text — the picked preset's label, or free-typed period
        // text ("45m", "Jan 1 - Jan 2", ...) awaiting Enter.
        const [comboText, setComboText] = useState<string>(() => {
            if (presetIndex == null) return '';
            return presetEntries[presetIndex]?.[1].text ?? '';
        });

        const rootRef = useRef<HTMLDivElement | null>(null);
        const dialogId = useId();
        const listboxId = useId();

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
         * Enter inside either time input (see calendar-open.html: every
         * popover with the Start/End input header shows an "Apply ↵"
         * button directly below the End row). No-op without a range or with
         * unparsable time text — there is nothing to attach a time to, and
         * no runtime evidence dictates otherwise (decision, not measured).
         */
        const commitTimeInputs = useCallback((): void => {
            if (!range) return;
            const startParts = parseTimeParts(startTime);
            const endParts = parseTimeParts(endTime);
            if (!startParts || !endParts) return;
            const nextStart = new Date(range.start);
            nextStart.setHours(startParts[0], startParts[1], 0, 0);
            const nextEnd = new Date(range.end);
            nextEnd.setHours(endParts[0], endParts[1], 0, 0);
            applyRange({ start: nextStart, end: nextEnd });
        }, [range, startTime, endTime, applyRange]);

        const handleTimeKeyDown = useCallback(
            (event: KeyboardEvent<HTMLInputElement>): void => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    commitTimeInputs();
                }
            },
            [commitTimeInputs],
        );

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
            className,
        );

        const widthVar = small ? '180px' : '250px';

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
                <div className={styles.comboboxWrapper} data-open={presetsOpen || undefined}>
                    <input
                        type="text"
                        role="combobox"
                        aria-haspopup="dialog"
                        aria-expanded={presetsOpen}
                        aria-controls={listboxId}
                        aria-autocomplete="list"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={disabled}
                        placeholder={COMBOBOX_PLACEHOLDER}
                        value={comboText}
                        data-testid="calendar/combobox-input"
                        className={styles.comboboxInput}
                        onChange={(e) => setComboText(e.target.value)}
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
                    {!compact ? (
                        <span className={styles.comboboxInputPrefix}>
                            <ClockGlyph />
                        </span>
                    ) : null}
                    <span className={styles.comboboxInputSuffix}>
                        <ChevronDown size={16} />
                    </span>
                    {presetsOpen ? (
                        <div
                            role="dialog"
                            aria-label="Select a period"
                            className={styles.comboboxPopover}
                        >
                            <div
                                role="listbox"
                                aria-label="Suggestions"
                                id={listboxId}
                                className={styles.suggestions}
                            >
                                {presetEntries.map(([id, preset]) => (
                                    <div
                                        key={id}
                                        role="option"
                                        aria-selected={
                                            range != null &&
                                            preset.start.getTime() === range.start.getTime() &&
                                            preset.end.getTime() === range.end.getTime()
                                        }
                                        className={styles.comboboxItem}
                                        data-testid={`calendar/preset/${id}`}
                                        onClick={() => pickPreset(preset)}
                                    >
                                        {preset.text}
                                    </div>
                                ))}
                            </div>
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
                typeName="button"
                size={small ? 'small' : 'medium'}
                prefix={<CalendarIcon size={16} className={styles.triggerIcon} />}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls={dialogId}
                data-state={isOpen ? 'open' : 'closed'}
                data-testid="calendar/trigger/button"
                title={TRIGGER_PLACEHOLDER}
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
                <div>
                    <div className={styles.inputGroupHeader}>
                        <label className={styles.inputGroupLabel}>Start</label>
                    </div>
                    <div className={styles.inputRow}>
                        <Input
                            size="small"
                            readOnly
                            placeholder="Jan 01, 2025"
                            value={range ? formatDate(range.start) : ''}
                            className={styles.dateInput}
                            data-testid="calendar/input/start-date"
                        />
                        {showTimeInput ? (
                            <Input
                                size="small"
                                placeholder={timePlaceholder}
                                value={startTime}
                                className={styles.timeInput}
                                data-testid="calendar/input/start-time"
                                onChange={(e) => setStartTime(e.target.value)}
                                onKeyDown={handleTimeKeyDown}
                            />
                        ) : null}
                    </div>
                </div>

                <div>
                    <div className={styles.inputGroupHeader}>
                        <label className={styles.inputGroupLabel}>End</label>
                    </div>
                    <div className={styles.inputRow}>
                        <Input
                            size="small"
                            readOnly
                            placeholder="Jan 01, 2025"
                            value={range ? formatDate(range.end) : ''}
                            className={styles.dateInput}
                            data-testid="calendar/input/end-date"
                        />
                        {showTimeInput ? (
                            <Input
                                size="small"
                                placeholder={timePlaceholder}
                                value={endTime}
                                className={styles.timeInput}
                                data-testid="calendar/input/end-time"
                                onChange={(e) => setEndTime(e.target.value)}
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
                        typeName="button"
                        size="small"
                        disabled={disabled}
                        className={styles.applyButton}
                        data-testid="calendar/apply"
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
                        <div className={styles.timezoneSelectWrapper}>
                            <select
                                aria-label="Timezone"
                                className={styles.timezoneSelect}
                                style={{ '--tz-width': `${tzWidth}px` } as React.CSSProperties}
                                value={tzValue}
                                onChange={handleTimezoneChange}
                                data-testid="calendar/timezone-select"
                            >
                                {TIMEZONE_OPTIONS.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                            <span className={styles.timezoneSelectChevron}>
                                <ChevronDown size={16} />
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );

        /*
         * Isi panel, dipakai apa adanya baik oleh popover (layar lebar) maupun
         * drawer (layar sempit). Yang berbeda hanya wadahnya.
         */
        const panel = (
            <div className={styles.content}>
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
                    />
                </div>
            </div>
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
                data-oxobz-calendar-popover=""
                data-version={dataVersion}
                data-size={size}
                data-disabled={disabled || undefined}
                style={{ '--width': widthVar, ...rest.style } as React.CSSProperties}
            >
                {compact ? (
                    <>
                        {triggerButton}
                        {presetCombobox}
                    </>
                ) : (
                    <>
                        {presetCombobox}
                        {triggerButton}
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
            return (
                <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
                    {kontrol}
                    <Drawer.Portal>
                        <Drawer.Backdrop className={styles.drawerBackdrop} />
                        <Drawer.Popup
                            id={dialogId}
                            aria-label="Choose date range"
                            className={styles.drawer}
                        >
                            {panel}
                        </Drawer.Popup>
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
                        aria-label="Choose date range"
                        side="bottom"
                        align={popoverAlignment}
                        sideOffset={8}
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
