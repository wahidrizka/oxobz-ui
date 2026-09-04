import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Feedback } from './Feedback';

/**
 * Selects the root wrapper div. The two variants are marked differently on
 * purpose, because production marks them differently: the inline card's
 * wrapper carries `data-feedback-inline` and nothing else, while the popover
 * variant keeps the component marker.
 */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-feedback-inline],[data-oxobz-feedback]');
}

/** The inline card is "open" when a rating is picked — the same signal production exposes. */
function isOpen() {
    return screen
        .getAllByRole('radio')
        .some((tombol) => tombol.getAttribute('aria-checked') === 'true');
}

describe('Feedback', () => {
    // ── Root / displayName ──

    it('has the correct displayName', () => {
        expect(Feedback.displayName).toBe('Feedback');
    });

    /* Production's inline wrapper carries data-feedback-inline and NO
       data-version, verified attribute-by-attribute on the live page. */
    it('marks the inline wrapper with data-feedback-inline and no data-version', () => {
        const { container } = render(<Feedback type="inline" />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-feedback-inline', '');
        expect(root).not.toHaveAttribute('data-version');
        expect(root).not.toHaveAttribute('data-oxobz-feedback');
        expect(root?.className).toContain('inlineWrapper');
    });

    it('allows a custom data-version (default variant)', () => {
        const { container } = render(<Feedback data-version="v2" />);
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
        expect(ref.current).toHaveAttribute('data-feedback-inline');
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

        /*
         * The card no longer carries `data-open`: production has no such
         * attribute, and the open geometry is written as inline style by
         * framer-motion. Open state is read off the emoji radios instead,
         * which is the signal production itself exposes.
         */
        it('opens the card only after an emoji is picked', () => {
            render(<Feedback type="inline" />);
            expect(isOpen()).toBe(false);
            fireEvent.click(screen.getByLabelText('Select Hate it emoji'));
            expect(isOpen()).toBe(true);
        });

        it('collapses the card when clicking outside', () => {
            render(<Feedback type="inline" />);
            fireEvent.click(screen.getByLabelText('Select Hate it emoji'));
            expect(isOpen()).toBe(true);
            fireEvent.pointerDown(document.body);
            expect(isOpen()).toBe(false);
        });

        it('collapses the card on Escape', () => {
            render(<Feedback type="inline" />);
            fireEvent.click(screen.getByLabelText('Select Hate it emoji'));
            expect(isOpen()).toBe(true);
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(isOpen()).toBe(false);
        });

        it('does not collapse when clicking inside the card', () => {
            render(<Feedback type="inline" />);
            fireEvent.click(screen.getByLabelText('Select Hate it emoji'));
            fireEvent.pointerDown(
                screen.getByPlaceholderText('Your feedback...'),
            );
            expect(isOpen()).toBe(true);
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

        it('calls onSubmit with rating + message and shows the success view', async () => {
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
            expect(screen.getByText('Your feedback has been received!')).toBeInTheDocument();
            expect(screen.getByText('Thank you for your help.')).toBeInTheDocument();
            /* The form does not vanish instantly: production fades it out
               (`exit: {opacity:0, y:-4}`, 200ms) before AnimatePresence
               unmounts it, so the Send button outlives the click by a frame. */
            await waitFor(() => {
                expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
            });
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
            expect(within(screen.getByRole('dialog')).getByText('Your feedback has been received!')).toBeInTheDocument();
        });

        it('accepts dryRun without throwing', () => {
            render(<Feedback label="vercel" dryRun />);
            expect(screen.getByRole('button', { name: 'Feedback' })).toBeInTheDocument();
        });
    });
});
