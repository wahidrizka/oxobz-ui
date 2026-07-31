import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommandMenu, type CommandMenuGroup } from './CommandMenu';

const GROUPS: CommandMenuGroup[] = [
    {
        heading: 'Foundations',
        items: [
            { label: 'Introduction', icon: <svg data-testid="icon" /> },
            { label: 'Colors' },
        ],
    },
    {
        heading: 'Components',
        items: [{ label: 'Badge' }, { label: 'Button' }],
    },
];

/** Controlled harness — the component is `open`-driven, like Geist's. */
function Harness({ onSelect }: { onSelect?: (label: string) => void } = {}) {
    const [open, setOpen] = useState(true);
    return (
        <CommandMenu
            open={open}
            onOpenChange={setOpen}
            groups={GROUPS.map((g) => ({
                ...g,
                items: g.items.map((i) => ({ ...i, onSelect: () => onSelect?.(i.label) })),
            }))}
            description="Test description"
            emptyMessage={(q) => `No results found for "${q}".`}
        />
    );
}

describe('CommandMenu', () => {
    it('renders the dialog with cmdk markers', () => {
        render(<Harness />);
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('cmdk-dialog');
        expect(dialog).toHaveAttribute('data-oxobz-command-menu');
        expect(dialog).toHaveAttribute('data-version', 'v1');
    });

    it('renders every group heading and item', () => {
        render(<Harness />);
        expect(screen.getByText('Foundations')).toBeInTheDocument();
        expect(screen.getByText('Components')).toBeInTheDocument();
        for (const label of ['Introduction', 'Colors', 'Badge', 'Button']) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
    });

    it('uses the default placeholder and renders a per-item icon slot', () => {
        render(<Harness />);
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('filters items by the typed query', async () => {
        render(<Harness />);
        fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'badg' } });
        await waitFor(() => {
            expect(screen.getByText('Badge')).toBeInTheDocument();
            expect(screen.queryByText('Introduction')).not.toBeInTheDocument();
        });
    });

    it('shows the empty message, quoting the query', async () => {
        render(<Harness />);
        fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'zzzq' } });
        await waitFor(() => {
            expect(screen.getByText('No results found for "zzzq".')).toBeInTheDocument();
        });
    });

    it('fires onSelect when an item is picked', async () => {
        const onSelect = vi.fn();
        render(<Harness onSelect={onSelect} />);
        fireEvent.click(screen.getByText('Colors'));
        expect(onSelect).toHaveBeenCalledWith('Colors');
    });

    it('closes when the Esc button is clicked', async () => {
        render(<Harness />);
        fireEvent.click(screen.getByRole('button', { name: 'Esc' }));
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    it('renders nothing while closed', () => {
        render(
            <CommandMenu open={false} onOpenChange={() => {}} groups={GROUPS} />,
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
