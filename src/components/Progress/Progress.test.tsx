import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Progress, type ProgressType } from './Progress';

describe('Progress', () => {
    // ── Rendering ──

    it('renders a native <progress> with data-oxobz-progress and data-version="v1"', () => {
        const { container } = render(<Progress value={30} />);
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('PROGRESS');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('progress');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Progress data-version="v2" value={10} />);
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root).toHaveAttribute('data-version', 'v2');
    });

    it('exposes the progressbar role', () => {
        render(<Progress value={40} aria-label="Upload" />);
        const bar = screen.getByRole('progressbar', { name: 'Upload' });
        expect(bar.tagName).toBe('PROGRESS');
    });

    // ── value / max + native attributes ──

    it('defaults value to 0', () => {
        const { container } = render(<Progress />);
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root).toHaveAttribute('value', '0');
        expect(root).toHaveAttribute('aria-valuenow', '0');
    });

    it('reflects value on the native value attribute and aria-valuenow', () => {
        const { container } = render(<Progress value={30} />);
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root).toHaveAttribute('value', '30');
        expect(root).toHaveAttribute('aria-valuenow', '30');
    });

    it('defaults max to 100 (aria-valuemax + native max)', () => {
        const { container } = render(<Progress value={30} />);
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root).toHaveAttribute('max', '100');
        expect(root).toHaveAttribute('aria-valuemax', '100');
    });

    it('supports a custom max', () => {
        const { container } = render(<Progress max={40} value={30} />);
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root).toHaveAttribute('max', '40');
        expect(root).toHaveAttribute('aria-valuemax', '40');
        expect(root).toHaveAttribute('aria-valuenow', '30');
    });

    it('always sets aria-valuemin to 0', () => {
        const { container } = render(<Progress max={40} value={30} />);
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root).toHaveAttribute('aria-valuemin', '0');
    });

    it('clamps value above max down to max', () => {
        const { container } = render(<Progress max={100} value={150} />);
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root).toHaveAttribute('value', '100');
        expect(root).toHaveAttribute('aria-valuenow', '100');
    });

    it('clamps a negative value up to 0', () => {
        const { container } = render(<Progress value={-20} />);
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root).toHaveAttribute('value', '0');
        expect(root).toHaveAttribute('aria-valuenow', '0');
    });

    // ── Fill color: default / type ──

    it('uses the foreground token as the default fill (--fg)', () => {
        const { container } = render(<Progress value={30} />);
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.getPropertyValue('--fg')).toBe(
            'var(--oxobz-foreground)',
        );
    });

    const typeCases: Array<[ProgressType, string]> = [
        ['secondary', 'var(--oxobz-secondary)'],
        ['success', 'var(--oxobz-success)'],
        ['error', 'var(--oxobz-error)'],
        ['warning', 'var(--oxobz-warning)'],
    ];

    it.each(typeCases)('maps type="%s" to the %s fill token', (type, token) => {
        const { container } = render(<Progress type={type} value={50} />);
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.getPropertyValue('--fg')).toBe(token);
    });

    // ── Fill color: dynamic colors ──

    const dynamicColors = {
        0: 'var(--oxobz-foreground)',
        25: 'var(--oxobz-error)',
        50: 'var(--oxobz-warning)',
        75: 'var(--oxobz-highlight-pink)',
        100: 'var(--oxobz-success)',
    };

    it('picks the threshold-0 color for a low value', () => {
        const { container } = render(
            <Progress colors={dynamicColors} value={10} />,
        );
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.getPropertyValue('--fg')).toBe(
            'var(--oxobz-foreground)',
        );
    });

    it('picks the highest threshold <= the current percentage', () => {
        const { container } = render(
            <Progress colors={dynamicColors} value={30} />,
        );
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.getPropertyValue('--fg')).toBe('var(--oxobz-error)');
    });

    it('reaches the top threshold color at 100%', () => {
        const { container } = render(
            <Progress colors={dynamicColors} value={100} />,
        );
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.getPropertyValue('--fg')).toBe(
            'var(--oxobz-success)',
        );
    });

    it('computes the threshold against max, not the raw value', () => {
        // value 20 of max 40 → 50% → warning threshold
        const { container } = render(
            <Progress colors={dynamicColors} max={40} value={20} />,
        );
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.getPropertyValue('--fg')).toBe(
            'var(--oxobz-warning)',
        );
    });

    it('lets colors override type', () => {
        const { container } = render(
            <Progress colors={dynamicColors} type="success" value={30} />,
        );
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.getPropertyValue('--fg')).toBe('var(--oxobz-error)');
    });

    // ── Width / height ──

    it('applies a numeric width as pixels', () => {
        const { container } = render(<Progress value={60} width={200} />);
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.width).toBe('200px');
    });

    it('applies a string width verbatim', () => {
        const { container } = render(<Progress value={60} width="50%" />);
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.width).toBe('50%');
    });

    it('applies a numeric height as pixels', () => {
        const { container } = render(<Progress value={60} height={50} />);
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.height).toBe('50px');
    });

    it('sets no inline width or height by default', () => {
        const { container } = render(<Progress value={60} />);
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root.style.width).toBe('');
        expect(root.style.height).toBe('');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <Progress className="custom-bar" value={30} />,
        );
        const root = container.querySelector('[data-oxobz-progress]');
        expect(root?.className).toContain('progress');
        expect(root?.className).toContain('custom-bar');
        expect(root?.className.endsWith('custom-bar')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the native progress element', () => {
        const ref = createRef<HTMLProgressElement>();
        render(<Progress ref={ref} value={30} />);
        expect(ref.current).toBeInstanceOf(HTMLProgressElement);
        expect(ref.current).toHaveAttribute('data-oxobz-progress');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes and merges inline style', () => {
        const { container } = render(
            <Progress
                id="upload-bar"
                style={{ opacity: 0.5 }}
                value={30}
            />,
        );
        const root = container.querySelector(
            '[data-oxobz-progress]',
        ) as HTMLProgressElement;
        expect(root).toHaveAttribute('id', 'upload-bar');
        expect(root.style.opacity).toBe('0.5');
        // component-managed custom property is preserved alongside user style
        expect(root.style.getPropertyValue('--fg')).toBe(
            'var(--oxobz-foreground)',
        );
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Progress.displayName).toBe('Progress');
    });
});
