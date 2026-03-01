import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Browser } from './Browser';

describe('Browser', () => {
    // ---- Render dasar ----
    describe('render dasar', () => {
        it('render tanpa error', () => {
            const { container } = render(<Browser />);
            expect(container.firstChild).toBeDefined();
        });

        it('mempunyai data-oxobz-browser attribute', () => {
            const { container } = render(<Browser />);
            const browser = container.querySelector('[data-oxobz-browser]');
            expect(browser).not.toBeNull();
        });

        it('mempunyai data-oxobz-browser-header-root attribute pada header', () => {
            const { container } = render(<Browser />);
            const header = container.querySelector('[data-oxobz-browser-header-root="true"]');
            expect(header).not.toBeNull();
        });

        it('render container query wrapper', () => {
            const { container } = render(<Browser />);
            const el = container.firstChild as HTMLElement;
            expect(el.className).toMatch(/containerQuery/);
        });

        it('render browser shell', () => {
            const { container } = render(<Browser />);
            const browser = container.querySelector('[data-oxobz-browser]') as HTMLElement;
            expect(browser.className).toMatch(/browser/);
        });
    });

    // ---- Traffic lights ----
    describe('traffic lights', () => {
        it('render 3 traffic light dots', () => {
            const { container } = render(<Browser />);
            const dots = container.querySelectorAll(
                '[class*="dotRed"], [class*="dotYellow"], [class*="dotGreen"]',
            );
            expect(dots.length).toBe(3);
        });

        it('render dotRed, dotYellow, dotGreen classes', () => {
            const { container } = render(<Browser />);
            expect(container.querySelector('[class*="dotRed"]')).not.toBeNull();
            expect(container.querySelector('[class*="dotYellow"]')).not.toBeNull();
            expect(container.querySelector('[class*="dotGreen"]')).not.toBeNull();
        });
    });

    // ---- Nav icons ----
    describe('navigation icons', () => {
        it('render 3 navigation SVG icons', () => {
            const { container } = render(<Browser />);
            const navIcons = container.querySelector('[class*="navIcons"]');
            expect(navIcons).not.toBeNull();
            const svgs = navIcons!.querySelectorAll('svg');
            expect(svgs.length).toBe(3);
        });
    });

    // ---- Address bar ----
    describe('address bar', () => {
        it('render address text ketika address prop diberikan', () => {
            render(<Browser address="vercel.com" />);
            expect(screen.getByText('vercel.com')).toBeDefined();
        });

        it('render address bar container', () => {
            const { container } = render(<Browser address="vercel.com" />);
            const addressBar = container.querySelector('[class*="addressBar"]');
            expect(addressBar).not.toBeNull();
        });

        it('tidak render address bar ketika address prop tidak diberikan', () => {
            const { container } = render(<Browser />);
            const addressBar = container.querySelector('[class*="addressBar"]');
            expect(addressBar).toBeNull();
        });

        it('render copy button di address bar', () => {
            render(<Browser address="vercel.com" />);
            const copyBtn = screen.getByLabelText('Copy');
            expect(copyBtn).toBeDefined();
            expect(copyBtn.tagName.toLowerCase()).toBe('button');
        });
    });

    // ---- Header sections ----
    describe('header sections', () => {
        it('render headerLeft, headerCenter, headerRight', () => {
            const { container } = render(<Browser address="vercel.com" />);
            expect(container.querySelector('[class*="headerLeft"]')).not.toBeNull();
            expect(container.querySelector('[class*="headerCenter"]')).not.toBeNull();
            expect(container.querySelector('[class*="headerRight"]')).not.toBeNull();
        });
    });

    // ---- Children ----
    describe('children', () => {
        it('render children di dalam browser frame', () => {
            render(
                <Browser address="vercel.com">
                    <div data-testid="browser-content">Hello World</div>
                </Browser>,
            );
            expect(screen.getByTestId('browser-content')).toBeDefined();
            expect(screen.getByText('Hello World')).toBeDefined();
        });

        it('children berada di dalam browser shell, bukan di header', () => {
            const { container } = render(
                <Browser>
                    <div data-testid="inner-content">Content</div>
                </Browser>,
            );
            const browserShell = container.querySelector('[data-oxobz-browser]')!;
            const header = container.querySelector('[data-oxobz-browser-header-root]')!;
            const content = screen.getByTestId('inner-content');

            // content is inside browser shell
            expect(browserShell.contains(content)).toBe(true);
            // content is NOT inside header
            expect(header.contains(content)).toBe(false);
        });
    });

    // ---- className & props forwarding ----
    describe('className dan props forwarding', () => {
        it('forward className ke container query wrapper', () => {
            const { container } = render(<Browser className="custom-class" />);
            const el = container.firstChild as HTMLElement;
            expect(el.className).toContain('custom-class');
        });

        it('forward style prop', () => {
            const { container } = render(<Browser style={{ width: '100%' }} />);
            const el = container.firstChild as HTMLElement;
            expect(el.style.width).toBe('100%');
        });

        it('forward data-* attributes', () => {
            const { container } = render(<Browser data-testid="my-browser" />);
            const el = container.firstChild as HTMLElement;
            expect(el.getAttribute('data-testid')).toBe('my-browser');
        });

        it('forward id attribute', () => {
            const { container } = render(<Browser id="browser-1" />);
            const el = container.firstChild as HTMLElement;
            expect(el.id).toBe('browser-1');
        });
    });

    // ---- Ref forwarding ----
    describe('ref forwarding', () => {
        it('forward ref ke container query wrapper div', () => {
            const ref = createRef<HTMLDivElement>();
            render(<Browser ref={ref} />);
            expect(ref.current).not.toBeNull();
            expect(ref.current!.tagName.toLowerCase()).toBe('div');
        });
    });

    // ---- displayName ----
    describe('displayName', () => {
        it('mempunyai displayName "Browser"', () => {
            expect(Browser.displayName).toBe('Browser');
        });
    });
});
