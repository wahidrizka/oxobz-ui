import { render, fireEvent, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { CalendarGrid } from './CalendarGrid';
import { Calendar, type CalendarPresets } from './Calendar';

/** July 2026 as the pinned visible month (July 1 is a Wednesday). */
const JULY_2026 = new Date(2026, 6, 1);

function getRoot(container: HTMLElement) {
    // Calendar chrome marks its root with data-oxobz-calendar; the internal
    // CalendarGrid root is plain (production has no marker there), so fall back
    // to the first rendered element for standalone CalendarGrid renders.
    return (
        container.querySelector('[data-oxobz-calendar]') ?? container.firstElementChild
    );
}

function day(container: HTMLElement, iso: string) {
    return container.querySelector<HTMLSpanElement>(`[data-testid="calendar/cell/date-${Number(iso.slice(8, 10))}"]`);
}

/*
 * The Start/End date+time inputs, the Apply button, and the timezone select no
 * longer carry data-testid (production output does not), so tests locate them
 * by the same stable, production-matching attributes: aria-labelledby on the
 * inputs, the accessible role/name for Apply, and the sole native <select> for
 * the timezone. The popover portals to document.body, so these scan the whole
 * document rather than a render container.
 */
const startDateInput = () =>
    document.querySelector('input[aria-labelledby="start-date"]') as HTMLInputElement | null;
const endDateInput = () =>
    document.querySelector('input[aria-labelledby="end-date"]') as HTMLInputElement | null;
const timeInputs = () =>
    Array.from(document.querySelectorAll('input[aria-labelledby="time"]')) as HTMLInputElement[];
const startTimeInput = () => timeInputs()[0] ?? null;
const endTimeInput = () => timeInputs()[1] ?? null;
const timezoneSelect = () => document.querySelector('select') as HTMLSelectElement | null;
const applyButton = () => screen.getByRole('button', { name: /Apply/ });

describe('CalendarGrid', () => {
    // ── Rendering ──

    it('renders a plain root wrapping the grid (production marks no attributes there)', () => {
        const { container } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        // Production's grid root carries no data-oxobz-calendar / data-version /
        // data-size (the Calendar chrome root holds the marker instead).
        expect(root).not.toHaveAttribute('data-oxobz-calendar');
        expect(root?.querySelector('table[role="grid"]')).toBeInTheDocument();
    });

    it('renders the month/year title', () => {
        render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        expect(screen.getByRole('heading', { name: 'July 2026' })).toBeInTheDocument();
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
        expect(screen.getByRole('heading', { name: 'August 2026' })).toBeInTheDocument();
        fireEvent.click(container.querySelector('[aria-label="Previous"]')!);
        fireEvent.click(container.querySelector('[aria-label="Previous"]')!);
        expect(screen.getByRole('heading', { name: 'June 2026' })).toBeInTheDocument();
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
        // Production sets aria-selected on every cell (false when unselected),
        // not only on the selected band.
        expect(day(container, '2026-07-09')?.closest('td')).toHaveAttribute(
            'aria-selected',
            'false',
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
        // Production keeps tabindex="0" on the arrows even when disabled.
        expect(container.querySelector('[aria-label="Next"]')).toHaveAttribute('tabindex', '0');
        expect(container.querySelector('[aria-label="Previous"]')).toHaveAttribute('tabindex', '0');
        expect(day(container, '2026-07-15')?.className).toContain('disabled');
    });

    it('describes a selected range in the caption and points the table at it', () => {
        const { container, rerender } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        const table = container.querySelector('table') as HTMLTableElement;
        const caption = container.querySelector('caption') as HTMLElement;
        // No range: empty caption, no description reference.
        expect(caption.textContent).toBe('');
        expect(table).not.toHaveAttribute('aria-describedby');
        rerender(
            <CalendarGrid
                defaultFocusedMonth={JULY_2026}
                value={{ start: new Date(2026, 6, 10), end: new Date(2026, 6, 14) }}
            />,
        );
        expect(caption.textContent).toBe('Selected Range: July 10, 2026 to July 14, 2026');
        expect(table).toHaveAttribute('aria-describedby', caption.id);
        // One day: the single-date message, with the weekday.
        rerender(
            <CalendarGrid
                defaultFocusedMonth={JULY_2026}
                value={{ start: new Date(2026, 6, 10), end: new Date(2026, 6, 10) }}
            />,
        );
        expect(caption.textContent).toBe('Selected Date: Friday, July 10, 2026');
    });

    it('tightens the rows with compact', () => {
        const { container, rerender } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        expect(container.querySelector('tbody')?.className).not.toContain('tbodyCompact');
        rerender(<CalendarGrid defaultFocusedMonth={JULY_2026} compact />);
        expect(container.querySelector('tbody')?.className).toContain('tbodyCompact');
        container.querySelectorAll('tr').forEach((row) => {
            expect(row.className).toContain('rowCompact');
        });
    });

    // ── Keyboard navigation ──

    /*
     * Kisi tanggal kini berjalan di atas react-aria, dan react-aria menaruh
     * penanganan papan ketik pada SEL yang sedang fokus, bukan pada <table>.
     * Jadi tombol ditembakkan ke sel, dan setiap kali fokus berpindah, tombol
     * berikutnya ditembakkan ke elemen yang sedang aktif.
     */
    // react-aria menyelesaikan penekanan tombol pada keyup, bukan keydown, jadi
    // keduanya ditembakkan. Navigasi panah sendiri hanya butuh keydown, dan
    // keyup tambahan tidak berdampak apa-apa di sana.
    const tekanTombol = (key: string) => {
        const el = document.activeElement!;
        fireEvent.keyDown(el, { key });
        // keyup HARUS ke elemen yang sama, bukan ke elemen yang baru fokus:
        // kalau tidak, panah terhitung bergerak dua kali.
        fireEvent.keyUp(el, { key });
    };

    const fokuskanSel = (container: HTMLElement, iso: string) => {
        const sel = container.querySelector(`[data-testid="calendar/cell/date-${Number(iso.slice(8, 10))}"]`) as HTMLElement;
        sel.focus();
        return sel;
    };

    it('moves focus with arrow keys', () => {
        const { container } = render(
            <CalendarGrid
                defaultValue={{
                    start: new Date(2026, 6, 10),
                    end: new Date(2026, 6, 10),
                }}
            />,
        );
        fokuskanSel(container, '2026-07-10');
        tekanTombol('ArrowRight');
        expect(document.activeElement).toHaveAttribute('data-testid', 'calendar/cell/date-11');
        tekanTombol('ArrowDown');
        expect(document.activeElement).toHaveAttribute('data-testid', 'calendar/cell/date-18');
    });

    it('jumps a month with PageDown', () => {
        const { container } = render(
            <CalendarGrid
                defaultValue={{
                    start: new Date(2026, 6, 10),
                    end: new Date(2026, 6, 10),
                }}
            />,
        );
        fokuskanSel(container, '2026-07-10');
        tekanTombol('PageDown');
        expect(screen.getByRole('heading', { name: 'August 2026' })).toBeInTheDocument();
    });

    it('selects the focused day with Enter', () => {
        const onChange = vi.fn();
        const { container } = render(
            <CalendarGrid
                defaultValue={{
                    start: new Date(2026, 6, 10),
                    end: new Date(2026, 6, 10),
                }}
                onChange={onChange}
            />,
        );
        fokuskanSel(container, '2026-07-10');
        // Enter butuh keydown DAN keyup: react-aria menyelesaikan penekanan di
        // keyup. Sel kedua difokuskan langsung, bukan lewat panah, supaya yang
        // diuji benar-benar "Enter memilih hari yang sedang fokus" dan bukan
        // seluk-beluk navigasi panah (yang sudah punya testnya sendiri).
        tekanTombol('Enter'); // jangkar di tanggal 10
        fokuskanSel(container, '2026-07-11');
        tekanTombol('Enter'); // kunci rentang 10 sampai 11
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg.start.getDate()).toBe(10);
        expect(arg.end.getDate()).toBe(11);
    });

    // ── Roving tabindex ──

    it('exposes exactly one tabbable day (roving tabindex)', () => {
        const { container } = render(<CalendarGrid defaultFocusedMonth={JULY_2026} />);
        const tabbable = container.querySelectorAll(
            '[data-testid^="calendar/cell/date-"][tabindex="0"]',
        );
        expect(tabbable).toHaveLength(1);
    });

    // ── size ──

    it('accepts the size prop without changing the plain root', () => {
        // Production reflects size on the Calendar chrome (class), not on the
        // grid root, so the grid root stays plain regardless of size.
        const { container } = render(
            <CalendarGrid defaultFocusedMonth={JULY_2026} size="small" />,
        );
        expect(getRoot(container)).not.toHaveAttribute('data-size');
    });

    // ── Custom className ──

    it('puts a custom className on the plain root', () => {
        const { container } = render(
            <CalendarGrid className="custom-cal" defaultFocusedMonth={JULY_2026} />,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('custom-cal');
    });

    // ── Ref forwarding ──

    it('forwards ref to the root element', () => {
        const ref = createRef<HTMLDivElement>();
        render(<CalendarGrid ref={ref} defaultFocusedMonth={JULY_2026} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current?.querySelector('table[role="grid"]')).toBeInTheDocument();
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

    it('renders a root with data-oxobz-calendar and data-version="v1"', () => {
        const { container } = render(<Calendar />);
        const root = container.querySelector('[data-oxobz-calendar]');
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

    it('closes the popover on outside click', async () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        /*
         * Radix baru memasang pendengar "tekan di luar" pada tick berikutnya
         * (setTimeout 0), supaya klik yang MEMBUKA popover tidak langsung
         * menutupnya lagi. Tick itu harus dilewati dulu, kalau tidak
         * pointerdown di bawah menembak ke ruang kosong.
         */
        await act(async () => {
            await new Promise((lanjut) => setTimeout(lanjut, 0));
        });
        // Penutupannya sendiri terjadi pada `click`, bukan `pointerdown`
        // (Radix menunda ke click); keduanya ditembakkan supaya urutan
        // peristiwanya sama seperti di peramban sungguhan.
        fireEvent.pointerDown(document.body);
        fireEvent.click(document.body);
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
        fireEvent.click(screen.getByRole('option', { name: 'Last 7 Days' }));
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
        const startTime = startTimeInput() as HTMLInputElement;
        expect(startTime).toBeInTheDocument();
        /*
         * Jam ditampilkan mengikuti locale pembaca, persis seperti produksi:
         * locale 24 jam memberi "00:00" atau "00.00" (id-ID), locale 12 jam
         * memberi "12:00 AM". Ketiganya menunjuk tengah malam yang sama.
         */
        expect(startTime.value).toMatch(/^(00[:.]00|12[:.]00\s?AM)$/i);
        fireEvent.change(startTime, { target: { value: '09:30' } });
        expect(startTime.value).toBe('09:30');
    });

    /*
     * Zona waktu. Diukur langsung di situs Geist dengan peramban di
     * Asia/Jakarta (UTC+7): rentang bawaan tampil "12:00 AM"/"11:59 PM",
     * setelah select diubah ke UTC menjadi "05:00 PM"/"04:59 PM", dan contoh
     * pinnedTimezone="America/Los_Angeles" tampil "10:00 AM"/"09:59 AM".
     * Kolom tanggal TIDAK ikut berubah di ketiga keadaan itu.
     */
    it('renders the time inputs in the pinned timezone', () => {
        // 1 Juli 2026 pukul 00:00 UTC. Di UTC itu tengah malam pas.
        const start = new Date(Date.UTC(2026, 6, 1, 0, 0));
        const end = new Date(Date.UTC(2026, 6, 1, 12, 0));
        render(<Calendar value={{ start, end }} pinnedTimezone="UTC" />);
        fireEvent.click(trigger());
        const startTime = startTimeInput() as HTMLInputElement;
        const endTime = endTimeInput() as HTMLInputElement;
        expect(startTime.value).toMatch(/^(00[:.]00|12[:.]00\s?AM)$/i);
        expect(endTime.value).toMatch(/^(12[:.]00|12[:.]00\s?PM)$/i);
    });

    it('re-derives the time inputs when the timezone select changes', () => {
        const start = new Date(Date.UTC(2026, 6, 1, 0, 0));
        render(<Calendar value={{ start, end: start }} />);
        fireEvent.click(trigger());
        const startTime = startTimeInput() as HTMLInputElement;
        const sebelum = startTime.value;
        fireEvent.change(timezoneSelect(), {
            target: { value: 'UTC' },
        });
        // Di UTC nilainya pasti tengah malam; kalau runner-nya memang sudah
        // UTC, nilainya tidak berubah dan itu tetap benar.
        expect(startTime.value).toMatch(/^(00[:.]00|12[:.]00\s?AM)$/i);
        expect(typeof sebelum).toBe('string');
    });

    it('labels the timezone select and stretches its label to the full row', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        const select = timezoneSelect();
        expect(select).toHaveAttribute('aria-label', 'Timezone');
        // The width lives on the wrapping label, never on the select itself.
        expect(select).not.toHaveAttribute('style');
        const label = select.closest('label') as HTMLLabelElement;
        expect(label.getAttribute('style')).toBe('width: 100%;');
        expect(label).not.toHaveAttribute('class');
    });

    it('accepts 12-hour time text in the time inputs', () => {
        const onChange = vi.fn();
        // Start dan end harus berbeda: kalau sehari yang sama dan jam mulainya
        // menyalip jam selesai, validasi menolaknya, sama seperti produksi.
        const start = new Date(2026, 6, 1, 0, 0);
        const end = new Date(2026, 6, 1, 23, 59);
        render(<Calendar value={{ start, end }} onChange={onChange} />);
        fireEvent.click(trigger());
        const startTime = startTimeInput();
        fireEvent.change(startTime, { target: { value: '1:30PM' } });
        fireEvent.keyDown(startTime, { key: 'Enter' });
        expect(onChange).toHaveBeenCalled();
        const arg = onChange.mock.calls[0][0] as { start: Date };
        expect(arg.start.getHours()).toBe(13);
        expect(arg.start.getMinutes()).toBe(30);
    });

    /*
     * Kolom tanggal bisa diketik dan divalidasi. Semua diukur di situs Geist:
     * inputnya readOnly=false, tidak ada peringatan apa pun sampai Enter
     * ditekan, lalu muncul tulisan "Invalid date format" di baris label dan
     * input yang salah diberi aria-invalid="true".
     */
    const rentang = {
        start: new Date(2026, 6, 1, 0, 0),
        end: new Date(2026, 6, 5, 23, 59),
    };

    it('lets the date inputs be typed into', () => {
        render(<Calendar value={rentang} />);
        fireEvent.click(trigger());
        const startDate = startDateInput() as HTMLInputElement;
        expect(startDate.readOnly).toBe(false);
        expect(startDate.value).toBe('Jul 1, 2026');
    });

    it('stays quiet while typing and only complains on Enter', () => {
        render(<Calendar value={rentang} />);
        fireEvent.click(trigger());
        const startDate = startDateInput();
        fireEvent.change(startDate, { target: { value: 'ngawur' } });
        expect(screen.queryByText('Invalid date format')).not.toBeInTheDocument();
        fireEvent.keyDown(startDate, { key: 'Enter' });
        expect(screen.getByText('Invalid date format')).toBeInTheDocument();
        expect(startDate).toHaveAttribute('aria-invalid', 'true');
        expect(endDateInput()).toHaveAttribute(
            'aria-invalid',
            'false',
        );
    });

    it('clears the message as soon as the field is edited again', () => {
        render(<Calendar value={rentang} />);
        fireEvent.click(trigger());
        const startDate = startDateInput();
        fireEvent.change(startDate, { target: { value: 'ngawur' } });
        fireEvent.keyDown(startDate, { key: 'Enter' });
        expect(screen.getByText('Invalid date format')).toBeInTheDocument();
        fireEvent.change(startDate, { target: { value: 'Jul 2, 2026' } });
        expect(screen.queryByText('Invalid date format')).not.toBeInTheDocument();
    });

    it('commits a typed date and tidies the text', () => {
        const onChange = vi.fn();
        render(<Calendar value={rentang} onChange={onChange} />);
        fireEvent.click(trigger());
        const startDate = startDateInput() as HTMLInputElement;
        // Bentuk panjang juga diterima, lalu ditulis ulang jadi bentuk pendek.
        fireEvent.change(startDate, { target: { value: 'July 2, 2026' } });
        fireEvent.keyDown(startDate, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date };
        expect(arg.start.getDate()).toBe(2);
        expect(startDate.value).toBe('Jul 2, 2026');
    });

    it('refuses a start date after the end date', () => {
        const onChange = vi.fn();
        render(<Calendar value={rentang} onChange={onChange} />);
        fireEvent.click(trigger());
        const startDate = startDateInput();
        fireEvent.change(startDate, { target: { value: 'Jul 9, 2026' } });
        fireEvent.keyDown(startDate, { key: 'Enter' });
        expect(screen.getByText('Start date cannot be after end date')).toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('refuses a date outside minValue', () => {
        const onChange = vi.fn();
        render(
            <Calendar
                value={rentang}
                minValue={new Date(2026, 5, 15)}
                onChange={onChange}
            />,
        );
        fireEvent.click(trigger());
        const startDate = startDateInput();
        fireEvent.change(startDate, { target: { value: 'Jun 1, 2026' } });
        fireEvent.keyDown(startDate, { key: 'Enter' });
        expect(screen.getByText('Outside of allowed range')).toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('reports unreadable time text', () => {
        render(<Calendar value={rentang} />);
        fireEvent.click(trigger());
        const startTime = startTimeInput();
        fireEvent.change(startTime, { target: { value: '99:99' } });
        fireEvent.keyDown(startTime, { key: 'Enter' });
        expect(screen.getByText('Invalid time format')).toBeInTheDocument();
    });

    it('renders date inputs reflecting the selected range', () => {
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} />);
        fireEvent.click(trigger());
        const startDate = startDateInput() as HTMLInputElement;
        // No leading zero on the day — snapshot value format "Jul 4, 2026"
        // (only the static placeholder is the zero-padded "Jan 01, 2025").
        expect(startDate.value).toBe('Jul 4, 2026');
    });

    // ── Popover layout & timezone (production-parity pass) ──

    it('keeps the inputs header FIRST in the DOM under a column-reverse wrapper (grid renders on top)', () => {
        const { container } = render(<Calendar />);
        fireEvent.click(trigger());
        const wrapper = document.querySelector('[role="dialog"] [class*="calendarContentWrapper"]');
        expect(wrapper).toBeInTheDocument();
        // Production writes inputs-then-grid and reverses visually via CSS.
        expect(wrapper?.firstElementChild?.className).toContain('inputsWrapper');
        expect(wrapper?.className).toContain('calendarContentWrapper');
    });

    it('renders the built-in ghost timezone select with exactly UTC + Local options', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        const select = timezoneSelect() as HTMLSelectElement;
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
        fireEvent.click(screen.getByRole('option', { name: 'Last 14 Days' }));
        const combo = screen.getByTestId('calendar/combobox-input') as HTMLInputElement;
        expect(combo.value).toBe('Last 14 Days');
    });

    it('renders the preset list in a Radix popover portaled to the body', () => {
        const { container } = render(<Calendar presets={PRESETS} />);
        const combo = screen.getByTestId('calendar/combobox-input');
        // Closed: the trigger attributes are there, the list is not.
        expect(combo).toHaveAttribute('aria-haspopup', 'dialog');
        expect(combo).toHaveAttribute('data-state', 'closed');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        fireEvent.click(combo);
        expect(combo).toHaveAttribute('data-state', 'open');
        const list = screen.getByRole('listbox');
        // Portaled: the list is outside the component's own subtree.
        expect(container.contains(list)).toBe(false);
        const content = list.closest('[role="dialog"]') as HTMLElement;
        expect(content).toHaveAttribute('data-state', 'open');
        expect(content).toHaveAttribute('data-align', 'start');
        expect(content.parentElement).toHaveAttribute('data-radix-popper-content-wrapper');
        // Items carry no test id, exactly four cmdk attributes worth checking.
        const first = screen.getByRole('option', { name: 'Last 3 Days' });
        expect(first).not.toHaveAttribute('data-testid');
        expect(first).toHaveAttribute('cmdk-item');
        expect(first).toHaveAttribute('data-value', 'Last 3 Days');
    });

    it('shows the typing hints only when the layout is not compact', () => {
        const { unmount } = render(<Calendar presets={PRESETS} />);
        fireEvent.click(screen.getByTestId('calendar/combobox-input'));
        expect(screen.getByText('Type relative times')).toBeInTheDocument();
        unmount();
        render(<Calendar compact presets={PRESETS} />);
        fireEvent.click(screen.getByTestId('calendar/combobox-input'));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.queryByText('Type relative times')).not.toBeInTheDocument();
    });

    it('empties the input while focused and shows the picked label as placeholder', () => {
        render(<Calendar presets={PRESETS} presetIndex={2} />);
        const combo = screen.getByTestId('calendar/combobox-input') as HTMLInputElement;
        expect(combo.value).toBe('Last 14 Days');
        fireEvent.focus(combo);
        expect(combo.value).toBe('');
        expect(combo).toHaveAttribute('placeholder', 'Last 14 Days');
        fireEvent.blur(combo);
        expect(combo.value).toBe('Last 14 Days');
    });

    it('filters the list by the typed text and falls back to one item with that text', () => {
        render(<Calendar presets={PRESETS} />);
        const combo = screen.getByTestId('calendar/combobox-input');
        fireEvent.focus(combo);
        fireEvent.change(combo, { target: { value: '14' } });
        expect(screen.getAllByRole('option')).toHaveLength(1);
        expect(screen.getByRole('option', { name: 'Last 14 Days' })).toBeInTheDocument();
        // "7d" is not part of any label; the keyword table maps it to "Last 7 Days".
        fireEvent.change(combo, { target: { value: '7d' } });
        expect(screen.getAllByRole('option')).toHaveLength(1);
        expect(screen.getByRole('option', { name: 'Last 7 Days' })).toBeInTheDocument();
        // Nothing matches: a single item carrying the typed text itself.
        fireEvent.change(combo, { target: { value: 'zzz' } });
        expect(screen.getAllByRole('option')).toHaveLength(1);
        expect(screen.getByRole('option', { name: 'zzz' })).toBeInTheDocument();
    });

    it('flags the combobox with data-error when the typed text is not a period', () => {
        const onChange = vi.fn();
        render(<Calendar presets={PRESETS} onChange={onChange} />);
        const combo = screen.getByTestId('calendar/combobox-input');
        expect(combo).toHaveAttribute('data-error', 'false');
        fireEvent.focus(combo);
        fireEvent.change(combo, { target: { value: 'zzz' } });
        fireEvent.click(screen.getByRole('option', { name: 'zzz' }));
        expect(onChange).not.toHaveBeenCalled();
        expect(combo).toHaveAttribute('data-error', 'true');
        // Typing again clears the flag.
        fireEvent.change(combo, { target: { value: 'z' } });
        expect(combo).toHaveAttribute('data-error', 'false');
    });

    it('compact: the combobox is minimized until it has focus or a preset is picked', () => {
        render(<Calendar compact presets={PRESETS} />);
        const combo = screen.getByTestId('calendar/combobox-input');
        const button = trigger();
        // Calendar mode: combobox is the small box, the date button is full.
        expect(combo.getAttribute('style')).toContain('color: transparent');
        expect(combo).toHaveAttribute('placeholder', '');
        expect(button.className).not.toContain('triggerMinimized');
        expect(button).toHaveTextContent('Select Date Range');
        // Focus flips it: combobox expands, the date button keeps only its icon.
        fireEvent.focus(combo);
        // React clears the three properties but leaves an empty style attribute,
        // which is also what the live page shows in this state.
        expect(combo.style.color).toBe('');
        expect(combo.style.width).toBe('');
        expect(combo).toHaveAttribute('placeholder', 'Select Period');
        expect(button.className).toContain('triggerMinimized');
        expect(button).not.toHaveTextContent('Select Date Range');
        expect(button).toHaveAttribute('title', 'Select Date Range');
        // Blur without a preset: back to calendar mode.
        fireEvent.blur(combo);
        expect(combo.getAttribute('style')).toContain('color: transparent');
        expect(button.className).not.toContain('triggerMinimized');
    });

    it('compact: stays in preset mode after a preset is picked', () => {
        render(<Calendar compact presets={PRESETS} />);
        const combo = screen.getByTestId('calendar/combobox-input') as HTMLInputElement;
        fireEvent.click(combo);
        fireEvent.click(screen.getByRole('option', { name: 'Last 7 Days' }));
        fireEvent.blur(combo);
        expect(combo.style.color).toBe('');
        expect(combo.value).toBe('Last 7 Days');
        expect(trigger().className).toContain('triggerMinimized');
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
        /*
         * Bentuknya mengikuti locale runner, sama seperti yang diukur di situs
         * Geist: locale 24 jam menulis "12.45 - 23.59" (id-ID), locale 12 jam
         * menulis "12:45pm - 11:59pm" (en-US, huruf kecil dan tanpa spasi).
         */
        expect(trigger().textContent).toMatch(
            /(12[:.]45 - 23[:.]59|12[:.]45pm - 11[:.]59pm)/,
        );
    });

    it('sizes the combobox with the calendar (sizeSmall class drives medium 36px vs small 32px styling)', () => {
        const { container, rerender } = render(<Calendar presets={PRESETS} />);
        expect(container.querySelector('[data-oxobz-calendar]')?.className).not.toContain('sizeSmall');
        rerender(<Calendar presets={PRESETS} size="small" />);
        expect(container.querySelector('[data-oxobz-calendar]')?.className).toContain('sizeSmall');
    });

    /*
     * Pembalikan arah (buka ke atas saat ruang bawah habis) kini milik Radix,
     * bukan pengukuran viewport buatan sendiri. Bagian test yang dulu memalsukan
     * getBoundingClientRect dihapus: jsdom tidak punya tata letak, jadi yang
     * diujinya hanya tiruan kita sendiri, bukan perilaku sungguhan. Sisi bawah
     * sebagai bawaan tetap diperiksa; pembalikannya diperiksa di peramban
     * sungguhan saat halaman /calendar diukur.
     */
    it('opens with data-side="bottom" by default', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'bottom');
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
        expect(startTimeInput()).not.toBeInTheDocument();
        expect(endTimeInput()).not.toBeInTheDocument();
        expect(startDateInput()).toBeInTheDocument();
        expect(endDateInput()).toBeInTheDocument();
    });

    // ── Apply (commits typed Start/End time onto the range) ──
    // Surveyed 32/32 Start/End popovers in calendar-open.html: Apply always
    // renders directly below the End row, regardless of showTimeInput,
    // pinnedTimezone, or whether the range already has a value.

    it('renders an Apply button with an Enter-key hint below the End row', () => {
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} />);
        fireEvent.click(trigger());
        const apply = applyButton();
        expect(apply).toHaveTextContent('Apply');
        expect(apply).toHaveTextContent('↵');
    });

    it('still renders Apply when showTimeInput is false (matches every surveyed popover, not gated on time inputs)', () => {
        render(<Calendar showTimeInput={false} />);
        fireEvent.click(trigger());
        expect(applyButton()).toBeInTheDocument();
    });

    it('still renders Apply with pinnedTimezone', () => {
        render(<Calendar pinnedTimezone="America/Los_Angeles" />);
        fireEvent.click(trigger());
        expect(applyButton()).toBeInTheDocument();
    });

    it('commits typed Start/End time onto the range on Apply click, without closing the popover', () => {
        const onChange = vi.fn();
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} onChange={onChange} />);
        fireEvent.click(trigger());
        const startTime = startTimeInput() as HTMLInputElement;
        const endTime = endTimeInput() as HTMLInputElement;
        fireEvent.change(startTime, { target: { value: '09:30' } });
        fireEvent.change(endTime, { target: { value: '17:45' } });
        fireEvent.click(applyButton());

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
        const startTime = startTimeInput() as HTMLInputElement;
        fireEvent.change(startTime, { target: { value: '08:15' } });
        fireEvent.keyDown(startTime, { key: 'Enter' });

        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        expect(arg.start.getHours()).toBe(8);
        expect(arg.start.getMinutes()).toBe(15);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    /*
     * Diperbaiki 29 Agu 2026. Ekspektasi lama ("Apply tidak berbuat apa-apa")
     * lahir dari perilaku kita sendiri yang mengosongkan kolom tanggal. Di
     * produksi kolom itu terisi hari ini, dan menekan Apply memang menerapkan
     * rentang sehari penuh lalu menutup popover: label pemicunya berubah dari
     * "Select Date Range" menjadi "Sat, Aug 29".
     */
    it('applies today as a full-day range on Apply when nothing is selected yet', () => {
        const onChange = vi.fn();
        render(<Calendar onChange={onChange} />);
        fireEvent.click(trigger());
        fireEvent.click(applyButton());
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0] as { start: Date; end: Date };
        const hariIni = new Date();
        expect(arg.start.getDate()).toBe(hariIni.getDate());
        expect(arg.end.getDate()).toBe(hariIni.getDate());
        expect(arg.start.getHours()).toBe(0);
        expect(arg.end.getHours()).toBe(23);
    });

    // ── Timezone (built-in UTC/Local select, or pinnedTimezone) ──

    it('always renders the built-in UTC / Local timezone select when no pinnedTimezone is given', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        expect(timezoneSelect()).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'UTC' })).toBeInTheDocument();
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        expect(screen.getByRole('option', { name: `Local (${localTz})` })).toBeInTheDocument();
    });

    it('still renders the timezone select when showTimeInput is false (horizontalLayout demo)', () => {
        render(<Calendar horizontalLayout showTimeInput={false} />);
        fireEvent.click(trigger());
        expect(timezoneSelect()).toBeInTheDocument();
        expect(startTimeInput()).not.toBeInTheDocument();
    });

    it('renders pinnedTimezone as read-only text instead of the select', () => {
        render(<Calendar pinnedTimezone="America/Los_Angeles" />);
        fireEvent.click(trigger());
        // A bare span: production puts no test id (or any other attribute) on it.
        const pinned = screen.getByText('America/Los_Angeles');
        expect(pinned.tagName).toBe('SPAN');
        expect(pinned).not.toHaveAttribute('data-testid');
        expect(timezoneSelect()).not.toBeInTheDocument();
    });

    it('shows the field defaults in the pinned zone, not in the viewer zone', () => {
        // With no range the fields describe today's bounds in the viewer's
        // zone, displayed in the pinned one. Los Angeles and Tokyo are 16 or
        // 17 hours apart, so their start times can never be equal.
        const { unmount } = render(<Calendar pinnedTimezone="America/Los_Angeles" />);
        fireEvent.click(trigger());
        const losAngeles = startTimeInput().value;
        unmount();
        render(<Calendar pinnedTimezone="Asia/Tokyo" />);
        fireEvent.click(trigger());
        expect(startTimeInput().value).not.toBe(losAngeles);
    });

    // ── allowClear ──

    /* The clear button follows production's source (read 10 Nov 2026): it sits
       next to the date button, is labelled "Clear input value", carries
       data-clear-button, and exists only with a value and never on compact. */
    it('renders a clear button that empties the selection', () => {
        const onChange = vi.fn();
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} allowClear onChange={onChange} />);
        expect(trigger()).toHaveTextContent('Jul 4 - 18');
        const clear = screen.getByRole('button', { name: 'Clear input value' });
        expect(clear).toHaveAttribute('data-clear-button', 'true');
        expect(clear).toHaveAttribute('type', 'button');
        expect(clear.parentElement).toBe(trigger().parentElement);
        fireEvent.click(clear);
        expect(trigger()).toHaveTextContent('Select Date Range');
        expect(onChange).toHaveBeenLastCalledWith(undefined);
        expect(screen.queryByRole('button', { name: 'Clear input value' })).not.toBeInTheDocument();
    });

    it('does not render a clear button without a value, or on compact', () => {
        const { unmount } = render(<Calendar allowClear />);
        expect(screen.queryByRole('button', { name: 'Clear input value' })).not.toBeInTheDocument();
        unmount();
        render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} allowClear compact />);
        expect(screen.queryByRole('button', { name: 'Clear input value' })).not.toBeInTheDocument();
    });

    // ── Phone (<= 600px): the preset box is a button that opens its own drawer ──

    describe('on a phone', () => {
        beforeEach(() => {
            vi.stubGlobal(
                'matchMedia',
                (query: string) =>
                    ({
                        matches: true,
                        media: query,
                        addEventListener: () => undefined,
                        removeEventListener: () => undefined,
                    }) as unknown as MediaQueryList,
            );
        });

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('opens a "Select Period" drawer with the presets, a search box and Done', async () => {
            render(<Calendar presets={JUL_RANGE_PRESETS} />);
            fireEvent.click(screen.getByRole('button', { name: 'Select Period' }));
            const dialog = await screen.findByRole('dialog');
            expect(dialog).toHaveAccessibleName('Select Period');
            expect(dialog.querySelector('[cmdk-input]')).not.toBeNull();
            expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('type', 'button');
            expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
            const done = screen.getByRole('button', { name: 'Done' });
            expect(done.closest('footer')).not.toBeNull();
            expect(done).toHaveAttribute('type', 'button');
            // the date grid belongs to the other drawer
            expect(dialog.querySelector('[role="grid"]')).toBeNull();
        });

        it('picking a preset applies it and closes the drawer', async () => {
            render(<Calendar presets={JUL_RANGE_PRESETS} />);
            fireEvent.click(screen.getByRole('button', { name: 'Select Period' }));
            await screen.findByRole('dialog');
            const first = screen.getAllByRole('option')[0];
            const label = first.textContent ?? '';
            fireEvent.click(first);
            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
            expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
        });

        it('has no clear button', () => {
            render(<Calendar presets={JUL_RANGE_PRESETS} presetIndex={0} allowClear />);
            expect(screen.queryByRole('button', { name: 'Clear input value' })).not.toBeInTheDocument();
        });
    });

    // ── Layouts ──

    it('applies the compact layout class', () => {
        const { container } = render(<Calendar compact presets={PRESETS} />);
        expect(container.querySelector('[data-oxobz-calendar]')?.className).toContain(
            'compact',
        );
    });

    it('applies the stacked layout class', () => {
        const { container } = render(<Calendar stacked presets={PRESETS} />);
        expect(container.querySelector('[data-oxobz-calendar]')?.className).toContain(
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
        const wrapper = document.querySelector(
            '[class*="calendarContentWrapperHorizontal"]',
        );
        expect(wrapper).toBeInTheDocument();
    });

    it('uses the vertical content-wrapper class by default', () => {
        const { container } = render(<Calendar />);
        fireEvent.click(trigger());
        expect(
            document.querySelector('[class*="calendarContentWrapperHorizontal"]'),
        ).not.toBeInTheDocument();
    });

    // ── popoverAlignment ──

    /*
     * Perataan popover kini diserahkan ke prop `align` milik Radix, bukan kelas
     * CSS buatan sendiri. Radix menuliskannya kembali sebagai atribut data-align,
     * jadi itu yang diperiksa.
     */
    it('defaults popoverAlignment to start', () => {
        render(<Calendar />);
        fireEvent.click(trigger());
        expect(screen.getByRole('dialog')).toHaveAttribute('data-align', 'start');
    });

    it('passes popoverAlignment="center" through to the popover', () => {
        render(<Calendar popoverAlignment="center" />);
        fireEvent.click(trigger());
        expect(screen.getByRole('dialog')).toHaveAttribute('data-align', 'center');
    });

    // ── size ──

    it('reflects the size prop as the sizeSmall class', () => {
        const { container } = render(<Calendar size="small" />);
        expect(container.querySelector('[data-oxobz-calendar]')?.className).toContain('sizeSmall');
    });

    // ── disabled ──

    it('disables the trigger', () => {
        render(<Calendar disabled />);
        expect(trigger()).toBeDisabled();
    });

    // ── Custom className / ref / displayName ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<Calendar className="custom-pop" />);
        const root = container.querySelector('[data-oxobz-calendar]');
        expect(root?.className).toContain('calendar');
        expect(root?.className.endsWith('custom-pop')).toBe(true);
    });

    it('forwards ref to the root element', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Calendar ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-calendar');
    });

    it('has the correct displayName', () => {
        expect(Calendar.displayName).toBe('Calendar');
    });
});
