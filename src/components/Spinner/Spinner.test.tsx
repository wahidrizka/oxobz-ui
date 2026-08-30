import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Spinner } from './Spinner';

/**
 * Spinner — geistcn generation tests.
 * All expectations below mirror measured values from the fresh capture
 * (spinner-jul2026.html): single root (role="status", no inner wrapper),
 * per-size bar counts/durations/dimensions, rotate+translate(146%).
 */

/*
 * Akar spinner dikenali lewat role="status".
 *
 * Penanda `data-oxobz-spinner` sudah dihapus karena produksi tidak
 * punya padanannya; yang ada justru `data-glyph="circular"`. Terukur di
 * halaman Button live 30 Agu 2026.
 */
function rootOf(container: HTMLElement): HTMLElement {
    return container.querySelector('[role="status"]') as HTMLElement;
}

function barsOf(container: HTMLElement): HTMLElement[] {
    // Anak terakhir adalah label tersembunyi "Loading...", bukan batang, jadi
    // hanya elemen ber-aria-hidden yang dihitung (persis seperti produksi).
    return Array.from(rootOf(container).children).filter(
        (el) => el.getAttribute('aria-hidden') === 'true',
    ) as HTMLElement[];
}

describe('Spinner', () => {
    it('renders a single status root — no inner wrapper (production structure)', () => {
        const { container } = render(<Spinner />);
        const root = rootOf(container);
        expect(root).toHaveAttribute('role', 'status');
        expect(root).toHaveAttribute('aria-label', 'Loading');
        expect(root).toHaveAttribute('data-testid', 'geistcn/spinner');
        // children are the bars themselves, not a wrapper
        expect(root.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    });

    /*
     * Ukuran BAKU dipasang lewat kelas, bukan gaya inline.
     *
     * Produksi memakai utility `size-3`, `size-4`, dan seterusnya, jadi
     * elemen spinner-nya tidak membawa atribut style sama sekali
     * (terukur di halaman Button live 30 Agu 2026). Ukuran bebas tetap
     * lewat gaya inline, dan itu diuji terpisah di bawah.
     */
    it('memakai kelas ukuran, tanpa gaya inline, untuk ukuran baku', () => {
        const { container } = render(<Spinner />);
        const root = rootOf(container);
        expect(root.getAttribute('style')).toBeNull();
        expect(root.className).toContain('s20');
    });

    it('masih memakai gaya inline untuk ukuran bebas', () => {
        const { container } = render(<Spinner size={19} />);
        const root = rootOf(container);
        expect(root.style.width).toBe('19px');
        expect(root.style.height).toBe('19px');
    });

    // ---- Per-size bar parameters (measured table) ----

    it.each([
        ['sm', 12, 8, '1000ms', '1.5px', '3px'],
        ['md', 16, 10, '1000ms', '1.5px', '4px'],
        ['lg', 20, 12, '1200ms', '2px', '5px'],
        ['xl', 24, 12, '1200ms', '2.5px', '6px'],
        ['2xl', 32, 15, '1200ms', '2.5px', '8px'],
    ] as const)(
        'token %s (%dpx): %d bars, %s, bar %s x %s',
        (token, px, count, duration, h, w) => {
            const { container } = render(<Spinner size={token} />);
            const root = rootOf(container);
            expect(root.className).toContain(`s${px}`);
            const bars = barsOf(container);
            expect(bars).toHaveLength(count);
            expect(bars[0].style.getPropertyValue('--animation-duration')).toBe(duration);
            expect(bars[0].style.height).toBe(h);
            expect(bars[0].style.width).toBe(w);
        },
    );

    it('accepts raw pixel numbers (16 → 10 bars @1000ms)', () => {
        const { container } = render(<Spinner size={16} />);
        expect(barsOf(container)).toHaveLength(10);
        expect(barsOf(container)[0].style.getPropertyValue('--animation-duration')).toBe('1000ms');
    });

    it('positions bars with rotate + translate(146%) at equal steps', () => {
        const { container } = render(<Spinner size={16} />);
        const bars = barsOf(container);
        expect(bars[0].style.transform).toBe('rotate(0deg) translate(146%)');
        expect(bars[1].style.transform).toBe('rotate(36deg) translate(146%)');
        expect(bars[9].style.transform).toBe('rotate(324deg) translate(146%)');
    });

    it('staggers delays from -(duration - slot) to 0 (16px: -900ms … 0ms)', () => {
        const { container } = render(<Spinner size={16} />);
        const bars = barsOf(container);
        expect(bars[0].style.getPropertyValue('--animation-delay')).toBe('-900ms');
        expect(bars[9].style.getPropertyValue('--animation-delay')).toBe('0ms');
    });

    // ---- Color ----

    it('uses the default gray-700 via the CSS var fallback (no inline color)', () => {
        const { container } = render(<Spinner />);
        expect(rootOf(container).style.color).toBe('');
    });

    it('color prop sets both color and --spinner-color on the root', () => {
        const { container } = render(<Spinner color="red" />);
        const root = rootOf(container);
        expect(root.style.color).toBe('red');
        expect(root.style.getPropertyValue('--spinner-color')).toBe('red');
    });

    // ---- Misc ----

    it('merges a custom className', () => {
        const { container } = render(<Spinner className="my-spin" />);
        expect(rootOf(container).className).toContain('my-spin');
        expect(rootOf(container).className).toContain('spinner');
    });

    it('forwards its ref to the root element', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Spinner ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-glyph', 'circular');
        expect(ref.current).not.toHaveAttribute('data-oxobz-spinner');
    });

    /*
     * TANPA data-version. Elemen spinner produksi hanya membawa role,
     * aria-label, data-testid, data-glyph, dan class (terukur 30 Agu
     * 2026). Tidak ada data-version di sana.
     */
    it('tidak memasang data-version', () => {
        const { container } = render(<Spinner />);
        expect(rootOf(container)).not.toHaveAttribute('data-version');
    });
});
