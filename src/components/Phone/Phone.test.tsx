import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Phone } from './Phone';

/** The outer element: it only sets up the container query. */
function getWrapper(container: HTMLElement) {
    return container.firstElementChild as HTMLElement;
}

/** The frame: the element that receives className and every other prop. */
function getFrame(container: HTMLElement) {
    return getWrapper(container).firstElementChild as HTMLElement;
}

/** Class names of the frame's direct children, in DOM order. */
function childClasses(container: HTMLElement) {
    return Array.from(getFrame(container).children).map((el) => el.className);
}

describe('Phone', () => {
    // ── Structure ──

    it('wraps the frame in a class-less element that sets up the container query', () => {
        const { container } = render(<Phone />);
        const wrapper = getWrapper(container);
        expect(wrapper.tagName).toBe('DIV');
        expect(wrapper).not.toHaveAttribute('class');
        expect(wrapper.getAttribute('style')).toContain('container-type: inline-size');
        expect(wrapper.children).toHaveLength(1);
    });

    it('carries no marker, version or aria-hidden attribute anywhere', () => {
        const { container } = render(<Phone address="https://vercel.com" />);
        const all = [getWrapper(container), ...Array.from(container.querySelectorAll('div, span'))];
        for (const el of all) {
            for (const name of el.getAttributeNames()) {
                expect(name.startsWith('data-')).toBe(false);
                expect(name).not.toBe('aria-hidden');
            }
        }
    });

    it('renders screen, notch, home indicator and four side buttons without an address', () => {
        const { container } = render(<Phone />);
        const classes = childClasses(container);
        expect(classes).toHaveLength(7);
        expect(classes[0]).toContain('screen');
        expect(classes[1]).toContain('notch');
        expect(classes[2]).toContain('homeIndicator');
        expect(classes[3]).toContain('buttonMute');
        expect(classes[4]).toContain('buttonVolumeUp');
        expect(classes[5]).toContain('buttonVolumeDown');
        expect(classes[6]).toContain('buttonPower');
        classes.slice(3).forEach((name) => expect(name).toContain('sideButton'));
    });

    it('puts the bottom bar between the home indicator and the side buttons', () => {
        const { container } = render(<Phone address="https://vercel.com" />);
        const classes = childClasses(container);
        expect(classes).toHaveLength(8);
        expect(classes[2]).toContain('homeIndicator');
        expect(classes[3]).toContain('bar');
        expect(classes[4]).toContain('buttonMute');
    });

    // ── notch ──

    it('draws the notch by default and leaves it out with notch={false}', () => {
        const { container, rerender } = render(<Phone />);
        expect(container.querySelector('[class*="notch"]')).not.toBeNull();
        rerender(<Phone notch={false} />);
        expect(container.querySelector('[class*="notch"]')).toBeNull();
        expect(childClasses(container)).toHaveLength(6);
    });

    // ── variant ──

    it('uses the dark frame by default', () => {
        const { container } = render(<Phone />);
        const frame = getFrame(container);
        expect(frame.className).toContain('frame');
        expect(frame.className).toContain('dark');
        expect(frame.className).not.toContain('light');
    });

    it('switches to the light frame with variant="light"', () => {
        const { container } = render(<Phone variant="light" />);
        const frame = getFrame(container);
        expect(frame.className).toContain('light');
        expect(frame.className).not.toContain('dark');
    });

    // ── address ──

    it('renders no bar, no gradient and no icon without an address', () => {
        const { container } = render(<Phone />);
        expect(container.querySelector('[class*="bar"]')).toBeNull();
        expect(container.querySelector('[class*="scrim"]')).toBeNull();
        expect(container.querySelectorAll('svg')).toHaveLength(0);
    });

    it('renders the gradient and a bar of three pills with two icons when an address is set', () => {
        const { container } = render(<Phone address="https://vercel.com" />);
        expect(container.querySelector('[class*="scrim"]')).not.toBeNull();
        const bar = container.querySelector('[class*="bar"]') as HTMLElement;
        expect(bar.children).toHaveLength(3);
        Array.from(bar.children).forEach((pill) => expect(pill.className).toContain('pill'));
        expect(bar.children[0].querySelector('svg')).not.toBeNull();
        expect(bar.children[1].className).toContain('pillAddress');
        expect(bar.children[1].querySelector('svg')).toBeNull();
        expect(bar.children[2].querySelector('svg')).not.toBeNull();
    });

    it.each([
        ['https://vercel.com', 'vercel.com'],
        ['http://vercel.com', 'vercel.com'],
        ['https://www.vercel.com/', 'vercel.com'],
        ['www.vercel.com', 'vercel.com'],
        ['vercel.com/geist/', 'vercel.com/geist'],
        ['vercel.com//', 'vercel.com/'],
    ])('shows %s as %s', (address, shown) => {
        const { container } = render(<Phone address={address} />);
        expect(container.querySelector('[class*="addressText"]')?.textContent).toBe(shown);
    });

    // ── children ──

    it('renders children inside the screen, not inside the bar', () => {
        const { container } = render(
            <Phone address="https://vercel.com">
                <img alt="Vercel dashboard on iPhone" data-testid="shot" src="/shot.png" />
            </Phone>,
        );
        const shot = screen.getByTestId('shot');
        expect(container.querySelector('[class*="screenBackdrop"]')?.contains(shot)).toBe(true);
        expect(container.querySelector('[class*="bar"]')?.contains(shot)).toBe(false);
    });

    // ── className, props, ref, displayName ──

    it('appends a custom className after the module classes, on the frame', () => {
        const { container } = render(<Phone className="custom-phone" />);
        const frame = getFrame(container);
        expect(frame.className).toContain('frame');
        expect(frame.className.endsWith('custom-phone')).toBe(true);
        expect(getWrapper(container)).not.toHaveAttribute('class');
    });

    it('forwards extra HTML attributes to the frame', () => {
        const { container } = render(<Phone id="phone-1" style={{ width: '50%' }} title="Preview" />);
        const frame = getFrame(container);
        expect(frame).toHaveAttribute('id', 'phone-1');
        expect(frame).toHaveAttribute('title', 'Preview');
        expect(frame.style.width).toBe('50%');
    });

    it('forwards ref to the frame', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<Phone ref={ref} />);
        expect(ref.current).toBe(getFrame(container));
    });

    it('has the correct displayName', () => {
        expect(Phone.displayName).toBe('Phone');
    });
});
