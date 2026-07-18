import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { LoadMoreButton } from './LoadMoreButton';

/** Selects the root button (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-load-more-button]');
}

describe('LoadMoreButton', () => {
    // ── Rendering ──

    it('renders a root button with data-oxobz-load-more-button and data-version="v1"', () => {
        const { container } = render(<LoadMoreButton>Load More</LoadMoreButton>);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root).toHaveAttribute('data-oxobz-button', '');
        expect(root?.className).toContain('loadMoreButton');
        expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <LoadMoreButton data-version="v2">Load More</LoadMoreButton>,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the secondary Button variant styling', () => {
        const { container } = render(<LoadMoreButton>Load More</LoadMoreButton>);
        expect(getRoot(container)?.className).toContain('secondary');
    });

    // ── Default text/content (Custom Text variant) ──

    it('renders arbitrary children as the label', () => {
        render(<LoadMoreButton>Show More Results</LoadMoreButton>);
        expect(screen.getByText('Show More Results')).toBeInTheDocument();
    });

    // ── loading ──

    it('is not loading by default', () => {
        const { container } = render(<LoadMoreButton>Load More</LoadMoreButton>);
        const root = getRoot(container);
        expect(root).not.toBeDisabled();
        expect(root?.className).not.toContain('loading');
    });

    it('shows the loading spinner and disables the button when loading', () => {
        const { container } = render(
            <LoadMoreButton loading>Loading...</LoadMoreButton>,
        );
        const root = getRoot(container);
        expect(root).toBeDisabled();
        expect(root?.className).toContain('loading');
        expect(container.querySelector('[data-oxobz-spinner]')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    // ── noGap ──

    it('applies the noGap modifier class', () => {
        const { container } = render(
            <LoadMoreButton noGap>Load More</LoadMoreButton>,
        );
        expect(getRoot(container)?.className).toContain('noGap');
    });

    it('does not apply the noGap modifier class by default', () => {
        const { container } = render(<LoadMoreButton>Load More</LoadMoreButton>);
        expect(getRoot(container)?.className).not.toContain('noGap');
    });

    // ── noBorderRadius ──

    it('applies the noBorderRadius modifier class', () => {
        const { container } = render(
            <LoadMoreButton noBorderRadius>Load More</LoadMoreButton>,
        );
        expect(getRoot(container)?.className).toContain('noBorderRadius');
    });

    it('does not apply the noBorderRadius modifier class by default', () => {
        const { container } = render(<LoadMoreButton>Load More</LoadMoreButton>);
        expect(getRoot(container)?.className).not.toContain('noBorderRadius');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <LoadMoreButton className="custom-load-more">Load More</LoadMoreButton>,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('loadMoreButton');
        expect(root?.className).toContain('custom-load-more');
        expect(root?.className.endsWith('custom-load-more')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root button', () => {
        const ref = createRef<HTMLButtonElement>();
        render(<LoadMoreButton ref={ref}>Load More</LoadMoreButton>);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        expect(ref.current).toHaveAttribute('data-oxobz-load-more-button');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, onClick)', () => {
        const onClick = () => {};
        const { container } = render(
            <LoadMoreButton id="load-more-1" onClick={onClick}>
                Load More
            </LoadMoreButton>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'load-more-1');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(LoadMoreButton.displayName).toBe('LoadMoreButton');
    });
});
