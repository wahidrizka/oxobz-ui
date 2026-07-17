import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import {
    EmptyState,
    EmptyStateIcon,
    EmptyStateTitle,
    EmptyStateDescription,
} from './EmptyState';

/** Convenience: a fully-populated "Blank Slate" empty state used across several tests. */
function renderEmptyState(props: Partial<Parameters<typeof EmptyState>[0]> = {}) {
    return render(
        <EmptyState {...props}>
            <EmptyStateIcon>
                <svg data-testid="icon" viewBox="0 0 16 16" height="32" width="32" />
            </EmptyStateIcon>
            <div>
                <EmptyStateTitle>Title</EmptyStateTitle>
                <EmptyStateDescription>
                    A message conveying the state of the product.
                </EmptyStateDescription>
            </div>
        </EmptyState>,
    );
}

describe('EmptyState', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-empty-state and data-version="v1"', () => {
        const { container } = renderEmptyState();
        const root = container.querySelector('[data-oxobz-empty-state]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('root');
    });

    it('renders the title and description text', () => {
        renderEmptyState();
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(
            screen.getByText('A message conveying the state of the product.'),
        ).toBeInTheDocument();
    });

    it('renders the icon content', () => {
        renderEmptyState();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    // ── Sub-component structure / classes ──

    it('applies the text-heading-16 utility and module class to the title', () => {
        const { container } = renderEmptyState();
        const title = container.querySelector('[data-oxobz-empty-state-title]');
        expect(title).toBeInTheDocument();
        expect(title?.className).toContain('text-heading-16');
        expect(title?.className).toContain('title');
    });

    it('applies the text-copy-14 utility and module class to the description', () => {
        const { container } = renderEmptyState();
        const description = container.querySelector('[data-oxobz-empty-state-description]');
        expect(description).toBeInTheDocument();
        expect(description?.className).toContain('text-copy-14');
        expect(description?.className).toContain('description');
    });

    it('applies the icon module class and aria-hidden defaults to true', () => {
        const { container } = renderEmptyState();
        const icon = container.querySelector('[data-oxobz-empty-state-icon]');
        expect(icon).toBeInTheDocument();
        expect(icon?.className).toContain('icon');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('allows overriding aria-hidden on EmptyStateIcon', () => {
        const { container } = render(
            <EmptyState>
                <EmptyStateIcon aria-hidden={false}>
                    <svg viewBox="0 0 16 16" />
                </EmptyStateIcon>
            </EmptyState>,
        );
        const icon = container.querySelector('[data-oxobz-empty-state-icon]');
        expect(icon).toHaveAttribute('aria-hidden', 'false');
    });

    // ── Actions passed as further children ──

    it('renders action elements passed as additional children', () => {
        render(
            <EmptyState>
                <EmptyStateTitle>Title</EmptyStateTitle>
                <button type="button">Primary Action</button>
                <a href="/">Learn more</a>
            </EmptyState>,
        );
        expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Learn more' })).toBeInTheDocument();
    });

    // ── Custom className ──

    it('appends a custom className after the module class on EmptyState', () => {
        const { container } = renderEmptyState({ className: 'custom-empty-state' });
        const root = container.querySelector('[data-oxobz-empty-state]');
        expect(root?.className).toContain('root');
        expect(root?.className).toContain('custom-empty-state');
        expect(root?.className.endsWith('custom-empty-state')).toBe(true);
    });

    it('appends a custom className after the module class on EmptyStateIcon', () => {
        const { container } = render(
            <EmptyState>
                <EmptyStateIcon className="custom-icon">
                    <svg viewBox="0 0 16 16" />
                </EmptyStateIcon>
            </EmptyState>,
        );
        const icon = container.querySelector('[data-oxobz-empty-state-icon]');
        expect(icon?.className).toContain('icon');
        expect(icon?.className).toContain('custom-icon');
        expect(icon?.className.endsWith('custom-icon')).toBe(true);
    });

    it('appends a custom className after the module class on EmptyStateTitle', () => {
        const { container } = render(
            <EmptyState>
                <EmptyStateTitle className="custom-title">Title</EmptyStateTitle>
            </EmptyState>,
        );
        const title = container.querySelector('[data-oxobz-empty-state-title]');
        expect(title?.className).toContain('title');
        expect(title?.className).toContain('custom-title');
        expect(title?.className.endsWith('custom-title')).toBe(true);
    });

    it('appends a custom className after the module class on EmptyStateDescription', () => {
        const { container } = render(
            <EmptyState>
                <EmptyStateDescription className="custom-description">Desc</EmptyStateDescription>
            </EmptyState>,
        );
        const description = container.querySelector('[data-oxobz-empty-state-description]');
        expect(description?.className).toContain('description');
        expect(description?.className).toContain('custom-description');
        expect(description?.className.endsWith('custom-description')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<EmptyState ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-empty-state');
    });

    it('forwards ref on EmptyStateIcon', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <EmptyState>
                <EmptyStateIcon ref={ref}>
                    <svg viewBox="0 0 16 16" />
                </EmptyStateIcon>
            </EmptyState>,
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-empty-state-icon');
    });

    it('forwards ref on EmptyStateTitle', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <EmptyState>
                <EmptyStateTitle ref={ref}>Title</EmptyStateTitle>
            </EmptyState>,
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-empty-state-title');
    });

    it('forwards ref on EmptyStateDescription', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <EmptyState>
                <EmptyStateDescription ref={ref}>Desc</EmptyStateDescription>
            </EmptyState>,
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-empty-state-description');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, style) on EmptyState', () => {
        const { container } = renderEmptyState({ id: 'empty-state-1', style: { marginTop: '4px' } });
        const root = container.querySelector('[data-oxobz-empty-state]');
        expect(root).toHaveAttribute('id', 'empty-state-1');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName for every part', () => {
        expect(EmptyState.displayName).toBe('EmptyState');
        expect(EmptyStateIcon.displayName).toBe('EmptyStateIcon');
        expect(EmptyStateTitle.displayName).toBe('EmptyStateTitle');
        expect(EmptyStateDescription.displayName).toBe('EmptyStateDescription');
    });
});
