import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { LoadingDots, type LoadingDotsSize } from './LoadingDots';

describe('LoadingDots', () => {
    // ── Rendering ──

    it('renders a wrapper span with data-oxobz-loading-dots and data-version="v1"', () => {
        const { container } = render(<LoadingDots />);
        const root = container.querySelector('[data-oxobz-loading-dots]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('SPAN');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('loading');
    });

    it('renders exactly three dot spans as direct children', () => {
        const { container } = render(<LoadingDots />);
        const dots = container.querySelectorAll(
            '[data-oxobz-loading-dots] > span',
        );
        expect(dots).toHaveLength(3);
    });

    it('allows a custom data-version', () => {
        const { container } = render(<LoadingDots data-version="v2" />);
        const root = container.querySelector('[data-oxobz-loading-dots]');
        expect(root).toHaveAttribute('data-version', 'v2');
    });

    // ── Accessibility ──

    it('defaults aria-label to "Loading" on the wrapper', () => {
        const { container } = render(<LoadingDots />);
        const root = container.querySelector('[data-oxobz-loading-dots]');
        expect(root).toHaveAttribute('aria-label', 'Loading');
    });

    it('allows overriding aria-label', () => {
        const { container } = render(<LoadingDots aria-label="Saving" />);
        const root = container.querySelector('[data-oxobz-loading-dots]');
        expect(root).toHaveAttribute('aria-label', 'Saving');
    });

    it('defaults aria-live to "polite" so screen readers announce progress', () => {
        const { container } = render(<LoadingDots />);
        const root = container.querySelector('[data-oxobz-loading-dots]');
        expect(root).toHaveAttribute('aria-live', 'polite');
    });

    it('allows overriding aria-live', () => {
        const { container } = render(<LoadingDots aria-live="assertive" />);
        const root = container.querySelector('[data-oxobz-loading-dots]');
        expect(root).toHaveAttribute('aria-live', 'assertive');
    });

    // ── Sizes ──

    const sizes: Array<[LoadingDotsSize, string]> = [
        ['sm', '2px'],
        ['md', '3px'],
        ['lg', '4px'],
    ];

    it.each(sizes)(
        'sets --loading-dots-size for size="%s"',
        (size, expected) => {
            const { container } = render(<LoadingDots size={size} />);
            const root = container.querySelector<HTMLSpanElement>(
                '[data-oxobz-loading-dots]',
            );
            expect(root?.style.getPropertyValue('--loading-dots-size')).toBe(
                expected,
            );
        },
    );

    it('leaves --loading-dots-size unset when size is omitted (CSS default)', () => {
        const { container } = render(<LoadingDots />);
        const root = container.querySelector<HTMLSpanElement>(
            '[data-oxobz-loading-dots]',
        );
        expect(root?.style.getPropertyValue('--loading-dots-size')).toBe('');
    });

    // ── Trailing label (spacer) ──

    it('renders children inside a leading spacer div before the dots', () => {
        const { container } = render(<LoadingDots>Loading</LoadingDots>);
        const root = container.querySelector('[data-oxobz-loading-dots]');
        const spacer = root?.firstElementChild;
        expect(spacer?.tagName).toBe('DIV');
        expect(spacer?.className).toContain('spacer');
        expect(spacer?.textContent).toBe('Loading');
        // The three dots still render after the spacer.
        expect(
            container.querySelectorAll('[data-oxobz-loading-dots] > span'),
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

    it('renders no spacer div when no children are provided', () => {
        const { container } = render(<LoadingDots />);
        const spacer = container.querySelector(
            '[data-oxobz-loading-dots] > div',
        );
        expect(spacer).toBeNull();
    });

    // ── Custom className ──

    it('appends custom className after the module classes', () => {
        const { container } = render(<LoadingDots className="custom-dots" />);
        const root = container.querySelector('[data-oxobz-loading-dots]');
        expect(root?.className).toContain('loading');
        expect(root?.className).toContain('custom-dots');
        expect(root?.className.endsWith('custom-dots')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the wrapper span', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<LoadingDots ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        expect(ref.current).toHaveAttribute('data-oxobz-loading-dots');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes and merges inline style with the size var', () => {
        const { container } = render(
            <LoadingDots id="dots-1" size="lg" style={{ opacity: 0.5 }} />,
        );
        const root = container.querySelector<HTMLSpanElement>(
            '[data-oxobz-loading-dots]',
        );
        expect(root).toHaveAttribute('id', 'dots-1');
        expect(root).toHaveStyle({ opacity: '0.5' });
        expect(root?.style.getPropertyValue('--loading-dots-size')).toBe('4px');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(LoadingDots.displayName).toBe('LoadingDots');
    });
});
