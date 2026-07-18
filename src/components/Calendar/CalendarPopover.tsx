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
import { Calendar, type DateValue, type RangeValue, type WeekDayIndex } from './Calendar';
import styles from './CalendarPopover.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Trigger size — `medium` (default) or `small`, mirroring Geist's form sizes. */
export type CalendarPopoverSize = 'medium' | 'small';

/**
 * A named preset range shown in the preset combobox
 * (`<Calendar.Presets>` in Geist — here supplied as data).
 */
export interface CalendarPreset {
    /** Title Case label, e.g. `"Last 7 Days"` (matches the Geist snapshot). */
    label: string;
    /** The range applied when the preset is picked. */
    value: RangeValue<DateValue>;
}

/** A timezone option for the timezone `<Select>`. */
export interface CalendarTimezone {
    /** IANA identifier, e.g. `"UTC"` or `"Asia/Jakarta"`. */
    value: string;
    /** Human label, e.g. `"Local (Asia/Jakarta)"`. */
    label: string;
}

export interface CalendarPopoverProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
    /** Controlled selected range. Pass `null` for an empty selection. */
    value?: RangeValue<DateValue> | null;
    /** Uncontrolled initial range. */
    defaultValue?: RangeValue<DateValue> | null;
    /** Fired with the completed range when the grid commits a selection. */
    onChange?: (value: RangeValue<DateValue>) => void;

    /** Trigger label when no range is selected. Default `"Select Date Range"`. */
    placeholder?: string;
    /** Trigger size. Default `"medium"`. */
    size?: CalendarPopoverSize;
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
    presets?: CalendarPreset[];

    /** Compact layout: preset combobox and trigger share one row (button rounded-left). */
    compact?: boolean;
    /** Stacked layout: preset combobox on top, trigger below. */
    stacked?: boolean;
    /**
     * Align the input column horizontally beside the grid inside the popover
     * (Geist `horizontalLayout`).
     */
    horizontalLayout?: boolean;

    /** Show per-endpoint time inputs (HH:MM) in the popover. */
    showTimePicker?: boolean;
    /** Timezone options for the timezone `<Select>`. */
    timezones?: CalendarTimezone[];
    /** Controlled timezone value. */
    timezone?: string;
    /** Uncontrolled initial timezone value. */
    defaultTimezone?: string;
    /** Fired when the timezone `<Select>` changes. */
    onTimezoneChange?: (timezone: string) => void;
    /**
     * Lock the calendar to a fixed timezone shown as read-only text instead of a
     * `<Select>` (Geist `pinnedTimezone`).
     */
    pinnedTimezone?: string;

    /** Render a clear button that empties the selection. */
    allowClear?: boolean;

    /** Controlled popover open state. */
    open?: boolean;
    /** Uncontrolled initial open state. */
    defaultOpen?: boolean;
    /** Fired when the popover opens or closes. */
    onOpenChange?: (open: boolean) => void;

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

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

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
 * Default preset ranges — the labels captured in the Geist snapshot
 * (`Last 3 Days`, `Last 7 Days`, `Last 14 Days`, `Last Month`), computed
 * relative to today. Exported so callers can reuse the exact Geist set.
 */
export function getDefaultCalendarPresets(today: Date = new Date()): CalendarPreset[] {
    const base = startOfDay(today);
    return [
        { label: 'Last 3 Days', value: { start: addDays(base, -2), end: base } },
        { label: 'Last 7 Days', value: { start: addDays(base, -6), end: base } },
        { label: 'Last 14 Days', value: { start: addDays(base, -13), end: base } },
        {
            label: 'Last Month',
            value: {
                start: new Date(base.getFullYear(), base.getMonth() - 1, 1),
                end: new Date(base.getFullYear(), base.getMonth(), 0),
            },
        },
    ];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * CalendarPopover — the trigger + popover "chrome" around the {@link Calendar}
 * grid: a button (or button + preset combobox) that opens a popover containing
 * optional date/time inputs, a timezone select, and the month grid.
 *
 * The grid core is reused verbatim from {@link Calendar}; only the surrounding
 * chrome (trigger, popover, presets, layouts, time/timezone, clear) is added.
 *
 * Rendered DOM (mirrors the geistcn snapshots in calendar-open.html):
 * ```html
 * <div data-oxobz-calendar-popover data-version="v1" style="--width: 250px">
 *   <button data-oxobz-button aria-haspopup="dialog" aria-expanded>Select Date Range</button>
 *   <div role="dialog" data-state="open">
 *     <div class="content">
 *       <div class="calendarContentWrapper">
 *         <div class="inputsWrapper">…date/time inputs + timezone…</div>
 *         <Calendar />
 *       </div>
 *     </div>
 *   </div>
 * </div>
 * ```
 */
const CalendarPopover = forwardRef<HTMLDivElement, CalendarPopoverProps>(
    (
        {
            value,
            defaultValue = null,
            onChange,
            placeholder = 'Select Date Range',
            size = 'medium',
            disabled = false,
            minValue,
            maxValue,
            isDateUnavailable,
            weekStartsOn = 0,
            presets,
            compact = false,
            stacked = false,
            horizontalLayout = false,
            showTimePicker = false,
            timezones,
            timezone,
            defaultTimezone,
            onTimezoneChange,
            pinnedTimezone,
            allowClear = false,
            open,
            defaultOpen = false,
            onOpenChange,
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

        const isOpenControlled = open !== undefined;
        const [internalOpen, setInternalOpen] = useState(defaultOpen);
        const isOpen = isOpenControlled ? open : internalOpen;

        const [presetsOpen, setPresetsOpen] = useState(false);

        const isTzControlled = timezone !== undefined;
        const [internalTz, setInternalTz] = useState(
            defaultTimezone ?? timezones?.[0]?.value ?? '',
        );
        const tzValue = isTzControlled ? timezone : internalTz;

        // Time inputs are local display state (HH:MM), seeded from the range.
        const [startTime, setStartTime] = useState('00:00');
        const [endTime, setEndTime] = useState('23:59');

        const rootRef = useRef<HTMLDivElement | null>(null);
        const dialogId = useId();
        const listboxId = useId();

        const small = size === 'small';

        const setOpen = useCallback(
            (next: boolean): void => {
                if (!isOpenControlled) setInternalOpen(next);
                onOpenChange?.(next);
            },
            [isOpenControlled, onOpenChange],
        );

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
                setOpen(false);
                setPresetsOpen(false);
            };
            document.addEventListener('pointerdown', onPointerDown, true);
            return () => document.removeEventListener('pointerdown', onPointerDown, true);
        }, [isOpen, presetsOpen, setOpen]);

        const handleTriggerKeyDown = useCallback(
            (event: KeyboardEvent<HTMLElement>): void => {
                if (event.key === 'Escape' && (isOpen || presetsOpen)) {
                    event.preventDefault();
                    setOpen(false);
                    setPresetsOpen(false);
                }
            },
            [isOpen, presetsOpen, setOpen],
        );

        const triggerLabel = range ? formatRangeLabel(range) : placeholder;

        const resolvedPresets = useMemo(() => presets ?? [], [presets]);

        const pickPreset = useCallback(
            (preset: CalendarPreset): void => {
                applyRange(preset.value);
                setPresetsOpen(false);
            },
            [applyRange],
        );

        const handleTimezoneChange = useCallback(
            (event: ChangeEvent<HTMLSelectElement>): void => {
                const next = event.target.value;
                if (!isTzControlled) setInternalTz(next);
                onTimezoneChange?.(next);
            },
            [isTzControlled, onTimezoneChange],
        );

        const wrapperClasses = cn(
            styles.calendar,
            resolvedPresets.length > 0 && styles.hasSelect,
            compact && styles.compact,
            stacked && styles.stacked,
            className,
        );

        const widthVar = small ? '180px' : '250px';

        /* ---- Preset combobox (rendered only when presets are supplied) ---- */
        const presetCombobox: ReactNode =
            resolvedPresets.length > 0 ? (
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
                                {resolvedPresets.map((preset) => (
                                    <div
                                        key={preset.label}
                                        role="option"
                                        aria-selected={
                                            range != null &&
                                            preset.value.start.getTime() === range.start.getTime() &&
                                            preset.value.end.getTime() === range.end.getTime()
                                        }
                                        className={styles.comboboxItem}
                                        data-testid={`calendar/preset/${preset.label}`}
                                        onClick={() => pickPreset(preset)}
                                    >
                                        {preset.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null;

        /* ---- Date / time / timezone inputs (popover header) ---- */
        const hasInputs = showTimePicker || Boolean(pinnedTimezone) || Boolean(timezones);
        const inputsSection: ReactNode = hasInputs ? (
            <div className={styles.inputsWrapper}>
                <label className={styles.inputGroupLabel}>Start</label>
                <div className={cn(styles.inputRow, !showTimePicker && styles.inputRowSingle)}>
                    <Input
                        size="small"
                        readOnly
                        placeholder="Jan 01, 2025"
                        value={range ? formatDate(range.start) : ''}
                        data-testid="calendar/input/start-date"
                    />
                    {showTimePicker ? (
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
                <div className={cn(styles.inputRow, !showTimePicker && styles.inputRowSingle)}>
                    <Input
                        size="small"
                        readOnly
                        placeholder="Jan 01, 2025"
                        value={range ? formatDate(range.end) : ''}
                        data-testid="calendar/input/end-date"
                    />
                    {showTimePicker ? (
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

                {pinnedTimezone ? (
                    <div className={styles.timezoneRow}>
                        <label className={styles.inputGroupLabel}>Timezone</label>
                        <span className={styles.pinnedTimezone} data-testid="calendar/pinned-timezone">
                            {pinnedTimezone}
                        </span>
                    </div>
                ) : timezones ? (
                    <div className={styles.timezoneRow}>
                        <label className={styles.inputGroupLabel}>Timezone</label>
                        <Select
                            size="small"
                            value={tzValue}
                            onChange={handleTimezoneChange}
                            data-testid="calendar/timezone-select"
                        >
                            {timezones.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                ) : null}
            </div>
        ) : null;

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
                    title={placeholder}
                    className={styles.trigger}
                    onClick={() => setOpen(!isOpen)}
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
                        className={styles.popover}
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
                                <Calendar
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

CalendarPopover.displayName = 'CalendarPopover';

export { CalendarPopover };
