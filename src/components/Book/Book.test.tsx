import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Book } from './Book';

describe('Book', () => {
    // ---- Render dasar ----
    describe('render dasar', () => {
        it('render dengan title yang benar', () => {
            render(<Book title="The user experience of the Frontend Cloud" />);
            expect(
                screen.getByText('The user experience of the Frontend Cloud'),
            ).toBeDefined();
        });

        it('mempunyai class perspective', () => {
            const { container } = render(<Book title="Test Book" />);
            const el = container.firstChild as HTMLElement;
            expect(el.className).toMatch(/perspective/);
        });

        it('render elemen pages dan back (aria-hidden)', () => {
            const { container } = render(<Book title="Test Book" />);
            const ariaHiddens = container.querySelectorAll('[aria-hidden="true"]');
            // bind aria-hidden, pages, back (minimal)
            expect(ariaHiddens.length).toBeGreaterThanOrEqual(2);
        });
    });

    // ---- Variant ----
    describe('variant', () => {
        it('default variant adalah stripe', () => {
            const { container } = render(<Book title="Test" />);
            const wrapper = container.querySelector('[class*="rotateWrapper"]');
            expect(wrapper?.className).toMatch(/stripe/);
        });

        it('variant simple tidak punya stripe section', () => {
            const { container } = render(
                <Book variant="simple" title="Test" color="#7DC1C1" />,
            );
            const stripe = container.querySelector('[class*="stripe"]');
            expect(stripe).toBeNull();
        });

        it('variant stripe mempunyai stripe section (aria-hidden)', () => {
            const { container } = render(<Book variant="stripe" title="Test" />);
            const stripe = container.querySelector('[class*="stripe"][aria-hidden="true"]');
            expect(stripe).not.toBeNull();
        });
    });

    // ---- Color ----
    describe('color prop', () => {
        it('set --book-color via inline style', () => {
            const { container } = render(<Book title="Test" color="#FED954" />);
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--book-color')).toBe('#FED954');
        });

        it('set --book-text-color via inline style', () => {
            const { container } = render(
                <Book title="Test" color="#9D2127" textColor="#ece4db" />,
            );
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--book-text-color')).toBe('#ece4db');
        });

        it('wrapper mempunyai class color jika color prop ada', () => {
            const { container } = render(<Book title="Test" color="#FED954" />);
            const wrapper = container.querySelector('[class*="rotateWrapper"]');
            expect(wrapper?.className).toMatch(/color/);
        });

        it('stripe variant TETAP mempunyai class color (default amber)', () => {
            // Default stripe variant has effectiveColor = var(--ds-amber-600)
            // so hasColor is always true for stripe
            const { container } = render(<Book title="Test" />);
            const wrapper = container.querySelector('[class*="rotateWrapper"]');
            const classes = wrapper?.className ?? '';
            expect(classes.split(' ').some((c) => c.endsWith('color'))).toBe(true);
        });
    });

    // ---- Width ----
    describe('width props', () => {
        it('set --book-width default 196 bila hanya width yang diberikan', () => {
            const { container } = render(<Book title="Test" width={300} />);
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--book-width')).toBe('300');
        });

        it('set --sm-book-width bila smWidth diberikan', () => {
            const { container } = render(
                <Book title="Test" smWidth={150} mdWidth={196} />,
            );
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--sm-book-width')).toBe('150');
            expect(el.style.getPropertyValue('--md-book-width')).toBe('196');
        });

        it('tidak set --book-width bila responsive width props diberikan', () => {
            const { container } = render(
                <Book title="Test" smWidth={150} mdWidth={196} />,
            );
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--book-width')).toBe('');
        });
    });

    // ---- Illustration ----
    describe('illustration', () => {
        it('stripe variant: illustration ada di stripe section', () => {
            const { container } = render(
                <Book
                    variant="stripe"
                    title="Test"
                    illustration={<svg data-testid="test-svg" />}
                />,
            );
            const stripe = container.querySelector('[class*="stripe"][aria-hidden="true"]');
            const svg = stripe?.querySelector('[data-testid="test-svg"]');
            expect(svg).not.toBeNull();
        });

        it('simple variant: illustration ada di content area', () => {
            const { container } = render(
                <Book
                    variant="simple"
                    title="Test"
                    color="#7DC1C1"
                    illustration={<svg data-testid="test-svg-simple" />}
                />,
            );
            const stripeEl = container.querySelector('[class*="stripe"][aria-hidden="true"]');
            expect(stripeEl).toBeNull(); // simple tidak punya stripe section
            const svg = container.querySelector('[data-testid="test-svg-simple"]');
            expect(svg).not.toBeNull();
        });
    });

    // ---- Textured ----
    describe('textured', () => {
        it('mempunyai elemen texture jika textured=true', () => {
            const { container } = render(<Book title="Test" textured />);
            const texture = container.querySelector('[class*="texture"]');
            expect(texture).not.toBeNull();
        });

        it('tidak mempunyai elemen texture jika textured=false (default)', () => {
            const { container } = render(<Book title="Test" />);
            const texture = container.querySelector('[class*="texture"]');
            expect(texture).toBeNull();
        });

        it('textureRotation 180 diterapkan ke style', () => {
            const { container } = render(
                <Book title="Test" textured textureRotation={180} />,
            );
            const texture = container.querySelector(
                '[class*="texture"]',
            ) as HTMLElement;
            expect(texture?.style.transform).toBe('rotate(180deg)');
        });

        it('pages mempunyai class textured jika textured=true', () => {
            const { container } = render(<Book title="Test" textured />);
            const pages = container.querySelector('[class*="pages"]');
            expect(pages?.className).toMatch(/textured/);
        });
    });

    // ---- className ----
    describe('className', () => {
        it('menerima custom className', () => {
            const { container } = render(
                <Book title="Test" className="my-custom-class" />,
            );
            const el = container.firstChild as HTMLElement;
            expect(el.className).toMatch(/my-custom-class/);
        });
    });

    // ---- Logo ----
    describe('logo (stripe variant)', () => {
        it('render logo di content area stripe variant', () => {
            const { container } = render(
                <Book
                    variant="stripe"
                    title="Test"
                    logo={<svg data-testid="test-logo" />}
                />,
            );
            const logo = container.querySelector('[data-testid="test-logo"]');
            expect(logo).not.toBeNull();
        });
    });

    // ---- Ref forwarding ----
    describe('ref forwarding', () => {
        it('forward ref ke elemen perspective div', () => {
            const ref = createRef<HTMLDivElement>();
            const { container } = render(<Book ref={ref} title="Test" />);
            expect(ref.current).toBe(container.firstChild);
        });
    });

    // ---- Style forwarding ----
    describe('style forwarding', () => {
        it('menggabungkan custom style dengan book CSS vars', () => {
            const { container } = render(
                <Book title="Test" color="#FED954" style={{ marginTop: '20px' }} />,
            );
            const el = container.firstChild as HTMLElement;
            expect(el.style.marginTop).toBe('20px');
            expect(el.style.getPropertyValue('--book-color')).toBe('#FED954');
        });
    });
});
