import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChoiceboxGroup } from './ChoiceboxGroup';

/** Two plain items used across tests */
const twoItems = (
    <>
        <ChoiceboxGroup.Item title="Trial" description="Free for two weeks" value="trial" />
        <ChoiceboxGroup.Item title="Pro" description="Get started now" value="pro" />
    </>
);

describe('ChoiceboxGroup — radio mode (default)', () => {
    // ── Rendering ──

    it('renders with role="radiogroup" by default', () => {
        render(<ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>);
        expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('sets aria-multiselectable="false"', () => {
        render(<ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>);
        expect(screen.getByRole('radiogroup')).toHaveAttribute(
            'aria-multiselectable',
            'false',
        );
    });

    it('renders one radio input per item', () => {
        render(<ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>);
        expect(screen.getAllByRole('radio')).toHaveLength(2);
    });

    it('all radio inputs share the same generated name', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>,
        );
        const inputs = container.querySelectorAll('input');
        expect(inputs[0].getAttribute('name')).toContain('choicebox-name-');
        expect(inputs[0].getAttribute('name')).toBe(inputs[1].getAttribute('name'));
    });

    it('applies choicebox-group class to the root', () => {
        render(<ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>);
        expect(screen.getByRole('radiogroup').className).toContain('choicebox-group');
    });

    it('applies custom className to the root', () => {
        render(
            <ChoiceboxGroup label="plan" className="my-custom">
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(screen.getByRole('radiogroup').className).toContain('my-custom');
    });

    it('forwards extra HTML attributes to the root div', () => {
        render(
            <ChoiceboxGroup label="plan" data-testid="grp" id="plans">
                {twoItems}
            </ChoiceboxGroup>,
        );
        const group = screen.getByTestId('grp');
        expect(group).toHaveAttribute('id', 'plans');
        expect(group).toHaveAttribute('role', 'radiogroup');
    });

    // ── Checked state ──

    it('checks the radio whose value matches the group value', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" value="pro" onChange={() => { }}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(container.querySelector('input[value="pro"]')).toBeChecked();
        expect(container.querySelector('input[value="trial"]')).not.toBeChecked();
    });

    it('checked item label gets aria-selected="true" and checked class', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" value="pro" onChange={() => { }}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const checkedLabel = container.querySelector('input[value="pro"]')?.closest('label.choicebox');
        expect(checkedLabel).toHaveAttribute('aria-selected', 'true');
        expect(checkedLabel?.className).toContain('checked');
    });

    it('unchecked item label gets aria-selected="false" and no checked class', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" value="pro" onChange={() => { }}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const otherLabel = container.querySelector('input[value="trial"]')?.closest('label.choicebox');
        expect(otherLabel).toHaveAttribute('aria-selected', 'false');
        expect(otherLabel?.className).not.toContain('checked');
    });

    // ── onChange ──

    it('clicking an unselected radio calls onChange with the string value', () => {
        const onChange = vi.fn();
        const { container } = render(
            <ChoiceboxGroup label="plan" value="trial" onChange={onChange}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const proInput = container.querySelector('input[value="pro"]') as HTMLInputElement;
        fireEvent.click(proInput);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('pro');
    });
});

describe('ChoiceboxGroup — checkbox mode', () => {
    it('renders with role="group"', () => {
        render(
            <ChoiceboxGroup label="plan" type="checkbox">
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('sets aria-multiselectable="true"', () => {
        render(
            <ChoiceboxGroup label="plan" type="checkbox">
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(screen.getByRole('group')).toHaveAttribute(
            'aria-multiselectable',
            'true',
        );
    });

    it('renders one checkbox input per item', () => {
        render(
            <ChoiceboxGroup label="plan" type="checkbox">
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    });

    it('checks every checkbox whose value is in the array value', () => {
        const { container } = render(
            <ChoiceboxGroup
                label="plan"
                type="checkbox"
                value={['trial', 'pro']}
                onChange={() => { }}
            >
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(container.querySelector('input[value="trial"]')).toBeChecked();
        expect(container.querySelector('input[value="pro"]')).toBeChecked();
    });

    it('clicking an unchecked checkbox calls onChange with the value appended', () => {
        const onChange = vi.fn();
        const { container } = render(
            <ChoiceboxGroup label="plan" type="checkbox" value={['trial']} onChange={onChange}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const proInput = container.querySelector('input[value="pro"]') as HTMLInputElement;
        fireEvent.click(proInput);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['trial', 'pro']);
    });

    it('clicking a checked checkbox calls onChange with the value removed', () => {
        const onChange = vi.fn();
        const { container } = render(
            <ChoiceboxGroup label="plan" type="checkbox" value={['trial', 'pro']} onChange={onChange}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const trialInput = container.querySelector('input[value="trial"]') as HTMLInputElement;
        fireEvent.click(trialInput);
        expect(onChange).toHaveBeenCalledWith(['pro']);
    });

    it('treats an undefined value as an empty array when toggling', () => {
        const onChange = vi.fn();
        const { container } = render(
            <ChoiceboxGroup label="plan" type="checkbox" onChange={onChange}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const trialInput = container.querySelector('input[value="trial"]') as HTMLInputElement;
        fireEvent.click(trialInput);
        expect(onChange).toHaveBeenCalledWith(['trial']);
    });

    it('renders the checkbox SVG indicator inside the item', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" type="checkbox">
                {twoItems}
            </ChoiceboxGroup>,
        );
        const svg = container.querySelector('[aria-hidden="true"] svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
    });
});

describe('ChoiceboxGroup — direction', () => {
    it('defaults to row via --stack-direction on the ul', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>,
        );
        const ul = container.querySelector('ul');
        expect(ul?.style.getPropertyValue('--stack-direction')).toBe('row');
    });

    it('direction="column" sets --stack-direction to column', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" direction="column">
                {twoItems}
            </ChoiceboxGroup>,
        );
        const ul = container.querySelector('ul');
        expect(ul?.style.getPropertyValue('--stack-direction')).toBe('column');
    });
});

describe('ChoiceboxGroup — label & showLabel', () => {
    it('without showLabel, the label becomes aria-label and is not visible text', () => {
        render(<ChoiceboxGroup label="Select a plan">{twoItems}</ChoiceboxGroup>);
        expect(screen.getByRole('radiogroup')).toHaveAttribute(
            'aria-label',
            'Select a plan',
        );
        expect(screen.queryByText('Select a plan')).toBeNull();
    });

    it('with showLabel, renders a visible Label element with the text', () => {
        render(
            <ChoiceboxGroup label="Select a plan" showLabel>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const visibleLabel = screen.getByText('Select a plan');
        expect(visibleLabel.tagName).toBe('LABEL');
        expect(visibleLabel.className).toContain('label');
    });

    it('with showLabel, aria-label is not set on the group', () => {
        render(
            <ChoiceboxGroup label="Select a plan" showLabel>
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label');
    });

    it('with showLabel, aria-labelledby points to the rendered label element', () => {
        render(
            <ChoiceboxGroup label="Select a plan" showLabel>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const group = screen.getByRole('radiogroup');
        const labelledBy = group.getAttribute('aria-labelledby');
        expect(labelledBy).toBeTruthy();
        const labelEl = document.getElementById(labelledBy as string);
        expect(labelEl).not.toBeNull();
        expect(labelEl?.tagName).toBe('LABEL');
        expect(labelEl).toHaveTextContent('Select a plan');
    });

    it('with showLabel, the group gets its accessible name from the label', () => {
        render(
            <ChoiceboxGroup label="Select a plan" showLabel>
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(
            screen.getByRole('radiogroup', { name: 'Select a plan' }),
        ).toBeInTheDocument();
    });

    it('showLabel without label renders no visible label element', () => {
        const { container } = render(
            <ChoiceboxGroup showLabel>{twoItems}</ChoiceboxGroup>,
        );
        // Only the item <label> wrappers exist — no Label component before the ul
        const rootDiv = container.firstChild as HTMLElement;
        expect(rootDiv.firstElementChild?.tagName).toBe('UL');
    });
});

describe('ChoiceboxGroup — required', () => {
    it('defaults to aria-required="false"', () => {
        render(<ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>);
        expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'false');
    });

    it('required sets aria-required="true"', () => {
        render(
            <ChoiceboxGroup label="plan" required>
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    });
});

describe('ChoiceboxGroup — disabled', () => {
    it('group disabled disables every input', () => {
        render(
            <ChoiceboxGroup label="plan" disabled>
                {twoItems}
            </ChoiceboxGroup>,
        );
        for (const input of screen.getAllByRole('radio')) {
            expect(input).toBeDisabled();
        }
    });

    it('group disabled applies disabled class to each item label', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" disabled>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const labels = container.querySelectorAll('label.choicebox');
        expect(labels).toHaveLength(2);
        for (const label of labels) {
            expect(label.className).toContain('disabled');
        }
    });

    it('group disabled prevents onChange on click', () => {
        const onChange = vi.fn();
        const { container } = render(
            <ChoiceboxGroup label="plan" disabled onChange={onChange}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const proInput = container.querySelector('input[value="pro"]') as HTMLInputElement;
        fireEvent.click(proInput);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('per-item disabled disables only that item', () => {
        const onChange = vi.fn();
        const { container } = render(
            <ChoiceboxGroup label="plan" onChange={onChange}>
                <ChoiceboxGroup.Item title="Trial" value="trial" disabled />
                <ChoiceboxGroup.Item title="Pro" value="pro" />
            </ChoiceboxGroup>,
        );
        const trialInput = container.querySelector('input[value="trial"]') as HTMLInputElement;
        const proInput = container.querySelector('input[value="pro"]') as HTMLInputElement;
        expect(trialInput).toBeDisabled();
        expect(proInput).not.toBeDisabled();

        fireEvent.click(trialInput);
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.click(proInput);
        expect(onChange).toHaveBeenCalledWith('pro');
    });

    it('item disabled={false} overrides group disabled', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" disabled>
                <ChoiceboxGroup.Item title="Trial" value="trial" />
                <ChoiceboxGroup.Item title="Pro" value="pro" disabled={false} />
            </ChoiceboxGroup>,
        );
        expect(container.querySelector('input[value="trial"]')).toBeDisabled();
        expect(container.querySelector('input[value="pro"]')).not.toBeDisabled();
    });
});

describe('ChoiceboxGroup.Item', () => {
    it('renders title and description with their classes', () => {
        render(<ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>);
        const title = screen.getByText('Trial');
        const description = screen.getByText('Free for two weeks');
        expect(title.className).toContain('title');
        expect(description.className).toContain('description');
    });

    it('omits the description span when description is not provided', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroup.Item title="Bare" value="bare" />
            </ChoiceboxGroup>,
        );
        expect(container.querySelector('.description')).toBeNull();
    });

    it('has data-version="v1" on the item label', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroup.Item title="Trial" value="trial" />
            </ChoiceboxGroup>,
        );
        expect(container.querySelector('label.choicebox')).toHaveAttribute(
            'data-version',
            'v1',
        );
    });

    it('renders children inside the content slot when checked', () => {
        render(
            <ChoiceboxGroup label="plan" value="trial" onChange={() => { }}>
                <ChoiceboxGroup.Item title="Trial" value="trial">
                    <span data-testid="slot">Extra content</span>
                </ChoiceboxGroup.Item>
            </ChoiceboxGroup>,
        );
        const slot = screen.getByTestId('slot');
        expect(slot).toBeInTheDocument();
        expect(slot.parentElement?.className).toContain('content');
    });

    it('renders children in the DOM even when NOT checked (characterization)', () => {
        // NOTE: the JSDoc claims children render "when checked", but the
        // component renders the content slot unconditionally.
        render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroup.Item title="Trial" value="trial">
                    <span data-testid="slot-unchecked">Extra content</span>
                </ChoiceboxGroup.Item>
            </ChoiceboxGroup>,
        );
        expect(screen.getByTestId('slot-unchecked')).toBeInTheDocument();
    });

    it('applies custom className to the item label', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroup.Item title="Trial" value="trial" className="my-item" />
            </ChoiceboxGroup>,
        );
        const label = container.querySelector('label.choicebox');
        expect(label?.className).toContain('my-item');
    });

    it('forwards extra HTML attributes to the item label', () => {
        render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroup.Item title="Trial" value="trial" data-testid="item" />
            </ChoiceboxGroup>,
        );
        expect(screen.getByTestId('item').tagName).toBe('LABEL');
    });

    it('forwards ref to the item label element', () => {
        const ref = vi.fn();
        render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroup.Item ref={ref} title="Trial" value="trial" />
            </ChoiceboxGroup>,
        );
        expect(ref).toHaveBeenCalledWith(expect.any(HTMLLabelElement));
    });

    it('throws when rendered outside a ChoiceboxGroup', () => {
        // React logs the thrown error via console.error — silence it
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() =>
            render(<ChoiceboxGroup.Item title="Orphan" value="orphan" />),
        ).toThrow('ChoiceboxGroup.Item must be used within a ChoiceboxGroup');
        spy.mockRestore();
    });
});

describe('ChoiceboxGroup — display names', () => {
    it('has displayName "ChoiceboxGroup"', () => {
        expect(ChoiceboxGroup.displayName).toBe('ChoiceboxGroup');
    });

    it('Item has displayName "ChoiceboxGroup.Item"', () => {
        expect(ChoiceboxGroup.Item.displayName).toBe('ChoiceboxGroup.Item');
    });
});
