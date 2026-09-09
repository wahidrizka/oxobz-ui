import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Separator } from './Separator';

/** Selects the separator root div. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-testid="geistcn/separator"]');
}

describe('Separator', () => {
    // ── Rendering ──

    it('renders a root div with the geistcn test id and slot, no marker attributes', () => {
        const { container } = render(<Separator />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-slot', 'separator');
        expect(root?.className).toContain('root');
        expect(root).not.toHaveAttribute('data-oxobz-separator');
        expect(root).not.toHaveAttribute('data-version');
    });

    // ── Orientation + role + aria ──

    it('defaults to horizontal: role="separator", aria-orientation="horizontal"', () => {
        const { container } = render(<Separator />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('data-orientation', 'horizontal');
        expect(root).toHaveAttribute('role', 'separator');
        expect(root).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('applies vertical: role="separator", aria-orientation="vertical"', () => {
        const { container } = render(<Separator orientation="vertical" />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('data-orientation', 'vertical');
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
        expect(ref.current).toHaveAttribute('data-testid', 'geistcn/separator');
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
