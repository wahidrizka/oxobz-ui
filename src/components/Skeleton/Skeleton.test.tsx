import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
    // ── Rendering ──

    it('renders a root span with data-oxobz-skeleton and data-version="v1"', () => {
        const { container } = render(<Skeleton width={160} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('SPAN');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('skeleton');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Skeleton data-version="v2" width={160} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root).toHaveAttribute('data-version', 'v2');
    });

    // ── Dimensions (inline style, snapshot parity) ──

    it('sets width and a default min-height of 24px', () => {
        const { container } = render(<Skeleton width={160} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root).toHaveStyle({ width: '160px', minHeight: '24px' });
    });

    it('accepts a string width', () => {
        const { container } = render(<Skeleton width="100%" />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root).toHaveStyle({ width: '100%' });
    });

    it('uses height for the min-height', () => {
        const { container } = render(<Skeleton height={100} width="100%" />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root).toHaveStyle({ minHeight: '100px' });
    });

    it('adds margin-bottom of (boxHeight − height) when boxHeight exceeds height', () => {
        const { container } = render(<Skeleton boxHeight={42} width={160} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        // height defaults to 24 → 42 − 24 = 18
        expect(root).toHaveStyle({ minHeight: '24px', marginBottom: '18px' });
    });

    it('omits margin-bottom when boxHeight equals height', () => {
        const { container } = render(
            <Skeleton boxHeight={48} height={48} width={48} />,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.getAttribute('style')).not.toContain('margin-bottom');
    });

    // ── Shapes ──

    it('applies the pill class', () => {
        const { container } = render(<Skeleton pill width={48} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('pill');
    });

    it('applies the rounded class', () => {
        const { container } = render(<Skeleton rounded width={48} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('rounded');
    });

    it('applies the squared class', () => {
        const { container } = render(<Skeleton squared width={48} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('squared');
    });

    it('applies no shape class by default', () => {
        const { container } = render(<Skeleton width={48} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).not.toContain('pill');
        expect(root?.className).not.toContain('rounded');
        expect(root?.className).not.toContain('squared');
    });

    // ── Animation ──

    it('applies the noAnimation class when animated is false', () => {
        const { container } = render(
            <Skeleton animated={false} height={100} width="100%" />,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('noAnimation');
    });

    it('does not apply the noAnimation class by default', () => {
        const { container } = render(<Skeleton width={160} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).not.toContain('noAnimation');
    });

    // ── show ──

    it('applies the show class by default', () => {
        const { container } = render(<Skeleton width={160} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('show');
    });

    it('drops the show class when show is false', () => {
        const { container } = render(<Skeleton show={false} width={160} />);
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).not.toContain('show');
    });

    // ── Wrapper mode (children without a fixed width) ──

    it('wraps children in wrapper mode and renders them', () => {
        const { container } = render(
            <Skeleton>
                <button type="button">Hidden by skeleton</button>
            </Skeleton>,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('wrapper');
        expect(root?.className).not.toContain('loaded');
        expect(
            screen.getByRole('button', { name: 'Hidden by skeleton' }),
        ).toBeInTheDocument();
    });

    it('emits no inline dimensions in wrapper mode', () => {
        const { container } = render(
            <Skeleton>
                <button type="button">Child</button>
            </Skeleton>,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root).not.toHaveAttribute('style');
    });

    it('keeps the wrapper but drops show when show is false', () => {
        const { container } = render(
            <Skeleton show={false}>
                <button type="button">Not hidden</button>
            </Skeleton>,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('wrapper');
        expect(root?.className).not.toContain('show');
    });

    it('treats {null} children as no children (plain mode)', () => {
        const { container } = render(
            <Skeleton height={100} width="100%">
                {null}
            </Skeleton>,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).not.toContain('wrapper');
        expect(root?.className).not.toContain('loaded');
        expect(root).toHaveStyle({ width: '100%', minHeight: '100px' });
    });

    // ── Loaded mode (children with a fixed width) ──

    it('uses loaded mode for children with a fixed width', () => {
        const { container } = render(
            <Skeleton height={32} width={120}>
                <button type="button">Loading...</button>
            </Skeleton>,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('loaded');
        expect(root?.className).not.toContain('wrapper');
        expect(root).toHaveStyle({ width: '120px', minHeight: '32px' });
        expect(
            screen.getByRole('button', { name: 'Loading...' }),
        ).toBeInTheDocument();
    });

    // ── button prop ──

    it('applies the button class', () => {
        const { container } = render(
            <Skeleton button height={32} width={120}>
                <button type="button">Loading...</button>
            </Skeleton>,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('button');
    });

    // ── Custom className ──

    it('appends custom className after the module classes', () => {
        const { container } = render(
            <Skeleton className="custom-skeleton" width={160} />,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root?.className).toContain('skeleton');
        expect(root?.className).toContain('custom-skeleton');
        expect(root?.className.endsWith('custom-skeleton')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root span', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<Skeleton ref={ref} width={160} />);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        expect(ref.current).toHaveAttribute('data-oxobz-skeleton');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes and merges user style', () => {
        const { container } = render(
            <Skeleton
                aria-hidden="true"
                id="sk-1"
                style={{ opacity: 0.5 }}
                width={160}
            />,
        );
        const root = container.querySelector('[data-oxobz-skeleton]');
        expect(root).toHaveAttribute('id', 'sk-1');
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(root).toHaveStyle({ width: '160px', opacity: '0.5' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Skeleton.displayName).toBe('Skeleton');
    });
});
