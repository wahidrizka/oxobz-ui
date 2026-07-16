import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef, useRef } from 'react';
import {
    Modal,
    ModalBody,
    ModalHeader,
    ModalTitle,
    ModalSubtitle,
    ModalInset,
    ModalActions,
    ModalAction,
} from './Modal';

/** Convenience: a fully-populated modal used across several tests. */
function renderModal(props: Partial<Parameters<typeof Modal>[0]> = {}) {
    return render(
        <Modal active {...props}>
            <ModalBody>
                <ModalHeader>
                    <ModalTitle>Create Token</ModalTitle>
                    <ModalSubtitle>Enter a unique name.</ModalSubtitle>
                </ModalHeader>
                <p className="text-copy-14">Some content.</p>
            </ModalBody>
            <ModalActions>
                <ModalAction variant="secondary">Cancel</ModalAction>
                <ModalAction>Submit</ModalAction>
            </ModalActions>
        </Modal>,
    );
}

describe('Modal', () => {
    // ── Presence ──

    it('renders the dialog (in a portal) when active', () => {
        renderModal();
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        // Portals render onto document.body, not the RTL container.
        expect(document.body.contains(dialog)).toBe(true);
        expect(dialog).toHaveAttribute('data-oxobz-modal');
        expect(dialog).toHaveAttribute('data-version', 'v1');
    });

    it('renders nothing when not active', () => {
        render(
            <Modal active={false}>
                <ModalBody>
                    <ModalHeader>
                        <ModalTitle>Create Token</ModalTitle>
                    </ModalHeader>
                </ModalBody>
            </Modal>,
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // ── ARIA wiring ──

    it('exposes role=dialog and aria-modal=true', () => {
        renderModal();
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('wires aria-labelledby to the ModalTitle id', () => {
        renderModal();
        const dialog = screen.getByRole('dialog');
        const title = screen.getByRole('heading', { name: 'Create Token' });
        expect(title).toHaveAttribute('id');
        expect(dialog.getAttribute('aria-labelledby')).toBe(title.getAttribute('id'));
    });

    // ── Dismissal ──

    it('calls onClickOutside when the overlay (outside the dialog) is clicked', () => {
        const onClickOutside = vi.fn();
        renderModal({ onClickOutside });
        const overlay = document.querySelector('.overlay');
        expect(overlay).not.toBeNull();
        fireEvent.click(overlay as Element);
        expect(onClickOutside).toHaveBeenCalledTimes(1);
    });

    it('does not call onClickOutside when clicking inside the dialog', () => {
        const onClickOutside = vi.fn();
        renderModal({ onClickOutside });
        fireEvent.click(screen.getByRole('heading', { name: 'Create Token' }));
        expect(onClickOutside).not.toHaveBeenCalled();
    });

    it('calls onClickOutside when Escape is pressed', () => {
        const onClickOutside = vi.fn();
        renderModal({ onClickOutside });
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(onClickOutside).toHaveBeenCalledTimes(1);
    });

    it('unmounts after the exit animation once active becomes false', async () => {
        const { rerender } = renderModal();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        rerender(
            <Modal active={false}>
                <ModalBody>
                    <ModalHeader>
                        <ModalTitle>Create Token</ModalTitle>
                    </ModalHeader>
                </ModalBody>
            </Modal>,
        );
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    // ── Focus management ──

    it('moves focus to the first focusable element on open (Cancel)', () => {
        renderModal();
        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });

    it('honours initialFocusRef', () => {
        function Wrapper() {
            const ref = useRef<HTMLButtonElement>(null);
            return (
                <Modal active initialFocusRef={ref}>
                    <ModalBody>
                        <ModalHeader>
                            <ModalTitle>Initial Focus</ModalTitle>
                        </ModalHeader>
                    </ModalBody>
                    <ModalActions>
                        <ModalAction variant="secondary">Cancel</ModalAction>
                        <ModalAction ref={ref}>Submit</ModalAction>
                    </ModalActions>
                </Modal>
            );
        }
        render(<Wrapper />);
        expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
    });

    it('locks body scroll while open', () => {
        renderModal();
        expect(document.body.style.overflow).toBe('hidden');
    });

    // ── Sub-components / DOM structure ──

    it('renders the documented sub-component data attributes', () => {
        renderModal();
        expect(document.querySelector('[data-oxobz-modal-body]')).toBeInTheDocument();
        expect(document.querySelector('[data-oxobz-modal-header]')).toBeInTheDocument();
        expect(document.querySelector('[data-oxobz-modal-title]')).toBeInTheDocument();
        expect(document.querySelector('[data-oxobz-modal-subtitle]')).toBeInTheDocument();
        expect(document.querySelector('[data-oxobz-modal-actions]')).toBeInTheDocument();
        expect(document.querySelectorAll('[data-oxobz-modal-action]')).toHaveLength(2);
    });

    it('renders ModalInset with its data attribute', () => {
        render(
            <Modal active>
                <ModalBody>
                    <ModalInset>Inset content</ModalInset>
                </ModalBody>
            </Modal>,
        );
        const inset = document.querySelector('[data-oxobz-modal-inset]');
        expect(inset).toBeInTheDocument();
        expect(inset).toHaveTextContent('Inset content');
    });

    // ── ModalAction (built on Button) ──

    it('renders each ModalAction as a Button with type=button', () => {
        renderModal();
        const actions = document.querySelectorAll('[data-oxobz-modal-action]');
        actions.forEach((action) => {
            expect(action).toHaveAttribute('data-oxobz-button');
            expect(action).toHaveAttribute('type', 'button');
        });
    });

    it('disables a ModalAction when disabled is set', () => {
        render(
            <Modal active>
                <ModalBody>
                    <ModalHeader>
                        <ModalTitle>Modal</ModalTitle>
                    </ModalHeader>
                </ModalBody>
                <ModalActions>
                    <ModalAction variant="secondary">Cancel</ModalAction>
                    <ModalAction disabled>Submit</ModalAction>
                </ModalActions>
            </Modal>,
        );
        expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });

    it('applies the fullWidth class to a full-width action', () => {
        render(
            <Modal active>
                <ModalBody>
                    <ModalHeader>
                        <ModalTitle>Modal</ModalTitle>
                    </ModalHeader>
                </ModalBody>
                <ModalActions>
                    <ModalAction fullWidth>Cancel</ModalAction>
                </ModalActions>
            </Modal>,
        );
        expect(screen.getByRole('button', { name: 'Cancel' }).className).toContain('fullWidth');
    });

    // ── className / ref ──

    it('appends a custom className on the dialog', () => {
        renderModal({ className: 'custom-modal' });
        const dialog = screen.getByRole('dialog');
        expect(dialog.className).toContain('modal');
        expect(dialog.className).toContain('custom-modal');
    });

    it('applies the width prop as an inline pixel style', () => {
        renderModal({ width: 480 });
        expect(screen.getByRole('dialog')).toHaveStyle({ width: '480px' });
        // Default width.
        renderModal();
        expect(screen.getAllByRole('dialog')[1]).toHaveStyle({ width: '540px' });
    });

    it('forwards a ref to the dialog element', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Modal active ref={ref}>
                <ModalBody>
                    <ModalHeader>
                        <ModalTitle>Modal</ModalTitle>
                    </ModalHeader>
                </ModalBody>
            </Modal>,
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-modal');
    });

    // ── Compound + displayName ──

    it('exposes sub-components as compound members', () => {
        expect(Modal.Body).toBe(ModalBody);
        expect(Modal.Header).toBe(ModalHeader);
        expect(Modal.Title).toBe(ModalTitle);
        expect(Modal.Subtitle).toBe(ModalSubtitle);
        expect(Modal.Inset).toBe(ModalInset);
        expect(Modal.Actions).toBe(ModalActions);
        expect(Modal.Action).toBe(ModalAction);
    });

    it('has the expected displayNames', () => {
        expect(Modal.displayName).toBe('Modal');
        expect(ModalBody.displayName).toBe('ModalBody');
        expect(ModalHeader.displayName).toBe('ModalHeader');
        expect(ModalTitle.displayName).toBe('ModalTitle');
        expect(ModalSubtitle.displayName).toBe('ModalSubtitle');
        expect(ModalInset.displayName).toBe('ModalInset');
        expect(ModalActions.displayName).toBe('ModalActions');
        expect(ModalAction.displayName).toBe('ModalAction');
    });
});
