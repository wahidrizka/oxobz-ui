import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Input } from './Input';

describe('Input', () => {
    // ── Rendering ──

    it('renders the DOM structure div[data-oxobz-input-wrapper] > input', () => {
        const { container } = render(<Input aria-labelledby="Demo input" />);
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveAttribute('data-version', 'v1');
        expect(wrapper?.className).toContain('container');
        const input = wrapper?.querySelector('input');
        expect(input).toBeInTheDocument();
        expect(input?.className).toContain('input');
        expect(input).toHaveAttribute('data-oxobz-input');
    });

    it('does not wrap the field in a <label> without the label prop', () => {
        const { container } = render(<Input aria-labelledby="Demo input" />);
        expect(container.querySelector('label')).not.toBeInTheDocument();
    });

    it('allows custom data-version', () => {
        const { container } = render(
            <Input aria-labelledby="Demo input" data-version="v2" />,
        );
        expect(
            container.querySelector('[data-oxobz-input-wrapper]'),
        ).toHaveAttribute('data-version', 'v2');
    });

    it('applies production default attributes to the input', () => {
        render(<Input aria-labelledby="Demo input" />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('autocapitalize', 'none');
        expect(input).toHaveAttribute('autocomplete', 'off');
        expect(input).toHaveAttribute('autocorrect', 'off');
        expect(input).toHaveAttribute('spellcheck', 'false');
        expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('generates an id with the input- prefix and accepts a custom id', () => {
        const { rerender } = render(<Input aria-labelledby="Demo input" />);
        expect(screen.getByRole('textbox').id).toMatch(/^input-/);
        rerender(<Input aria-labelledby="Demo input" id="my-domain" />);
        expect(screen.getByRole('textbox').id).toBe('my-domain');
    });

    it('forwards placeholder and native props (Default docs example)', () => {
        render(<Input aria-labelledby="Demo input" placeholder="Default" />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('placeholder', 'Default');
        expect(input).toHaveAttribute('aria-labelledby', 'Demo input');
    });

    it('allows overriding the input type', () => {
        const { container } = render(
            <Input aria-label="Search" type="search" />,
        );
        expect(container.querySelector('input')).toHaveAttribute(
            'type',
            'search',
        );
    });

    // ── Sizes ──

    it('applies no size class for the default (medium) size', () => {
        const { container } = render(<Input aria-labelledby="Demo input" />);
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).not.toContain('small');
        expect(wrapper?.className).not.toContain('large');
    });

    it('applies the small class on the wrapper', () => {
        const { container } = render(
            <Input aria-labelledby="Demo input" size="small" />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).toContain('small');
    });

    it('applies the large class on the wrapper', () => {
        const { container } = render(
            <Input aria-labelledby="Demo input" size="large" />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).toContain('large');
    });

    it('sets --oxobz-icon-size per size, 16px when the size prop is implicit (production quirk)', () => {
        const { container, rerender } = render(
            <Input aria-labelledby="Demo input" />,
        );
        const wrapper = (): HTMLElement | null =>
            container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper()?.style.getPropertyValue('--oxobz-icon-size')).toBe(
            '16px',
        );
        rerender(<Input aria-labelledby="Demo input" size="small" />);
        expect(wrapper()?.style.getPropertyValue('--oxobz-icon-size')).toBe(
            '16px',
        );
        rerender(<Input aria-labelledby="Demo input" size="medium" />);
        expect(wrapper()?.style.getPropertyValue('--oxobz-icon-size')).toBe(
            '20px',
        );
        rerender(<Input aria-labelledby="Demo input" size="large" />);
        expect(wrapper()?.style.getPropertyValue('--oxobz-icon-size')).toBe(
            '24px',
        );
    });

    // ── Disabled ──

    it('disables the input', () => {
        render(
            <Input
                aria-labelledby="Demo"
                disabled
                placeholder="Disabled with placeholder"
            />,
        );
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    // ── Error ──

    it('renders the error message with role="alert" wired via aria-describedby', () => {
        const { container } = render(
            <Input
                aria-labelledby="Demo input"
                error="An error message."
                placeholder="long-error@gmail.com"
            />,
        );
        const input = screen.getByRole('textbox');
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('An error message.');
        expect(alert).toHaveAttribute('data-oxobz-error');
        expect(alert).toHaveAttribute('data-version', 'v1');
        expect(alert.id).toBe(`${input.id}-error`);
        expect(input).toHaveAttribute('aria-describedby', alert.id);
        expect(input).toHaveAttribute('aria-invalid', 'true');
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).toContain('error');
        // Stop icon inside the error block
        expect(alert.querySelector('svg')).toBeInTheDocument();
    });

    it('renders no error block and keeps aria-describedby pass-through without error', () => {
        render(<Input aria-describedby="hint" aria-labelledby="Demo input" />);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveAttribute(
            'aria-describedby',
            'hint',
        );
    });

    // ── Label ──

    it('wraps the field in a <label> with labelText when label is set', () => {
        const { container } = render(
            <Input
                aria-labelledby="Demo input"
                label="Label"
                placeholder="Label"
            />,
        );
        const label = container.querySelector('label');
        expect(label).toBeInTheDocument();
        expect(label).toHaveAttribute('data-version', 'v1');
        const input = screen.getByRole('textbox');
        expect(label).toHaveAttribute('for', input.id);
        const text = label?.querySelector('div');
        expect(text?.className).toContain('labelText');
        expect(text?.textContent).toBe('Label');
        // wrapper lives inside the label
        expect(
            label?.querySelector('[data-oxobz-input-wrapper]'),
        ).toBeInTheDocument();
    });

    // ── Prefix / suffix ──

    it('renders the prefix in an aria-hidden label after the input (order via CSS)', () => {
        const { container } = render(
            <Input
                aria-labelledby="Demo"
                placeholder="Default"
                prefix={<svg data-testid="prefix-icon" />}
            />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).toContain('prefix');
        expect(wrapper?.className).not.toContain('suffix');
        const affix = wrapper?.querySelector('[data-oxobz-input-prefix]');
        expect(affix?.tagName).toBe('LABEL');
        expect(affix).toHaveAttribute('aria-hidden', 'true');
        expect(affix).toHaveAttribute(
            'for',
            container.querySelector('input')?.id,
        );
        expect(affix?.className).toContain('affix');
        expect(screen.getByTestId('prefix-icon')).toBeInTheDocument();
        // DOM order: input first, affix second (visual order comes from CSS)
        expect(wrapper?.children[0].tagName).toBe('INPUT');
        expect(wrapper?.children[1]).toBe(affix);
    });

    it('renders the suffix in an aria-hidden label as the last child', () => {
        const { container } = render(
            <Input aria-labelledby="Demo" placeholder="Default" suffix=".com" />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).toContain('suffix');
        const affix = wrapper?.querySelector('[data-oxobz-input-suffix]');
        expect(affix?.tagName).toBe('LABEL');
        expect(affix?.textContent).toBe('.com');
        expect(wrapper?.lastElementChild).toBe(affix);
    });

    it('renders string prefix and suffix together (https:// + .com docs example)', () => {
        const { container } = render(
            <Input
                aria-labelledby="Demo"
                placeholder="Default"
                prefix="https://"
                suffix=".com"
            />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).toContain('prefix');
        expect(wrapper?.className).toContain('suffix');
        expect(
            wrapper?.querySelector('[data-oxobz-input-prefix]')?.textContent,
        ).toBe('https://');
        expect(
            wrapper?.querySelector('[data-oxobz-input-suffix]')?.textContent,
        ).toBe('.com');
    });

    it('applies noPrefixStyle / noSuffixStyle when styling is disabled', () => {
        const { container } = render(
            <Input
                aria-labelledby="Demo"
                placeholder="Default"
                prefix={<svg />}
                prefixStyling={false}
                suffix={<svg />}
                suffixStyling={false}
            />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).toContain('noPrefixStyle');
        expect(wrapper?.className).toContain('noSuffixStyle');
    });

    it('does not apply noPrefixStyle/noSuffixStyle without the matching affix', () => {
        const { container } = render(
            <Input
                aria-labelledby="Demo"
                prefixStyling={false}
                suffixStyling={false}
            />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).not.toContain('noPrefixStyle');
        expect(wrapper?.className).not.toContain('noSuffixStyle');
    });

    it('renders the suffix node directly when suffixContainer={false}', () => {
        const { container } = render(
            <Input
                aria-labelledby="Demo"
                placeholder="Default"
                prefix="vercel/"
                suffix={<svg data-testid="bare-suffix" />}
                suffixContainer={false}
                suffixStyling={false}
            />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(
            wrapper?.querySelector('[data-oxobz-input-suffix]'),
        ).not.toBeInTheDocument();
        // the bare node is the wrapper's last child, still styled positionally
        expect(wrapper?.lastElementChild).toBe(
            screen.getByTestId('bare-suffix'),
        );
        expect(wrapper?.className).toContain('suffix');
    });

    // ── Rounded ──

    it('applies the rounded class (Rounded prefix and suffix docs example)', () => {
        const { container } = render(
            <Input
                aria-labelledby="Demo"
                placeholder="Label example"
                prefix="www."
                rounded
                suffix=".com"
            />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).toContain('rounded');
    });

    // ── Controlled value ──

    it('supports controlled value + onChange', () => {
        const onChange = vi.fn();
        render(
            <Input
                aria-labelledby="Demo input"
                onChange={onChange}
                value="hello"
            />,
        );
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('hello');
        fireEvent.change(input, { target: { value: 'hello!' } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    // ── Custom className ──

    it('appends custom className on the input element', () => {
        const { container } = render(
            <Input aria-labelledby="Demo input" className="custom-input" />,
        );
        const input = container.querySelector('input');
        expect(input?.className).toContain('input');
        expect(input?.className).toContain('custom-input');
    });

    // ── Ref forwarding ──

    it('forwards ref to the input element', () => {
        const ref = createRef<HTMLInputElement>();
        render(<Input aria-labelledby="Demo input" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
        expect(ref.current).toHaveAttribute('data-oxobz-input');
    });

    // ── Search: Escape-to-clear (Geist behaviour) ──

    it('clears a search input when Escape is pressed', () => {
        const { container } = render(
            <Input aria-label="Search" defaultValue="hello" type="search" />,
        );
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input.value).toBe('hello');
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input.value).toBe('');
    });

    it('does NOT clear a non-search input on Escape', () => {
        const { container } = render(
            <Input aria-label="Text" defaultValue="keep" type="text" />,
        );
        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input.value).toBe('keep');
    });

    it('still calls a user-provided onKeyDown on search Escape', () => {
        const onKeyDown = vi.fn();
        const { container } = render(
            <Input
                aria-label="Search"
                defaultValue="x"
                onKeyDown={onKeyDown}
                type="search"
            />,
        );
        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(input.value).toBe('');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Input.displayName).toBe('Input');
    });
});
