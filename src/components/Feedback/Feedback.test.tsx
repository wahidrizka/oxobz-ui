import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Feedback } from './Feedback';

/** Selects the root wrapper div (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-feedback]');
}

describe('Feedback', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-feedback and data-version="v1"', () => {
        const { container } = render(<Feedback />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('inlineWrapper');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Feedback data-version="v2" />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the default prompt copy', () => {
        render(<Feedback />);
        expect(screen.getByText('Was this helpful?')).toBeInTheDocument();
    });

    it('renders custom copy', () => {
        render(<Feedback copy="How did the import go?" />);
        expect(screen.getByText('How did the import go?')).toBeInTheDocument();
        expect(
            screen.queryByText('Was this helpful?'),
        ).not.toBeInTheDocument();
    });

    // ── Emoji picker ──

    it('renders 4 radio-role emoji buttons with the production aria-labels', () => {
        render(<Feedback />);
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(4);
        expect(
            screen.getByLabelText('Select Hate it emoji'),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText('Select Not great emoji'),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText("Select It's okay emoji"),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText('Select Love it! emoji'),
        ).toBeInTheDocument();
    });

    it('all emoji buttons start with aria-checked="false"', () => {
        render(<Feedback />);
        screen.getAllByRole('radio').forEach((radio) => {
            expect(radio).toHaveAttribute('aria-checked', 'false');
        });
    });

    it('marks only the clicked emoji as checked and fires onRatingChange', () => {
        const onRatingChange = vi.fn();
        render(<Feedback onRatingChange={onRatingChange} />);
        const loveButton = screen.getByLabelText('Select Love it! emoji');
        fireEvent.click(loveButton);
        expect(loveButton).toHaveAttribute('aria-checked', 'true');
        expect(onRatingChange).toHaveBeenCalledWith('love');
        expect(
            screen.getByLabelText('Select Hate it emoji'),
        ).toHaveAttribute('aria-checked', 'false');
    });

    it('opens the card (data-open) only after an emoji is picked', () => {
        const { container } = render(<Feedback />);
        const card = container.querySelector('[data-oxobz-feedback] > div');
        expect(card).not.toHaveAttribute('data-open');
        fireEvent.click(screen.getByLabelText('Select Hate it emoji'));
        expect(card).toHaveAttribute('data-open');
    });

    // ── Form ──

    it('renders the feedback textarea with the fixed placeholder', () => {
        render(<Feedback />);
        const textarea = screen.getByPlaceholderText('Your feedback...');
        expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders the markdown "supported." hint', () => {
        render(<Feedback />);
        expect(screen.getByText('supported.')).toBeInTheDocument();
    });

    it('renders a Send submit button', () => {
        render(<Feedback />);
        const send = screen.getByRole('button', { name: 'Send' });
        expect(send).toHaveAttribute('type', 'submit');
    });

    it('updates the textarea value as a controlled field', () => {
        render(<Feedback />);
        const textarea = screen.getByPlaceholderText(
            'Your feedback...',
        ) as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'Great component!' } });
        expect(textarea.value).toBe('Great component!');
    });

    // ── Submit / success ──

    it('does not submit while no rating has been picked', () => {
        const onSubmit = vi.fn();
        const { container } = render(<Feedback onSubmit={onSubmit} />);
        const form = container.querySelector('form');
        expect(form).toBeInTheDocument();
        if (form) fireEvent.submit(form);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit with rating + message and shows the success view', () => {
        const onSubmit = vi.fn();
        const { container } = render(<Feedback onSubmit={onSubmit} />);
        fireEvent.click(screen.getByLabelText('Select Love it! emoji'));
        const textarea = screen.getByPlaceholderText('Your feedback...');
        fireEvent.change(textarea, { target: { value: 'Loved it' } });
        const form = container.querySelector('form');
        expect(form).toBeInTheDocument();
        if (form) fireEvent.submit(form);
        expect(onSubmit).toHaveBeenCalledWith({
            rating: 'love',
            message: 'Loved it',
        });
        expect(
            screen.getByText('Thanks for the feedback!'),
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
    });

    it('renders custom success copy', () => {
        const { container } = render(
            <Feedback
                successDescription="We appreciate it."
                successMessage="Merci beaucoup!"
            />,
        );
        fireEvent.click(screen.getByLabelText("Select It's okay emoji"));
        const form = container.querySelector('form');
        if (form) fireEvent.submit(form);
        expect(screen.getByText('Merci beaucoup!')).toBeInTheDocument();
        expect(screen.getByText('We appreciate it.')).toBeInTheDocument();
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<Feedback className="custom-feedback" />);
        const root = getRoot(container);
        expect(root?.className).toContain('inlineWrapper');
        expect(root?.className).toContain('custom-feedback');
        expect(root?.className.endsWith('custom-feedback')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Feedback ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-feedback');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-label)', () => {
        const { container } = render(<Feedback aria-label="Docs feedback" id="fb-1" />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'fb-1');
        expect(root).toHaveAttribute('aria-label', 'Docs feedback');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Feedback.displayName).toBe('Feedback');
    });
});
