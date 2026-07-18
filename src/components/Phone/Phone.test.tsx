import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Phone } from './Phone';

describe('Phone', () => {
    // ---- Render dasar ----
    describe('render dasar', () => {
        it('render tanpa error', () => {
            const { container } = render(<Phone />);
            expect(container.firstChild).toBeDefined();
        });

        it('mempunyai data-oxobz-phone attribute', () => {
            const { container } = render(<Phone />);
            const phone = container.querySelector('[data-oxobz-phone]');
            expect(phone).not.toBeNull();
        });

        it('mempunyai data-oxobz-phone-screen attribute pada layar', () => {
            const { container } = render(<Phone />);
            const screen_ = container.querySelector('[data-oxobz-phone-screen="true"]');
            expect(screen_).not.toBeNull();
        });

        it('render container query wrapper', () => {
            const { container } = render(<Phone />);
            const el = container.firstChild as HTMLElement;
            expect(el.className).toMatch(/containerQuery/);
        });

        it('render bezel shell', () => {
            const { container } = render(<Phone />);
            const bezel = container.querySelector('[data-oxobz-phone]') as HTMLElement;
            expect(bezel.className).toMatch(/bezel/);
        });
    });

    // ---- Chrome decoratif ----
    describe('chrome decoratif', () => {
        it('render notch', () => {
            const { container } = render(<Phone />);
            expect(container.querySelector('[class*="notch"]')).not.toBeNull();
        });

        it('render home indicator', () => {
            const { container } = render(<Phone />);
            expect(container.querySelector('[class*="homeIndicator"]')).not.toBeNull();
        });

        it('render 4 side buttons (mute, volume up/down, power)', () => {
            const { container } = render(<Phone />);
            const buttons = container.querySelectorAll('[class*="sideButton"]');
            expect(buttons.length).toBe(4);
        });

        it('notch dan home indicator bersifat aria-hidden', () => {
            const { container } = render(<Phone />);
            const notch = container.querySelector('[class*="notch"]');
            const homeIndicator = container.querySelector('[class*="homeIndicator"]');
            expect(notch?.getAttribute('aria-hidden')).toBe('true');
            expect(homeIndicator?.getAttribute('aria-hidden')).toBe('true');
        });
    });

    // ---- Status bar & address pill ----
    describe('status bar', () => {
        it('render status bar dengan back dan more icon selalu ada', () => {
            const { container } = render(<Phone />);
            const statusBar = container.querySelector('[class*="statusBar"]');
            expect(statusBar).not.toBeNull();
            const svgs = statusBar!.querySelectorAll('svg');
            expect(svgs.length).toBe(2);
        });

        it('render address text ketika address prop diberikan', () => {
            render(<Phone address="vercel.com" />);
            expect(screen.getByText('vercel.com')).toBeDefined();
        });

        it('render pillAddress container ketika address diberikan', () => {
            const { container } = render(<Phone address="vercel.com" />);
            expect(container.querySelector('[class*="pillAddress"]')).not.toBeNull();
        });

        it('tidak render pillAddress ketika address prop tidak diberikan', () => {
            const { container } = render(<Phone />);
            expect(container.querySelector('[class*="pillAddress"]')).toBeNull();
        });
    });

    // ---- Children / screen content ----
    describe('children', () => {
        it('render children di dalam screen backdrop', () => {
            render(
                <Phone address="vercel.com">
                    <img alt="Vercel dashboard on iPhone" src="/shot.png" data-testid="phone-content" />
                </Phone>,
            );
            expect(screen.getByTestId('phone-content')).toBeDefined();
        });

        it('children berada di dalam screen, bukan di status bar', () => {
            const { container } = render(
                <Phone>
                    <div data-testid="inner-content">Content</div>
                </Phone>,
            );
            const screenEl = container.querySelector('[data-oxobz-phone-screen="true"]')!;
            const statusBar = container.querySelector('[class*="statusBar"]')!;
            const content = screen.getByTestId('inner-content');

            expect(screenEl.contains(content)).toBe(true);
            expect(statusBar.contains(content)).toBe(false);
        });
    });

    // ---- className & props forwarding ----
    describe('className dan props forwarding', () => {
        it('forward className ke container query wrapper', () => {
            const { container } = render(<Phone className="custom-class" />);
            const el = container.firstChild as HTMLElement;
            expect(el.className).toContain('custom-class');
        });

        it('forward style prop', () => {
            const { container } = render(<Phone style={{ width: '100%' }} />);
            const el = container.firstChild as HTMLElement;
            expect(el.style.width).toBe('100%');
        });

        it('forward data-* attributes', () => {
            const { container } = render(<Phone data-testid="my-phone" />);
            const el = container.firstChild as HTMLElement;
            expect(el.getAttribute('data-testid')).toBe('my-phone');
        });

        it('forward id attribute', () => {
            const { container } = render(<Phone id="phone-1" />);
            const el = container.firstChild as HTMLElement;
            expect(el.id).toBe('phone-1');
        });
    });

    // ---- Ref forwarding ----
    describe('ref forwarding', () => {
        it('forward ref ke container query wrapper div', () => {
            const ref = createRef<HTMLDivElement>();
            render(<Phone ref={ref} />);
            expect(ref.current).not.toBeNull();
            expect(ref.current!.tagName.toLowerCase()).toBe('div');
        });
    });

    // ---- displayName ----
    describe('displayName', () => {
        it('mempunyai displayName "Phone"', () => {
            expect(Phone.displayName).toBe('Phone');
        });
    });
});
