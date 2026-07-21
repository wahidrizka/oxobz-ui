import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { EmptyState, EmptyStateIcon } from './EmptyState';

function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-empty-state]');
}

describe('EmptyState', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-empty-state and data-version="v1"', () => {
        const { container } = render(
            <EmptyState
                description="A message conveying the state of the product."
                title="Title"
            />,
        );
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('root');
    });

    it('renders the title with text-heading-16 and the description with text-copy-14', () => {
        const { container } = render(
            <EmptyState
                description="A message conveying the state of the product."
                title="Title"
            />,
        );
        const title = screen.getByText('Title');
        expect(title.className).toContain('text-heading-16');
        expect(title.className).toContain('title');
        const description = screen.getByText(
            'A message conveying the state of the product.',
        );
        expect(description.className).toContain('text-copy-14');
        expect(description.className).toContain('description');
        // both inside the content group
        const content = container.querySelector('[class*="content"]');
        expect(content).toContainElement(title);
        expect(content).toContainElement(description);
    });

    // ── icon prop ──

    it('renders the icon prop inside a plain wrapper div (production structure)', () => {
        const { container } = render(
            <EmptyState
                description="Description"
                icon={<EmptyStateIcon icon={<svg data-testid="icon-svg" />} />}
                title="Title"
            />,
        );
        const box = container.querySelector('[data-oxobz-empty-state-icon]');
        expect(box).toBeInTheDocument();
        // plain unstyled wrapper div between the root and the icon box
        expect(box?.parentElement?.tagName).toBe('DIV');
        expect(box?.parentElement?.getAttribute('class')).toBeNull();
        expect(box?.parentElement?.parentElement).toBe(getRoot(container));
        expect(box?.querySelector('[data-testid="icon-svg"]')).toBeInTheDocument();
    });

    it('renders no icon wrapper when icon is omitted', () => {
        const { container } = render(
            <EmptyState description="Description" title="Title" />,
        );
        expect(
            container.querySelector('[data-oxobz-empty-state-icon]'),
        ).toBeNull();
    });

    // ── children (CTA area) ──

    it('renders children as direct children of the root after the content', () => {
        const { container } = render(
            <EmptyState description="Description" title="Title">
                <button type="button">Primary Action</button>
            </EmptyState>,
        );
        const button = screen.getByRole('button', { name: 'Primary Action' });
        expect(button.parentElement).toBe(getRoot(container));
    });

    // ── EmptyStateIcon ──

    it('EmptyStateIcon is aria-hidden by default and can opt out', () => {
        const { container: hidden } = render(
            <EmptyStateIcon icon={<svg />} />,
        );
        expect(
            hidden.querySelector('[data-oxobz-empty-state-icon]'),
        ).toHaveAttribute('aria-hidden', 'true');

        const { container: visible } = render(
            <EmptyStateIcon aria-hidden={false} icon={<svg />} />,
        );
        expect(
            visible.querySelector('[data-oxobz-empty-state-icon]'),
        ).toHaveAttribute('aria-hidden', 'false');
    });

    // ── Custom className ──

    it('appends custom classNames on root and icon box', () => {
        const { container } = render(
            <EmptyState
                className="custom-root"
                description="Description"
                icon={<EmptyStateIcon className="custom-icon" icon={<svg />} />}
                title="Title"
            />,
        );
        expect(getRoot(container)?.className.endsWith('custom-root')).toBe(true);
        expect(
            container.querySelector('[data-oxobz-empty-state-icon]')?.className,
        ).toContain('custom-icon');
    });

    // ── Ref forwarding ──

    it('forwards refs on EmptyState and EmptyStateIcon', () => {
        const rootRef = createRef<HTMLDivElement>();
        const iconRef = createRef<HTMLDivElement>();
        render(
            <EmptyState
                description="Description"
                icon={<EmptyStateIcon icon={<svg />} ref={iconRef} />}
                ref={rootRef}
                title="Title"
            />,
        );
        expect(rootRef.current).toHaveAttribute('data-oxobz-empty-state');
        expect(iconRef.current).toHaveAttribute('data-oxobz-empty-state-icon');
    });

    // ── displayName ──

    it('has the correct displayNames', () => {
        expect(EmptyState.displayName).toBe('EmptyState');
        expect(EmptyStateIcon.displayName).toBe('EmptyStateIcon');
    });
});
