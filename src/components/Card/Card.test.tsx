import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Card } from './Card';

/** Selects the card root div. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-card]');
}

describe('Card', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-card and data-version="v1"', () => {
        const { container } = render(<Card>A simple card</Card>);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('root');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Card data-version="v2">A card</Card>);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders children inside the root', () => {
        render(<Card>A simple card</Card>);
        expect(screen.getByText('A simple card')).toBeInTheDocument();
    });

    it('applies no variant classes by default', () => {
        const { container } = render(<Card>Plain</Card>);
        const root = getRoot(container);
        for (const cls of ['secondary', 'row', 'border', 'borderBetween', 'shadow', 'hoverable']) {
            expect(root?.className).not.toContain(cls);
        }
    });

    // ── Boolean props ──

    it('applies the secondary class', () => {
        const { container } = render(<Card secondary>S</Card>);
        expect(getRoot(container)?.className).toContain('secondary');
    });

    it('applies the border class', () => {
        const { container } = render(<Card border>B</Card>);
        expect(getRoot(container)?.className).toContain('border');
    });

    it('applies the borderBetween class', () => {
        const { container } = render(<Card borderBetween>D</Card>);
        expect(getRoot(container)?.className).toContain('borderBetween');
    });

    it('applies the shadow class', () => {
        const { container } = render(<Card shadow>Sh</Card>);
        expect(getRoot(container)?.className).toContain('shadow');
    });

    it('applies the hoverable class', () => {
        const { container } = render(<Card hoverable>H</Card>);
        expect(getRoot(container)?.className).toContain('hoverable');
    });

    // ── direction ──

    it('does not apply the row class for the default column direction', () => {
        const { container } = render(<Card direction="column">C</Card>);
        expect(getRoot(container)?.className).not.toContain('row');
    });

    it('applies the row class when direction="row"', () => {
        const { container } = render(<Card direction="row">R</Card>);
        expect(getRoot(container)?.className).toContain('row');
    });

    it('combines every variant prop', () => {
        const { container } = render(
            <Card border borderBetween direction="row" hoverable secondary shadow>
                All
            </Card>,
        );
        const root = getRoot(container);
        for (const cls of ['secondary', 'row', 'border', 'borderBetween', 'shadow', 'hoverable']) {
            expect(root?.className).toContain(cls);
        }
    });

    // ── Custom className ──

    it('appends a custom className after the module classes', () => {
        const { container } = render(
            <Card className="p-4" border shadow>
                Custom
            </Card>,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('root');
        expect(root?.className).toContain('p-4');
        expect(root?.className.endsWith('p-4')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Card ref={ref}>Ref test</Card>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-card');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-label, style)', () => {
        const { container } = render(
            <Card aria-label="profile-card" id="card-1" style={{ marginTop: '4px' }}>
                Forwarded
            </Card>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'card-1');
        expect(root).toHaveAttribute('aria-label', 'profile-card');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Card.displayName).toBe('Card');
    });
});
