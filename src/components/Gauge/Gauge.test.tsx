import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Gauge, type GaugeSize } from './Gauge';

/** Query the root progressbar element. */
function getRoot(container: HTMLElement): HTMLElement {
    const root = container.querySelector<HTMLElement>(
        '[data-oxobz-progress-circle]',
    );
    if (!root) throw new Error('gauge root not found');
    return root;
}

/** Query the two arc circles [secondary, primary]. */
function getCircles(container: HTMLElement): {
    secondary: SVGCircleElement;
    primary: SVGCircleElement;
} {
    const secondary = container.querySelector<SVGCircleElement>(
        'circle:not([data-oxobz-progress-circle-fg])',
    );
    const primary = container.querySelector<SVGCircleElement>(
        'circle[data-oxobz-progress-circle-fg]',
    );
    if (!secondary || !primary) throw new Error('gauge circles not found');
    return { secondary, primary };
}

describe('Gauge', () => {
    // ── Rendering ──

    it('renders a progressbar div with data-oxobz-progress-circle and data-version="v1"', () => {
        const { container } = render(<Gauge value={50} />);
        const root = getRoot(container);
        expect(root.tagName).toBe('DIV');
        expect(root).toHaveAttribute('role', 'progressbar');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root.className).toContain('circle');
        expect(root.className).toContain('animate');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Gauge data-version="v2" value={50} />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders exactly two arc circles inside an aria-hidden svg', () => {
        const { container } = render(<Gauge value={50} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
        expect(container.querySelectorAll('circle')).toHaveLength(2);
    });

    it('orders the secondary arc before the primary (foreground) arc', () => {
        const { container } = render(<Gauge value={50} />);
        const circles = container.querySelectorAll('circle');
        expect(circles[0]).not.toHaveAttribute('data-oxobz-progress-circle-fg');
        expect(circles[1]).toHaveAttribute('data-oxobz-progress-circle-fg');
    });

    // ── ARIA ──

    it('sets aria-valuemin/max/now from the value', () => {
        const { container } = render(<Gauge value={72} />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('aria-valuemin', '0');
        expect(root).toHaveAttribute('aria-valuemax', '100');
        expect(root).toHaveAttribute('aria-valuenow', '72');
    });

    it('clamps the value into 0–100 for aria-valuenow', () => {
        const { container: over } = render(<Gauge value={150} />);
        expect(getRoot(over)).toHaveAttribute('aria-valuenow', '100');
        const { container: under } = render(<Gauge value={-20} />);
        expect(getRoot(under)).toHaveAttribute('aria-valuenow', '0');
    });

    it('forwards aria-labelledby for the accessible name', () => {
        const { container } = render(
            <Gauge aria-labelledby="uptime-label" value={99} />,
        );
        expect(getRoot(container)).toHaveAttribute(
            'aria-labelledby',
            'uptime-label',
        );
    });

    // ── Sizes ──

    const sizeCases: Array<[GaugeSize, number, string, string]> = [
        ['tiny', 20, '15', '42.5'],
        ['small', 32, '10', '45'],
        ['medium', 64, '10', '45'],
        ['large', 128, '10', '45'],
    ];

    it.each(sizeCases)(
        'renders %s at the right svg size, stroke-width and radius',
        (size, px, strokeWidth, radius) => {
            const { container } = render(<Gauge size={size} value={50} />);
            const svg = container.querySelector('svg');
            expect(svg).toHaveAttribute('width', String(px));
            expect(svg).toHaveAttribute('height', String(px));
            const { primary } = getCircles(container);
            expect(primary).toHaveAttribute('stroke-width', strokeWidth);
            expect(primary).toHaveAttribute('r', radius);
        },
    );

    it('defaults to the medium size', () => {
        const { container } = render(<Gauge value={50} />);
        expect(container.querySelector('svg')).toHaveAttribute('width', '64');
    });

    // ── Geometry CSS variables ──

    it('sets circle-size, circumference and percent-to-px for medium', () => {
        const { container } = render(<Gauge value={50} />);
        const root = getRoot(container);
        expect(root.style.getPropertyValue('--circle-size')).toBe('100px');
        expect(root.style.getPropertyValue('--circumference')).toContain(
            '282.743',
        );
        expect(root.style.getPropertyValue('--percent-to-px')).toContain(
            '2.82743',
        );
    });

    it('uses the per-size gap while both arcs are visible', () => {
        const cases: Array<[GaugeSize, string]> = [
            ['tiny', '9'],
            ['small', '6'],
            ['medium', '5'],
            ['large', '5'],
        ];
        for (const [size, gap] of cases) {
            const { container } = render(<Gauge size={size} value={50} />);
            expect(getRoot(container).style.getPropertyValue('--gap-percent')).toBe(
                gap,
            );
        }
    });

    it('collapses the gap to 0 at value 0 and value 100', () => {
        const { container: zero } = render(<Gauge value={0} />);
        expect(getRoot(zero).style.getPropertyValue('--gap-percent')).toBe('0');
        const { container: full } = render(<Gauge value={100} />);
        expect(getRoot(full).style.getPropertyValue('--gap-percent')).toBe('0');
    });

    // ── Stroke percentages (arc math, snapshot parity) ──

    it('sets primary = value and secondary = 100 - value - 2*gap (medium, value 50)', () => {
        const { container } = render(<Gauge size="medium" value={50} />);
        const { primary, secondary } = getCircles(container);
        expect(primary.style.getPropertyValue('--stroke-percent')).toBe('50');
        expect(secondary.style.getPropertyValue('--stroke-percent')).toBe('40');
    });

    it('hides the primary arc and caps the background at 99 when value is 0', () => {
        const { container } = render(<Gauge value={0} />);
        const { primary, secondary } = getCircles(container);
        expect(primary.style.opacity).toBe('0');
        expect(primary.style.getPropertyValue('--stroke-percent')).toBe('0');
        expect(secondary.style.getPropertyValue('--stroke-percent')).toBe('99');
        expect(secondary.style.opacity).toBe('1');
    });

    it('hides the secondary arc when value is 100', () => {
        const { container } = render(<Gauge value={100} />);
        const { primary, secondary } = getCircles(container);
        expect(primary.style.getPropertyValue('--stroke-percent')).toBe('100');
        expect(primary.style.opacity).toBe('1');
        expect(secondary.style.opacity).toBe('0');
    });

    // ── Arc priority ──

    it('keeps offset-factor 0 for the default (primary) priority', () => {
        const { container } = render(<Gauge value={50} />);
        expect(getRoot(container).style.getPropertyValue('--offset-factor')).toBe(
            '0',
        );
    });

    it('splits the gap evenly with arcPriority="equal" (offset-factor 0.5)', () => {
        const { container } = render(
            <Gauge arcPriority="equal" size="medium" value={50} />,
        );
        const root = getRoot(container);
        expect(root.style.getPropertyValue('--offset-factor')).toBe('0.5');
        const { primary, secondary } = getCircles(container);
        // value 50, gap 5, offset 0.5 → both arcs 45
        expect(primary.style.getPropertyValue('--stroke-percent')).toBe('45');
        expect(secondary.style.getPropertyValue('--stroke-percent')).toBe('45');
    });

    // ── Colors ──

    it('applies the default red/amber/green threshold scale', () => {
        const { container: low } = render(<Gauge value={14} />);
        expect(getCircles(low).primary).toHaveAttribute(
            'stroke',
            'var(--ds-red-800)',
        );
        const { container: mid } = render(<Gauge value={50} />);
        expect(getCircles(mid).primary).toHaveAttribute(
            'stroke',
            'var(--ds-amber-700)',
        );
        const { container: high } = render(<Gauge value={80} />);
        expect(getCircles(high).primary).toHaveAttribute(
            'stroke',
            'var(--ds-green-700)',
        );
    });

    it('defaults the secondary arc to gray-alpha-400', () => {
        const { container } = render(<Gauge value={50} />);
        expect(getCircles(container).secondary).toHaveAttribute(
            'stroke',
            'var(--ds-gray-alpha-400)',
        );
    });

    it('applies named primary and secondary colors', () => {
        const { container } = render(
            <Gauge
                colors={{
                    primary: 'var(--ds-blue-700)',
                    secondary: 'var(--ds-blue-300)',
                }}
                value={50}
            />,
        );
        const { primary, secondary } = getCircles(container);
        expect(primary).toHaveAttribute('stroke', 'var(--ds-blue-700)');
        expect(secondary).toHaveAttribute('stroke', 'var(--ds-blue-300)');
    });

    it('resolves a threshold color map by the greatest key <= value', () => {
        const colors = {
            '0': 'var(--ds-pink-100)',
            '30': 'var(--ds-pink-400)',
            '50': 'var(--ds-pink-500)',
        };
        // value 40 → greatest key <= 40 is 30 → pink-400
        const { container } = render(<Gauge colors={colors} value={40} />);
        expect(getCircles(container).primary).toHaveAttribute(
            'stroke',
            'var(--ds-pink-400)',
        );
        // secondary stays default gray when only thresholds are given
        expect(getCircles(container).secondary).toHaveAttribute(
            'stroke',
            'var(--ds-gray-alpha-400)',
        );
    });

    // ── showValue / children ──

    it('does not render the center content without showValue or children', () => {
        const { container } = render(<Gauge value={50} />);
        expect(
            container.querySelector('[data-oxobz-progress-circle] > div'),
        ).toBeNull();
    });

    it('renders the value with the small font when showValue is set', () => {
        const { container } = render(
            <Gauge showValue size="small" value={80} />,
        );
        const p = screen.getByText('80');
        expect(p.tagName).toBe('P');
        expect(p.className).toContain('text-copy-14');
        expect(p).toHaveStyle({ fontSize: '11px', fontWeight: '500' });
    });

    it('uses the large font (32px/600) for showValue', () => {
        const { container } = render(
            <Gauge showValue size="large" value={100} />,
        );
        const p = screen.getByText('100');
        expect(p).toHaveStyle({ fontSize: '32px', fontWeight: '600' });
        // content wrapper exists and is aria-hidden
        const content = container.querySelector(
            '[data-oxobz-progress-circle] > div',
        );
        expect(content).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders an empty content wrapper for tiny showValue (no number)', () => {
        const { container } = render(
            <Gauge showValue size="tiny" value={80} />,
        );
        const content = container.querySelector(
            '[data-oxobz-progress-circle] > div',
        );
        expect(content).toBeInTheDocument();
        expect(content?.querySelector('p')).toBeNull();
        expect(content?.textContent).toBe('');
    });

    it('renders children as a center overlay instead of the value', () => {
        const { container } = render(
            <Gauge showValue value={50}>
                <span data-testid="icon">★</span>
            </Gauge>,
        );
        const content = container.querySelector(
            '[data-oxobz-progress-circle] > div',
        );
        expect(content).toContainElement(screen.getByTestId('icon'));
        expect(content?.querySelector('p')).toBeNull();
    });

    // ── Indeterminate ──

    it('adds the indeterminate class and drops aria-valuenow', () => {
        const { container } = render(<Gauge indeterminate value={25} />);
        const root = getRoot(container);
        expect(root.className).toContain('indeterminate');
        expect(root).not.toHaveAttribute('aria-valuenow');
        // min/max stay for the progressbar role
        expect(root).toHaveAttribute('aria-valuemin', '0');
        expect(root).toHaveAttribute('aria-valuemax', '100');
    });

    it('is determinate by default (no indeterminate class)', () => {
        const { container } = render(<Gauge value={25} />);
        expect(getRoot(container).className).not.toContain('indeterminate');
    });

    // ── className / ref / props ──

    it('appends a custom className after the module classes', () => {
        const { container } = render(
            <Gauge className="custom-gauge" value={50} />,
        );
        const root = getRoot(container);
        expect(root.className).toContain('circle');
        expect(root.className.endsWith('custom-gauge')).toBe(true);
    });

    it('merges a custom inline style with the geometry variables', () => {
        const { container } = render(
            <Gauge style={{ margin: '8px' }} value={50} />,
        );
        const root = getRoot(container);
        expect(root).toHaveStyle({ margin: '8px' });
        expect(root.style.getPropertyValue('--circle-size')).toBe('100px');
    });

    it('forwards the ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Gauge ref={ref} value={50} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-progress-circle');
    });

    it('has the correct displayName', () => {
        expect(Gauge.displayName).toBe('Gauge');
    });
});
