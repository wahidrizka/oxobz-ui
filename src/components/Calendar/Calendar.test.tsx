import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { CalendarGrid } from './CalendarGrid';
import { Calendar, type CalendarPresets } from './Calendar';

/** July 2026 as the pinned visible month (July 1 is a Wednesday). */
const JULY_2026 = new Date(2026, 6, 1);

function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-calendar]');
}

function day(container: HTMLElement, iso: string) {
    return container.querySelector<HTMLSpanElement>(`[data-date="${iso}"]`);
}

describe('CalendarGrid', () => {
    // ── Rendering ──

    it('renders a root with data-oxobz-calendar and data-version="v1"', () => {
        const { container } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('contentWrapper');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <CalendarGrid data-version="v2" defaultFocusedMonth={JULY_2026} />,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the month/year title', () => {
        render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        expect(screen.getByText('July 2026')).toBeInTheDocument();
    });

    it('renders a 7-column weekday header (Sunday first by default)', () => {
        const { container } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        const ths = container.querySelectorAll('thead th');
        expect(ths).toHaveLength(7);
        expect(ths[0].textContent).toBe('S');
        expect(ths[0]).toHaveAttribute('abbr', 'Sunday');
        expect(ths[1]).toHaveAttribute('abbr', 'Monday');
    });

    it('honors weekStartsOn=1 (Monday first)', () => {
        const { container } = render(
            <CalendarGrid defaultFocusedMonth={JULY_2026} weekStartsOn={1} />,
        );
        const ths = container.querySelectorAll('thead th');
        expect(ths[0]).toHaveAttribute('abbr', 'Monday');
        expect(ths[6]).toHaveAttribute('abbr', 'Sunday');
    });

    it('renders a grid with all days of the visible month', () => {
        const { container } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        expect(day(container, '2026-07-01')).toBeInTheDocument();
        expect(day(container, '2026-07-31')).toBeInTheDocument();
        // leading/trailing days from adjacent months are marked outsideMonth
        const jun28 = day(container, '2026-06-28');
        expect(jun28).toBeInTheDocument();
        expect(jun28?.className).toContain('outsideMonth');
    });

    it('sets role=grid and aria-multiselectable on the table', () => {
        const { container } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        const table = container.querySelector('table');
        expect(table).toHaveAttribute('role', 'grid');
        expect(table).toHaveAttribute('aria-multiselectable', 'true');
    });

    // ── Month navigation ──

    it('navigates to the next and previous month', () => {
        const { container } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        fireEvent.click(container.querySelector('[aria-label="Next"]')!);
        expect(screen.getByText('August 2026')).toBeInTheDocument();
        fireEvent.click(container.querySelector('[aria-label="Previous"]')!);
        fireEvent.click(container.querySelector('[aria-label="Previous"]')!);
        expect(screen.getByText('June 2026')).toBeInTheDocument();
    });

    // ── Today highlight ──

    it('highlights today with the highlight (today) class', () => {
        const now = new Date();
        const iso = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(
            2,
            '0',
        )}-${`${now.getDate()}`.padStart(2, '0')}`;
        const { container } = render(<CalendarGrid />);
        expect(day(container, iso)?.className).toContain('highlight');
    });

    // ── Range selection (two clicks) ──

    it('anchors on the first click without firing onChange', () => {
        const onChange = vi.fn();
        const { container } = render(
            <CalendarGrid defaultFocusedMonth={JULY_2026} onChange={onChange} />,
        );
        fireEvent.click(day(container, '2026-07-10')!);
        expect(onChange).not.toHaveBeenCalled();
        expect(day(container, '2026-07-10')?.className).toContain('selected');
    });

    it('commits the range and fires onChange on the second click', () => {
        const onChange = vi.fn();
        const { container } = render(
            <CalendarGrid defaultFocusedMonth={JULY_2026} onChange={onChange} />,
        );
        fireEvent.click(day(container, '2026-07-10')!);
        fireEvent.click(day(container, '2026-07-15')!);
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as {
            start: Date;
            end: Date;
        };
        expect(arg.start.getDate()).toBe(10);
        expect(arg.end.getDate()).toBe(15);
    });

    it('orders the range regardless of click direction', () => {
        const onChange = vi.fn();
        const { container } = render(
            <CalendarGrid defaultFocusedMonth={JULY_2026} onChange={onChange} />,
        );
        fireEvent.click(day(container, '2026-07-20')!);
        fireEvent.click(day(container, '2026-07-12')!);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg.start.getDate()).toBe(12);
        expect(arg.end.getDate()).toBe(20);
    });

    it('paints the range band (aria-selected) across the committed range', () => {
        const { container } = render(
            <CalendarGrid
                defaultFocusedMonth={JULY_2026}
                value={{
                    start: new Date(2026, 6, 10),
                    end: new Date(2026, 6, 13),
                }}
            />,
        );
        for (const d of ['10', '11', '12', '13']) {
            const cell = day(container, `2026-07-${d}`)?.closest('td');
            expect(cell).toHaveAttribute('aria-selected', 'true');
        }
        expect(day(container, '2026-07-09')?.closest('td')).not.toHaveAttribute(
            'aria-selected',
        );
        expect(day(container, '2026-07-10')?.className).toContain('selected');
        expect(day(container, '2026-07-11')?.className).toContain('inRange');
    });

    // ── min / max / disabled dates ──

    it('disables days before minValue and after maxValue', () => {
        const { container } = render(
            <CalendarGrid
                defaultFocusedMonth={JULY_2026}
                minValue={new Date(2026, 6, 10)}
                maxValue={new Date(2026, 6, 20)}
            />,
        );
        expect(day(container, '2026-07-05')?.className).toContain('disabled');
        expect(day(container, '2026-07-25')?.className).toContain('disabled');
        expect(day(container, '2026-07-15')?.className).not.toContain('disabled');
    });

    it('does not select a disabled day', () => {
        const onChange = vi.fn();
        const { container } = render(
            <CalendarGrid
                defaultFocusedMonth={JULY_2026}
                minValue={new Date(2026, 6, 10)}
                onChange={onChange}
            />,
        );
        fireEvent.click(day(container, '2026-07-05')!);
        fireEvent.click(day(container, '2026-07-06')!);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('marks days unavailable via isDateUnavailable', () => {
        const { container } = render(
            <CalendarGrid
                defaultFocusedMonth={JULY_2026}
                isDateUnavailable={(d) => d.getDate() === 14}
            />,
        );
        expect(day(container, '2026-07-14')?.className).toContain('disabled');
    });

    // ── isDisabled ──

    it('disables the whole calendar and both nav buttons', () => {
        const { container } = render(
            <CalendarGrid defaultFocusedMonth={JULY_2026} isDisabled />,
        );
        expect(getRoot(container)).toHaveAttribute('data-disabled', 'true');
        expect(container.querySelector('[aria-label="Next"]')).toBeDisabled();
        expect(container.querySelector('[aria-label="Previous"]')).toBeDisabled();
        expect(day(container, '2026-07-15')?.className).toContain('disabled');
    });

    // ── Keyboard navigation ──

    it('moves focus with arrow keys', () => {
        const { container } = render(
            <CalendarGrid
                defaultFocusedMonth={JULY_2026}
                defaultValue={{
                    start: new Date(2026, 6, 10),
                    end: new Date(2026, 6, 10),
                }}
            />,
        );
        const table = container.querySelector('table')!;
        fireEvent.keyDown(table, { key: 'ArrowRight' });
        expect(document.activeElement).toHaveAttribute('data-date', '2026-07-11');
        fireEvent.keyDown(table, { key: 'ArrowDown' });
        expect(document.activeElement).toHaveAttribute('data-date', '2026-07-18');
    });

    it('jumps a month with PageDown', () => {
        const { container } = render(
            <CalendarGrid
                defaultFocusedMonth={JULY_2026}
                defaultValue={{
                    start: new Date(2026, 6, 10),
                    end: new Date(2026, 6, 10),
                }}
            />,
        );
        const table = container.querySelector('table')!;
        fireEvent.keyDown(table, { key: 'PageDown' });
        expect(screen.getByText('August 2026')).toBeInTheDocument();
    });

    it('selects the focused day with Enter', () => {
        const onChange = vi.fn();
        const { container } = render(
            <CalendarGrid
                defaultFocusedMonth={JULY_2026}
                defaultValue={{
                    start: new Date(2026, 6, 10),
                    end: new Date(2026, 6, 10),
                }}
                onChange={onChange}
            />,
        );
        const table = container.querySelector('table')!;
        fireEvent.keyDown(table, { key: 'Enter' }); // anchor on the 10th
        fireEvent.keyDown(table, { key: 'ArrowRight' }); // focus the 11th
        fireEvent.keyDown(table, { key: 'Enter' }); // commit 10 → 11
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg.start.getDate()).toBe(10);
        expect(arg.end.getDate()).toBe(11);
    });

    // ── Roving tabindex ──

    it('exposes exactly one tabbable day (roving tabindex)', () => {
        const { container } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        const tabbable = container.querySelectorAll(
            '[data-date][tabindex="0"]',
        );
        expect(tabbable).toHaveLength(1);
    });

    // ── size ──

    it('reflects the size prop as data-size', () => {
        const { container } = render(
            <CalendarGrid defaultFocusedMonth={JULY_2026} size="small" />,
        );
        expect(getRoot(container)).toHaveAttribute('data-size', 'small');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <CalendarGrid className="custom-cal" defaultFocusedMonth={JULY_2026} />,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('contentWrapper');
        expect(root?.className.endsWith('custom-cal')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root element', () => {
        const ref = createRef<HTMLDivElement>();
        render(<CalendarGrid ref={ref} defaultFocusedMonth={JULY_2026} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-calendar');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(CalendarGrid.displayName).toBe('CalendarGrid');
    });
});

/* ================================================================== */
/*  Calendar — trigger + popover chrome                                */
/* ================================================================== */

const JUL_RANGE = {
    start: new Date(2026, 6, 4),
    end: new Date(2026, 6, 18),
};

/** A single-entry preset used to seed an uncontrolled initial range via presetIndex. */
const JUL_RANGE_PRESETS: CalendarPresets = {
    jul: { text: 'July Range', start: JUL_RANGE.start, end: JUL_RANGE.end },
};

const PRESETS: CalendarPresets = {
    'last-3-days': { text: 'Last 3 Days', start: new Date(2026, 6, 16), end: new Date(2026, 6, 18) },
    'last-7-days': { text: 'Last 7 Days', start: new Date(2026, 6, 12), end: new Date(2026, 6, 18) },
    'last-14-days': { text: 'Last 14 Days', start: new Date(2026, 6, 5), end: new Date(2026, 6, 18) },
    'last-month': { text: 'Last Month', start: new Date(2026, 5, 1), end: new Date(2026, 5, 30) },
};

function trigger() {
    return screen.getByTestId('calendar/trigger/button');
}

describe('Calendar', () => {
    // ── Trigger rendering ──

    it('renders a root with data-oxobz-calendar-popover and data-version="v1"', () => {
        const { container } = render(<Calendar />);
        const root = container.querySelector('[data-oxobz-calendar-popover]');
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('data-version', 'v1');
    });

    it('renders the "Select Date Range" placeholder and dialog trigger attributes', () => {
        render(<Calendar />);
        const btn = trigger();
        expect(btn).toHaveTextContent('Select Date Range');
        expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
        expect(btn).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows the committed range as the trigger label (seeded via presetIndex)', () => {
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} />);
        expect(trigger()).toHaveTextContent('Jul 4 - 18');
    });

    it('commits a range picked in the grid and updates the trigger label', () => {
        const onChange = vi.fn();
        render(<Calendar onChange={onChange} />);
        fireEvent.click(trigger());
        // Day numbers 15/20 are always inside the visible month (never part of
        // the adjacent-month leading/trailing padding), so this is safe
        // regardless of which month is "today" when the suite runs.
        fireEvent.click(screen.getByTestId('calendar/cell/date-15'));
        fireEvent.click(screen.getByTestId('calendar/cell/date-20'));
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg.start.getDate()).toBe(15);
        expect(arg.end.getDate()).toBe(20);
        expect(trigger()).not.toHaveTextContent('Select Date Range');
    });

    // ── Open / close ──

    it('opens the popover on trigger click', () => {
        render(<Calendar />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        fireEvent.click(trigger());
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes the popover on a second trigger click', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        fireEvent.click(trigger());
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the popover on Escape', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the popover on outside click', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.pointerDown(document.body);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // ── Presets (Record<string, { text, start, end }>) ──

    it('renders a preset combobox only when presets are provided', () => {
        const { rerender } = render(<Calendar />);
        expect(screen.queryByTestId('calendar/combobox-input')).not.toBeInTheDocument();
        rerender(<Calendar presets={PRESETS} />);
        expect(screen.getByTestId('calendar/combobox-input')).toBeInTheDocument();
    });

    it('opens the preset listbox, shows Title Case labels in insertion order, and fires onChange on pick', () => {
        const onChange = vi.fn();
        render(<Calendar presets={PRESETS} onChange={onChange} />);
        fireEvent.click(screen.getByTestId('calendar/combobox-input'));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        for (const label of ['Last 3 Days', 'Last 7 Days', 'Last 14 Days', 'Last Month']) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
        fireEvent.click(screen.getByTestId('calendar/preset/last-7-days'));
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg).toEqual({
            start: PRESETS['last-7-days'].start,
            end: PRESETS['last-7-days'].end,
        });
        // The preset selection closes the listbox.
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('seeds the initial range from presetIndex (index into insertion order) when uncontrolled', () => {
        render(<Calendar presets={PRESETS} presetIndex={2} />);
        // index 2 -> 'last-14-days' -> Jul 5 - 18
        expect(trigger()).toHaveTextContent('Jul 5 - 18');
    });

    // ── Time inputs (showTimeInput, default true) ──

    it('shows time inputs by default (showTimeInput defaults to true)', () => {
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} />);
        fireEvent.click(trigger());
        const startTime = screen.getByTestId('calendar/input/start-time') as HTMLInputElement;
        expect(startTime).toBeInTheDocument();
        // Locale-formatted 2-digit 24h ("00:00" or "00.00" depending on the
        // runner's locale — production shows the same variance, e.g. "00.00"
        // in the id-ID capture).
        expect(startTime.value).toMatch(/^00[:.]00$/);
        fireEvent.change(startTime, { target: { value: '09:30' } });
        expect(startTime.value).toBe('09:30');
    });

    it('renders date inputs reflecting the selected range', () => {
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} />);
        fireEvent.click(trigger());
        const startDate = screen.getByTestId('calendar/input/start-date') as HTMLInputElement;
        // No leading zero on the day — snapshot value format "Jul 4, 2026"
        // (only the static placeholder is the zero-padded "Jan 01, 2025").
        expect(startDate.value).toBe('Jul 4, 2026');
    });

    // ── Popover layout & timezone (production-parity pass) ──

    it('keeps the inputs header FIRST in the DOM under a column-reverse wrapper (grid renders on top)', () => {
        const { container } = render(<Calendar />);
        fireEvent.click(trigger());
        const wrapper = container.querySelector('[role="dialog"] [class*="calendarContentWrapper"]');
        expect(wrapper).toBeInTheDocument();
        // Production writes inputs-then-grid and reverses visually via CSS.
        expect(wrapper?.firstElementChild?.className).toContain('inputsWrapper');
        expect(wrapper?.className).toContain('calendarContentWrapper');
    });

    it('renders the built-in ghost timezone select with exactly UTC + Local options', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        const select = screen.getByTestId('calendar/timezone-select') as HTMLSelectElement;
        expect(select.className).toContain('timezoneSelect');
        const options = Array.from(select.options).map((o) => o.value);
        expect(options[0]).toBe('UTC');
        expect(options).toHaveLength(2);
        expect(select.options[1].textContent).toMatch(/^Local \(/);
    });

    // ── Preset combobox (text input + two-column dropdown) ──

    it('renders the preset combobox as a text input with the "Select Period" placeholder', () => {
        render(<Calendar presets={PRESETS} />);
        const combo = screen.getByTestId('calendar/combobox-input') as HTMLInputElement;
        expect(combo.tagName).toBe('INPUT');
        expect(combo).toHaveAttribute('placeholder', 'Select Period');
        expect(combo).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('opens a two-column dropdown: preset listbox + typing hint chips', () => {
        render(<Calendar presets={PRESETS} />);
        fireEvent.click(screen.getByTestId('calendar/combobox-input'));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getByText('Type relative times')).toBeInTheDocument();
        expect(screen.getByText('Type fixed times')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '45m' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Jan 1 - Jan 2' })).toBeInTheDocument();
    });

    it('picking a preset writes its label into the combobox input', () => {
        render(<Calendar presets={PRESETS} />);
        fireEvent.click(screen.getByTestId('calendar/combobox-input'));
        fireEvent.click(screen.getByTestId('calendar/preset/last-14-days'));
        const combo = screen.getByTestId('calendar/combobox-input') as HTMLInputElement;
        expect(combo.value).toBe('Last 14 Days');
    });

    it('applies a parsed range when a hint chip is clicked', () => {
        const onChange = vi.fn();
        render(<Calendar presets={PRESETS} onChange={onChange} />);
        fireEvent.click(screen.getByTestId('calendar/combobox-input'));
        fireEvent.click(screen.getByRole('button', { name: 'yesterday' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        const range = onChange.mock.calls[0][0];
        expect(range.start).toBeInstanceOf(Date);
        expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
    });

    // ── Trigger label formats + placeholder tone (user-verified live rules) ──

    it('uses gray-700 placeholder tone without a range, gray-1000 with one', () => {
        const { rerender } = render(<Calendar />);
        expect(trigger().className).toContain('triggerPlaceholder');
        rerender(<Calendar value={{ start: new Date(2026, 6, 4), end: new Date(2026, 6, 18) }} />);
        expect(trigger().className).not.toContain('triggerPlaceholder');
    });

    it('formats a same-day full-day range as "EEE, MMM d" (e.g. "today")', () => {
        render(
            <Calendar
                value={{
                    start: new Date(2026, 6, 19, 0, 0),
                    end: new Date(2026, 6, 19, 23, 59),
                }}
            />,
        );
        expect(trigger()).toHaveTextContent('Sun, Jul 19');
    });

    it('formats a same-day partial range as a locale time range (e.g. "45m")', () => {
        render(
            <Calendar
                value={{
                    start: new Date(2026, 6, 19, 12, 45),
                    end: new Date(2026, 6, 19, 23, 59),
                }}
            />,
        );
        // "12:45 - 23:59" or "12.45 - 23.59" depending on the runner locale.
        expect(trigger().textContent).toMatch(/12[:.]45 - 23[:.]59/);
    });

    it('sizes the combobox with the calendar (data-size drives 40px vs 32px styling)', () => {
        const { container, rerender } = render(<Calendar presets={PRESETS} />);
        expect(container.querySelector('[data-oxobz-calendar-popover]')).toHaveAttribute(
            'data-size',
            'medium',
        );
        rerender(<Calendar presets={PRESETS} size="small" />);
        expect(container.querySelector('[data-oxobz-calendar-popover]')).toHaveAttribute(
            'data-size',
            'small',
        );
    });

    it('opens with data-side="bottom" by default and flips to "top" when space below is short', () => {
        const { container, unmount } = render(<Calendar />);
        fireEvent.click(trigger());
        expect(container.querySelector('[role="dialog"]')).toHaveAttribute('data-side', 'bottom');
        unmount();

        // Anchor near the viewport bottom: dialog (400px tall) no longer fits below.
        const anchorRect = {
            top: 700, bottom: 732, left: 0, right: 250, width: 250, height: 32, x: 0, y: 700,
            toJSON: () => ({}),
        } as DOMRect;
        const dialogRect = { ...anchorRect, height: 400 } as DOMRect;
        const spy = vi
            .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function (this: HTMLElement) {
                return this.getAttribute('role') === 'dialog' ? dialogRect : anchorRect;
            });
        try {
            const second = render(<Calendar />);
            fireEvent.click(screen.getByTestId('calendar/trigger/button'));
            expect(second.container.querySelector('[role="dialog"]')).toHaveAttribute(
                'data-side',
                'top',
            );
        } finally {
            spy.mockRestore();
        }
    });

    it('applies a typed period on Enter (e.g. "2 weeks")', () => {
        const onChange = vi.fn();
        render(<Calendar presets={PRESETS} onChange={onChange} />);
        const combo = screen.getByTestId('calendar/combobox-input');
        fireEvent.change(combo, { target: { value: '2 weeks' } });
        fireEvent.keyDown(combo, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledTimes(1);
        const range = onChange.mock.calls[0][0];
        const days = (range.end.getTime() - range.start.getTime()) / 86_400_000;
        expect(Math.round(days)).toBe(14);
    });

    it('hides only the time sub-inputs when showTimeInput={false}, keeping the date row', () => {
        render(<Calendar showTimeInput={false} />);
        fireEvent.click(trigger());
        expect(screen.queryByTestId('calendar/input/start-time')).not.toBeInTheDocument();
        expect(screen.queryByTestId('calendar/input/end-time')).not.toBeInTheDocument();
        expect(screen.getByTestId('calendar/input/start-date')).toBeInTheDocument();
        expect(screen.getByTestId('calendar/input/end-date')).toBeInTheDocument();
    });

    // ── Apply (commits typed Start/End time onto the range) ──
    // Surveyed 32/32 Start/End popovers in calendar-open.html: Apply always
    // renders directly below the End row, regardless of showTimeInput,
    // pinnedTimezone, or whether the range already has a value.

    it('renders an Apply button with an Enter-key hint below the End row', () => {
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} />);
        fireEvent.click(trigger());
        const apply = screen.getByTestId('calendar/apply');
        expect(apply).toHaveTextContent('Apply');
        expect(apply).toHaveTextContent('↵');
    });

    it('still renders Apply when showTimeInput is false (matches every surveyed popover, not gated on time inputs)', () => {
        render(<Calendar showTimeInput={false} />);
        fireEvent.click(trigger());
        expect(screen.getByTestId('calendar/apply')).toBeInTheDocument();
    });

    it('still renders Apply with pinnedTimezone', () => {
        render(<Calendar pinnedTimezone="America/Los_Angeles" />);
        fireEvent.click(trigger());
        expect(screen.getByTestId('calendar/apply')).toBeInTheDocument();
    });

    it('commits typed Start/End time onto the range on Apply click, without closing the popover', () => {
        const onChange = vi.fn();
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} onChange={onChange} />);
        fireEvent.click(trigger());
        const startTime = screen.getByTestId('calendar/input/start-time') as HTMLInputElement;
        const endTime = screen.getByTestId('calendar/input/end-time') as HTMLInputElement;
        fireEvent.change(startTime, { target: { value: '09:30' } });
        fireEvent.change(endTime, { target: { value: '17:45' } });
        fireEvent.click(screen.getByTestId('calendar/apply'));

        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg.start.getHours()).toBe(9);
        expect(arg.start.getMinutes()).toBe(30);
        expect(arg.end.getHours()).toBe(17);
        expect(arg.end.getMinutes()).toBe(45);
        // The date portion of the range is preserved — only the time changes.
        expect(arg.start.getDate()).toBe(JUL_RANGE.start.getDate());
        // Apply must not close the popover — no evidence it should (documented decision).
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('commits typed time when Enter is pressed inside a time input', () => {
        const onChange = vi.fn();
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} onChange={onChange} />);
        fireEvent.click(trigger());
        const startTime = screen.getByTestId('calendar/input/start-time') as HTMLInputElement;
        fireEvent.change(startTime, { target: { value: '08:15' } });
        fireEvent.keyDown(startTime, { key: 'Enter' });

        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg.start.getHours()).toBe(8);
        expect(arg.start.getMinutes()).toBe(15);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does nothing on Apply when no range is selected yet', () => {
        const onChange = vi.fn();
        render(<Calendar onChange={onChange} />);
        fireEvent.click(trigger());
        fireEvent.click(screen.getByTestId('calendar/apply'));
        expect(onChange).not.toHaveBeenCalled();
    });

    // ── Timezone (built-in UTC/Local select, or pinnedTimezone) ──

    it('always renders the built-in UTC / Local timezone select when no pinnedTimezone is given', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        expect(screen.getByTestId('calendar/timezone-select')).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'UTC' })).toBeInTheDocument();
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        expect(screen.getByRole('option', { name: `Local (${localTz})` })).toBeInTheDocument();
    });

    it('still renders the timezone select when showTimeInput is false (horizontalLayout demo)', () => {
        render(<Calendar horizontalLayout showTimeInput={false} />);
        fireEvent.click(trigger());
        expect(screen.getByTestId('calendar/timezone-select')).toBeInTheDocument();
        expect(screen.queryByTestId('calendar/input/start-time')).not.toBeInTheDocument();
    });

    it('renders pinnedTimezone as read-only text instead of the select', () => {
        render(<Calendar pinnedTimezone="America/Los_Angeles" />);
        fireEvent.click(trigger());
        expect(screen.getByTestId('calendar/pinned-timezone')).toHaveTextContent(
            'America/Los_Angeles',
        );
        expect(screen.queryByTestId('calendar/timezone-select')).not.toBeInTheDocument();
    });

    // ── allowClear ──

    it('renders a clear button that empties the selection', () => {
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} allowClear />);
        expect(trigger()).toHaveTextContent('Jul 4 - 18');
        fireEvent.click(screen.getByTestId('calendar/clear'));
        expect(trigger()).toHaveTextContent('Select Date Range');
    });

    it('does not render a clear button without a value', () => {
        render(<Calendar allowClear />);
        expect(screen.queryByTestId('calendar/clear')).not.toBeInTheDocument();
    });

    // ── Layouts ──

    it('applies the compact layout class', () => {
        const { container } = render(<Calendar compact presets={PRESETS} />);
        expect(container.querySelector('[data-oxobz-calendar-popover]')?.className).toContain(
            'compact',
        );
    });

    it('applies the stacked layout class', () => {
        const { container } = render(<Calendar stacked presets={PRESETS} />);
        expect(container.querySelector('[data-oxobz-calendar-popover]')?.className).toContain(
            'stacked',
        );
    });

    // ── Compact combobox overlap fix ──
    // Root cause (calendar-open.html "Compact" example): production renders
    // NO prefix icon at all on the compact combobox, and the trigger button
    // renders FIRST (button-left, combobox-right) — the opposite order of
    // the default/stacked layouts. Rendering the icon unconditionally, with
    // the combobox always first, is what made the icon sit on top of
    // "Combobox Menu".

    function triggerAndComboboxOrder(container: HTMLElement): string[] {
        const triggerEl = container.querySelector('[data-testid="calendar/trigger/button"]');
        const comboboxEl = container.querySelector('[data-testid="calendar/combobox-input"]');
        if (!triggerEl || !comboboxEl) return [];
        // eslint-disable-next-line no-bitwise
        const comboboxFollowsTrigger = Boolean(
            triggerEl.compareDocumentPosition(comboboxEl) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
        return comboboxFollowsTrigger
            ? ['calendar/trigger/button', 'calendar/combobox-input']
            : ['calendar/combobox-input', 'calendar/trigger/button'];
    }

    it('does not render a prefix icon on the compact combobox (no icon to overlap the text)', () => {
        const { container } = render(<Calendar compact presets={PRESETS} />);
        expect(container.querySelector('[class*="comboboxInputPrefix"]')).not.toBeInTheDocument();
        // The chevron suffix icon is still there — only the prefix is suppressed.
        expect(container.querySelector('[class*="comboboxInputSuffix"]')).toBeInTheDocument();
    });

    it('renders a prefix icon on the combobox for the default (non-compact) layout', () => {
        const { container } = render(<Calendar presets={PRESETS} />);
        expect(container.querySelector('[class*="comboboxInputPrefix"]')).toBeInTheDocument();
    });

    it('renders a prefix icon on the combobox for the stacked layout', () => {
        const { container } = render(<Calendar stacked presets={PRESETS} />);
        expect(container.querySelector('[class*="comboboxInputPrefix"]')).toBeInTheDocument();
    });

    it('renders the trigger button before the combobox in compact layout (matches production order)', () => {
        const { container } = render(<Calendar compact presets={PRESETS} />);
        expect(triggerAndComboboxOrder(container)).toEqual([
            'calendar/trigger/button',
            'calendar/combobox-input',
        ]);
    });

    it('renders the combobox before the trigger button in the default (non-compact) layout', () => {
        const { container } = render(<Calendar presets={PRESETS} />);
        expect(triggerAndComboboxOrder(container)).toEqual([
            'calendar/combobox-input',
            'calendar/trigger/button',
        ]);
    });

    it('renders the combobox before the trigger button in stacked layout', () => {
        const { container } = render(<Calendar stacked presets={PRESETS} />);
        expect(triggerAndComboboxOrder(container)).toEqual([
            'calendar/combobox-input',
            'calendar/trigger/button',
        ]);
    });

    it('applies the horizontal content-wrapper class inside the popover', () => {
        const { container } = render(<Calendar horizontalLayout />);
        fireEvent.click(trigger());
        const wrapper = container.querySelector(
            '[class*="calendarContentWrapperHorizontal"]',
        );
        expect(wrapper).toBeInTheDocument();
    });

    it('uses the vertical content-wrapper class by default', () => {
        const { container } = render(<Calendar />);
        fireEvent.click(trigger());
        expect(
            container.querySelector('[class*="calendarContentWrapperHorizontal"]'),
        ).not.toBeInTheDocument();
    });

    // ── popoverAlignment ──

    it('defaults popoverAlignment to start (no center-alignment class)', () => {
        const { container } = render(<Calendar />);
        fireEvent.click(trigger());
        const dialog = container.querySelector('[role="dialog"]');
        expect(dialog?.className).not.toContain('popoverCenter');
    });

    it('applies a center-alignment class when popoverAlignment="center"', () => {
        const { container } = render(<Calendar popoverAlignment="center" />);
        fireEvent.click(trigger());
        const dialog = container.querySelector('[role="dialog"]');
        expect(dialog?.className).toContain('popoverCenter');
    });

    // ── size ──

    it('reflects the size prop as data-size', () => {
        const { container } = render(<Calendar size="small" />);
        expect(container.querySelector('[data-oxobz-calendar-popover]')).toHaveAttribute(
            'data-size',
            'small',
        );
    });

    // ── disabled ──

    it('disables the trigger', () => {
        render(<Calendar disabled />);
        expect(trigger()).toBeDisabled();
    });

    // ── Custom className / ref / displayName ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<Calendar className="custom-pop" />);
        const root = container.querySelector('[data-oxobz-calendar-popover]');
        expect(root?.className).toContain('calendar');
        expect(root?.className.endsWith('custom-pop')).toBe(true);
    });

    it('forwards ref to the root element', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Calendar ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-calendar-popover');
    });

    it('has the correct displayName', () => {
        expect(Calendar.displayName).toBe('Calendar');
    });
});
