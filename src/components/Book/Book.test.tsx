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
        it('set --book-color via inline style pada rotate-wrapper', () => {
            const { container } = render(<Book title="Test" color="#FED954" />);
            const wrapper = container.querySelector(
                '[class*="rotateWrapper"]',
            ) as HTMLElement;
            expect(wrapper.style.getPropertyValue('--book-color')).toBe('#FED954');
        });

        it('--book-color TIDAK di-set pada elemen root perspective', () => {
            const { container } = render(<Book title="Test" color="#FED954" />);
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--book-color')).toBe('');
        });

        it('set --book-text-color via inline style pada rotate-wrapper', () => {
            const { container } = render(
                <Book title="Test" color="#9D2127" textColor="#ece4db" />,
            );
            const wrapper = container.querySelector(
                '[class*="rotateWrapper"]',
            ) as HTMLElement;
            expect(wrapper.style.getPropertyValue('--book-text-color')).toBe('#ece4db');
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
    describe('width prop', () => {
        it('width number set --book-width', () => {
            const { container } = render(<Book title="Test" width={300} />);
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--book-width')).toBe('300');
        });

        it('default --book-width 196 bila width tidak diberikan', () => {
            const { container } = render(<Book title="Test" />);
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--book-width')).toBe('196');
        });

        it('width object set custom property per breakpoint', () => {
            const { container } = render(
                <Book title="Test" width={{ sm: 150, md: 196 }} />,
            );
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--sm-book-width')).toBe('150');
            expect(el.style.getPropertyValue('--md-book-width')).toBe('196');
        });

        it('width object mendukung xs/smd/lg', () => {
            const { container } = render(
                <Book title="Test" width={{ xs: 120, smd: 170, lg: 240 }} />,
            );
            const el = container.firstChild as HTMLElement;
            expect(el.style.getPropertyValue('--xs-book-width')).toBe('120');
            expect(el.style.getPropertyValue('--smd-book-width')).toBe('170');
            expect(el.style.getPropertyValue('--lg-book-width')).toBe('240');
        });

        it('tidak set --book-width bila width object diberikan', () => {
            const { container } = render(
                <Book title="Test" width={{ sm: 150, md: 196 }} />,
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

        it('texture rotation auto-derived ke 0deg atau 180deg', () => {
            const { container } = render(<Book title="Test" textured />);
            const texture = container.querySelector(
                '[class*="texture"]',
            ) as HTMLElement;
            expect(texture.style.transform).toMatch(/^rotate\((0|180)deg\)$/);
        });

        it('deret textured books bervariasi rotasinya (auto-alternate)', () => {
            const { container } = render(
                <div>
                    <Book title="A" textured />
                    <Book title="B" textured />
                    <Book title="C" textured />
                    <Book title="D" textured />
                </div>,
            );
            const rotations = Array.from(
                container.querySelectorAll('[class*="texture"]'),
            )
                .map((el) => (el as HTMLElement).style.transform)
                .filter((t) => t.length > 0);
            expect(rotations).toHaveLength(4);
            // Production alternates the texture across a row; ensure not all identical.
            expect(new Set(rotations).size).toBeGreaterThan(1);
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

        it('class list bersih tanpa spasi berlebih saat className tidak diberikan (cn)', () => {
            const { container } = render(<Book title="Test" />);
            const el = container.firstChild as HTMLElement;
            expect(el.className).toBe(el.className.trim());
            expect(el.className).not.toMatch(/\s{2,}/);
        });

        it('pages class list bersih tanpa entri kosong saat textured=false (cn)', () => {
            const { container } = render(<Book title="Test" />);
            const pages = container.querySelector('[class*="pages"]') as HTMLElement;
            expect(pages.className).toBe(pages.className.trim());
            expect(pages.className).not.toMatch(/\s{2,}/);
        });
    });

    // ---- Root attributes (production fidelity) ----
    describe('atribut root', () => {
        it('root TIDAK punya marker data-oxobz-book / data-version (sesuai produksi)', () => {
            // Production snapshot (book.html): the root perspective element has
            // no data- attributes at all — data-version="v1" only appears on
            // inner Stack/Text elements rendered by those components.
            const { container } = render(<Book title="Test" />);
            const el = container.firstChild as HTMLElement;
            expect(el.hasAttribute('data-oxobz-book')).toBe(false);
            expect(el.hasAttribute('data-version')).toBe(false);
        });
    });

    // ---- Icon ----
    describe('icon (stripe variant)', () => {
        it('render custom icon di content area stripe variant', () => {
            const { container } = render(
                <Book
                    variant="stripe"
                    title="Test"
                    icon={<svg data-testid="test-icon" />}
                />,
            );
            const icon = container.querySelector('[data-testid="test-icon"]');
            expect(icon).not.toBeNull();
        });

        it('default icon (LogoVercel) dirender bila icon tidak diberikan', () => {
            const { container } = render(<Book variant="stripe" title="Test" />);
            const svg = container.querySelector('[data-slot="oxobz-icon"]');
            expect(svg).not.toBeNull();
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
        it('custom style diteruskan ke root, color var tetap di wrapper', () => {
            const { container } = render(
                <Book title="Test" color="#FED954" style={{ marginTop: '20px' }} />,
            );
            const el = container.firstChild as HTMLElement;
            expect(el.style.marginTop).toBe('20px');
            expect(el.style.getPropertyValue('--book-width')).toBe('196');
            const wrapper = container.querySelector(
                '[class*="rotateWrapper"]',
            ) as HTMLElement;
            expect(wrapper.style.getPropertyValue('--book-color')).toBe('#FED954');
        });
    });
});
