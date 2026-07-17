import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Feedback } from './Feedback';

/** Selects the root wrapper div (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-feedback]');
}

describe('Feedback', () => {
    // ── Root / displayName ──

    it('has the correct displayName', () => {
        expect(Feedback.displayName).toBe('Feedback');
    });

    it('renders a root div with data-oxobz-feedback and data-version="v1" (inline)', () => {
        const { container } = render(<Feedback type="inline" />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('inlineWrapper');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Feedback type="inline" data-version="v2" />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('appends a custom className after the module class', () => {
        const { container } = render(<Feedback type="inline" className="custom-feedback" />);
        const root = getRoot(container);
        expect(root?.className).toContain('inlineWrapper');
        expect(root?.className).toContain('custom-feedback');
        expect(root?.className.endsWith('custom-feedback')).toBe(true);
    });

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Feedback type="inline" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-feedback');
    });

    it('forwards extra HTML attributes (id, aria-label)', () => {
        const { container } = render(<Feedback type="inline" aria-label="Docs feedback" id="fb-1" />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'fb-1');
        expect(root).toHaveAttribute('aria-label', 'Docs feedback');
    });

    // ── Inline variant ──

    describe('inline variant', () => {
        it('renders the fixed prompt copy', () => {
            render(<Feedback type="inline" />);
            expect(screen.getByText('Was this helpful?')).toBeInTheDocument();
        });

        it('renders 4 radio-role emoji buttons with the production aria-labels', () => {
            render(<Feedback type="inline" />);
            const radios = screen.getAllByRole('radio');
            expect(radios).toHaveLength(4);
            expect(screen.getByLabelText('Select Hate it emoji')).toBeInTheDocument();
            expect(screen.getByLabelText('Select Not great emoji')).toBeInTheDocument();
            expect(screen.getByLabelText("Select It's okay emoji")).toBeInTheDocument();
            expect(screen.getByLabelText('Select Love it! emoji')).toBeInTheDocument();
        });

        it('all emoji buttons start with aria-checked="false"', () => {
            render(<Feedback type="inline" />);
            screen.getAllByRole('radio').forEach((radio) => {
                expect(radio).toHaveAttribute('aria-checked', 'false');
            });
        });

        it('marks only the clicked emoji as checked', () => {
            render(<Feedback type="inline" />);
            const loveButton = screen.getByLabelText('Select Love it! emoji');
            fireEvent.click(loveButton);
            expect(loveButton).toHaveAttribute('aria-checked', 'true');
            expect(screen.getByLabelText('Select Hate it emoji')).toHaveAttribute('aria-checked', 'false');
        });

        it('opens the card (data-open) only after an emoji is picked', () => {
            const { container } = render(<Feedback type="inline" />);
            const card = container.querySelector('[data-oxobz-feedback] > div');
            expect(card).not.toHaveAttribute('data-open');
            fireEvent.click(screen.getByLabelText('Select Hate it emoji'));
            expect(card).toHaveAttribute('data-open');
        });

        it('renders the feedback textarea with the fixed placeholder', () => {
            render(<Feedback type="inline" />);
            const textarea = screen.getByPlaceholderText('Your feedback...');
            expect(textarea.tagName).toBe('TEXTAREA');
        });

        it('renders the markdown "supported." hint', () => {
            render(<Feedback type="inline" />);
            expect(screen.getByText('supported.')).toBeInTheDocument();
        });

        it('renders a Send submit button', () => {
            render(<Feedback type="inline" />);
            const send = screen.getByRole('button', { name: 'Send' });
            expect(send).toHaveAttribute('type', 'submit');
        });

        it('updates the textarea value as a controlled field', () => {
            render(<Feedback type="inline" />);
            const textarea = screen.getByPlaceholderText('Your feedback...') as HTMLTextAreaElement;
            fireEvent.change(textarea, { target: { value: 'Great component!' } });
            expect(textarea.value).toBe('Great component!');
        });

        it('does not submit while no rating has been picked', () => {
            const onSubmit = vi.fn();
            const { container } = render(<Feedback type="inline" onSubmit={onSubmit} />);
            const form = container.querySelector('form');
            expect(form).toBeInTheDocument();
            if (form) fireEvent.submit(form);
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('calls onSubmit with rating + message and shows the success view', () => {
            const onSubmit = vi.fn();
            const { container } = render(<Feedback type="inline" onSubmit={onSubmit} />);
            fireEvent.click(screen.getByLabelText('Select Love it! emoji'));
            const textarea = screen.getByPlaceholderText('Your feedback...');
            fireEvent.change(textarea, { target: { value: 'Loved it' } });
            const form = container.querySelector('form');
            expect(form).toBeInTheDocument();
            if (form) fireEvent.submit(form);
            expect(onSubmit).toHaveBeenCalledWith({
                rating: 'love',
                message: 'Loved it',
                topic: undefined,
                metadata: undefined,
            });
            expect(screen.getByText('Thanks for the feedback!')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
        });

        it('forwards metadata to onSubmit', () => {
            const onSubmit = vi.fn();
            const metadata = { userId: 'user_1', location: 'footer' };
            const { container } = render(
                <Feedback type="inline" metadata={metadata} onSubmit={onSubmit} />,
            );
            fireEvent.click(screen.getByLabelText("Select It's okay emoji"));
            const form = container.querySelector('form');
            if (form) fireEvent.submit(form);
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ rating: 'okay', metadata }),
            );
        });

        it('accepts dryRun and label without throwing or changing the DOM footprint', () => {
            const { container } = render(<Feedback type="inline" dryRun label="vercel" />);
            expect(getRoot(container)).toBeInTheDocument();
            // `label` is verified to have zero DOM footprint in production.
            expect(container.innerHTML).not.toContain('vercel');
        });

        // ── showTopics (inline) ──

        it('showTopics renders a topic select with the production placeholder and default options', () => {
            render(<Feedback type="inline" showTopics />);
            const select = screen.getByRole('combobox') as HTMLSelectElement;
            expect(select).toBeInTheDocument();
            expect(within(select).getByText('Select a topic...')).toBeInTheDocument();
            expect(within(select).getByText('AI')).toBeInTheDocument();
            expect(within(select).getByText('Storage')).toBeInTheDocument();
            // 1 placeholder + 11 default topics.
            expect(select.querySelectorAll('option')).toHaveLength(12);
        });

        it('showTopics is absent by default', () => {
            render(<Feedback type="inline" />);
            expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
        });

        it('a custom topics list overrides the built-in default', () => {
            render(
                <Feedback
                    type="inline"
                    showTopics
                    topics={[{ label: 'Bug', value: 'bug' }, { label: 'Idea', value: 'idea' }]}
                />,
            );
            const select = screen.getByRole('combobox') as HTMLSelectElement;
            expect(select.querySelectorAll('option')).toHaveLength(3); // placeholder + 2
            expect(within(select).getByText('Bug')).toBeInTheDocument();
            expect(within(select).queryByText('AI')).not.toBeInTheDocument();
        });

        it('forwards the picked topic to onSubmit', () => {
            const onSubmit = vi.fn();
            const { container } = render(<Feedback type="inline" showTopics onSubmit={onSubmit} />);
            const select = screen.getByRole('combobox');
            fireEvent.change(select, { target: { value: 'Billing' } });
            fireEvent.click(screen.getByLabelText('Select Hate it emoji'));
            const form = container.querySelector('form');
            if (form) fireEvent.submit(form);
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ rating: 'hate', topic: 'Billing' }),
            );
        });
    });

    // ── Default variant (trigger Button + popover) ──

    describe('default variant', () => {
        it('renders a trigger Button with the fixed text "Feedback", regardless of `label`', () => {
            render(<Feedback label="vercel" />);
            const trigger = screen.getByRole('button', { name: 'Feedback' });
            expect(trigger).toBeInTheDocument();
            expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
        });

        it('renders prefix and suffix icons inside the trigger', () => {
            render(
                <Feedback
                    prefix={<span data-testid="prefix-icon" />}
                    suffix={<span data-testid="suffix-icon" />}
                />,
            );
            expect(screen.getByTestId('prefix-icon')).toBeInTheDocument();
            expect(screen.getByTestId('suffix-icon')).toBeInTheDocument();
        });

        it('opens a role="dialog" popover on click, containing the textarea, emoji picker and Send', () => {
            render(<Feedback label="vercel" />);
            fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));

            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeInTheDocument();
            expect(dialog).toHaveAttribute('data-state', 'open');
            expect(within(dialog).getByPlaceholderText('Your feedback...')).toBeInTheDocument();
            expect(within(dialog).getAllByRole('radio')).toHaveLength(4);
            expect(within(dialog).getByRole('button', { name: 'Send' })).toBeInTheDocument();

            expect(screen.getByRole('button', { name: 'Feedback' })).toHaveAttribute('aria-expanded', 'true');
        });

        it('does not show the inline prompt copy in the popover', () => {
            render(<Feedback label="vercel" />);
            fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
            expect(screen.queryByText('Was this helpful?')).not.toBeInTheDocument();
        });

        it('showTopics renders the topic select inside the popover, above the textarea', () => {
            render(<Feedback label="vercel" showTopics />);
            fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
            const dialog = screen.getByRole('dialog');
            expect(within(dialog).getByRole('combobox')).toBeInTheDocument();
        });

        it('closes the popover on outside click', async () => {
            render(
                <div>
                    <button type="button">outside</button>
                    <Feedback label="vercel" />
                </div>,
            );
            fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
            expect(screen.getByRole('dialog')).toBeInTheDocument();
            fireEvent.pointerDown(screen.getByRole('button', { name: 'outside' }));
            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        });

        it('closes the popover on Escape and returns focus to the trigger', async () => {
            render(<Feedback label="vercel" />);
            const trigger = screen.getByRole('button', { name: 'Feedback' });
            fireEvent.click(trigger);
            fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
            expect(trigger).toHaveFocus();
        });

        it('toggles closed when the trigger is clicked again', () => {
            render(<Feedback label="vercel" />);
            const trigger = screen.getByRole('button', { name: 'Feedback' });
            fireEvent.click(trigger);
            expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'open');
            fireEvent.click(trigger);
            expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'closed');
        });

        it('does not submit while no rating has been picked', () => {
            const onSubmit = vi.fn();
            render(<Feedback label="vercel" onSubmit={onSubmit} />);
            fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
            const form = screen.getByRole('dialog').querySelector('form');
            expect(form).toBeInTheDocument();
            if (form) fireEvent.submit(form);
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('calls onSubmit with rating + message (+ metadata) and shows the success view', () => {
            const onSubmit = vi.fn();
            const metadata = { userId: 'user_12345', location: 'post-checkout' };
            render(<Feedback label="vercel" metadata={metadata} onSubmit={onSubmit} />);
            fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));

            const dialog = screen.getByRole('dialog');
            fireEvent.click(within(dialog).getByLabelText('Select Love it! emoji'));
            fireEvent.change(within(dialog).getByPlaceholderText('Your feedback...'), {
                target: { value: 'Loved it' },
            });
            const form = dialog.querySelector('form');
            expect(form).toBeInTheDocument();
            if (form) fireEvent.submit(form);

            expect(onSubmit).toHaveBeenCalledWith({
                rating: 'love',
                message: 'Loved it',
                topic: undefined,
                metadata,
            });
            expect(within(screen.getByRole('dialog')).getByText('Thanks for the feedback!')).toBeInTheDocument();
        });

        it('accepts dryRun without throwing', () => {
            render(<Feedback label="vercel" dryRun />);
            expect(screen.getByRole('button', { name: 'Feedback' })).toBeInTheDocument();
        });
    });
});
