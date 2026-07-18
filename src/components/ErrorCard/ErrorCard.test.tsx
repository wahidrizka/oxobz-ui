import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { ErrorCard } from './ErrorCard';

/** Selects the root card block. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-error-card]');
}

describe('ErrorCard', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-error-card and data-version="v1"', () => {
        const { container } = render(<ErrorCard title="No credits left" />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('root');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <ErrorCard data-version="v2" title="No credits left" />,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the title as a centered h3', () => {
        render(<ErrorCard title="No credits left" />);
        const title = screen.getByText('No credits left');
        expect(title.tagName).toBe('H3');
        expect(title.className).toContain('text-copy-16');
    });

    it('renders a decorative, aria-hidden error icon before the title', () => {
        const { container } = render(<ErrorCard title="No credits left" />);
        const root = getRoot(container);
        const icon = root?.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    // ── message (visually-hidden, see ErrorCard.tsx doc comment) ──

    it('renders no message span when message is omitted', () => {
        const { container } = render(<ErrorCard title="No credits left" />);
        expect(container.querySelector('.oxobz-sr-only')).not.toBeInTheDocument();
    });

    it('exposes message as visually-hidden text when provided', () => {
        render(
            <ErrorCard message="Lorem ipsum dolor sit amet." title="No credits left" />,
        );
        const message = screen.getByText('Lorem ipsum dolor sit amet.');
        expect(message.tagName).toBe('SPAN');
        expect(message.className).toContain('oxobz-sr-only');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <ErrorCard className="custom-error-card" title="No credits left" />,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('root');
        expect(root?.className).toContain('custom-error-card');
        expect(root?.className.endsWith('custom-error-card')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<ErrorCard ref={ref} title="No credits left" />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-error-card');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, style)', () => {
        const { container } = render(
            <ErrorCard id="error-card-1" style={{ marginTop: '4px' }} title="No credits left" />,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'error-card-1');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(ErrorCard.displayName).toBe('ErrorCard');
    });
});
