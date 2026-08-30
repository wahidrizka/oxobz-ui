import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { ClearableInput } from './ClearableInput';

describe('ClearableInput', () => {
    // ── Rendering (Default docs example) ──

    it('renders the same wrapper/input DOM as Input', () => {
        const { container } = render(
            <ClearableInput aria-label="Demo clearable input" />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveAttribute('data-version', 'v1');
        const input = wrapper?.querySelector('input');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('data-oxobz-input');
        /* TANPA penanda kedua: input produksi cuma membawa `data-geist-input`,
           tidak ada penanda khusus varian clearable (terukur 30 Agu 2026). */
        expect(input).not.toHaveAttribute('data-oxobz-clearable-input');
    });

    it('renders no suffix at all while the field is empty', () => {
        const { container } = render(
            <ClearableInput aria-label="Demo clearable input" />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).not.toContain('suffix');
        expect(
            container.querySelector('[data-oxobz-input-suffix]'),
        ).not.toBeInTheDocument();
    });

    // ── With Label docs example ──

    it('wraps the field in a <label> when label is set', () => {
        const { container } = render(
            <ClearableInput label="Email" placeholder="Enter your email..." />,
        );
        const label = container.querySelector('label[data-version]');
        expect(label).toBeInTheDocument();
        expect(label?.querySelector('div')?.textContent).toBe('Email');
        expect(
            label?.querySelector('[data-oxobz-input-wrapper]'),
        ).toBeInTheDocument();
    });

    // ── Filled field: clear button suffix (Disabled docs example shape) ──

    it('renders the clear button suffix once the field has a value', () => {
        const { container } = render(
            <ClearableInput aria-label="Clearable" defaultValue="Some text" />,
        );
        const wrapper = container.querySelector('[data-oxobz-input-wrapper]');
        expect(wrapper?.className).toContain('suffix');
        const suffix = container.querySelector('[data-oxobz-input-suffix]');
        expect(suffix).toBeInTheDocument();
        const button = suffix?.querySelector('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('tabindex', '-1');
        expect(button?.querySelector('[data-oxobz-kbd]')?.textContent).toBe(
            'Esc',
        );
    });

    it('does not render the clear suffix on a disabled empty field, but does on a disabled filled field', () => {
        const empty = render(<ClearableInput aria-label="A" disabled />);
        expect(
            empty.container.querySelector('[data-oxobz-input-suffix]'),
        ).not.toBeInTheDocument();

        const filled = render(
            <ClearableInput aria-label="B" defaultValue="Some text" disabled />,
        );
        expect(
            filled.container.querySelector('[data-oxobz-input-suffix]'),
        ).toBeInTheDocument();
        expect(filled.container.querySelector('input')).toBeDisabled();
    });

    // ── Clearing behaviour ──

    it('clears an uncontrolled value when the clear button is clicked', () => {
        const { container } = render(
            <ClearableInput aria-label="Clearable" defaultValue="hello" />,
        );
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input.value).toBe('hello');
        const button = container.querySelector('button') as HTMLButtonElement;
        fireEvent.click(button);
        expect(input.value).toBe('');
    });

    it('calls onClear when cleared via the button', () => {
        const onClear = vi.fn();
        const { container } = render(
            <ClearableInput
                aria-label="Clearable"
                defaultValue="hello"
                onClear={onClear}
            />,
        );
        const button = container.querySelector('button') as HTMLButtonElement;
        fireEvent.click(button);
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('clears the value when Escape is pressed', () => {
        const onClear = vi.fn();
        const { container } = render(
            <ClearableInput
                aria-label="Clearable"
                defaultValue="hello"
                onClear={onClear}
            />,
        );
        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input.value).toBe('');
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('does not clear on Escape when the field is empty', () => {
        const onClear = vi.fn();
        render(<ClearableInput aria-label="Clearable" onClear={onClear} />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(onClear).not.toHaveBeenCalled();
    });

    it('still calls a user-provided onKeyDown on Escape', () => {
        const onKeyDown = vi.fn();
        const { container } = render(
            <ClearableInput
                aria-label="Clearable"
                defaultValue="hello"
                onKeyDown={onKeyDown}
            />,
        );
        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(input.value).toBe('');
    });

    it('supports a controlled value (With Clear Callback docs example)', () => {
        const onChange = vi.fn();
        const onClear = vi.fn();
        const { container, rerender } = render(
            <ClearableInput
                aria-label="Clearable input with callback"
                onChange={onChange}
                onClear={onClear}
                value="hello"
            />,
        );
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input.value).toBe('hello');
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        // Controlled: the DOM value only updates once the parent re-renders.
        rerender(
            <ClearableInput
                aria-label="Clearable input with callback"
                onChange={onChange}
                onClear={onClear}
                value=""
            />,
        );
        expect(input.value).toBe('');
    });

    // ── cmdk variant (With Cmdk docs example) ──

    it('renders the cmdk shortcut hint instead of the clear button', () => {
        const { container } = render(
            <ClearableInput aria-label="Search with cmdk" cmdk />,
        );
        const suffix = container.querySelector('[data-oxobz-input-suffix]');
        expect(suffix).toBeInTheDocument();
        expect(container.querySelector('button')).not.toBeInTheDocument();
        const kbds = suffix?.querySelectorAll('[data-oxobz-kbd]');
        expect(kbds).toHaveLength(2);
        expect(suffix?.textContent).toContain('Esc');
        expect(suffix?.textContent).toContain('⌘');
        expect(suffix?.textContent).toContain('K');
    });

    it('renders the cmdk hint even while the field is empty', () => {
        const { container } = render(
            <ClearableInput aria-label="Search with cmdk" cmdk value="" />,
        );
        expect(
            container.querySelector('[data-oxobz-input-suffix]'),
        ).toBeInTheDocument();
    });

    /*
     * data-animate mengikuti ISI, bukan fokus.
     *
     * Diukur bertahap di halaman live (30 Agu 2026): diam "false"; difokuskan
     * tapi masih kosong tetap "false"; begitu diketik jadi "true"; kehilangan
     * fokus tapi isinya masih ada tetap "true". Versi lama test ini mengunci
     * perilaku fokus/blur yang ternyata keliru.
     */
    it('sets data-animate on the cmdk hint only while the field has a value', () => {
        const { container } = render(
            <ClearableInput aria-label="Search with cmdk" cmdk />,
        );
        const hint = container.querySelector(
            '[aria-label="Press Cmd + K to open the Command Menu"]',
        ) as HTMLElement;
        expect(hint).toHaveAttribute('data-animate', 'false');

        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.focus(input);
        expect(hint).toHaveAttribute('data-animate', 'false');

        fireEvent.change(input, { target: { value: 'cari' } });
        expect(hint).toHaveAttribute('data-animate', 'true');

        fireEvent.blur(input);
        expect(hint).toHaveAttribute('data-animate', 'true');

        fireEvent.change(input, { target: { value: '' } });
        expect(hint).toHaveAttribute('data-animate', 'false');
    });

    // ── Custom className ──

    it('appends a custom className on the input element', () => {
        const { container } = render(
            <ClearableInput
                aria-label="Clearable"
                className="custom-clearable"
            />,
        );
        const input = container.querySelector('input');
        expect(input?.className).toContain('input');
        expect(input?.className).toContain('custom-clearable');
    });

    // ── Ref forwarding ──

    it('forwards ref to the input element', () => {
        const ref = createRef<HTMLInputElement>();
        render(<ClearableInput aria-label="Clearable" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
        expect(ref.current).toHaveAttribute('data-oxobz-input');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(ClearableInput.displayName).toBe('ClearableInput');
    });
});
