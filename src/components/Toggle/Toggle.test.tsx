import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Toggle } from './Toggle';

const noop = () => {};

describe('Toggle', () => {
    // ── Rendering ──

    it('renders a root label with data-oxobz-toggle and data-version="v1"', () => {
        const { container } = render(
            <Toggle aria-label="Enable Firewall" checked={false} onChange={noop} />,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('LABEL');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('wrapper');
    });

    it('allows custom data-version', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} data-version="v2" onChange={noop} />,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root).toHaveAttribute('data-version', 'v2');
    });

    it('renders a hidden checkbox input with the toggle/input testid', () => {
        render(<Toggle aria-label="x" checked={false} onChange={noop} />);
        const input = screen.getByRole('checkbox');
        expect(input).toHaveAttribute('type', 'checkbox');
        expect(input).toHaveAttribute('data-testid', 'toggle/input');
        expect(input.className).toContain('oxobz-sr-only');
        expect(input.className).toContain('input');
    });

    it('renders the DOM structure label > input + span.track > div.thumb', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} />,
        );
        const label = container.querySelector('label');
        const input = label?.querySelector('input[type="checkbox"]');
        expect(input).toBeInTheDocument();
        const track = label?.querySelector('span[class*="track"]');
        expect(track?.className).toContain('track');
        const thumb = track?.querySelector('div[class*="thumb"]');
        expect(thumb?.className).toContain('thumb');
    });

    // ── Accessible name ──

    it('places the aria-label on the label root (snapshot parity)', () => {
        const { container } = render(
            <Toggle aria-label="Enable Firewall" checked={false} onChange={noop} />,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root).toHaveAttribute('aria-label', 'Enable Firewall');
        // The name comes from the label, not the input.
        expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-label');
    });

    // ── Checked / unchecked ──

    it('reflects the checked prop on the input and track/thumb classes', () => {
        const { container } = render(
            <Toggle aria-label="x" checked onChange={noop} />,
        );
        expect(screen.getByRole('checkbox')).toBeChecked();
        const track = container.querySelector('span[class*="track"]');
        const thumb = container.querySelector('div[class*="thumb"]');
        expect(track?.className).toContain('checked');
        expect(thumb?.className).toContain('checked');
    });

    it('renders no checked class when unchecked', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} />,
        );
        expect(screen.getByRole('checkbox')).not.toBeChecked();
        const track = container.querySelector('span[class*="track"]');
        const thumb = container.querySelector('div[class*="thumb"]');
        expect(track?.className).not.toContain('checked');
        expect(thumb?.className).not.toContain('checked');
    });

    // ── Disabled ──

    it('disables the input and adds the disabled class to track and thumb', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} disabled onChange={noop} />,
        );
        expect(screen.getByRole('checkbox')).toBeDisabled();
        const track = container.querySelector('span[class*="track"]');
        const thumb = container.querySelector('div[class*="thumb"]');
        expect(track?.className).toContain('disabled');
        expect(thumb?.className).toContain('disabled');
    });

    it('is not disabled by default', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} />,
        );
        expect(screen.getByRole('checkbox')).not.toBeDisabled();
        const track = container.querySelector('span[class*="track"]');
        expect(track?.className).not.toContain('disabled');
    });

    // ── Sizes ──

    it('applies no size class for the default (small) size', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} />,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root?.className).not.toContain('medium');
        expect(root?.className).not.toContain('large');
    });

    it('applies no size class when size="small" is explicit', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} size="small" />,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root?.className).not.toContain('medium');
        expect(root?.className).not.toContain('large');
    });

    it('applies the medium class on the wrapper', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} size="medium" />,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root?.className).toContain('medium');
    });

    it('applies the large class on the wrapper', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} size="large" />,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root?.className).toContain('large');
    });

    // ── Custom color (inline CSS var overrides) ──

    it('sets the amber color override variables inline', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} color="amber" onChange={noop} />,
        );
        const root = container.querySelector<HTMLElement>('[data-oxobz-toggle]');
        expect(root?.style.getPropertyValue('--unchecked-bg-color-override')).toBe(
            'var(--ds-amber-700)',
        );
        expect(root?.style.getPropertyValue('--checked-bg-color-override')).toBe(
            'var(--ds-gray-100)',
        );
        expect(root?.style.getPropertyValue('--thumb-fg-color-override')).toBe(
            'var(--ds-amber-100)',
        );
        expect(root?.style.getPropertyValue('--thumb-light-fg-color-override')).toBe(
            'var(--ds-amber-1000)',
        );
    });

    it('sets the red color override variables inline', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} color="red" onChange={noop} />,
        );
        const root = container.querySelector<HTMLElement>('[data-oxobz-toggle]');
        expect(root?.style.getPropertyValue('--unchecked-bg-color-override')).toBe(
            'var(--ds-red-600)',
        );
        expect(root?.style.getPropertyValue('--thumb-light-fg-color-override')).toBe(
            'var(--ds-red-1000)',
        );
    });

    it('sets no color override variables without a color', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} />,
        );
        const root = container.querySelector<HTMLElement>('[data-oxobz-toggle]');
        expect(root?.style.getPropertyValue('--unchecked-bg-color-override')).toBe('');
    });

    it('lets a user style override the color variables (user wins)', () => {
        const { container } = render(
            <Toggle
                aria-label="x"
                checked={false}
                color="amber"
                onChange={noop}
                style={{ maxWidth: '80px' }}
            />,
        );
        const root = container.querySelector<HTMLElement>('[data-oxobz-toggle]');
        expect(root).toHaveStyle({ maxWidth: '80px' });
        expect(root?.style.getPropertyValue('--unchecked-bg-color-override')).toBe(
            'var(--ds-amber-700)',
        );
    });

    // ── Icon ──

    it('renders the unchecked icon inside an aria-hidden thumbIcon when off', () => {
        const { container } = render(
            <Toggle
                aria-label="x"
                checked={false}
                icon={{
                    checked: <svg data-testid="icon-on" />,
                    unchecked: <svg data-testid="icon-off" />,
                }}
                onChange={noop}
            />,
        );
        expect(screen.getByTestId('icon-off')).toBeInTheDocument();
        expect(screen.queryByTestId('icon-on')).not.toBeInTheDocument();
        const thumbIcon = container.querySelector('div[class*="thumbIcon"]');
        expect(thumbIcon).toBeInTheDocument();
        expect(thumbIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders the checked icon when on', () => {
        render(
            <Toggle
                aria-label="x"
                checked
                icon={{
                    checked: <svg data-testid="icon-on" />,
                    unchecked: <svg data-testid="icon-off" />,
                }}
                onChange={noop}
            />,
        );
        expect(screen.getByTestId('icon-on')).toBeInTheDocument();
        expect(screen.queryByTestId('icon-off')).not.toBeInTheDocument();
    });

    it('renders no thumbIcon without an icon', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} />,
        );
        expect(container.querySelector('div[class*="thumbIcon"]')).not.toBeInTheDocument();
    });

    // ── Direction ──

    it('applies no switchFirst class by default (label-first)', () => {
        const { container } = render(
            <Toggle checked={false} onChange={noop}>
                Enable Firewall
            </Toggle>,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root?.className).not.toContain('switchFirst');
    });

    it('applies the switchFirst class for direction="switch-first"', () => {
        const { container } = render(
            <Toggle checked={false} direction="switch-first" onChange={noop}>
                Enable Firewall
            </Toggle>,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root?.className).toContain('switchFirst');
    });

    // ── Label casing ──

    it('applies the titleCasing class by default', () => {
        const { container } = render(
            <Toggle checked={false} onChange={noop}>
                Enable Firewall
            </Toggle>,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root?.className).toContain('titleCasing');
    });

    it('applies no titleCasing class for labelCasing="normal"', () => {
        const { container } = render(
            <Toggle checked={false} labelCasing="normal" onChange={noop}>
                Enable Firewall
            </Toggle>,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root?.className).not.toContain('titleCasing');
    });

    // ── Label (children) ──

    it('renders the children label in a leading span', () => {
        const { container } = render(
            <Toggle checked={false} onChange={noop}>
                Enable Firewall
            </Toggle>,
        );
        const label = container.querySelector('[data-oxobz-toggle]');
        const firstChild = label?.firstElementChild;
        expect(firstChild?.tagName).toBe('SPAN');
        expect(firstChild?.textContent).toBe('Enable Firewall');
    });

    it('renders no label span without children', () => {
        const { container } = render(
            <Toggle aria-label="x" checked={false} onChange={noop} />,
        );
        const label = container.querySelector('[data-oxobz-toggle]');
        // First element child is the input, not a label span.
        expect(label?.firstElementChild?.tagName).toBe('INPUT');
    });

    // ── Change behaviour ──

    it('fires onChange when the input is toggled', () => {
        const onChange = vi.fn();
        render(<Toggle aria-label="x" checked={false} onChange={onChange} />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    // ── Custom className ──

    it('appends custom className after the module classes on the wrapper', () => {
        const { container } = render(
            <Toggle
                aria-label="x"
                checked={false}
                className="custom-toggle"
                onChange={noop}
            />,
        );
        const root = container.querySelector('[data-oxobz-toggle]');
        expect(root?.className).toContain('wrapper');
        expect(root?.className).toContain('custom-toggle');
        expect(root?.className.endsWith('custom-toggle')).toBe(true);
    });

    // ── Ref + prop forwarding ──

    it('forwards ref to the checkbox input', () => {
        const ref = createRef<HTMLInputElement>();
        render(<Toggle aria-label="x" checked={false} onChange={noop} ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
        expect(ref.current).toHaveAttribute('type', 'checkbox');
    });

    it('forwards extra input attributes (name, id) to the input', () => {
        render(
            <Toggle
                aria-label="x"
                checked={false}
                id="firewall"
                name="firewall"
                onChange={noop}
            />,
        );
        const input = screen.getByRole('checkbox');
        expect(input).toHaveAttribute('name', 'firewall');
        expect(input).toHaveAttribute('id', 'firewall');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Toggle.displayName).toBe('Toggle');
    });
});
