import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Label } from './Label';

/**
 * Sejak 30 Agu 2026 struktur Label mengikuti produksi: <label> POLOS berisi
 * <div> yang membawa seluruh kelasnya. Pembantu ini mengambil div itu.
 */
function isi(container: HTMLElement) {
    return container.querySelector('label > div');
}

describe('Label', () => {
    // ── Rendering (value) ──

    it('renders a label element with the value text', () => {
        const { container } = render(<Label value="Email address" />);
        const label = container.querySelector('label');
        expect(label).toBeInTheDocument();
        expect(screen.getByText('Email address')).toBeInTheDocument();
    });

    it('renders without a value', () => {
        const { container } = render(<Label />);
        const label = container.querySelector('label');
        expect(label).toBeInTheDocument();
        expect(label?.textContent).toBe('');
    });

    it('applies base label class to the inner div', () => {
        const { container } = render(<Label value="Base" />);
        expect(container.querySelector('label')?.className).toBe('');
        expect(isi(container)?.className).toContain('label');
    });

    it('falls back to children when value is omitted', () => {
        const { container } = render(<Label>Legacy children</Label>);
        const label = container.querySelector('label');
        expect(label?.textContent).toBe('Legacy children');
    });

    it('prefers value over children when both are provided', () => {
        const { container } = render(<Label value="From value">From children</Label>);
        const label = container.querySelector('label');
        expect(label?.textContent).toBe('From value');
    });

    // ── id / htmlFor pass-through ──

    it('passes id through (docs pattern: referenced via aria-labelledby)', () => {
        const { container } = render(<Label id="test-input" value="Email" />);
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('id', 'test-input');
    });

    it('passes htmlFor through to the for attribute', () => {
        // getByText kini mengembalikan <div> di dalamnya, jadi atributnya
        // diperiksa pada <label> pembungkusnya.
        const { container } = render(<Label htmlFor="email-field" value="Email" />);
        expect(container.querySelector('label')).toHaveAttribute('for', 'email-field');
    });

    it('does not have a for attribute when htmlFor is omitted', () => {
        render(<Label value="No for" />);
        const label = screen.getByText('No for');
        expect(label).not.toHaveAttribute('for');
    });

    // ── withInput ──

    it('applies input class when withInput is true', () => {
        const { container } = render(<Label value="Input label" withInput />);
        const label = container.querySelector('label');
        expect(isi(container)?.className).toContain('input');
    });

    it('does not apply input class by default', () => {
        const { container } = render(<Label value="Plain" />);
        const label = container.querySelector('label');
        expect(isi(container)?.className).not.toContain('input');
    });

    // ── bypassCasing (opt-out; casing is applied by default) ──

    it('applies capitalize class by default', () => {
        const { container } = render(<Label value="default casing" />);
        const label = container.querySelector('label');
        expect(isi(container)?.className).toContain('capitalize');
    });

    it('removes capitalize class when bypassCasing is true', () => {
        const { container } = render(<Label value="no casing" bypassCasing />);
        const label = container.querySelector('label');
        expect(isi(container)?.className).not.toContain('capitalize');
    });

    // ── data-version ──

    it('has data-version="v1" by default', () => {
        const { container } = render(<Label value="Version" />);
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('data-version', 'v1');
    });

    it('allows overriding data-version', () => {
        const { container } = render(<Label value="Version" data-version="v2" />);
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('data-version', 'v2');
    });

    // ── className ──

    it('merges custom className with base class', () => {
        const { container } = render(<Label value="Custom" className="my-custom-class" />);
        const label = container.querySelector('label');
        expect(isi(container)?.className).toContain('my-custom-class');
        expect(isi(container)?.className).toContain('label');
    });

    // ── Combined props ──

    it('combines withInput + bypassCasing + custom className', () => {
        const { container } = render(
            <Label value="All props" withInput bypassCasing className="extra" />,
        );
        const label = container.querySelector('label');
        expect(isi(container)?.className).toContain('label');
        expect(isi(container)?.className).toContain('input');
        expect(isi(container)?.className).not.toContain('capitalize');
        expect(isi(container)?.className).toContain('extra');
    });

    // ── Prop forwarding ──

    it('forwards additional HTML label attributes', () => {
        const { container } = render(<Label id="my-label" title="tooltip" value="Attrs" />);
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('id', 'my-label');
        expect(label).toHaveAttribute('title', 'tooltip');
    });

    // ── Ref forwarding ──

    it('forwards ref to the label element', () => {
        const ref = vi.fn();
        render(<Label ref={ref} value="Ref" />);
        expect(ref).toHaveBeenCalledWith(expect.any(HTMLLabelElement));
    });

    // ── Display name ──

    it('has displayName "Label"', () => {
        expect(Label.displayName).toBe('Label');
    });
});
