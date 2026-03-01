import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
    // ---- Rendering ----

    it('renders a spinner element', () => {
        const { container } = render(<Spinner />);
        const el = container.querySelector('[data-oxobz-spinner]');
        expect(el).toBeInTheDocument();
    });

    // ---- Data attributes ----

    it('has data-oxobz-spinner attribute', () => {
        const { container } = render(<Spinner />);
        const el = container.querySelector('[data-oxobz-spinner]');
        expect(el).toHaveAttribute('data-oxobz-spinner', '');
    });

    it('has data-version="v1" attribute', () => {
        const { container } = render(<Spinner />);
        const el = container.querySelector('[data-oxobz-spinner]');
        expect(el).toHaveAttribute('data-version', 'v1');
    });

    // ---- Default size ----

    it('default size is 20px', () => {
        const { container } = render(<Spinner />);
        const el = container.querySelector('[data-oxobz-spinner]') as HTMLElement;
        expect(el.style.width).toBe('20px');
        expect(el.style.height).toBe('20px');
    });

    // ---- Custom sizes ----

    it('renders at custom size 12px', () => {
        const { container } = render(<Spinner size={12} />);
        const el = container.querySelector('[data-oxobz-spinner]') as HTMLElement;
        expect(el.style.width).toBe('12px');
        expect(el.style.height).toBe('12px');
    });

    it('renders at custom size 32px', () => {
        const { container } = render(<Spinner size={32} />);
        const el = container.querySelector('[data-oxobz-spinner]') as HTMLElement;
        expect(el.style.width).toBe('32px');
        expect(el.style.height).toBe('32px');
    });

    it('renders at custom size 40px', () => {
        const { container } = render(<Spinner size={40} />);
        const el = container.querySelector('[data-oxobz-spinner]') as HTMLElement;
        expect(el.style.width).toBe('40px');
        expect(el.style.height).toBe('40px');
    });

    // ---- Bar count ----

    it('renders 12 bars for default size (20px)', () => {
        const { container } = render(<Spinner />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const bars = inner?.querySelectorAll('div');
        expect(bars?.length).toBe(12);
    });

    it('renders 8 bars for small size (12px)', () => {
        const { container } = render(<Spinner size={12} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const bars = inner?.querySelectorAll('div');
        expect(bars?.length).toBe(8);
    });

    it('renders 12 bars for size 32px', () => {
        const { container } = render(<Spinner size={32} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const bars = inner?.querySelectorAll('div');
        expect(bars?.length).toBe(12);
    });

    it('renders 8 bars for size exactly 16px (threshold)', () => {
        const { container } = render(<Spinner size={16} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const bars = inner?.querySelectorAll('div');
        expect(bars?.length).toBe(8);
    });

    it('renders 12 bars for size 17px (above threshold)', () => {
        const { container } = render(<Spinner size={17} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const bars = inner?.querySelectorAll('div');
        expect(bars?.length).toBe(12);
    });

    // ---- CSS animation variables ----

    it('applies correct animation-duration for default size', () => {
        const { container } = render(<Spinner />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const firstBar = inner?.querySelector('div') as HTMLElement;
        expect(firstBar.style.getPropertyValue('--animation-duration')).toBe('1200ms');
    });

    it('applies correct animation-duration for small size', () => {
        const { container } = render(<Spinner size={12} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const firstBar = inner?.querySelector('div') as HTMLElement;
        expect(firstBar.style.getPropertyValue('--animation-duration')).toBe('1000ms');
    });

    // ---- Bar rotation ----

    it('bars are rotated at 30° intervals for 12-bar spinner', () => {
        const { container } = render(<Spinner size={20} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const bars = inner?.querySelectorAll('div');
        bars?.forEach((bar, i) => {
            const rotation = 30 * i;
            expect(bar.style.transform).toContain(`rotate(${rotation}deg)`);
        });
    });

    it('bars are rotated at 45° intervals for 8-bar spinner', () => {
        const { container } = render(<Spinner size={12} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const bars = inner?.querySelectorAll('div');
        bars?.forEach((bar, i) => {
            const rotation = 45 * i;
            expect(bar.style.transform).toContain(`rotate(${rotation}deg)`);
        });
    });

    it('bars use translate(146%) for positioning', () => {
        const { container } = render(<Spinner />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const firstBar = inner?.querySelector('div') as HTMLElement;
        expect(firstBar.style.transform).toContain('translate(146%)');
    });

    // ---- Bar dimensions ----

    it('large spinner bars use percentage dimensions (8% height, 24% width)', () => {
        const { container } = render(<Spinner size={20} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const firstBar = inner?.querySelector('div') as HTMLElement;
        expect(firstBar.style.height).toBe('8%');
        expect(firstBar.style.width).toBe('24%');
    });

    it('small spinner bars use fixed dimensions (1.5px height, 3px width)', () => {
        const { container } = render(<Spinner size={12} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const firstBar = inner?.querySelector('div') as HTMLElement;
        expect(firstBar.style.height).toBe('1.5px');
        expect(firstBar.style.width).toBe('3px');
    });

    // ---- Inner container size ----

    it('inner container matches spinner size', () => {
        const { container } = render(<Spinner size={32} />);
        const inner = container.querySelector('[data-oxobz-spinner] > div') as HTMLElement;
        expect(inner.style.width).toBe('32px');
        expect(inner.style.height).toBe('32px');
    });

    // ---- Default color ----

    it('inner container has default color var(--ds-gray-700)', () => {
        const { container } = render(<Spinner />);
        const inner = container.querySelector('[data-oxobz-spinner] > div') as HTMLElement;
        expect(inner.style.color).toBe('var(--ds-gray-700)');
    });

    // ---- Custom color ----

    it('applies custom color via prop', () => {
        const { container } = render(<Spinner color="red" />);
        const inner = container.querySelector('[data-oxobz-spinner] > div') as HTMLElement;
        expect(inner.style.color).toBe('red');
    });

    // ---- Custom className ----

    it('applies custom className', () => {
        const { container } = render(<Spinner className="my-spinner" />);
        const el = container.querySelector('[data-oxobz-spinner]');
        expect(el?.className).toContain('my-spinner');
    });

    // ---- Ref forwarding ----

    it('forwards ref', () => {
        const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
        render(<Spinner ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    // ---- Custom style ----

    it('merges custom style with size styles', () => {
        const { container } = render(<Spinner style={{ margin: '10px' }} />);
        const el = container.querySelector('[data-oxobz-spinner]') as HTMLElement;
        expect(el.style.margin).toBe('10px');
        expect(el.style.width).toBe('20px');
        expect(el.style.height).toBe('20px');
    });

    // ---- Structure (CSS classes) ----

    it('spinner wrapper has .spinner class', () => {
        const { container } = render(<Spinner />);
        const el = container.querySelector('[data-oxobz-spinner]');
        expect(el?.className).toContain('spinner');
    });

    it('inner container has .inner class', () => {
        const { container } = render(<Spinner />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        expect(inner?.className).toContain('inner');
    });

    it('bars have .line class', () => {
        const { container } = render(<Spinner />);
        const inner = container.querySelector('[data-oxobz-spinner] > div');
        const firstBar = inner?.querySelector('div');
        expect(firstBar?.className).toContain('line');
    });
});
