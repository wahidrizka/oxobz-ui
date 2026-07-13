import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Label } from './Label';

describe('Label', () => {
    // ── Rendering ──

    it('renders a label element with children', () => {
        const { container } = render(<Label>Email address</Label>);
        const label = container.querySelector('label');
        expect(label).toBeInTheDocument();
        expect(screen.getByText('Email address')).toBeInTheDocument();
    });

    it('renders without children', () => {
        const { container } = render(<Label />);
        const label = container.querySelector('label');
        expect(label).toBeInTheDocument();
        expect(label?.textContent).toBe('');
    });

    it('applies base label class', () => {
        const { container } = render(<Label>Base</Label>);
        const label = container.querySelector('label');
        expect(label?.className).toContain('label');
    });

    // ── htmlFor pass-through ──

    it('passes htmlFor through to the for attribute', () => {
        render(<Label htmlFor="email-field">Email</Label>);
        const label = screen.getByText('Email');
        expect(label).toHaveAttribute('for', 'email-field');
    });

    it('does not have a for attribute when htmlFor is omitted', () => {
        render(<Label>No for</Label>);
        const label = screen.getByText('No for');
        expect(label).not.toHaveAttribute('for');
    });

    // ── isInput ──

    it('applies input class when isInput is true', () => {
        const { container } = render(<Label isInput>Input label</Label>);
        const label = container.querySelector('label');
        expect(label?.className).toContain('input');
    });

    it('does not apply input class by default', () => {
        const { container } = render(<Label>Plain</Label>);
        const label = container.querySelector('label');
        expect(label?.className).not.toContain('input');
    });

    // ── capitalize ──

    it('applies capitalize class when capitalize is true', () => {
        const { container } = render(<Label capitalize>capitalized</Label>);
        const label = container.querySelector('label');
        expect(label?.className).toContain('capitalize');
    });

    it('does not apply capitalize class by default', () => {
        const { container } = render(<Label>lowercase</Label>);
        const label = container.querySelector('label');
        expect(label?.className).not.toContain('capitalize');
    });

    // ── data-version ──

    it('has data-version="v1" by default', () => {
        const { container } = render(<Label>Version</Label>);
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('data-version', 'v1');
    });

    it('allows overriding data-version', () => {
        const { container } = render(<Label data-version="v2">Version</Label>);
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('data-version', 'v2');
    });

    // ── className ──

    it('merges custom className with base class', () => {
        const { container } = render(<Label className="my-custom-class">Custom</Label>);
        const label = container.querySelector('label');
        expect(label?.className).toContain('my-custom-class');
        expect(label?.className).toContain('label');
    });

    // ── Combined props ──

    it('combines isInput + capitalize + custom className', () => {
        const { container } = render(
            <Label isInput capitalize className="extra">
                All props
            </Label>,
        );
        const label = container.querySelector('label');
        expect(label?.className).toContain('label');
        expect(label?.className).toContain('input');
        expect(label?.className).toContain('capitalize');
        expect(label?.className).toContain('extra');
    });

    // ── Prop forwarding ──

    it('forwards additional HTML label attributes', () => {
        render(<Label id="my-label" title="tooltip">Attrs</Label>);
        const label = screen.getByText('Attrs');
        expect(label).toHaveAttribute('id', 'my-label');
        expect(label).toHaveAttribute('title', 'tooltip');
    });

    // ── Ref forwarding ──

    it('forwards ref to the label element', () => {
        const ref = vi.fn();
        render(<Label ref={ref}>Ref</Label>);
        expect(ref).toHaveBeenCalledWith(expect.any(HTMLLabelElement));
    });

    // ── Display name ──

    it('has displayName "Label"', () => {
        expect(Label.displayName).toBe('Label');
    });
});
