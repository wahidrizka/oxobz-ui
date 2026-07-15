import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Switch, SwitchControl } from './Switch';

describe('Switch', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-switch and data-version="v1"', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl defaultChecked label="Source" value="source" />
                <SwitchControl label="Output" value="output" />
            </Switch>,
        );
        const root = container.querySelector('[data-oxobz-switch]');
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('switch');
    });

    it('allows custom data-version', () => {
        const { container } = render(
            <Switch data-version="v2" name="view">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const root = container.querySelector('[data-oxobz-switch]');
        expect(root).toHaveAttribute('data-version', 'v2');
    });

    it('renders one radio input per control', () => {
        render(
            <Switch name="view">
                <SwitchControl defaultChecked label="Source" value="source" />
                <SwitchControl label="Output" value="output" />
            </Switch>,
        );
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(2);
        radios.forEach((radio) => {
            expect(radio).toHaveAttribute('type', 'radio');
        });
    });

    it('renders visible text labels', () => {
        render(
            <Switch name="view">
                <SwitchControl defaultChecked label="Source" value="source" />
                <SwitchControl label="Output" value="output" />
            </Switch>,
        );
        expect(screen.getByText('Source')).toBeInTheDocument();
        expect(screen.getByText('Output')).toBeInTheDocument();
    });

    it('renders the DOM structure label > input + div.control', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const label = container.querySelector('label');
        expect(label?.className).toContain('container');
        const input = label?.querySelector('input[type="radio"]');
        expect(input).toBeInTheDocument();
        const control = label?.querySelector('div');
        expect(control?.className).toContain('control');
        expect(control?.className).toContain('text');
    });

    it('hides the radio input visually via oxobz-sr-only', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const input = container.querySelector('input');
        expect(input?.className).toContain('oxobz-sr-only');
        expect(input?.className).toContain('input');
    });

    // ── Name grouping ──

    it('propagates the Switch name to every control input', () => {
        render(
            <Switch name="view-mode">
                <SwitchControl label="Source" value="source" />
                <SwitchControl label="Output" value="output" />
            </Switch>,
        );
        const radios = screen.getAllByRole('radio');
        radios.forEach((radio) => {
            expect(radio).toHaveAttribute('name', 'view-mode');
        });
    });

    it('lets a control override the group name', () => {
        render(
            <Switch name="view-mode">
                <SwitchControl label="Source" name="tooltip" value="source" />
            </Switch>,
        );
        expect(screen.getByRole('radio')).toHaveAttribute('name', 'tooltip');
    });

    it('renders inputs without a name when Switch has none', () => {
        render(
            <Switch>
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        expect(screen.getByRole('radio')).not.toHaveAttribute('name');
    });

    // ── Selection behaviour (radio semantics) ──

    it('respects defaultChecked', () => {
        render(
            <Switch name="view">
                <SwitchControl defaultChecked label="Source" value="source" />
                <SwitchControl label="Output" value="output" />
            </Switch>,
        );
        const [source, output] = screen.getAllByRole('radio');
        expect(source).toBeChecked();
        expect(output).not.toBeChecked();
    });

    it('keeps options mutually exclusive when clicking another option', () => {
        render(
            <Switch name="view">
                <SwitchControl defaultChecked label="Source" value="source" />
                <SwitchControl label="Output" value="output" />
            </Switch>,
        );
        const [source, output] = screen.getAllByRole('radio');
        fireEvent.click(output);
        expect(output).toBeChecked();
        expect(source).not.toBeChecked();
    });

    it('supports controlled checked + onChange', () => {
        const onChange = vi.fn();
        render(
            <Switch name="view">
                <SwitchControl checked label="Source" onChange={onChange} value="source" />
                <SwitchControl checked={false} label="Output" onChange={onChange} value="output" />
            </Switch>,
        );
        const [, output] = screen.getAllByRole('radio');
        fireEvent.click(output);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('forwards the value attribute to the input', () => {
        render(
            <Switch name="view">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        expect(screen.getByRole('radio')).toHaveAttribute('value', 'source');
    });

    // ── Sizes ──

    it('applies no size class for the default (medium) size', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const root = container.querySelector('[data-oxobz-switch]');
        expect(root?.className).not.toContain('small');
        expect(root?.className).not.toContain('large');
        const control = container.querySelector('label > div');
        expect(control?.className).not.toContain('small');
        expect(control?.className).not.toContain('large');
    });

    it('applies the small class to root and controls', () => {
        const { container } = render(
            <Switch name="view" size="small">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const root = container.querySelector('[data-oxobz-switch]');
        expect(root?.className).toContain('small');
        const control = container.querySelector('label > div');
        expect(control?.className).toContain('small');
    });

    it('applies the large class to root and controls', () => {
        const { container } = render(
            <Switch name="view" size="large">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const root = container.querySelector('[data-oxobz-switch]');
        expect(root?.className).toContain('large');
        const control = container.querySelector('label > div');
        expect(control?.className).toContain('large');
    });

    it('lets a control override the group size (Tooltip docs example)', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl label="Source" size="large" value="source" />
            </Switch>,
        );
        const root = container.querySelector('[data-oxobz-switch]');
        expect(root?.className).not.toContain('large');
        const control = container.querySelector('label > div');
        expect(control?.className).toContain('large');
    });

    // ── Icon mode ──

    it('renders the icon and an sr-only label instead of visible text', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl
                    icon={<svg data-testid="grid-icon" />}
                    label="Grid"
                    value="grid"
                />
            </Switch>,
        );
        expect(screen.getByTestId('grid-icon')).toBeInTheDocument();
        const control = container.querySelector('label > div');
        expect(control?.className).toContain('icon');
        expect(control?.className).not.toContain('text');
        const srLabel = control?.querySelector('span.oxobz-sr-only');
        expect(srLabel).toBeInTheDocument();
        expect(srLabel?.textContent).toBe('Grid');
    });

    it('applies the text class (not icon) when no icon is given', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const control = container.querySelector('label > div');
        expect(control?.className).toContain('text');
        expect(control?.className).not.toContain('icon');
    });

    // ── Disabled ──

    it('disables the input and marks the label with data-disabled="true"', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl disabled label="Source" value="source" />
            </Switch>,
        );
        expect(screen.getByRole('radio')).toBeDisabled();
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('data-disabled', 'true');
    });

    it('marks enabled controls with data-disabled="false"', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('data-disabled', 'false');
    });

    // ── Custom className ──

    it('appends custom className on the Switch root', () => {
        const { container } = render(
            <Switch className="custom-root" name="view">
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const root = container.querySelector('[data-oxobz-switch]');
        expect(root?.className).toContain('switch');
        expect(root?.className).toContain('custom-root');
    });

    it('appends custom className on a control label', () => {
        const { container } = render(
            <Switch name="view">
                <SwitchControl className="custom-control" label="Source" value="source" />
            </Switch>,
        );
        const label = container.querySelector('label');
        expect(label?.className).toContain('container');
        expect(label?.className).toContain('custom-control');
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Switch name="view" ref={ref}>
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-switch');
    });

    it('forwards ref to the control input', () => {
        const ref = createRef<HTMLInputElement>();
        render(
            <Switch name="view">
                <SwitchControl label="Source" ref={ref} value="source" />
            </Switch>,
        );
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
        expect(ref.current).toHaveAttribute('type', 'radio');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (style width — Full width docs example)', () => {
        const { container } = render(
            <Switch name="view" style={{ width: '100%' }}>
                <SwitchControl label="Source" value="source" />
            </Switch>,
        );
        const root = container.querySelector('[data-oxobz-switch]');
        expect(root).toHaveStyle({ width: '100%' });
    });

    // ── Compound export ──

    it('exposes SwitchControl as Switch.Control', () => {
        expect(Switch.Control).toBe(SwitchControl);
    });

    it('has correct displayNames', () => {
        expect(Switch.displayName).toBe('Switch');
        expect(SwitchControl.displayName).toBe('Switch.Control');
    });

    it('renders standalone SwitchControl (no Switch context) with medium defaults', () => {
        const { container } = render(
            <SwitchControl label="Solo" value="solo" />,
        );
        const input = screen.getByRole('radio');
        expect(input).not.toHaveAttribute('name');
        const control = container.querySelector('label > div');
        expect(control?.className).toContain('control');
        expect(control?.className).not.toContain('small');
        expect(control?.className).not.toContain('large');
    });
});
