import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Error } from './Error';

/** Selects the root error block. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-error]');
}

describe('Error', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-error and data-version="v1"', () => {
        const { container } = render(<Error>Something failed.</Error>);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('error');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <Error data-version="v2">Something failed.</Error>,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders role="alert" and aria-atomic="true"', () => {
        const { container } = render(<Error>Something failed.</Error>);
        const root = getRoot(container);
        expect(root).toHaveAttribute('role', 'alert');
        expect(root).toHaveAttribute('aria-atomic', 'true');
    });

    it('renders the message text', () => {
        render(<Error>This email address is already in use.</Error>);
        expect(
            screen.getByText('This email address is already in use.'),
        ).toBeInTheDocument();
    });

    it('renders a hidden icon before the message', () => {
        const { container } = render(<Error>Something failed.</Error>);
        const root = getRoot(container);
        const iconHolder = root?.firstElementChild;
        expect(iconHolder).toHaveAttribute('aria-hidden', 'true');
        expect(iconHolder?.querySelector('svg')).toBeInTheDocument();
    });

    // ── label ──

    it('renders no bold label by default', () => {
        const { container } = render(<Error>Something failed.</Error>);
        expect(container.querySelector('b')).not.toBeInTheDocument();
    });

    it('renders a bold label before the message when provided', () => {
        render(<Error label="Email Error:">This email is in use.</Error>);
        const label = screen.getByText('Email Error:');
        expect(label.tagName).toBe('B');
        expect(label.className).toContain('label');
        expect(screen.getByText('This email is in use.')).toBeInTheDocument();
    });

    // ── size ──

    const sizes = ['small', 'medium', 'large'] as const;

    it.each(sizes)('accepts size="%s"', (size) => {
        const { container } = render(<Error size={size}>Msg</Error>);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        if (size === 'small') {
            expect(root?.className).toContain('small');
        } else if (size === 'large') {
            expect(root?.className).toContain('large');
        }
    });

    it('applies no small/large modifier class for the default medium size', () => {
        const { container } = render(<Error>Msg</Error>);
        const root = getRoot(container);
        expect(root?.className).not.toContain('small');
        expect(root?.className).not.toContain('large');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <Error className="custom-error">Msg</Error>,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('error');
        expect(root?.className).toContain('custom-error');
        expect(root?.className.endsWith('custom-error')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Error ref={ref}>Msg</Error>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-error');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, style)', () => {
        const { container } = render(
            <Error id="error-1" style={{ marginTop: '4px' }}>
                Msg
            </Error>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'error-1');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Error.displayName).toBe('Error');
    });

    // ── Error.Action (compound) ──

    describe('Error.Action', () => {
        it('renders an inline-block span with the action-link class', () => {
            const { container } = render(
                <Error>
                    The request failed.{' '}
                    <Error.Action>
                        <a href="https://example.com">Contact Us</a>
                    </Error.Action>
                </Error>,
            );
            const action = container.querySelector('span[class*="action-link"]');
            expect(action).toBeInTheDocument();
            expect(screen.getByText('Contact Us')).toBeInTheDocument();
        });

        it('appends a custom className', () => {
            const { container } = render(
                <Error.Action className="custom-action">Link</Error.Action>,
            );
            const action = container.querySelector('span');
            expect(action?.className).toContain('action-link');
            expect(action?.className).toContain('custom-action');
        });

        it('forwards ref to the action span', () => {
            const ref = createRef<HTMLSpanElement>();
            render(<Error.Action ref={ref}>Link</Error.Action>);
            expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        });

        it('has the correct displayName', () => {
            expect(Error.Action.displayName).toBe('Error.Action');
        });
    });
});
