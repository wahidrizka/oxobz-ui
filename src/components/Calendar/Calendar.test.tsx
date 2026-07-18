import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Calendar } from './Calendar';
import { CalendarPopover, getDefaultCalendarPresets } from './CalendarPopover';

/** July 2026 as the pinned visible month (July 1 is a Wednesday). */
const JULY_2026 = new Date(2026, 6, 1);

function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-calendar]');
}

function day(container: HTMLElement, iso: string) {
    return container.querySelector<HTMLSpanElement>(`[data-date="${iso}"]`);
}

describe('Calendar', () => {
    // ── Rendering ──

    it('renders a root with data-oxobz-calendar and data-version="v1"', () => {
        const { container } = render(<Calendar defaultFocusedMonth={JULY_2026} />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('contentWrapper');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <Calendar data-version="v2" defaultFocusedMonth={JULY_2026} />,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the month/year title', () => {
        render(<Calendar defaultFocusedMonth={JULY_2026} />);
        expect(screen.getByText('July 2026')).toBeInTheDocument();
    });

    it('renders a 7-column weekday header (Sunday first by default)', () => {
        const { container } = render(<Calendar defaultFocusedMonth={JULY_2026} />);
        const ths = container.querySelectorAll('thead th');
        expect(ths).toHaveLength(7);
        expect(ths[0].textContent).toBe('S');
        expect(ths[0]).toHaveAttribute('abbr', 'Sunday');
        expect(ths[1]).toHaveAttribute('abbr', 'Monday');
    });

    it('honors weekStartsOn=1 (Monday first)', () => {
        const { container } = render(
            <Calendar defaultFocusedMonth={JULY_2026} weekStartsOn={1} />,
        );
        const ths = container.querySelectorAll('thead th');
        expect(ths[0]).toHaveAttribute('abbr', 'Monday');
        expect(ths[6]).toHaveAttribute('abbr', 'Sunday');
    });

    it('renders a grid with all days of the visible month', () => {
        const { container } = render(<Calendar defaultFocusedMonth={JULY_2026} />);
        expect(day(container, '2026-07-01')).toBeInTheDocument();
        expect(day(container, '2026-07-31')).toBeInTheDocument();
        // leading/trailing days from adjacent months are marked outsideMonth
        const jun28 = day(container, '2026-06-28');
        expect(jun28).toBeInTheDocument();
        expect(jun28?.className).toContain('outsideMonth');
    });

    it('sets role=grid and aria-multiselectable on the table', () => {
        const { container } = render(<Calendar defaultFocusedMonth={JULY_2026} />);
        const table = container.querySelector('table');
        expect(table).toHaveAttribute('role', 'grid');
        expect(table).toHaveAttribute('aria-multiselectable', 'true');
    });

    // ── Month navigation ──

    it('navigates to the next and previous month', () => {
        const { container } = render(<Calendar defaultFocusedMonth={JULY_2026} />);
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
        const { container } = render(<Calendar />);
        expect(day(container, iso)?.className).toContain('highlight');
    });

    // ── Range selection (two clicks) ──

    it('anchors on the first click without firing onChange', () => {
        const onChange = vi.fn();
        const { container } = render(
            <Calendar defaultFocusedMonth={JULY_2026} onChange={onChange} />,
        );
        fireEvent.click(day(container, '2026-07-10')!);
        expect(onChange).not.toHaveBeenCalled();
        expect(day(container, '2026-07-10')?.className).toContain('selected');
    });

    it('commits the range and fires onChange on the second click', () => {
        const onChange = vi.fn();
        const { container } = render(
            <Calendar defaultFocusedMonth={JULY_2026} onChange={onChange} />,
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
            <Calendar defaultFocusedMonth={JULY_2026} onChange={onChange} />,
        );
        fireEvent.click(day(container, '2026-07-20')!);
        fireEvent.click(day(container, '2026-07-12')!);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg.start.getDate()).toBe(12);
        expect(arg.end.getDate()).toBe(20);
    });

    it('paints the range band (aria-selected) across the committed range', () => {
        const { container } = render(
            <Calendar
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
            <Calendar
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
            <Calendar
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
            <Calendar
                defaultFocusedMonth={JULY_2026}
                isDateUnavailable={(d) => d.getDate() === 14}
            />,
        );
        expect(day(container, '2026-07-14')?.className).toContain('disabled');
    });

    // ── isDisabled ──

    it('disables the whole calendar and both nav buttons', () => {
        const { container } = render(
            <Calendar defaultFocusedMonth={JULY_2026} isDisabled />,
        );
        expect(getRoot(container)).toHaveAttribute('data-disabled', 'true');
        expect(container.querySelector('[aria-label="Next"]')).toBeDisabled();
        expect(container.querySelector('[aria-label="Previous"]')).toBeDisabled();
        expect(day(container, '2026-07-15')?.className).toContain('disabled');
    });

    // ── Keyboard navigation ──

    it('moves focus with arrow keys', () => {
        const { container } = render(
            <Calendar
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
            <Calendar
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
            <Calendar
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
        const { container } = render(<Calendar defaultFocusedMonth={JULY_2026} />);
        const tabbable = container.querySelectorAll(
            '[data-date][tabindex="0"]',
        );
        expect(tabbable).toHaveLength(1);
    });

    // ── size ──

    it('reflects the size prop as data-size', () => {
        const { container } = render(
            <Calendar defaultFocusedMonth={JULY_2026} size="small" />,
        );
        expect(getRoot(container)).toHaveAttribute('data-size', 'small');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <Calendar className="custom-cal" defaultFocusedMonth={JULY_2026} />,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('contentWrapper');
        expect(root?.className.endsWith('custom-cal')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root element', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Calendar ref={ref} defaultFocusedMonth={JULY_2026} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-calendar');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Calendar.displayName).toBe('Calendar');
    });
});

/* ================================================================== */
/*  CalendarPopover — trigger + popover chrome                        */
/* ================================================================== */

const JUL_RANGE = {
    start: new Date(2026, 6, 4),
    end: new Date(2026, 6, 18),
};

function trigger() {
    return screen.getByTestId('calendar/trigger/button');
}

describe('CalendarPopover', () => {
    // ── Trigger rendering ──

    it('renders a root with data-oxobz-calendar-popover and data-version="v1"', () => {
        const { container } = render(<CalendarPopover />);
        const root = container.querySelector('[data-oxobz-calendar-popover]');
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('data-version', 'v1');
    });

    it('renders the placeholder label and dialog trigger attributes', () => {
        render(<CalendarPopover />);
        const btn = trigger();
        expect(btn).toHaveTextContent('Select Date Range');
        expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
        expect(btn).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows the committed range as the trigger label', () => {
        render(<CalendarPopover defaultValue={JUL_RANGE} />);
        expect(trigger()).toHaveTextContent('Jul 4 - 18');
    });

    // ── Open / close ──

    it('opens the popover on trigger click', () => {
        render(<CalendarPopover />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        fireEvent.click(trigger());
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes the popover on a second trigger click', () => {
        render(<CalendarPopover />);
        fireEvent.click(trigger());
        fireEvent.click(trigger());
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the popover on Escape', () => {
        render(<CalendarPopover />);
        fireEvent.click(trigger());
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the popover on outside click', () => {
        render(<CalendarPopover />);
        fireEvent.click(trigger());
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.pointerDown(document.body);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('fires onOpenChange when toggled', () => {
        const onOpenChange = vi.fn();
        render(<CalendarPopover onOpenChange={onOpenChange} />);
        fireEvent.click(trigger());
        expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    // ── Presets ──

    it('renders a preset combobox only when presets are provided', () => {
        const { rerender } = render(<CalendarPopover />);
        expect(screen.queryByTestId('calendar/combobox-input')).not.toBeInTheDocument();
        rerender(<CalendarPopover presets={getDefaultCalendarPresets(new Date(2026, 6, 18))} />);
        expect(screen.getByTestId('calendar/combobox-input')).toBeInTheDocument();
    });

    it('opens the preset listbox and sets the range + fires onChange on pick', () => {
        const onChange = vi.fn();
        const presets = getDefaultCalendarPresets(new Date(2026, 6, 18));
        render(<CalendarPopover presets={presets} onChange={onChange} />);
        fireEvent.click(screen.getByTestId('calendar/combobox-input'));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('calendar/preset/Last 7 Days'));
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg).toEqual(presets[1].value);
        // The preset selection closes the listbox.
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('renders each preset with its Title Case label', () => {
        const presets = getDefaultCalendarPresets(new Date(2026, 6, 18));
        render(<CalendarPopover presets={presets} />);
        fireEvent.click(screen.getByTestId('calendar/combobox-input'));
        for (const label of ['Last 3 Days', 'Last 7 Days', 'Last 14 Days', 'Last Month']) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
    });

    // ── Time inputs ──

    it('renders time inputs and lets them change when showTimePicker', () => {
        render(<CalendarPopover showTimePicker defaultValue={JUL_RANGE} />);
        fireEvent.click(trigger());
        const startTime = screen.getByTestId('calendar/input/start-time') as HTMLInputElement;
        expect(startTime).toBeInTheDocument();
        expect(startTime.value).toBe('00:00');
        fireEvent.change(startTime, { target: { value: '09:30' } });
        expect(startTime.value).toBe('09:30');
    });

    it('renders date inputs reflecting the selected range', () => {
        render(<CalendarPopover showTimePicker defaultValue={JUL_RANGE} />);
        fireEvent.click(trigger());
        const startDate = screen.getByTestId('calendar/input/start-date') as HTMLInputElement;
        expect(startDate.value).toBe('Jul 04, 2026');
    });

    // ── Timezone ──

    it('renders a timezone select with the supplied options', () => {
        render(
            <CalendarPopover
                timezones={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'Asia/Jakarta', label: 'Local (Asia/Jakarta)' },
                ]}
            />,
        );
        fireEvent.click(trigger());
        const select = screen.getByTestId('calendar/timezone-select');
        expect(select).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Local (Asia/Jakarta)' })).toBeInTheDocument();
    });

    it('renders pinnedTimezone as read-only text (no select)', () => {
        render(<CalendarPopover pinnedTimezone="UTC" />);
        fireEvent.click(trigger());
        expect(screen.getByTestId('calendar/pinned-timezone')).toHaveTextContent('UTC');
        expect(screen.queryByTestId('calendar/timezone-select')).not.toBeInTheDocument();
    });

    // ── allowClear ──

    it('renders a clear button that empties the selection', () => {
        render(<CalendarPopover defaultValue={JUL_RANGE} allowClear />);
        expect(trigger()).toHaveTextContent('Jul 4 - 18');
        fireEvent.click(screen.getByTestId('calendar/clear'));
        expect(trigger()).toHaveTextContent('Select Date Range');
    });

    it('does not render a clear button without a value', () => {
        render(<CalendarPopover allowClear />);
        expect(screen.queryByTestId('calendar/clear')).not.toBeInTheDocument();
    });

    // ── Layouts ──

    it('applies the compact layout class', () => {
        const { container } = render(
            <CalendarPopover compact presets={getDefaultCalendarPresets()} />,
        );
        expect(container.querySelector('[data-oxobz-calendar-popover]')?.className).toContain(
            'compact',
        );
    });

    it('applies the stacked layout class', () => {
        const { container } = render(
            <CalendarPopover stacked presets={getDefaultCalendarPresets()} />,
        );
        expect(container.querySelector('[data-oxobz-calendar-popover]')?.className).toContain(
            'stacked',
        );
    });

    it('applies the horizontal content-wrapper class inside the popover', () => {
        const { container } = render(<CalendarPopover horizontalLayout showTimePicker />);
        fireEvent.click(trigger());
        const wrapper = container.querySelector(
            '[class*="calendarContentWrapperHorizontal"]',
        );
        expect(wrapper).toBeInTheDocument();
    });

    it('uses the vertical content-wrapper class by default', () => {
        const { container } = render(<CalendarPopover />);
        fireEvent.click(trigger());
        expect(
            container.querySelector('[class*="calendarContentWrapperHorizontal"]'),
        ).not.toBeInTheDocument();
    });

    // ── size ──

    it('reflects the size prop as data-size', () => {
        const { container } = render(<CalendarPopover size="small" />);
        expect(container.querySelector('[data-oxobz-calendar-popover]')).toHaveAttribute(
            'data-size',
            'small',
        );
    });

    // ── disabled ──

    it('disables the trigger', () => {
        render(<CalendarPopover disabled />);
        expect(trigger()).toBeDisabled();
    });

    // ── Custom className / ref / displayName ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<CalendarPopover className="custom-pop" />);
        const root = container.querySelector('[data-oxobz-calendar-popover]');
        expect(root?.className).toContain('calendar');
        expect(root?.className.endsWith('custom-pop')).toBe(true);
    });

    it('forwards ref to the root element', () => {
        const ref = createRef<HTMLDivElement>();
        render(<CalendarPopover ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-calendar-popover');
    });

    it('has the correct displayName', () => {
        expect(CalendarPopover.displayName).toBe('CalendarPopover');
    });
});
