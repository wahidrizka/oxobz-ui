import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RadioGroup, RadioGroupItem, useRadio } from './RadioGroup';

/** Helper: query a radio input inside a container by its value attribute. */
function getRadioByValue(container: HTMLElement, value: string): HTMLInputElement {
    const input = container.querySelector<HTMLInputElement>(
        `input[type="radio"][value="${value}"]`,
    );
    if (!input) throw new Error(`No radio with value "${value}"`);
    return input;
}

describe('RadioGroup', () => {
    // ── Root rendering ──

    it('renders a div with role="radiogroup"', () => {
        render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('has data-oxobz-radio-group attribute', () => {
        render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(screen.getByRole('radiogroup')).toHaveAttribute(
            'data-oxobz-radio-group',
            '',
        );
    });

    it('has data-version="v1" by default', () => {
        render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(screen.getByRole('radiogroup')).toHaveAttribute('data-version', 'v1');
    });

    it('allows custom data-version', () => {
        render(
            <RadioGroup data-version="v2">
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(screen.getByRole('radiogroup')).toHaveAttribute('data-version', 'v2');
    });

    it('passes className to the root div', () => {
        render(
            <RadioGroup className="my-group">
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(screen.getByRole('radiogroup').className).toContain('my-group');
    });

    // ── Label (sr-only) ──

    it('renders label as sr-only span linked via aria-labelledby', () => {
        render(
            <RadioGroup label="Choose plan">
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        const group = screen.getByRole('radiogroup');
        const labelSpan = screen.getByText('Choose plan');
        expect(labelSpan.className).toContain('oxobz-sr-only');
        expect(group.getAttribute('aria-labelledby')).toBe(labelSpan.id);
        expect(labelSpan.id).toContain('radio-');
    });

    it('has no aria-labelledby and no sr-only span without label', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-labelledby');
        expect(container.querySelector('div > .oxobz-sr-only')).toBeNull();
    });

    // ── Item rendering ──

    it('Item renders a label with data-oxobz-radio-item and item class', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        const label = container.querySelector('[data-oxobz-radio-item]');
        expect(label).toBeInTheDocument();
        expect(label?.tagName).toBe('LABEL');
        expect(label?.className).toContain('item');
    });

    it('Item input is hidden via radio-input + oxobz-sr-only classes', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        const input = container.querySelector('input[type="radio"]');
        expect(input?.className).toContain('radio-input');
        expect(input?.className).toContain('oxobz-sr-only');
    });

    it('Item renders radio-icon span with aria-hidden="true"', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon).toBeInTheDocument();
        expect(icon?.className).toContain('radio-icon');
    });

    it('Item renders a zero-width space inside the radio-check span', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        const check = container.querySelector('.radio-check');
        expect(check?.textContent).toContain('​');
    });

    it('Item renders children in a span with text class', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a">Option A</RadioGroup.Item>
            </RadioGroup>,
        );
        const text = screen.getByText('Option A');
        expect(text.className).toContain('text');
        expect(container.querySelector('[data-oxobz-radio-item]')).toContainElement(text);
    });

    it('Item without children does not render a text span', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a" />
            </RadioGroup>,
        );
        expect(container.querySelector('.text')).toBeNull();
    });

    it('Item merges custom className onto the label', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a" className="my-item">
                    A
                </RadioGroup.Item>
            </RadioGroup>,
        );
        const label = container.querySelector('[data-oxobz-radio-item]');
        expect(label?.className).toContain('my-item');
        expect(label?.className).toContain('item');
    });

    // ── Name uniformity via useId ──

    it('all items share the same generated name', () => {
        render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
                <RadioGroup.Item value="c">C</RadioGroup.Item>
            </RadioGroup>,
        );
        const inputs = screen.getAllByRole('radio') as HTMLInputElement[];
        expect(inputs).toHaveLength(3);
        const names = new Set(inputs.map((i) => i.name));
        expect(names.size).toBe(1);
        expect(inputs[0].name).toContain('radio-name-');
    });

    it('different groups get different generated names', () => {
        render(
            <>
                <RadioGroup label="one">
                    <RadioGroup.Item value="a">A</RadioGroup.Item>
                </RadioGroup>
                <RadioGroup label="two">
                    <RadioGroup.Item value="b">B</RadioGroup.Item>
                </RadioGroup>
            </>,
        );
        const inputs = screen.getAllByRole('radio') as HTMLInputElement[];
        expect(inputs[0].name).not.toBe(inputs[1].name);
    });

    // ── Controlled value + onChange ──

    it('checks the item matching the controlled value', () => {
        const { container } = render(
            <RadioGroup value="b" onChange={() => { }}>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
                <RadioGroup.Item value="c">C</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(getRadioByValue(container, 'a')).not.toBeChecked();
        expect(getRadioByValue(container, 'b')).toBeChecked();
        expect(getRadioByValue(container, 'c')).not.toBeChecked();
    });

    it('calls onChange with the item value when an unchecked item is clicked', () => {
        const onChange = vi.fn();
        const { container } = render(
            <RadioGroup value="a" onChange={onChange}>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
            </RadioGroup>,
        );
        fireEvent.click(getRadioByValue(container, 'b'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('b');
    });

    it('updates checked state when controlled value changes via rerender', () => {
        const { container, rerender } = render(
            <RadioGroup value="a" onChange={() => { }}>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(getRadioByValue(container, 'a')).toBeChecked();

        rerender(
            <RadioGroup value="b" onChange={() => { }}>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(getRadioByValue(container, 'a')).not.toBeChecked();
        expect(getRadioByValue(container, 'b')).toBeChecked();
    });

    // ── Disabled ──

    it('group disabled propagates to all items', () => {
        const { container } = render(
            <RadioGroup disabled>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
            </RadioGroup>,
        );
        const inputs = screen.getAllByRole('radio');
        inputs.forEach((input) => expect(input).toBeDisabled());
        const labels = container.querySelectorAll('[data-oxobz-radio-item]');
        labels.forEach((label) => expect(label.className).toContain('disabled'));
    });

    it('does not call onChange when a disabled item is clicked', () => {
        const onChange = vi.fn();
        const { container } = render(
            <RadioGroup value="a" onChange={onChange} disabled>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
            </RadioGroup>,
        );
        fireEvent.click(getRadioByValue(container, 'b'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('item-level disabled disables only that item', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a" disabled>
                    A
                </RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(getRadioByValue(container, 'a')).toBeDisabled();
        expect(getRadioByValue(container, 'b')).not.toBeDisabled();
    });

    it('item disabled={false} overrides group disabled (nullish coalescing)', () => {
        const { container } = render(
            <RadioGroup disabled>
                <RadioGroup.Item value="a" disabled={false}>
                    A
                </RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(getRadioByValue(container, 'a')).not.toBeDisabled();
        expect(getRadioByValue(container, 'b')).toBeDisabled();
    });

    // ── Required ──

    it('group required sets required on all item inputs', () => {
        render(
            <RadioGroup required>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
                <RadioGroup.Item value="b">B</RadioGroup.Item>
            </RadioGroup>,
        );
        screen.getAllByRole('radio').forEach((input) => {
            expect(input).toBeRequired();
        });
    });

    it('inputs are not required by default', () => {
        render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        expect(screen.getByRole('radio')).not.toBeRequired();
    });

    // ── Ref forwarding ──

    it('Item forwards ref to its input element', () => {
        const ref = vi.fn();
        render(
            <RadioGroup>
                <RadioGroup.Item value="a" ref={ref}>
                    A
                </RadioGroup.Item>
            </RadioGroup>,
        );
        expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });

    // ── Named export parity (Geist docs) ──

    it('exports RadioGroupItem as a named export equal to RadioGroup.Item', () => {
        expect(RadioGroupItem).toBe(RadioGroup.Item);
    });

    it('RadioGroupItem (named) works inside a RadioGroup', () => {
        const { container } = render(
            <RadioGroup value="b" onChange={() => { }}>
                <RadioGroupItem value="a">A</RadioGroupItem>
                <RadioGroupItem value="b">B</RadioGroupItem>
            </RadioGroup>,
        );
        expect(getRadioByValue(container, 'a')).not.toBeChecked();
        expect(getRadioByValue(container, 'b')).toBeChecked();
    });

    // ── DOM class composition (Geist production parity) ──

    it('Item composes both radio-module and radio-group-module classes', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a">A</RadioGroup.Item>
            </RadioGroup>,
        );
        const check = container.querySelector('.radio-check') as HTMLElement;
        expect(check.className).toContain('check');
        expect(check.className).toContain('radio-check');

        const input = container.querySelector(
            'input[type="radio"]',
        ) as HTMLInputElement;
        expect(input.className).toContain('input');
        expect(input.className).toContain('radio-input');
        expect(input.className).toContain('oxobz-sr-only');

        const icon = container.querySelector(
            '[aria-hidden="true"]',
        ) as HTMLElement;
        expect(icon.className).toContain('icon');
        expect(icon.className).toContain('radio-icon');
    });

    it('disabled Item adds the radio-module disabled class to the check span', () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroup.Item value="a" disabled>
                    A
                </RadioGroup.Item>
            </RadioGroup>,
        );
        const check = container.querySelector('.radio-check') as HTMLElement;
        expect(check.className).toContain('disabled');
    });

    // ── Headless useRadio ──

    it('useRadio returns a component rendering a span item that reads group context', () => {
        function Harness() {
            const { component } = useRadio({ value: 'one', disabled: false });
            const { component: component2 } = useRadio({
                value: 'two',
                disabled: false,
            });
            return (
                <RadioGroup value="one" onChange={() => { }}>
                    {component}
                    {component2}
                </RadioGroup>
            );
        }
        const { container } = render(<Harness />);

        const items = container.querySelectorAll('[data-oxobz-radio-item]');
        expect(items).toHaveLength(2);
        items.forEach((item) => expect(item.tagName).toBe('SPAN'));

        const first = getRadioByValue(container, 'one');
        const second = getRadioByValue(container, 'two');
        expect(first).toBeChecked();
        expect(second).not.toBeChecked();
        // name is wired from the surrounding RadioGroup context
        expect(first.name).toContain('radio-name-');
        expect(first.name).toBe(second.name);
    });

    it('useRadio component fires the group onChange when clicked', () => {
        const onChange = vi.fn();
        function Harness() {
            const { component } = useRadio({ value: 'two' });
            return (
                <RadioGroup value="one" onChange={onChange}>
                    {component}
                </RadioGroup>
            );
        }
        const { container } = render(<Harness />);
        fireEvent.click(getRadioByValue(container, 'two'));
        expect(onChange).toHaveBeenCalledWith('two');
    });

    it('useRadio component does not render a text span or zero-width space', () => {
        function Harness() {
            const { component } = useRadio({ value: 'one' });
            return (
                <RadioGroup value="one" onChange={() => { }}>
                    {component}
                </RadioGroup>
            );
        }
        const { container } = render(<Harness />);
        expect(container.querySelector('.text')).toBeNull();
        const check = container.querySelector('.radio-check') as HTMLElement;
        expect(check.textContent).not.toContain('​');
    });

    // ── Display names ──

    it('has displayName "RadioGroup"', () => {
        expect(RadioGroup.displayName).toBe('RadioGroup');
    });

    it('Item has displayName "RadioGroup.Item"', () => {
        expect(RadioGroup.Item.displayName).toBe('RadioGroup.Item');
    });
});
