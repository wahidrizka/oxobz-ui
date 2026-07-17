import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Breadcrumbs, BreadcrumbsItem } from './Breadcrumbs';

/** Selects the root <nav>. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-breadcrumbs]');
}

describe('Breadcrumbs', () => {
    // ── Rendering (text variant, default) ──

    it('renders a nav with data-oxobz-breadcrumbs, data-variant="text" and data-version="v1"', () => {
        const { container } = render(
            <Breadcrumbs>
                <BreadcrumbsItem>Home</BreadcrumbsItem>
                <BreadcrumbsItem>Dashboard</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('NAV');
        expect(root).toHaveAttribute('aria-label', 'Breadcrumb');
        expect(root).toHaveAttribute('data-variant', 'text');
        expect(root).toHaveAttribute('data-version', 'v1');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <Breadcrumbs data-version="v2">
                <BreadcrumbsItem>Home</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders an <ol class="ol"> wrapping <li class="textItem"> items', () => {
        const { container } = render(
            <Breadcrumbs>
                <BreadcrumbsItem>Home</BreadcrumbsItem>
                <BreadcrumbsItem>Dashboard</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const list = container.querySelector('ol');
        expect(list).toBeInTheDocument();
        expect(list?.className).toContain('ol');

        const items = container.querySelectorAll('li[data-oxobz-breadcrumbs-item]');
        expect(items).toHaveLength(2);
        items.forEach((item) => expect(item.className).toContain('textItem'));
    });

    it('renders a chevron separator svg inside each text item', () => {
        const { container } = render(
            <Breadcrumbs>
                <BreadcrumbsItem>Home</BreadcrumbsItem>
                <BreadcrumbsItem>Dashboard</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const items = container.querySelectorAll('li[data-oxobz-breadcrumbs-item]');
        items.forEach((item) => {
            expect(item.querySelector('svg')).toBeInTheDocument();
        });
    });

    it('renders the label as a raw text node inside the item (no wrapper span)', () => {
        const { container } = render(
            <Breadcrumbs>
                <BreadcrumbsItem>Home</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const item = container.querySelector('[data-oxobz-breadcrumbs-item]');
        // The label text is a direct child of the <li>, not wrapped in a span.
        expect(item?.querySelector('span')).toBeNull();
        expect(item).toHaveTextContent('Home');
    });

    // ── Menu variant ──

    it('renders a menuWrapper div with menuItem buttons for variant="menu"', () => {
        const { container } = render(
            <Breadcrumbs variant="menu">
                <BreadcrumbsItem>Home</BreadcrumbsItem>
                <BreadcrumbsItem>Dashboard</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('data-variant', 'menu');

        const wrapper = container.querySelector('.menuWrapper');
        expect(wrapper).toBeInTheDocument();
        expect(container.querySelector('ol')).not.toBeInTheDocument();

        const buttons = container.querySelectorAll(
            'button[data-oxobz-breadcrumbs-item]',
        );
        expect(buttons).toHaveLength(2);
        buttons.forEach((button) => {
            expect(button.className).toContain('menuItem');
            expect(button).toHaveAttribute('type', 'button');
            // No separator icon in the menu variant.
            expect(button.querySelector('svg')).not.toBeInTheDocument();
        });
    });

    // ── active ──

    it('applies the active class and aria-current="true" (text variant)', () => {
        render(
            <Breadcrumbs>
                <BreadcrumbsItem>Home</BreadcrumbsItem>
                <BreadcrumbsItem active>Dashboard</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const active = screen.getByText('Dashboard').closest('li');
        expect(active?.className).toContain('active');
        expect(active).toHaveAttribute('aria-current', 'true');

        const inactive = screen.getByText('Home').closest('li');
        expect(inactive?.className).not.toContain('active');
        expect(inactive).not.toHaveAttribute('aria-current');
    });

    it('applies the active class and aria-current="true" (menu variant)', () => {
        render(
            <Breadcrumbs variant="menu">
                <BreadcrumbsItem active>Dashboard</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const button = screen.getByText('Dashboard').closest('button');
        expect(button?.className).toContain('active');
        expect(button).toHaveAttribute('aria-current', 'true');
    });

    // ── disabled ──

    it('applies the disabled class and drops the link (text variant)', () => {
        const handleClick = vi.fn();
        render(
            <Breadcrumbs>
                <BreadcrumbsItem disabled href="/dashboard" onClick={handleClick}>
                    Dashboard
                </BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const item = screen.getByText('Dashboard').closest('li');
        expect(item?.className).toContain('disabled');
        expect(item?.querySelector('a')).not.toBeInTheDocument();

        item?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('sets the disabled attribute on the button (menu variant)', () => {
        render(
            <Breadcrumbs variant="menu">
                <BreadcrumbsItem disabled>Dashboard</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const button = screen.getByText('Dashboard').closest('button');
        expect(button?.className).toContain('disabled');
        expect(button).toBeDisabled();
    });

    // ── href (text variant) ──

    it('renders the label inside an <a> when href is set and not disabled', () => {
        render(
            <Breadcrumbs>
                <BreadcrumbsItem href="/home">Home</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const link = screen.getByRole('link', { name: 'Home' });
        expect(link).toHaveAttribute('href', '/home');
    });

    it('renders plain text (no <a>) when href is omitted', () => {
        const { container } = render(
            <Breadcrumbs>
                <BreadcrumbsItem>Home</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        expect(container.querySelector('a')).not.toBeInTheDocument();
    });

    // ── Custom className ──

    it('appends a custom className after the root (no base class merge needed)', () => {
        const { container } = render(
            <Breadcrumbs className="custom-nav">
                <BreadcrumbsItem>Home</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        expect(getRoot(container)?.className).toContain('custom-nav');
    });

    it('appends a custom className after the item module class', () => {
        render(
            <Breadcrumbs>
                <BreadcrumbsItem className="custom-item">Home</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        const item = screen.getByText('Home').closest('li');
        expect(item?.className).toContain('textItem');
        expect(item?.className).toContain('custom-item');
        expect(item?.className.endsWith('custom-item')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root nav', () => {
        const ref = createRef<HTMLElement>();
        render(
            <Breadcrumbs ref={ref}>
                <BreadcrumbsItem>Home</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        expect(ref.current).toBeInstanceOf(HTMLElement);
        expect(ref.current?.tagName).toBe('NAV');
    });

    it('forwards ref to the item <li> (text variant)', () => {
        const ref = createRef<HTMLElement>();
        render(
            <Breadcrumbs>
                <BreadcrumbsItem ref={ref}>Home</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        expect(ref.current?.tagName).toBe('LI');
    });

    it('forwards ref to the item <button> (menu variant)', () => {
        const ref = createRef<HTMLElement>();
        render(
            <Breadcrumbs variant="menu">
                <BreadcrumbsItem ref={ref}>Home</BreadcrumbsItem>
            </Breadcrumbs>,
        );
        expect(ref.current?.tagName).toBe('BUTTON');
    });

    // ── Context guard ──

    it('throws when BreadcrumbsItem is rendered outside Breadcrumbs', () => {
        // Suppress the expected React error boundary console noise.
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<BreadcrumbsItem>Home</BreadcrumbsItem>)).toThrow(
            'Breadcrumbs.Item must be used within a Breadcrumbs',
        );
        spy.mockRestore();
    });

    // ── displayName ──

    it('has the correct displayName on both the root and Item', () => {
        expect(Breadcrumbs.displayName).toBe('Breadcrumbs');
        expect(Breadcrumbs.Item.displayName).toBe('Breadcrumbs.Item');
        expect(BreadcrumbsItem.displayName).toBe('Breadcrumbs.Item');
    });
});
