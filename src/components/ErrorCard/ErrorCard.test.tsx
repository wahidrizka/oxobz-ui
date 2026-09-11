import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { ErrorCard } from './ErrorCard';

/**
 * Selects the root card block. Production's root carries no marker attribute,
 * so the card is reached by its own element rather than a data-attribute.
 */
function getRoot(container: HTMLElement) {
    return container.firstElementChild;
}

describe('ErrorCard', () => {
    // ── Rendering ──

    it('renders a plain root div with no marker or version attribute', () => {
        const { container } = render(<ErrorCard title="No credits left" />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root?.className).toContain('root');
        expect(root).not.toHaveAttribute('data-oxobz-error-card');
        expect(root).not.toHaveAttribute('data-version');
    });

    it('renders the title as a centered h3', () => {
        render(<ErrorCard title="No credits left" />);
        const title = screen.getByText('No credits left');
        expect(title.tagName).toBe('H3');
        expect(title.className).toContain('text-copy-16');
    });

    it('renders the error icon before the title, without aria-hidden', () => {
        const { container } = render(<ErrorCard title="No credits left" />);
        const icon = getRoot(container)?.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).not.toHaveAttribute('aria-hidden');
    });

    // ── message ──

    it('renders nothing for message, matching production', () => {
        const { container } = render(
            <ErrorCard message="Lorem ipsum dolor sit amet." title="No credits left" />,
        );
        expect(
            screen.queryByText('Lorem ipsum dolor sit amet.'),
        ).not.toBeInTheDocument();
        expect(container.querySelector('.oxobz-sr-only')).not.toBeInTheDocument();
    });

    it('keeps message out of the DOM as an attribute too', () => {
        const { container } = render(
            <ErrorCard message="Lorem ipsum." title="No credits left" />,
        );
        expect(getRoot(container)).not.toHaveAttribute('message');
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
        const { container } = render(<ErrorCard ref={ref} title="No credits left" />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toBe(getRoot(container));
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
