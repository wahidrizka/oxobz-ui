import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Separator } from './Separator';

/** Selects the separator root div. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-separator]');
}

describe('Separator', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-separator and data-version="v1"', () => {
        const { container } = render(<Separator />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('root');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Separator data-version="v2" />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    // ── Orientation ──

    it('defaults to horizontal orientation', () => {
        const { container } = render(<Separator />);
        expect(getRoot(container)).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('applies vertical orientation', () => {
        const { container } = render(<Separator orientation="vertical" />);
        expect(getRoot(container)).toHaveAttribute('data-orientation', 'vertical');
    });

    // ── Decorative / semantic (role + aria-orientation) ──

    it('is decorative by default: role="none", no aria-orientation', () => {
        const { container } = render(<Separator />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('role', 'none');
        expect(root).not.toHaveAttribute('aria-orientation');
    });

    it('decorative vertical: role="none", no aria-orientation', () => {
        const { container } = render(<Separator orientation="vertical" />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('role', 'none');
        expect(root).not.toHaveAttribute('aria-orientation');
    });

    it('semantic horizontal (decorative=false): role="separator", no aria-orientation', () => {
        const { container } = render(<Separator decorative={false} />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('role', 'separator');
        expect(root).not.toHaveAttribute('aria-orientation');
    });

    it('semantic vertical (decorative=false): role="separator", aria-orientation="vertical"', () => {
        const { container } = render(
            <Separator decorative={false} orientation="vertical" />,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('role', 'separator');
        expect(root).toHaveAttribute('aria-orientation', 'vertical');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<Separator className="custom-sep" />);
        const root = getRoot(container);
        expect(root?.className).toContain('root');
        expect(root?.className).toContain('custom-sep');
        expect(root?.className.endsWith('custom-sep')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Separator ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-separator');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-hidden, style)', () => {
        const { container } = render(
            <Separator aria-hidden="true" id="sep-1" style={{ marginTop: '4px' }} />,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'sep-1');
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Separator.displayName).toBe('Separator');
    });
});
