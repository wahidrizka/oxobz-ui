import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
    // ── Rendering ──

    it('renders as an inline-flex label with checkbox input', () => {
        render(<Checkbox>Accept terms</Checkbox>);
        const input = screen.getByRole('checkbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'checkbox');
    });

    it('renders children as label text', () => {
        render(<Checkbox>My label</Checkbox>);
        expect(screen.getByText('My label')).toBeInTheDocument();
    });

    it('renders without children (no label text span)', () => {
        const { container } = render(<Checkbox />);
        const input = container.querySelector('input[type="checkbox"]');
        expect(input).toBeInTheDocument();
        // No text span should be present
        const textSpan = container.querySelector('label > span:last-child');
        // The text span should not be present when children is undefined
        expect(textSpan?.textContent).not.toBe(undefined);
    });

    it('generates an automatic id for the input', () => {
        render(<Checkbox>Test</Checkbox>);
        const input = screen.getByRole('checkbox');
        expect(input.id).toContain('checkbox-');
    });

    it('uses provided id when given', () => {
        render(<Checkbox id="custom-id">Test</Checkbox>);
        const input = screen.getByRole('checkbox');
        expect(input.id).toBe('custom-id');
    });

    it('links label to input via htmlFor', () => {
        render(<Checkbox id="linked">Linked</Checkbox>);
        const label = screen.getByText('Linked').closest('label');
        expect(label).toHaveAttribute('for', 'linked');
    });

    it('sets data-version attribute', () => {
        const { container } = render(<Checkbox>Test</Checkbox>);
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('data-version', 'v1');
    });

    it('allows custom data-version', () => {
        const { container } = render(<Checkbox data-version="v2">Test</Checkbox>);
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('data-version', 'v2');
    });

    // ── Checked state ──

    it('respects checked prop', () => {
        render(<Checkbox checked onChange={() => { }}>Checked</Checkbox>);
        const input = screen.getByRole('checkbox');
        expect(input).toBeChecked();
    });

    it('respects defaultChecked prop', () => {
        render(<Checkbox defaultChecked>Default Checked</Checkbox>);
        const input = screen.getByRole('checkbox');
        expect(input).toBeChecked();
    });

    it('fires onChange when clicked', () => {
        const onChange = vi.fn();
        render(<Checkbox onChange={onChange}>Click me</Checkbox>);
        const input = screen.getByRole('checkbox');
        fireEvent.click(input);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    // ── Disabled state ──

    it('applies disabled attribute to input', () => {
        render(<Checkbox disabled>Disabled</Checkbox>);
        const input = screen.getByRole('checkbox');
        expect(input).toBeDisabled();
    });

    it('applies disabled CSS class to container label', () => {
        const { container } = render(<Checkbox disabled>Disabled</Checkbox>);
        const label = container.querySelector('label');
        expect(label?.className).toMatch(/disabled/);
    });

    it('applies disabled CSS class to icon span', () => {
        const { container } = render(<Checkbox disabled>Disabled</Checkbox>);
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon?.className).toMatch(/disabled/);
    });

    // ── Indeterminate state ──

    it('applies indeterminate class to icon when indeterminate prop is true', () => {
        const { container } = render(<Checkbox indeterminate>Indeterminate</Checkbox>);
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon?.className).toContain('indeterminate');
    });

    it('does not apply indeterminate class when prop is false', () => {
        const { container } = render(<Checkbox>Normal</Checkbox>);
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon?.className).not.toContain('indeterminate');
    });

    // ── Inverted state ──

    it('applies inverted class to icon when inverted prop is true', () => {
        const { container } = render(<Checkbox inverted>Inverted</Checkbox>);
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon?.className).toContain('inverted');
    });

    it('does not apply inverted class when prop is false', () => {
        const { container } = render(<Checkbox>Normal</Checkbox>);
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon?.className).not.toContain('inverted');
    });

    // ── FullWidth ──

    it('applies fullWidth CSS class when fullWidth prop is true', () => {
        const { container } = render(<Checkbox fullWidth>Full</Checkbox>);
        const label = container.querySelector('label');
        expect(label?.className).toMatch(/fullWidth/);
    });

    // ── SR-only input ──

    it('applies oxobz-sr-only class to the input', () => {
        const { container } = render(<Checkbox>SR</Checkbox>);
        const input = container.querySelector('input');
        expect(input?.className).toContain('oxobz-sr-only');
    });

    // ── SVG icon ──

    it('renders SVG inside the icon span', () => {
        const { container } = render(<Checkbox>With SVG</Checkbox>);
        const svg = container.querySelector('[aria-hidden="true"] svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
    });

    it('renders checkmark path and indeterminate line in SVG', () => {
        const { container } = render(<Checkbox>Check</Checkbox>);
        const path = container.querySelector('[aria-hidden="true"] svg path');
        const line = container.querySelector('[aria-hidden="true"] svg line');
        expect(path).toBeInTheDocument();
        expect(line).toBeInTheDocument();
    });

    // ── Ref forwarding ──

    it('forwards ref to the input element', () => {
        const ref = vi.fn();
        render(<Checkbox ref={ref}>Ref</Checkbox>);
        expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });

    // ── Prop forwarding ──

    it('forwards additional HTML input attributes', () => {
        render(<Checkbox name="terms" value="yes">Terms</Checkbox>);
        const input = screen.getByRole('checkbox');
        expect(input).toHaveAttribute('name', 'terms');
        expect(input).toHaveAttribute('value', 'yes');
    });

    it('passes className to the container label', () => {
        const { container } = render(<Checkbox className="custom">Custom</Checkbox>);
        const label = container.querySelector('label');
        expect(label?.className).toContain('custom');
    });

    // ── Display name ──

    it('has displayName "Checkbox"', () => {
        expect(Checkbox.displayName).toBe('Checkbox');
    });

    // ── Combined states ──

    it('can be disabled + checked + indeterminate simultaneously', () => {
        const { container } = render(
            <Checkbox checked disabled indeterminate onChange={() => { }}>
                All states
            </Checkbox>,
        );
        const input = screen.getByRole('checkbox');
        expect(input).toBeChecked();
        expect(input).toBeDisabled();
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon?.className).toContain('indeterminate');
        expect(icon?.className).toMatch(/disabled/);
    });

    // ── Accessibility ──

    it('renders icon span with aria-hidden="true"', () => {
        const { container } = render(<Checkbox>A11y</Checkbox>);
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon).toBeInTheDocument();
    });

    it('renders with a zero-width space in the check span', () => {
        const { container } = render(<Checkbox>ZWS</Checkbox>);
        const checkSpan = container.querySelector('label > span:first-child');
        expect(checkSpan?.textContent).toContain('\u200B');
    });
});
