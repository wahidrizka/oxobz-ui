import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Scroller } from './Scroller';

/** Selects the Scroller root (overlayContainer). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-scroller]');
}

/** Selects the scrollable inner container. */
function getScrollContainer(container: HTMLElement) {
    return container.querySelector('[data-oxobz-scroller-container]');
}

describe('Scroller', () => {
    // ── Rendering ──

    it('renders the root with data-oxobz-scroller and data-version="v1"', () => {
        const { container } = render(
            <Scroller>
                <div>item</div>
            </Scroller>,
        );
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('overlayContainer');
    });

    it('renders children inside the scroll container', () => {
        render(
            <Scroller>
                <div>hello world</div>
            </Scroller>,
        );
        expect(screen.getByText('hello world')).toBeInTheDocument();
    });

    it('renders the edge-fade overlay', () => {
        const { container } = render(
            <Scroller>
                <div>item</div>
            </Scroller>,
        );
        const overlay = container.querySelector('[data-oxobz-scroller-overlay]');
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveAttribute('aria-hidden', 'true');
        expect(overlay?.className).toContain('overlay');
    });

    // ── overflow variants ──

    it.each([
        ['y', false] as const,
        ['x', true] as const,
        ['both', false] as const,
    ])('sets data-overflow="%s" and toggles isHorizontal', (overflow, isHorizontal) => {
        const { container } = render(
            <Scroller overflow={overflow}>
                <div>item</div>
            </Scroller>,
        );
        const scrollContainer = getScrollContainer(container);
        expect(scrollContainer).toHaveAttribute('data-overflow', overflow);
        const root = getRoot(container);
        if (isHorizontal) {
            expect(root?.className).toContain('isHorizontal');
        } else {
            expect(root?.className).not.toContain('isHorizontal');
        }
    });

    it('defaults overflow to "y"', () => {
        const { container } = render(
            <Scroller>
                <div>item</div>
            </Scroller>,
        );
        expect(getScrollContainer(container)).toHaveAttribute('data-overflow', 'y');
    });

    // ── height / width ──

    it('defaults height and width to 100%', () => {
        const { container } = render(
            <Scroller>
                <div>item</div>
            </Scroller>,
        );
        const root = getRoot(container) as HTMLElement;
        expect(root.style.width).toBe('100%');
        expect(root.style.height).toBe('100%');
    });

    it('converts a numeric height/width to pixels', () => {
        const { container } = render(
            <Scroller height={220} width={300}>
                <div>item</div>
            </Scroller>,
        );
        const root = getRoot(container) as HTMLElement;
        expect(root.style.height).toBe('220px');
        expect(root.style.width).toBe('300px');
    });

    // ── childrenContainerClassName ──

    it('applies childrenContainerClassName to the direct children wrapper', () => {
        const { container } = render(
            <Scroller childrenContainerClassName="gap-4">
                <div>item</div>
            </Scroller>,
        );
        const scrollContainer = getScrollContainer(container);
        expect(scrollContainer?.firstElementChild?.className).toBe('gap-4');
    });

    // ── withButtons ──

    it('renders no buttons by default', () => {
        const { container } = render(
            <Scroller>
                <div>item</div>
            </Scroller>,
        );
        expect(container.querySelector('[data-oxobz-scroller-buttons]')).not.toBeInTheDocument();
    });

    it('renders scroll top/bottom buttons for overflow="y" withButtons', () => {
        render(
            <Scroller withButtons overflow="y">
                <div>item</div>
            </Scroller>,
        );
        expect(screen.getByRole('button', { name: 'scroll top' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'scroll bottom' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'scroll left' })).not.toBeInTheDocument();
    });

    it('renders scroll left/right buttons for overflow="x" withButtons', () => {
        render(
            <Scroller withButtons overflow="x">
                <div>item</div>
            </Scroller>,
        );
        expect(screen.getByRole('button', { name: 'scroll left' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'scroll right' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'scroll top' })).not.toBeInTheDocument();
    });

    it('renders all four scroll buttons for overflow="both" withButtons', () => {
        render(
            <Scroller withButtons overflow="both">
                <div>item</div>
            </Scroller>,
        );
        expect(screen.getByRole('button', { name: 'scroll top' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'scroll bottom' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'scroll left' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'scroll right' })).toBeInTheDocument();
    });

    it('places the buttons row before the root for overflow="y" and after for overflow="x"', () => {
        const { container: vertical } = render(
            <Scroller withButtons overflow="y">
                <div>item</div>
            </Scroller>,
        );
        const verticalChildren = Array.from(vertical.children);
        expect(verticalChildren[0]).toHaveAttribute('data-oxobz-scroller-buttons');
        expect(verticalChildren[1]).toHaveAttribute('data-oxobz-scroller');

        const { container: horizontal } = render(
            <Scroller withButtons overflow="x">
                <div>item</div>
            </Scroller>,
        );
        const horizontalChildren = Array.from(horizontal.children);
        expect(horizontalChildren[0]).toHaveAttribute('data-oxobz-scroller');
        expect(horizontalChildren[1]).toHaveAttribute('data-oxobz-scroller-buttons');
    });

    it('scrolls to the first direct child when "scroll top" is clicked', () => {
        const { container } = render(
            <Scroller withButtons overflow="y">
                <div key="a">a</div>
                <div key="b">b</div>
            </Scroller>,
        );
        const scrollContainer = getScrollContainer(container) as HTMLElement;
        const wrapper = scrollContainer.firstElementChild as HTMLElement;
        const first = wrapper.firstElementChild as HTMLElement;
        const scrollIntoView = vi.fn();
        first.scrollIntoView = scrollIntoView;

        fireEvent.click(screen.getByRole('button', { name: 'scroll top' }));
        expect(scrollIntoView).toHaveBeenCalledWith(
            expect.objectContaining({ behavior: 'smooth', block: 'start' }),
        );
    });

    it('scrolls to the last direct child when "scroll bottom" is clicked', () => {
        const { container } = render(
            <Scroller withButtons overflow="y">
                <div key="a">a</div>
                <div key="b">b</div>
            </Scroller>,
        );
        const scrollContainer = getScrollContainer(container) as HTMLElement;
        const wrapper = scrollContainer.firstElementChild as HTMLElement;
        const last = wrapper.lastElementChild as HTMLElement;
        const scrollIntoView = vi.fn();
        last.scrollIntoView = scrollIntoView;

        fireEvent.click(screen.getByRole('button', { name: 'scroll bottom' }));
        expect(scrollIntoView).toHaveBeenCalledWith(
            expect.objectContaining({ behavior: 'smooth', block: 'end' }),
        );
    });

    // ── Custom className ──

    it('appends a custom className after the module class on the root', () => {
        const { container } = render(
            <Scroller className="custom-scroller">
                <div>item</div>
            </Scroller>,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('overlayContainer');
        expect(root?.className).toContain('custom-scroller');
    });

    // ── Ref forwarding ──

    it('forwards ref to the root element', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Scroller ref={ref}>
                <div>item</div>
            </Scroller>,
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-scroller');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-label)', () => {
        const { container } = render(
            <Scroller aria-label="activity list" id="scroller-1">
                <div>item</div>
            </Scroller>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'scroller-1');
        expect(root).toHaveAttribute('aria-label', 'activity list');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Scroller.displayName).toBe('Scroller');
    });
});
