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
        expect(root?.className).toContain('card');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <Card data-version="v2">A card</Card>,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders children inside the root', () => {
        render(<Card>A simple card</Card>);
        expect(screen.getByText('A simple card')).toBeInTheDocument();
    });

    // ── type ──

    it('does not apply the secondary class by default (type="default")', () => {
        const { container } = render(<Card>Default</Card>);
        const root = getRoot(container);
        expect(root?.className).toContain('card');
        expect(root?.className).not.toContain('secondary');
    });

    it('applies the secondary class when type="secondary"', () => {
        const { container } = render(<Card type="secondary">Secondary</Card>);
        const root = getRoot(container);
        expect(root?.className).toContain('secondary');
    });

    // ── hover ──

    it('does not apply the hover class by default', () => {
        const { container } = render(<Card>Default</Card>);
        const root = getRoot(container);
        expect(root?.className).not.toContain('hover');
    });

    it('applies the hover class when hover is set', () => {
        const { container } = render(<Card hover>Elevated</Card>);
        const root = getRoot(container);
        expect(root?.className).toContain('hover');
    });

    it('combines type="secondary" with hover', () => {
        const { container } = render(
            <Card hover type="secondary">
                Secondary + hover
            </Card>,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('secondary');
        expect(root?.className).toContain('hover');
    });

    // ── Custom className ──

    it('appends a custom className after the module classes', () => {
        const { container } = render(
            <Card className="custom-card" hover type="secondary">
                Custom
            </Card>,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('card');
        expect(root?.className).toContain('custom-card');
        expect(root?.className.endsWith('custom-card')).toBe(true);
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
