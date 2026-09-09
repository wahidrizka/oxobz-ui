import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { LoadingDots, type LoadingDotsSize } from './LoadingDots';

/** Selects the root span (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-testid="geistcn/loading-dots"]');
}

describe('LoadingDots', () => {
    // ── Rendering ──

    it('renders a root span with the geistcn test id and no marker attributes', () => {
        const { container } = render(<LoadingDots />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('SPAN');
        expect(root?.className).toContain('root');
        // Production carries no data marker and no aria-live (measured live).
        expect(root).not.toHaveAttribute('data-oxobz-loading-dots');
        expect(root).not.toHaveAttribute('data-version');
        expect(root).not.toHaveAttribute('aria-live');
    });

    it('renders exactly three dot spans', () => {
        const { container } = render(<LoadingDots />);
        const dots = container.querySelectorAll('[data-testid="geistcn/loading-dots"] > span');
        expect(dots).toHaveLength(3);
    });

    // ── Accessibility ──

    it('defaults aria-label to "Loading" on the root', () => {
        const { container } = render(<LoadingDots />);
        expect(getRoot(container)).toHaveAttribute('aria-label', 'Loading');
    });

    it('allows overriding aria-label', () => {
        const { container } = render(<LoadingDots aria-label="Saving" />);
        expect(getRoot(container)).toHaveAttribute('aria-label', 'Saving');
    });

    // ── Sizes ──

    const sizes: Array<[LoadingDotsSize, string]> = [
        ['sm', 'sm'],
        ['md', 'md'],
        ['lg', 'lg'],
    ];

    it.each(sizes)('applies the %s size class to each dot', (size, cls) => {
        const { container } = render(<LoadingDots size={size} />);
        const dots = container.querySelectorAll('[data-testid="geistcn/loading-dots"] > span');
        dots.forEach((dot) => {
            expect(dot.className).toContain('dot');
            expect(dot.className).toContain(cls);
        });
    });

    it('defaults to the sm size when size is omitted', () => {
        const { container } = render(<LoadingDots />);
        const dot = container.querySelector('[data-testid="geistcn/loading-dots"] > span');
        expect(dot?.className).toContain('sm');
    });

    // ── Trailing label ──

    it('renders children inside a leading label div before the dots', () => {
        const { container } = render(<LoadingDots>Loading</LoadingDots>);
        const root = getRoot(container);
        const label = root?.firstElementChild;
        expect(label?.tagName).toBe('DIV');
        expect(label?.className).toContain('label');
        expect(label?.textContent).toBe('Loading');
        // The three dots still render after the label.
        expect(
            container.querySelectorAll('[data-testid="geistcn/loading-dots"] > span'),
        ).toHaveLength(3);
    });

    it('renders a supplied child element (parity with the docs example)', () => {
        render(
            <LoadingDots size="md">
                <p>Loading</p>
            </LoadingDots>,
        );
        expect(screen.getByText('Loading').tagName).toBe('P');
    });

    it('renders no label div when no children are provided', () => {
        const { container } = render(<LoadingDots />);
        expect(container.querySelector('[data-testid="geistcn/loading-dots"] > div')).toBeNull();
    });

    // ── Custom className ──

    it('appends custom className after the module classes', () => {
        const { container } = render(<LoadingDots className="custom-dots" />);
        const root = getRoot(container);
        expect(root?.className).toContain('root');
        expect(root?.className).toContain('custom-dots');
        expect(root?.className.endsWith('custom-dots')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root span', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<LoadingDots ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        expect(ref.current).toHaveAttribute('data-testid', 'geistcn/loading-dots');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, style)', () => {
        const { container } = render(<LoadingDots id="dots-1" style={{ opacity: 0.5 }} />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'dots-1');
        expect(root).toHaveStyle({ opacity: '0.5' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(LoadingDots.displayName).toBe('LoadingDots');
    });
});
