import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumbs';

/** Selects the root <nav>. */
function getRoot(container: HTMLElement) {
    return container.querySelector('nav');
}

describe('Breadcrumb', () => {
    // ── Rendering (text variant, default) ──

    /* Nav produksi tidak membawa penanda komponen, cuma aria-label. */
    it('renders a nav with aria-label and no component markers', () => {
        const { container } = render(
            <Breadcrumb>
                <BreadcrumbItem>Home</BreadcrumbItem>
                <BreadcrumbItem>Dashboard</BreadcrumbItem>
            </Breadcrumb>,
        );
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('NAV');
        expect(root).toHaveAttribute('aria-label', 'Breadcrumb');
        expect(root).not.toHaveAttribute('data-variant');
        expect(root).not.toHaveAttribute('data-version');
        expect(root).not.toHaveAttribute('data-oxobz-breadcrumbs');
    });

    /* data-version tetap diteruskan kalau pemakainya memberikannya, tapi
       tidak lagi dipasang sendiri oleh komponen. */
    it('meneruskan data-version dari pemakainya', () => {
        const { container } = render(
            <Breadcrumb data-version="v2">
                <BreadcrumbItem>Home</BreadcrumbItem>
            </Breadcrumb>,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders an <ol class="ol"> wrapping <li class="textItem"> items', () => {
        const { container } = render(
            <Breadcrumb>
                <BreadcrumbItem>Home</BreadcrumbItem>
                <BreadcrumbItem>Dashboard</BreadcrumbItem>
            </Breadcrumb>,
        );
        const list = container.querySelector('ol');
        expect(list).toBeInTheDocument();
        expect(list?.className).toContain('ol');

        const items = container.querySelectorAll('li');
        expect(items).toHaveLength(2);
        items.forEach((item) => expect(item.className).toContain('textItem'));
    });

    it('renders a chevron separator svg inside each text item', () => {
        const { container } = render(
            <Breadcrumb>
                <BreadcrumbItem>Home</BreadcrumbItem>
                <BreadcrumbItem>Dashboard</BreadcrumbItem>
            </Breadcrumb>,
        );
        const items = container.querySelectorAll('li');
        items.forEach((item) => {
            expect(item.querySelector('svg')).toBeInTheDocument();
        });
    });

    it('renders the label as a raw text node inside the item (no wrapper span)', () => {
        const { container } = render(
            <Breadcrumb>
                <BreadcrumbItem>Home</BreadcrumbItem>
            </Breadcrumb>,
        );
        const item = container.querySelector('li');
        // The label text is a direct child of the <li>, not wrapped in a span.
        expect(item?.querySelector('span')).toBeNull();
        expect(item).toHaveTextContent('Home');
    });

    // ── Menu variant ──

    it('renders a menuWrapper div with menuItem buttons for type="menu"', () => {
        const { container } = render(
            <Breadcrumb type="menu">
                <BreadcrumbItem>Home</BreadcrumbItem>
                <BreadcrumbItem>Dashboard</BreadcrumbItem>
            </Breadcrumb>,
        );
        const root = getRoot(container);
        expect(root).not.toHaveAttribute('data-variant');

        const wrapper = container.querySelector('.menuWrapper');
        expect(wrapper).toBeInTheDocument();
        expect(container.querySelector('ol')).not.toBeInTheDocument();

        const buttons = container.querySelectorAll(
            'button',
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
            <Breadcrumb>
                <BreadcrumbItem>Home</BreadcrumbItem>
                <BreadcrumbItem active>Dashboard</BreadcrumbItem>
            </Breadcrumb>,
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
            <Breadcrumb type="menu">
                <BreadcrumbItem active>Dashboard</BreadcrumbItem>
            </Breadcrumb>,
        );
        const button = screen.getByText('Dashboard').closest('button');
        expect(button?.className).toContain('active');
        expect(button).toHaveAttribute('aria-current', 'true');
    });

    // ── disabled ──

    it('applies the disabled class and drops the link (text variant)', () => {
        const handleClick = vi.fn();
        render(
            <Breadcrumb>
                <BreadcrumbItem disabled href="/dashboard" onClick={handleClick}>
                    Dashboard
                </BreadcrumbItem>
            </Breadcrumb>,
        );
        const item = screen.getByText('Dashboard').closest('li');
        expect(item?.className).toContain('disabled');
        expect(item?.querySelector('a')).not.toBeInTheDocument();

        item?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('sets the disabled attribute on the button (menu variant)', () => {
        render(
            <Breadcrumb type="menu">
                <BreadcrumbItem disabled>Dashboard</BreadcrumbItem>
            </Breadcrumb>,
        );
        const button = screen.getByText('Dashboard').closest('button');
        expect(button?.className).toContain('disabled');
        expect(button).toBeDisabled();
    });

    // ── href (text variant) ──

    it('renders the label inside an <a> when href is set and not disabled', () => {
        render(
            <Breadcrumb>
                <BreadcrumbItem href="/home">Home</BreadcrumbItem>
            </Breadcrumb>,
        );
        const link = screen.getByRole('link', { name: 'Home' });
        expect(link).toHaveAttribute('href', '/home');
    });

    it('renders plain text (no <a>) when href is omitted', () => {
        const { container } = render(
            <Breadcrumb>
                <BreadcrumbItem>Home</BreadcrumbItem>
            </Breadcrumb>,
        );
        expect(container.querySelector('a')).not.toBeInTheDocument();
    });

    // ── Custom className ──

    it('appends a custom className after the root (no base class merge needed)', () => {
        const { container } = render(
            <Breadcrumb className="custom-nav">
                <BreadcrumbItem>Home</BreadcrumbItem>
            </Breadcrumb>,
        );
        expect(getRoot(container)?.className).toContain('custom-nav');
    });

    it('appends a custom className after the item module class', () => {
        render(
            <Breadcrumb>
                <BreadcrumbItem className="custom-item">Home</BreadcrumbItem>
            </Breadcrumb>,
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
            <Breadcrumb ref={ref}>
                <BreadcrumbItem>Home</BreadcrumbItem>
            </Breadcrumb>,
        );
        expect(ref.current).toBeInstanceOf(HTMLElement);
        expect(ref.current?.tagName).toBe('NAV');
    });

    it('forwards ref to the item <li> (text variant)', () => {
        const ref = createRef<HTMLElement>();
        render(
            <Breadcrumb>
                <BreadcrumbItem ref={ref}>Home</BreadcrumbItem>
            </Breadcrumb>,
        );
        expect(ref.current?.tagName).toBe('LI');
    });

    it('forwards ref to the item <button> (menu variant)', () => {
        const ref = createRef<HTMLElement>();
        render(
            <Breadcrumb type="menu">
                <BreadcrumbItem ref={ref}>Home</BreadcrumbItem>
            </Breadcrumb>,
        );
        expect(ref.current?.tagName).toBe('BUTTON');
    });

    // ── Context guard ──

    it('throws when BreadcrumbItem is rendered outside Breadcrumb', () => {
        // Suppress the expected React error boundary console noise.
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<BreadcrumbItem>Home</BreadcrumbItem>)).toThrow(
            'Breadcrumb.Item must be used within a Breadcrumb',
        );
        spy.mockRestore();
    });

    // ── displayName ──

    it('has the correct displayName on both the root and Item', () => {
        expect(Breadcrumb.displayName).toBe('Breadcrumb');
        expect(Breadcrumb.Item.displayName).toBe('Breadcrumb.Item');
        expect(BreadcrumbItem.displayName).toBe('Breadcrumb.Item');
    });
});
