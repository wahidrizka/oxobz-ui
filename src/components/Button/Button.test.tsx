import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
    // ---- Rendering ----

    it('renders with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders as <button> element', () => {
        render(<Button>tag test</Button>);
        const el = screen.getByText('tag test').closest('[data-oxobz-button]');
        expect(el?.tagName).toBe('BUTTON');
    });

    // ---- Data attributes ----

    it('has data-oxobz-button attribute', () => {
        render(<Button>attr test</Button>);
        const el = screen.getByText('attr test').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('data-oxobz-button', '');
    });

    it('has data-version="v1" attribute', () => {
        render(<Button>version test</Button>);
        const el = screen.getByText('version test').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('data-version', 'v1');
    });

    it('has data-prefix="false" and data-suffix="false" by default', () => {
        render(<Button>prefix test</Button>);
        const el = screen.getByText('prefix test').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('data-prefix', 'false');
        expect(el).toHaveAttribute('data-suffix', 'false');
    });

    it('has data-prefix="true" when prefix is provided', () => {
        render(<Button prefix={<span>→</span>}>with prefix</Button>);
        const el = screen.getByText('with prefix').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('data-prefix', 'true');
    });

    it('has data-suffix="true" when suffix is provided', () => {
        render(<Button suffix={<span>←</span>}>with suffix</Button>);
        const el = screen.getByText('with suffix').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('data-suffix', 'true');
    });

    // ---- HTML type ----

    it('default htmlType is submit', () => {
        render(<Button>submit btn</Button>);
        const el = screen.getByText('submit btn').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('type', 'submit');
    });

    it('htmlType="button" sets type attribute', () => {
        render(<Button htmlType="button">btn type</Button>);
        const el = screen.getByText('btn type').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('type', 'button');
    });

    it('htmlType="reset" sets type attribute', () => {
        render(<Button htmlType="reset">reset type</Button>);
        const el = screen.getByText('reset type').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('type', 'reset');
    });

    // ---- Variants ----

    it('default variant does not apply secondary/tertiary class', () => {
        render(<Button>default variant</Button>);
        const el = screen.getByText('default variant').closest('[data-oxobz-button]');
        expect(el?.className).not.toContain('secondary');
        expect(el?.className).not.toContain('tertiary');
    });

    it('applies secondary class for variant="secondary"', () => {
        render(<Button variant="secondary">secondary</Button>);
        const el = screen.getByText('secondary').closest('[data-oxobz-button]');
        expect(el?.className).toContain('secondary');
    });

    it('applies tertiary class for variant="tertiary"', () => {
        render(<Button variant="tertiary">tertiary</Button>);
        const el = screen.getByText('tertiary').closest('[data-oxobz-button]');
        expect(el?.className).toContain('tertiary');
    });

    it('applies error + themed classes for variant="error"', () => {
        render(<Button variant="error">error btn</Button>);
        const el = screen.getByText('error btn').closest('[data-oxobz-button]');
        expect(el?.className).toContain('error');
        expect(el?.className).toContain('themed');
    });

    it('applies warning + themed classes for variant="warning"', () => {
        render(<Button variant="warning">warning btn</Button>);
        const el = screen.getByText('warning btn').closest('[data-oxobz-button]');
        expect(el?.className).toContain('warning');
        expect(el?.className).toContain('themed');
    });

    // ---- Sizes ----

    it('default size (medium) does not add small/large/tiny class', () => {
        render(<Button>medium size</Button>);
        const el = screen.getByText('medium size').closest('[data-oxobz-button]');
        expect(el?.className).not.toContain('small');
        expect(el?.className).not.toContain('large');
        expect(el?.className).not.toContain('tiny');
    });

    it('applies small class for size="small"', () => {
        render(<Button size="small">small btn</Button>);
        const el = screen.getByText('small btn').closest('[data-oxobz-button]');
        expect(el?.className).toContain('small');
    });

    it('applies large class for size="large"', () => {
        render(<Button size="large">large btn</Button>);
        const el = screen.getByText('large btn').closest('[data-oxobz-button]');
        expect(el?.className).toContain('large');
    });

    it('applies tiny class for size="tiny"', () => {
        render(<Button size="tiny">tiny btn</Button>);
        const el = screen.getByText('tiny btn').closest('[data-oxobz-button]');
        expect(el?.className).toContain('tiny');
    });

    // ---- Shape ----

    it('applies shape class for shape="square"', () => {
        render(<Button shape="square">sq</Button>);
        const el = screen.getByText('sq').closest('[data-oxobz-button]');
        expect(el?.className).toContain('shape');
    });

    it('applies shape + circle class for shape="circle"', () => {
        render(<Button shape="circle">ci</Button>);
        const el = screen.getByText('ci').closest('[data-oxobz-button]');
        expect(el?.className).toContain('shape');
        expect(el?.className).toContain('circle');
    });

    it('applies rounded class (without shape) for shape="rounded"', () => {
        render(<Button shape="rounded">ro</Button>);
        const el = screen.getByText('ro').closest('[data-oxobz-button]');
        expect(el?.className).not.toContain('shape');
        expect(el?.className).toContain('rounded');
    });

    // ---- Shadow ----

    it('applies shadow class when shadow=true', () => {
        render(<Button shadow>shadow btn</Button>);
        const el = screen.getByText('shadow btn').closest('[data-oxobz-button]');
        expect(el?.className).toContain('shadow');
    });

    it('does not apply shadow class by default', () => {
        render(<Button>no shadow</Button>);
        const el = screen.getByText('no shadow').closest('[data-oxobz-button]');
        expect(el?.className).not.toContain('shadow');
    });

    // ---- Prefix & Suffix rendering ----

    it('renders prefix icon in .prefix wrapper', () => {
        const icon = <span data-testid="prefix-icon">→</span>;
        render(<Button prefix={icon}>with prefix</Button>);
        expect(screen.getByTestId('prefix-icon')).toBeInTheDocument();
        const wrapper = screen.getByTestId('prefix-icon').parentElement;
        expect(wrapper?.className).toContain('prefix');
    });

    it('renders suffix icon in .suffix wrapper', () => {
        const icon = <span data-testid="suffix-icon">←</span>;
        render(<Button suffix={icon}>with suffix</Button>);
        expect(screen.getByTestId('suffix-icon')).toBeInTheDocument();
        const wrapper = screen.getByTestId('suffix-icon').parentElement;
        expect(wrapper?.className).toContain('suffix');
    });

    it('does NOT render prefix wrapper when no prefix', () => {
        const { container } = render(<Button>no prefix</Button>);
        const prefixEl = container.querySelector('.prefix');
        expect(prefixEl).toBeNull();
    });

    it('does NOT render suffix wrapper when no suffix', () => {
        const { container } = render(<Button>no suffix</Button>);
        const suffixEl = container.querySelector('.suffix');
        expect(suffixEl).toBeNull();
    });

    // ---- Content wrapper ----

    it('wraps children in .content span', () => {
        const { container } = render(<Button>content test</Button>);
        const content = container.querySelector('.content');
        expect(content).toBeInTheDocument();
        expect(content?.tagName).toBe('SPAN');
        expect(content?.textContent).toBe('content test');
    });

    it('applies flex class to content when svgOnly=true', () => {
        const { container } = render(<Button svgOnly>svg</Button>);
        const content = container.querySelector('.content');
        expect(content?.className).toContain('flex');
    });

    // ---- Disabled ----

    it('sets disabled attribute when disabled=true', () => {
        render(<Button disabled>disabled btn</Button>);
        const el = screen.getByText('disabled btn').closest('[data-oxobz-button]') as HTMLButtonElement;
        expect(el.disabled).toBe(true);
    });

    it('sets aria-disabled="true" when disabled', () => {
        render(<Button disabled>disabled aria</Button>);
        const el = screen.getByText('disabled aria').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('aria-disabled', 'true');
    });

    it('sets tabIndex=-1 when disabled', () => {
        render(<Button disabled>disabled tab</Button>);
        const el = screen.getByText('disabled tab').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('tabindex', '-1');
    });

    it('does not add data-hover when disabled and hovered', () => {
        render(<Button disabled>disabled hover</Button>);
        const el = screen.getByText('disabled hover').closest('[data-oxobz-button]') as HTMLElement;
        fireEvent.pointerEnter(el);
        expect(el).not.toHaveAttribute('data-hover');
    });

    // ---- Loading ----

    it('applies loading class when loading=true', () => {
        render(<Button loading>loading btn</Button>);
        const el = screen.getByText('loading btn').closest('[data-oxobz-button]');
        expect(el?.className).toContain('loading');
    });

    it('sets aria-disabled="true" when loading', () => {
        render(<Button loading>loading aria</Button>);
        const el = screen.getByText('loading aria').closest('[data-oxobz-button]');
        expect(el).toHaveAttribute('aria-disabled', 'true');
    });

    // ---- Hover / Active states ----

    it('adds data-hover on pointerEnter', () => {
        render(<Button>hover test</Button>);
        const el = screen.getByText('hover test').closest('[data-oxobz-button]') as HTMLElement;
        fireEvent.pointerEnter(el);
        expect(el).toHaveAttribute('data-hover');
    });

    it('removes data-hover on pointerLeave', () => {
        render(<Button>hover leave</Button>);
        const el = screen.getByText('hover leave').closest('[data-oxobz-button]') as HTMLElement;
        fireEvent.pointerEnter(el);
        expect(el).toHaveAttribute('data-hover');
        fireEvent.pointerLeave(el);
        expect(el).not.toHaveAttribute('data-hover');
    });

    it('adds data-active on pointerDown', () => {
        render(<Button>active test</Button>);
        const el = screen.getByText('active test').closest('[data-oxobz-button]') as HTMLElement;
        fireEvent.pointerDown(el);
        expect(el).toHaveAttribute('data-active');
    });

    it('removes data-active on pointerUp', () => {
        render(<Button>active up</Button>);
        const el = screen.getByText('active up').closest('[data-oxobz-button]') as HTMLElement;
        fireEvent.pointerDown(el);
        expect(el).toHaveAttribute('data-active');
        fireEvent.pointerUp(el);
        expect(el).not.toHaveAttribute('data-active');
    });

    // ---- Custom className ----

    it('applies custom className', () => {
        render(<Button className="my-custom">custom class</Button>);
        const el = screen.getByText('custom class').closest('[data-oxobz-button]');
        expect(el?.className).toContain('my-custom');
    });

    // ---- Ref forwarding ----

    it('forwards ref', () => {
        const ref = { current: null } as React.RefObject<HTMLButtonElement | null>;
        render(<Button ref={ref}>ref test</Button>);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    // ---- Inline style ----

    it('sets --oxobz-icon-size CSS variable', () => {
        render(<Button>icon size</Button>);
        const el = screen.getByText('icon size').closest('[data-oxobz-button]') as HTMLElement;
        expect(el.style.getPropertyValue('--oxobz-icon-size')).toBe('16px');
    });

    // ---- Base CSS classes ----

    it('always has base, reset, button, and invert classes', () => {
        render(<Button>base classes</Button>);
        const el = screen.getByText('base classes').closest('[data-oxobz-button]');
        expect(el?.className).toContain('base');
        expect(el?.className).toContain('reset');
        expect(el?.className).toContain('button');
        expect(el?.className).toContain('invert');
    });
});
