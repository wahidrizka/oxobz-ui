import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Pagination, type PaginationLink } from './Pagination';

const prev: PaginationLink = { title: 'Home', href: '/home' };
const next: PaginationLink = { title: 'Introduction', href: '/introduction' };

describe('Pagination', () => {
    // ── Rendering ──

    it('renders a nav with aria-label="pagination", data-oxobz-pagination and data-version="v1"', () => {
        const { container } = render(
            <Pagination previous={prev} next={next} />,
        );
        const root = container.querySelector('[data-oxobz-pagination]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('NAV');
        expect(root).toHaveAttribute('aria-label', 'pagination');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('pagination');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <Pagination data-version="v2" previous={prev} />,
        );
        const root = container.querySelector('[data-oxobz-pagination]');
        expect(root).toHaveAttribute('data-version', 'v2');
    });

    // ── Previous slot ──

    it('renders the previous link with href, aria-label, "Previous" label and title', () => {
        render(<Pagination previous={prev} />);
        const link = screen.getByRole('link', {
            name: 'Go to previous page: Home',
        });
        expect(link).toHaveAttribute('href', '/home');
        expect(link.className).toContain('item');
        expect(link).toHaveTextContent('Previous');
        expect(link).toHaveTextContent('Home');
    });

    it('does not add the align-right class to the previous link', () => {
        render(<Pagination previous={prev} />);
        const link = screen.getByRole('link', {
            name: 'Go to previous page: Home',
        });
        expect(link.className).not.toContain('align-right');
    });

    it('renders a chevron svg inside the previous link', () => {
        render(<Pagination previous={prev} />);
        const link = screen.getByRole('link', {
            name: 'Go to previous page: Home',
        });
        expect(link.querySelector('svg')).toBeInTheDocument();
    });

    // ── Next slot ──

    it('renders the next link with href, aria-label, "Next" label and title', () => {
        render(<Pagination next={next} />);
        const link = screen.getByRole('link', {
            name: 'Go to next page: Introduction',
        });
        expect(link).toHaveAttribute('href', '/introduction');
        expect(link).toHaveTextContent('Next');
        expect(link).toHaveTextContent('Introduction');
    });

    it('adds the align-right class to the next link', () => {
        render(<Pagination next={next} />);
        const link = screen.getByRole('link', {
            name: 'Go to next page: Introduction',
        });
        expect(link.className).toContain('item');
        expect(link.className).toContain('align-right');
    });

    it('renders a chevron svg inside the next link', () => {
        render(<Pagination next={next} />);
        const link = screen.getByRole('link', {
            name: 'Go to next page: Introduction',
        });
        expect(link.querySelector('svg')).toBeInTheDocument();
    });

    // ── Label / title structure ──

    it('wraps the label in a span and the title inside a title div', () => {
        const { container } = render(<Pagination previous={prev} />);
        const label = container.querySelector('span[class*="label"]');
        expect(label?.textContent).toBe('Previous');
        const title = container.querySelector('div[class*="title"]');
        expect(title).toBeInTheDocument();
        expect(title?.querySelector('span')?.textContent).toBe('Home');
    });

    // ── Optional slots ──

    it('renders only the next link when previous is omitted', () => {
        render(<Pagination next={next} />);
        expect(
            screen.queryByRole('link', { name: /Go to previous page/ }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Go to next page: Introduction' }),
        ).toBeInTheDocument();
    });

    it('renders only the previous link when next is omitted', () => {
        render(<Pagination previous={prev} />);
        expect(
            screen.queryByRole('link', { name: /Go to next page/ }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Go to previous page: Home' }),
        ).toBeInTheDocument();
    });

    it('renders no links when both slots are omitted', () => {
        render(<Pagination />);
        expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    // ── Centered children slot ──

    it('always renders the centered children slot div', () => {
        const { container } = render(<Pagination previous={prev} />);
        expect(
            container.querySelector('div[class*="children"]'),
        ).toBeInTheDocument();
    });

    it('renders children inside the centered slot', () => {
        const { container } = render(
            <Pagination previous={prev} next={next}>
                <span>Give feedback</span>
            </Pagination>,
        );
        const slot = container.querySelector('div[class*="children"]');
        expect(slot).toContainElement(screen.getByText('Give feedback'));
    });

    // ── Custom className ──

    it('appends custom className after the module classes', () => {
        const { container } = render(
            <Pagination className="custom-pager" previous={prev} />,
        );
        const root = container.querySelector('[data-oxobz-pagination]');
        expect(root?.className).toContain('pagination');
        expect(root?.className).toContain('custom-pager');
        expect(root?.className.endsWith('custom-pager')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the nav element', () => {
        const ref = createRef<HTMLElement>();
        render(<Pagination ref={ref} previous={prev} />);
        expect(ref.current).toBeInstanceOf(HTMLElement);
        expect(ref.current?.tagName).toBe('NAV');
        expect(ref.current).toHaveAttribute('data-oxobz-pagination');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes and inline style', () => {
        const { container } = render(
            <Pagination id="pager-1" style={{ maxWidth: '600px' }} />,
        );
        const root = container.querySelector('[data-oxobz-pagination]');
        expect(root).toHaveAttribute('id', 'pager-1');
        expect(root).toHaveStyle({ maxWidth: '600px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Pagination.displayName).toBe('Pagination');
    });
});
