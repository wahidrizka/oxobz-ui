import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import {
    Fieldset,
    FieldsetContent,
    FieldsetTitle,
    FieldsetSubtitle,
    FieldsetFooter,
    FieldsetFooterStatus,
    FieldsetFooterActions,
    FieldsetFooterAction,
    ErrorText,
    WarningText,
    DisabledWall,
} from './Fieldset';

/** Selects the Fieldset root. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-fieldset]');
}

describe('Fieldset', () => {
    // ── Default composition ──

    it('renders the root, content, title, subtitle, footer status and actions', () => {
        const { container } = render(
            <Fieldset>
                <FieldsetContent>
                    <FieldsetTitle>Account Settings</FieldsetTitle>
                    <FieldsetSubtitle>Manage your account preferences</FieldsetSubtitle>
                </FieldsetContent>
                <FieldsetFooter>
                    <FieldsetFooterStatus>
                        <span>Need help?</span>
                    </FieldsetFooterStatus>
                    <FieldsetFooterActions>
                        <button type="button">Save Changes</button>
                    </FieldsetFooterActions>
                </FieldsetFooter>
            </Fieldset>,
        );

        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('fieldset');

        expect(container.querySelector('[data-oxobz-fieldset-content]')).toBeInTheDocument();
        expect(screen.getByText('Account Settings').tagName).toBe('H4');
        expect(screen.getByText('Manage your account preferences').tagName).toBe('P');
        expect(container.querySelector('[data-oxobz-fieldset-footer]')).toHaveAttribute(
            'data-version',
            'v1',
        );
        expect(container.querySelector('[data-oxobz-fieldset-footer-status]')).toBeInTheDocument();
        expect(container.querySelector('[data-oxobz-fieldset-footer-actions]')).toBeInTheDocument();
    });

    it('renders FieldsetFooter as a <footer> element', () => {
        const { container } = render(
            <Fieldset>
                <FieldsetContent>
                    <FieldsetTitle>Title</FieldsetTitle>
                </FieldsetContent>
                <FieldsetFooter>status</FieldsetFooter>
            </Fieldset>,
        );
        expect(container.querySelector('[data-oxobz-fieldset-footer]')?.tagName).toBe('FOOTER');
    });

    // ── Optional parts ──

    it('renders without a FieldsetFooter (Without Footer)', () => {
        const { container } = render(
            <Fieldset>
                <FieldsetContent>
                    <FieldsetTitle>Account Information</FieldsetTitle>
                    <FieldsetSubtitle>Lorem ipsum.</FieldsetSubtitle>
                </FieldsetContent>
            </Fieldset>,
        );
        expect(container.querySelector('[data-oxobz-fieldset-footer]')).not.toBeInTheDocument();
    });

    it('renders without a FieldsetTitle (Without Title)', () => {
        const { container } = render(
            <Fieldset>
                <FieldsetContent>
                    <FieldsetSubtitle>Subtitle only, no title.</FieldsetSubtitle>
                </FieldsetContent>
            </Fieldset>,
        );
        expect(container.querySelector('h4')).not.toBeInTheDocument();
        expect(screen.getByText('Subtitle only, no title.')).toBeInTheDocument();
    });

    // ── FieldsetFooterActions auto-wrapping ──

    it('wraps each FieldsetFooterActions child in its own FieldsetFooterAction', () => {
        const { container } = render(
            <FieldsetFooterActions>
                <button type="button">Cancel</button>
                <button type="button">Apply Changes</button>
            </FieldsetFooterActions>,
        );
        const wrappers = container.querySelectorAll('[data-oxobz-fieldset-footer-action]');
        expect(wrappers).toHaveLength(2);
        expect(wrappers[0].querySelector('button')?.textContent).toBe('Cancel');
        expect(wrappers[1].querySelector('button')?.textContent).toBe('Apply Changes');
    });

    it('FieldsetFooterAction renders a plain wrapper div', () => {
        const { container } = render(<FieldsetFooterAction>content</FieldsetFooterAction>);
        const el = container.querySelector('[data-oxobz-fieldset-footer-action]');
        expect(el?.tagName).toBe('DIV');
        expect(el?.textContent).toBe('content');
    });

    // ── type="error" | "warning" ──

    it('applies data-fieldset-type and the tinted border class for type="error"', () => {
        const { container } = render(
            <Fieldset type="error">
                <FieldsetContent>
                    <FieldsetTitle>Payment Failed</FieldsetTitle>
                </FieldsetContent>
            </Fieldset>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('data-fieldset-type', 'error');
        expect(root?.className).toContain('typeError');
    });

    it('applies data-fieldset-type and the tinted border class for type="warning"', () => {
        const { container } = render(
            <Fieldset type="warning">
                <FieldsetContent>
                    <FieldsetTitle>Trial Ending Soon</FieldsetTitle>
                </FieldsetContent>
            </Fieldset>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('data-fieldset-type', 'warning');
        expect(root?.className).toContain('typeWarning');
    });

    it('omits data-fieldset-type by default', () => {
        const { container } = render(
            <Fieldset>
                <FieldsetContent>
                    <FieldsetTitle>Default</FieldsetTitle>
                </FieldsetContent>
            </Fieldset>,
        );
        expect(getRoot(container)).not.toHaveAttribute('data-fieldset-type');
    });

    // ── FieldsetContent disabled ──

    it('auto-renders a DisabledWall as the first child when FieldsetContent is disabled', () => {
        const { container } = render(
            <FieldsetContent disabled>
                <FieldsetTitle>Transfer Project</FieldsetTitle>
            </FieldsetContent>,
        );
        const content = container.querySelector('[data-oxobz-fieldset-content]');
        expect(content?.className).toContain('disabled');
        expect(content?.firstElementChild).toHaveAttribute('data-oxobz-fieldset-disabled-wall');
    });

    it('does not render a DisabledWall when FieldsetContent is not disabled', () => {
        const { container } = render(
            <FieldsetContent>
                <FieldsetTitle>Account Settings</FieldsetTitle>
            </FieldsetContent>,
        );
        expect(
            container.querySelector('[data-oxobz-fieldset-disabled-wall]'),
        ).not.toBeInTheDocument();
        expect(container.querySelector('[data-oxobz-fieldset-content]')?.className).not.toContain(
            'disabled',
        );
    });

    // ── FieldsetFooter highlight ──

    it('applies the highlight class to FieldsetFooter', () => {
        const { container } = render(<FieldsetFooter highlight>message</FieldsetFooter>);
        expect(container.querySelector('[data-oxobz-fieldset-footer]')?.className).toContain(
            'highlight',
        );
    });

    it('omits the highlight class by default', () => {
        const { container } = render(<FieldsetFooter>message</FieldsetFooter>);
        expect(container.querySelector('[data-oxobz-fieldset-footer]')?.className).not.toContain(
            'highlight',
        );
    });

    // ── ErrorText / WarningText ──

    it('renders ErrorText with the fieldset-error data attribute', () => {
        const { container } = render(<ErrorText>API key validation failed.</ErrorText>);
        const el = container.querySelector('[data-oxobz-fieldset-error]');
        expect(el).toBeInTheDocument();
        expect(el?.tagName).toBe('SPAN');
        expect(el).toHaveAttribute('data-version', 'v1');
        expect(el?.className).toContain('errorText');
        expect(screen.getByText('API key validation failed.')).toBeInTheDocument();
    });

    it('renders WarningText with the fieldset-warning data attribute', () => {
        const { container } = render(<WarningText>Restart required.</WarningText>);
        const el = container.querySelector('[data-oxobz-fieldset-warning]');
        expect(el).toBeInTheDocument();
        expect(el?.tagName).toBe('SPAN');
        expect(el).toHaveAttribute('data-version', 'v1');
        expect(el?.className).toContain('warningText');
    });

    // ── DisabledWall (manual placement) ──

    it('renders a standalone DisabledWall with no children', () => {
        const { container } = render(<DisabledWall />);
        const el = container.querySelector('[data-oxobz-fieldset-disabled-wall]');
        expect(el).toBeInTheDocument();
        expect(el?.tagName).toBe('DIV');
        expect(el).toHaveAttribute('data-version', 'v1');
        expect(el?.childElementCount).toBe(0);
    });

    // ── Custom className (merged last) ──

    it.each([
        ['Fieldset', () => render(<Fieldset className="custom" />), '[data-oxobz-fieldset]'],
        [
            'FieldsetContent',
            () => render(<FieldsetContent className="custom" />),
            '[data-oxobz-fieldset-content]',
        ],
        [
            'FieldsetTitle',
            () => render(<FieldsetTitle className="custom">t</FieldsetTitle>),
            '[data-oxobz-fieldset-title]',
        ],
        [
            'FieldsetSubtitle',
            () => render(<FieldsetSubtitle className="custom">s</FieldsetSubtitle>),
            '[data-oxobz-fieldset-subtitle]',
        ],
        [
            'FieldsetFooter',
            () => render(<FieldsetFooter className="custom" />),
            '[data-oxobz-fieldset-footer]',
        ],
        [
            'FieldsetFooterStatus',
            () => render(<FieldsetFooterStatus className="custom" />),
            '[data-oxobz-fieldset-footer-status]',
        ],
        [
            'FieldsetFooterActions',
            () => render(<FieldsetFooterActions className="custom" />),
            '[data-oxobz-fieldset-footer-actions]',
        ],
        [
            'FieldsetFooterAction',
            () => render(<FieldsetFooterAction className="custom" />),
            '[data-oxobz-fieldset-footer-action]',
        ],
        ['ErrorText', () => render(<ErrorText className="custom">e</ErrorText>), '[data-oxobz-fieldset-error]'],
        [
            'WarningText',
            () => render(<WarningText className="custom">w</WarningText>),
            '[data-oxobz-fieldset-warning]',
        ],
        [
            'DisabledWall',
            () => render(<DisabledWall className="custom" />),
            '[data-oxobz-fieldset-disabled-wall]',
        ],
    ] as const)('%s appends a custom className after the module class', (_name, doRender, selector) => {
        const { container } = doRender();
        const el = container.querySelector(selector);
        expect(el?.className.endsWith('custom')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards refs on Fieldset, FieldsetContent and FieldsetFooter', () => {
        const rootRef = createRef<HTMLDivElement>();
        const contentRef = createRef<HTMLDivElement>();
        const footerRef = createRef<HTMLElement>();
        render(
            <Fieldset ref={rootRef}>
                <FieldsetContent ref={contentRef}>
                    <FieldsetTitle>Title</FieldsetTitle>
                </FieldsetContent>
                <FieldsetFooter ref={footerRef}>status</FieldsetFooter>
            </Fieldset>,
        );
        expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
        expect(rootRef.current).toHaveAttribute('data-oxobz-fieldset');
        expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
        expect(footerRef.current?.tagName).toBe('FOOTER');
    });

    it('forwards refs on ErrorText, WarningText and DisabledWall', () => {
        const errorRef = createRef<HTMLSpanElement>();
        const warningRef = createRef<HTMLSpanElement>();
        const wallRef = createRef<HTMLDivElement>();
        render(
            <div>
                <ErrorText ref={errorRef}>e</ErrorText>
                <WarningText ref={warningRef}>w</WarningText>
                <DisabledWall ref={wallRef} />
            </div>,
        );
        expect(errorRef.current).toBeInstanceOf(HTMLSpanElement);
        expect(warningRef.current).toBeInstanceOf(HTMLSpanElement);
        expect(wallRef.current).toBeInstanceOf(HTMLDivElement);
    });

    // ── Compound API ──

    it('exposes sub-components as Fieldset.* compound members', () => {
        expect(Fieldset.Content).toBe(FieldsetContent);
        expect(Fieldset.Title).toBe(FieldsetTitle);
        expect(Fieldset.Subtitle).toBe(FieldsetSubtitle);
        expect(Fieldset.Footer).toBe(FieldsetFooter);
        expect(Fieldset.FooterStatus).toBe(FieldsetFooterStatus);
        expect(Fieldset.FooterActions).toBe(FieldsetFooterActions);
        expect(Fieldset.FooterAction).toBe(FieldsetFooterAction);
        expect(Fieldset.ErrorText).toBe(ErrorText);
        expect(Fieldset.WarningText).toBe(WarningText);
        expect(Fieldset.DisabledWall).toBe(DisabledWall);
    });

    // ── displayName ──

    it.each([
        [Fieldset, 'Fieldset'],
        [FieldsetContent, 'FieldsetContent'],
        [FieldsetTitle, 'FieldsetTitle'],
        [FieldsetSubtitle, 'FieldsetSubtitle'],
        [FieldsetFooter, 'FieldsetFooter'],
        [FieldsetFooterStatus, 'FieldsetFooterStatus'],
        [FieldsetFooterActions, 'FieldsetFooterActions'],
        [FieldsetFooterAction, 'FieldsetFooterAction'],
        [ErrorText, 'ErrorText'],
        [WarningText, 'WarningText'],
        [DisabledWall, 'DisabledWall'],
    ] as const)('has the correct displayName', (Component, expected) => {
        expect(Component.displayName).toBe(expected);
    });
});
