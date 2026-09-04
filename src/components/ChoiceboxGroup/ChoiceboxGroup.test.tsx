import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChoiceboxGroup, ChoiceboxGroupItem } from './ChoiceboxGroup';

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

    /*
      * Diperbaiki 30 Agu 2026. Produksi TIDAK memakai aria-selected di sini
      * (label memang tidak mendukungnya), dan pembungkus pilihan adalah <li>,
      * bukan <label>. Keadaan terpilih ditandai kelas pada <li> itu.
      */
    it('checked item gets the checked class on its <li>', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" value="pro" onChange={() => { }}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const checkedLi = container.querySelector('input[value="pro"]')?.closest('li.choicebox');
        expect(checkedLi).not.toBeNull();
        expect(checkedLi).not.toHaveAttribute('aria-selected');
        expect(checkedLi?.className).toContain('checked');
    });

    it('unchecked item has no checked class on its <li>', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" value="pro" onChange={() => { }}>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const otherLi = container.querySelector('input[value="trial"]')?.closest('li.choicebox');
        expect(otherLi).not.toBeNull();
        expect(otherLi?.className).not.toContain('checked');
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

// geistcn generation: the list is a plain flex ul (row by default) —
// direction="column" adds the .vertical class; no Stack variables remain.
describe('ChoiceboxGroup — direction', () => {
    it('defaults to a plain row list (no vertical class, no stack vars)', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>,
        );
        const ul = container.querySelector('ul');
        expect(ul?.className).not.toContain('vertical');
        expect(ul?.style.getPropertyValue('--stack-direction')).toBe('');
    });

    it('direction="column" adds the vertical class', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" direction="column">
                {twoItems}
            </ChoiceboxGroup>,
        );
        const ul = container.querySelector('ul');
        expect(ul?.className).toContain('vertical');
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
        /*
         * Struktur Label mengikuti produksi: <label> polos berisi <div>
         * bergaya, jadi teksnya ada di div itu dan <label>-nya pembungkus.
         */
        const teks = screen.getByText('Select a plan');
        expect(teks.tagName).toBe('DIV');
        expect(teks.className).toContain('label');
        expect(teks.parentElement?.tagName).toBe('LABEL');
    });

    it('with showLabel, aria-label is not set on the group', () => {
        render(
            <ChoiceboxGroup label="Select a plan" showLabel>
                {twoItems}
            </ChoiceboxGroup>,
        );
        expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label');
    });

    it('with showLabel, renders a visible label but leaves aria-labelledby dangling (matches production Geist)', () => {
        // Parity 100% (user decision 3 Sep 2026): production Geist sets both
        // aria-labelledby (on the group) and for (on the label) to an id that
        // has no matching element — a dangling reference we mirror exactly. The
        // label is visible and carries `for`, but no `id`, so the ref never
        // resolves.
        render(
            <ChoiceboxGroup label="Select a plan" showLabel>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const group = screen.getByRole('radiogroup');
        const labelledBy = group.getAttribute('aria-labelledby');
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy as string)).toBeNull();
        const labelEl = screen.getByText('Select a plan').closest('label') as HTMLElement;
        expect(labelEl).not.toBeNull();
        expect(labelEl.getAttribute('for')).toBe(labelledBy);
        expect(labelEl.getAttribute('id')).toBeNull();
    });

    it('with showLabel, the dangling reference gives the group no accessible name (matches production)', () => {
        render(
            <ChoiceboxGroup label="Select a plan" showLabel>
                {twoItems}
            </ChoiceboxGroup>,
        );
        // aria-labelledby dangles, so no accessible name resolves — exactly
        // production Geist's (buggy) behavior.
        expect(
            screen.queryByRole('radiogroup', { name: 'Select a plan' }),
        ).toBeNull();
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
        const labels = container.querySelectorAll('li.choicebox');
        expect(labels).toHaveLength(2);
        for (const label of labels) {
            expect(label.className).toContain('disabled');
        }
    });

    it('disabled radio: the choicebox li carries the disabled class', () => {
        // The radio wrapper no longer pulls in Radio.module's .check/.disabled.
        // styles.radio owns the wrapper (and its gray-500 --radio-color base),
        // while the disabled deltas (gray-500 color, gray-100 icon bg,
        // not-allowed cursor) come from `.choicebox.disabled .radio` on the
        // ancestor <li>. So the wrapper stays plain `radio` and the <li> is
        // what carries `disabled`.
        const { container } = render(
            <ChoiceboxGroup label="plan" disabled>
                {twoItems}
            </ChoiceboxGroup>,
        );
        const radioInput = container.querySelector('input[value="pro"]') as HTMLInputElement;
        const checkSpan = radioInput.parentElement as HTMLElement;
        expect(checkSpan.className).toContain('radio');
        expect(checkSpan.className).not.toContain('disabled');
        const li = checkSpan.closest('li') as HTMLElement;
        expect(li.className).toContain('disabled');
    });

    it('enabled radio check span has no disabled class', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>,
        );
        const radioInput = container.querySelector('input[value="pro"]') as HTMLInputElement;
        const checkSpan = radioInput.parentElement as HTMLElement;
        expect(checkSpan.className).not.toContain('disabled');
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

    /*
      * Produksi tidak menaruh atribut apa pun di <ul>, <li>, maupun <label>
      * pilihan. Yang dijaga sekarang justru kebalikannya.
      */
    it('leaves the list, item and label free of attributes, like production', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroup.Item title="Trial" value="trial" />
            </ChoiceboxGroup>,
        );
        expect(container.querySelector('ul')).not.toHaveAttribute('data-version');
        expect(container.querySelector('li.choicebox')).not.toHaveAttribute(
            'data-version',
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

    /*
     * Diperbaiki 30 Agu 2026. Test lama sengaja mengunci perilaku yang KELIRU
     * (isi khusus selalu dirender) dan catatannya sendiri menyebut JSDoc-nya
     * bilang "when checked". Diukur di halaman live: pada pilihan yang tidak
     * terpilih, span isi itu memang TIDAK ada di DOM.
     */
    it('keeps children out of the DOM while the item is NOT checked', () => {
        render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroup.Item title="Trial" value="trial">
                    <span data-testid="slot-unchecked">Extra content</span>
                </ChoiceboxGroup.Item>
            </ChoiceboxGroup>,
        );
        expect(screen.queryByTestId('slot-unchecked')).not.toBeInTheDocument();
    });

    it('applies custom className to the item label', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroup.Item title="Trial" value="trial" className="my-item" />
            </ChoiceboxGroup>,
        );
        const label = container.querySelector('li.choicebox');
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

describe('ChoiceboxGroup — checkbox id/for pairing', () => {
    it('pairs the checkbox input id with the wrapping label for', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" type="checkbox">
                {twoItems}
            </ChoiceboxGroup>,
        );
        const input = container.querySelector(
            'input[type="checkbox"][value="pro"]',
        ) as HTMLInputElement;
        expect(input.id).toMatch(/^checkbox-/);
        const label = container.querySelector(`label[for="${input.id}"]`);
        expect(label).not.toBeNull();
        // The pairing label wraps this very input.
        expect(label?.contains(input)).toBe(true);
    });

    it('radio inputs have no id (no id/for pairing in radio mode)', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan">{twoItems}</ChoiceboxGroup>,
        );
        for (const input of container.querySelectorAll('input[type="radio"]')) {
            expect(input.getAttribute('id')).toBeNull();
        }
    });
});

describe('ChoiceboxGroup — listClassName', () => {
    it('applies listClassName to the inner ul', () => {
        const { container } = render(
            <ChoiceboxGroup label="plan" listClassName="flex-row">
                {twoItems}
            </ChoiceboxGroup>,
        );
        const ul = container.querySelector('ul');
        expect(ul?.className).toContain('flex-row');
    });

    it('listClassName does not disturb the vertical class when direction="column"', () => {
        const { container } = render(
            <ChoiceboxGroup direction="column" label="plan" listClassName="flex-row">
                {twoItems}
            </ChoiceboxGroup>,
        );
        const ul = container.querySelector('ul');
        expect(ul?.className).toContain('vertical');
        expect(ul?.className).toContain('flex-row');
    });
});

describe('ChoiceboxGroup — named export', () => {
    it('ChoiceboxGroupItem is the same component as ChoiceboxGroup.Item', () => {
        expect(ChoiceboxGroupItem).toBe(ChoiceboxGroup.Item);
    });

    it('renders when used via the standalone named export', () => {
        render(
            <ChoiceboxGroup label="plan">
                <ChoiceboxGroupItem title="Trial" value="trial" />
            </ChoiceboxGroup>,
        );
        expect(screen.getByText('Trial')).toBeInTheDocument();
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
