import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Banner } from './Banner';

/** Selects the Banner root div. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-banner]');
}

describe('Banner', () => {
    // ── Rendering ──

    it('renders the message row as the root, with data-oxobz-banner and data-version="v1"', () => {
        const { container } = render(<Banner>Message</Banner>);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        // Production emits no wrapper of its own: the message row IS the root.
        expect(root?.className).toContain('message');
    });

    it('emits exactly two siblings and no frame of its own', () => {
        // The border/background/rounded-lg/scroll wrapper/24px padding this
        // component used to render belonged to the docs page's demo frame, not
        // to Banner. Production emits the mobile pill and the message row as
        // siblings, nothing around them. Guard against a wrapper creeping back.
        const { container } = render(
            <Banner button={{ href: '#', content: 'Read more' }}>Message</Banner>,
        );
        const roots = [...container.children];
        expect(roots).toHaveLength(2);
        expect(roots[0].tagName).toBe('A');
        expect(roots[1].tagName).toBe('DIV');
        expect(roots[1].className).toContain('message');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Banner data-version="v2">Message</Banner>);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the message text', () => {
        render(
            <Banner>
                <b>Big News</b> – New components finally available
            </Banner>,
        );
        expect(screen.getByText('Big News')).toBeInTheDocument();
        expect(screen.getByText(/New components finally available/)).toBeInTheDocument();
    });

    // ── With CTA button ──

    it('renders a mobile pill CTA and a desktop CTA when `button` is set', () => {
        render(
            <Banner button={{ href: '/read-more', content: 'Read more' }}>
                <b>Big News</b> – New components finally available
            </Banner>,
        );
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
        links.forEach((link) => expect(link).toHaveAttribute('href', '/read-more'));
    });

    it('uses `children` as the mobile CTA label and `button.content` as the desktop CTA label', () => {
        render(
            <Banner button={{ href: '/read-more', content: 'Read more' }}>
                <b>Big News</b> – New components finally available
            </Banner>,
        );
        expect(screen.getByRole('link', { name: /Read more/ })).toBeInTheDocument();
        // The mobile pill's accessible name is the full children content.
        expect(
            screen.getByRole('link', { name: /Big News.*New components finally available/ }),
        ).toBeInTheDocument();
    });

    it('renders a suffix chevron icon on every CTA link', () => {
        const { container } = render(
            <Banner button={{ href: '/read-more', content: 'Read more' }}>Message</Banner>,
        );
        expect(container.querySelectorAll('[data-slot="oxobz-icon"]')).toHaveLength(2);
    });

    // ── Without CTA button (optional prop) ──

    it('renders no link and shows the message row alone when `button` is omitted', () => {
        const { container } = render(<Banner>Just an announcement</Banner>);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getByText('Just an announcement')).toBeInTheDocument();
        const message = container.querySelector('p');
        expect(message?.parentElement?.className).toContain('solo');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<Banner className="custom-banner">Message</Banner>);
        const root = getRoot(container);
        expect(root?.className).toContain('banner');
        expect(root?.className).toContain('custom-banner');
        expect(root?.className.endsWith('custom-banner')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Banner ref={ref}>Message</Banner>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-banner');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-label, style)', () => {
        const { container } = render(
            <Banner aria-label="Announcement" id="banner-1" style={{ marginTop: '4px' }}>
                Message
            </Banner>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'banner-1');
        expect(root).toHaveAttribute('aria-label', 'Announcement');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Banner.displayName).toBe('Banner');
    });
});
