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
import { Calendar as CalendarIcon, ChevronDown, Cross } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select } from '../Select';
import { CalendarGrid, type DateValue, type RangeValue, type WeekDayIndex } from './CalendarGrid';
import styles from './Calendar.module.css';

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

/** `"Jul 18, 2026"` — the date-input display format from the snapshot. */
function formatDate(date: Date): string {
    return `${MONTH_ABBR[date.getMonth()]} ${`${date.getDate()}`.padStart(2, '0')}, ${date.getFullYear()}`;
}

/**
 * Trigger label for a committed range, e.g. `"Jul 4 - 18"` (same month) or
 * `"Jul 4 - Aug 2"` (cross-month), mirroring the Geist docs.
 */
function formatRangeLabel(range: RangeValue<Date>): string {
    const { start, end } = range;
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
        const [presetsOpen, setPresetsOpen] = useState(false);

        // Built-in timezone select value — decorative only (DateValue has no
        // timezone semantics); no `timezone`/`onTimezoneChange` prop exists.
        const [tzValue, setTzValue] = useState(LOCAL_TIMEZONE);

        // Time inputs are local display state (HH:MM), seeded independent of the range.
        const [startTime, setStartTime] = useState('00:00');
        const [endTime, setEndTime] = useState('23:59');

        const rootRef = useRef<HTMLDivElement | null>(null);
        const dialogId = useId();
        const listboxId = useId();

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

        // Dismiss the popover(s) on outside pointer-down (Combobox idiom).
        useEffect(() => {
            if (!isOpen && !presetsOpen) return;
            const onPointerDown = (event: PointerEvent): void => {
                const target = event.target as Node;
                if (rootRef.current?.contains(target)) return;
                setIsOpen(false);
                setPresetsOpen(false);
            };
            document.addEventListener('pointerdown', onPointerDown, true);
            return () => document.removeEventListener('pointerdown', onPointerDown, true);
        }, [isOpen, presetsOpen]);

        const handleTriggerKeyDown = useCallback(
            (event: KeyboardEvent<HTMLElement>): void => {
                if (event.key === 'Escape' && (isOpen || presetsOpen)) {
                    event.preventDefault();
                    setIsOpen(false);
                    setPresetsOpen(false);
                }
            },
            [isOpen, presetsOpen],
        );

        const triggerLabel = range ? formatRangeLabel(range) : TRIGGER_PLACEHOLDER;

        const pickPreset = useCallback(
            (preset: CalendarPresetEntry): void => {
                applyRange({ start: preset.start, end: preset.end });
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

        /* ---- Preset combobox (rendered only when presets are supplied) ---- */
        const presetCombobox: ReactNode =
            presetEntries.length > 0 ? (
                <div
                    className={cn(styles.comboboxWrapper, small && styles.comboboxWrapperSmall)}
                    data-open={presetsOpen || undefined}
                >
                    <button
                        type="button"
                        role="combobox"
                        aria-haspopup="listbox"
                        aria-expanded={presetsOpen}
                        aria-controls={listboxId}
                        disabled={disabled}
                        data-testid="calendar/combobox-input"
                        className={cn(styles.comboboxInput, small && styles.comboboxInputSmall)}
                        onClick={() => setPresetsOpen((o) => !o)}
                        onKeyDown={handleTriggerKeyDown}
                    >
                        Combobox Menu
                    </button>
                    <span className={styles.comboboxInputPrefix}>
                        <CalendarIcon size={16} />
                    </span>
                    <span className={styles.comboboxInputSuffix}>
                        <ChevronDown size={16} />
                    </span>
                    {presetsOpen ? (
                        <div className={styles.comboboxPopover}>
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
                        </div>
                    ) : null}
                </div>
            ) : null;

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
                <label className={styles.inputGroupLabel}>Start</label>
                <div className={cn(styles.inputRow, !showTimeInput && styles.inputRowSingle)}>
                    <Input
                        size="small"
                        readOnly
                        placeholder="Jan 01, 2025"
                        value={range ? formatDate(range.start) : ''}
                        data-testid="calendar/input/start-date"
                    />
                    {showTimeInput ? (
                        <Input
                            size="small"
                            placeholder="13:00"
                            value={startTime}
                            className={styles.timeInput}
                            data-testid="calendar/input/start-time"
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    ) : null}
                </div>

                <label className={styles.inputGroupLabel}>End</label>
                <div className={cn(styles.inputRow, !showTimeInput && styles.inputRowSingle)}>
                    <Input
                        size="small"
                        readOnly
                        placeholder="Jan 01, 2025"
                        value={range ? formatDate(range.end) : ''}
                        data-testid="calendar/input/end-date"
                    />
                    {showTimeInput ? (
                        <Input
                            size="small"
                            placeholder="13:00"
                            value={endTime}
                            className={styles.timeInput}
                            data-testid="calendar/input/end-time"
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    ) : null}
                </div>

                <div className={styles.timezoneRow}>
                    {pinnedTimezone ? (
                        <span
                            className={styles.pinnedTimezone}
                            data-testid="calendar/pinned-timezone"
                        >
                            {pinnedTimezone}
                        </span>
                    ) : (
                        <Select
                            size="small"
                            aria-label="Timezone"
                            value={tzValue}
                            onChange={handleTimezoneChange}
                            data-testid="calendar/timezone-select"
                        >
                            {TIMEZONE_OPTIONS.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </Select>
                    )}
                </div>
            </div>
        );

        return (
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
                {presetCombobox}

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
                    className={styles.trigger}
                    onClick={() => setIsOpen((o) => !o)}
                    onKeyDown={handleTriggerKeyDown}
                >
                    {triggerLabel}
                </Button>

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

                {isOpen ? (
                    <div
                        role="dialog"
                        id={dialogId}
                        aria-label="Choose date range"
                        data-state="open"
                        className={cn(
                            styles.popover,
                            popoverAlignment === 'center' && styles.popoverCenter,
                        )}
                        onKeyDown={handleTriggerKeyDown}
                    >
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
                    </div>
                ) : null}
            </div>
        );
    },
);

Calendar.displayName = 'Calendar';

export { Calendar };
