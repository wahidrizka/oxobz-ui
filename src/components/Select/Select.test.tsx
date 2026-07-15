import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Select } from './Select';

describe('Select', () => {
    // ── Rendering ──

    it('renders a container div with data-oxobz-select and data-version="v1"', () => {
        const { container } = render(
            <Select aria-label="Fruit" placeholder="Select a fruit" />,
        );
        const root = container.querySelector('[data-oxobz-select]');
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('container');
    });

    it('renders the DOM structure label > container > select + suffix', () => {
        const { container } = render(
            <Select aria-label="Fruit" placeholder="Select a fruit" />,
        );
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('data-version', 'v1');
        const wrapper = label?.querySelector('[data-oxobz-select]');
        expect(wrapper).toBeInTheDocument();
        const select = wrapper?.querySelector('select');
        expect(select?.className).toContain('select');
        expect(label).toHaveAttribute('for', select?.id);
        const suffix = wrapper?.querySelector('span');
        expect(suffix?.className).toContain('suffix');
    });

    it('allows custom data-version on label, container, and error block', () => {
        const { container } = render(
            <Select
                aria-label="Fruit"
                data-version="v2"
                error="Please select a value."
            />,
        );
        expect(container.querySelector('label')).toHaveAttribute(
            'data-version',
            'v2',
        );
        expect(
            container.querySelector('[data-oxobz-select]'),
        ).toHaveAttribute('data-version', 'v2');
        expect(container.querySelector('[data-oxobz-error]')).toHaveAttribute(
            'data-version',
            'v2',
        );
    });

    it('renders option children', () => {
        render(
            <Select aria-label="Fruit" placeholder="Select a fruit">
                <option value="apple">Apple</option>
                <option value="orange">Orange</option>
            </Select>,
        );
        const options = screen.getAllByRole('option');
        // placeholder + 2 options
        expect(options).toHaveLength(3);
        expect(
            screen.getByRole('option', { name: 'Apple' }),
        ).toBeInTheDocument();
    });

    it('renders the default chevron suffix icon', () => {
        const { container } = render(<Select aria-label="Fruit" />);
        const suffix = container.querySelector('span');
        expect(suffix?.className).toContain('suffix');
        const icon = suffix?.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon?.className.baseVal).toContain('controlIcon');
    });

    // ── Placeholder ──

    it('renders the placeholder as a disabled first option, selected by default', () => {
        render(
            <Select aria-label="Fruit" placeholder="Select a fruit">
                <option value="apple">Apple</option>
            </Select>,
        );
        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('Select a fruit');
        const placeholderOption = screen.getAllByRole('option')[0];
        expect(placeholderOption).toBeDisabled();
        expect(placeholderOption).toHaveAttribute('label', 'Select a fruit');
        expect(placeholderOption).toHaveAttribute('value', 'Select a fruit');
        expect(placeholderOption.className).toContain('placeholder');
    });

    it('selects defaultValue instead of the placeholder when provided', () => {
        render(
            <Select
                aria-label="Fruit"
                defaultValue="banana"
                placeholder="With default value"
            >
                <option value="apple">Apple</option>
                <option value="banana">Banana</option>
            </Select>,
        );
        expect(screen.getByRole('combobox')).toHaveValue('banana');
    });

    // ── Selection behaviour ──

    it('updates value on user change (uncontrolled)', () => {
        render(
            <Select aria-label="Fruit" placeholder="Select a fruit">
                <option value="apple">Apple</option>
                <option value="orange">Orange</option>
            </Select>,
        );
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'orange' } });
        expect(select).toHaveValue('orange');
    });

    it('supports controlled value + onChange', () => {
        const onChange = vi.fn();
        render(
            <Select aria-label="Fruit" onChange={onChange} value="apple">
                <option value="apple">Apple</option>
                <option value="orange">Orange</option>
            </Select>,
        );
        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('apple');
        fireEvent.change(select, { target: { value: 'orange' } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    // ── Sizes ──

    it('applies no size class for the default (medium) size', () => {
        render(<Select aria-label="Default" />);
        const select = screen.getByRole('combobox');
        expect(select.className).not.toContain('small');
        expect(select.className).not.toContain('large');
    });

    it('applies the small class', () => {
        render(<Select aria-label="Small" size="small" />);
        expect(screen.getByRole('combobox').className).toContain('small');
    });

    it('applies the large class', () => {
        render(<Select aria-label="Large" size="large" />);
        expect(screen.getByRole('combobox').className).toContain('large');
    });

    // ── Prefix & suffix ──

    it('renders the prefix before the select', () => {
        const { container } = render(
            <Select
                aria-label="Fruit"
                prefix={<svg data-testid="prefix-icon" />}
            />,
        );
        expect(screen.getByTestId('prefix-icon')).toBeInTheDocument();
        const wrapper = container.querySelector('[data-oxobz-select]');
        const first = wrapper?.firstElementChild;
        expect(first?.tagName).toBe('SPAN');
        expect(first?.className).toContain('prefix');
        expect(first?.nextElementSibling?.tagName).toBe('SELECT');
    });

    it('replaces the default chevron when a suffix is given', () => {
        const { container } = render(
            <Select
                aria-label="Fruit"
                suffix={<svg data-testid="suffix-icon" />}
            />,
        );
        expect(screen.getByTestId('suffix-icon')).toBeInTheDocument();
        const suffix = container.querySelector(
            '[data-oxobz-select] > span:last-child',
        );
        expect(suffix?.className).toContain('suffix');
        expect(suffix?.querySelector('[data-testid="oxobz-icon"]')).toBeNull();
    });

    // ── Label ──

    it('renders the label text above the control and links it via htmlFor', () => {
        const { container } = render(<Select label="My label" />);
        const labelText = screen.getByText('My label');
        expect(labelText.className).toContain('labelText');
        const label = container.querySelector('label');
        expect(label?.firstElementChild).toBe(labelText);
        const select = screen.getByRole('combobox');
        expect(label).toHaveAttribute('for', select.id);
    });

    it('renders no label text div when label is not given', () => {
        const { container } = render(<Select aria-label="Fruit" />);
        expect(container.querySelector('label')?.firstElementChild).toBe(
            container.querySelector('[data-oxobz-select]'),
        );
    });

    // ── Error ──

    it('renders the error message with role="alert" and wires aria attributes', () => {
        const { container } = render(
            <Select aria-label="Fruit" error="Please select a value." />,
        );
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Please select a value.');
        expect(alert).toHaveAttribute('data-oxobz-error');
        expect(alert).toHaveAttribute('aria-atomic', 'true');
        expect(alert.className).toContain('errorMessage');
        expect(alert).toHaveStyle({ marginTop: '8px' });

        const select = screen.getByRole('combobox');
        expect(select).toHaveAttribute('aria-invalid', 'true');
        expect(alert.id).toBe(`${select.id}-error`);
        expect(select).toHaveAttribute('aria-describedby', alert.id);

        const wrapper = container.querySelector('[data-oxobz-select]');
        expect(wrapper?.className).toContain('error');
    });

    it('renders the error icon hidden from screen readers', () => {
        render(<Select aria-label="Fruit" error="Please select a value." />);
        const alert = screen.getByRole('alert');
        const iconWrap = alert.querySelector('[aria-hidden="true"]');
        expect(iconWrap?.className).toContain('errorIcon');
        expect(iconWrap?.querySelector('svg')).toBeInTheDocument();
    });

    it('uses the large error style for size="large"', () => {
        render(
            <Select
                aria-label="Large with error"
                error="Please select a value."
                size="large"
            />,
        );
        expect(screen.getByRole('alert').className).toContain('errorLarge');
    });

    it('sets aria-invalid="false" and renders no alert without error', () => {
        render(<Select aria-label="Fruit" />);
        expect(screen.getByRole('combobox')).toHaveAttribute(
            'aria-invalid',
            'false',
        );
        expect(screen.queryByRole('alert')).toBeNull();
    });

    // ── Disabled ──

    it('disables the select and marks the container', () => {
        const { container } = render(
            <Select aria-label="Disabled" disabled />,
        );
        expect(screen.getByRole('combobox')).toBeDisabled();
        const wrapper = container.querySelector('[data-oxobz-select]');
        expect(wrapper?.className).toContain('disabled');
    });

    // ── Attribute forwarding ──

    it('respects a custom id', () => {
        render(<Select aria-label="Fruit" id="my-select" />);
        expect(screen.getByRole('combobox')).toHaveAttribute(
            'id',
            'my-select',
        );
    });

    it('forwards native select attributes (required, name)', () => {
        render(<Select aria-label="Fruit" name="fruit" required />);
        const select = screen.getByRole('combobox');
        expect(select).toBeRequired();
        expect(select).toHaveAttribute('name', 'fruit');
    });

    // ── Custom className ──

    it('appends custom className on the root label', () => {
        const { container } = render(
            <Select aria-label="Fruit" className="custom-select" />,
        );
        expect(container.querySelector('label')?.className).toContain(
            'custom-select',
        );
    });

    // ── Ref forwarding ──

    it('forwards ref to the native select element', () => {
        const ref = createRef<HTMLSelectElement>();
        render(<Select aria-label="Fruit" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLSelectElement);
        expect(ref.current).toHaveAttribute('aria-label', 'Fruit');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Select.displayName).toBe('Select');
    });
});
