import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Avatar, AvatarGroup, AvatarWithIcon, GitHubAvatar } from './Avatar';

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

describe('Avatar', () => {
    it('renders a span with data-oxobz-avatar attribute', () => {
        const { container } = render(<Avatar />);
        const span = container.querySelector('[data-oxobz-avatar]');
        expect(span).not.toBeNull();
    });

    it('has data-version="v1"', () => {
        const { container } = render(<Avatar />);
        const span = container.querySelector('[data-version="v1"]');
        expect(span).not.toBeNull();
    });

    it('has data-mask="true" by default (circular)', () => {
        const { container } = render(<Avatar />);
        expect(container.querySelector('[data-mask="true"]')).not.toBeNull();
    });

    it('has data-mask="false" when squared=true', () => {
        const { container } = render(<Avatar squared />);
        expect(container.querySelector('[data-mask="false"]')).not.toBeNull();
    });

    it('has data-resolved="false" by default (no src)', () => {
        const { container } = render(<Avatar />);
        // Without src, finalResolved = Boolean(undefined) = false
        expect(container.querySelector('[data-resolved="false"]')).not.toBeNull();
    });

    it('has data-resolved="true" when src is provided', () => {
        const { container } = render(<Avatar src="https://example.com/a.jpg" />);
        expect(container.querySelector('[data-resolved="true"]')).not.toBeNull();
    });

    it('has data-resolved="false" when resolved=false', () => {
        const { container } = render(<Avatar resolved={false} />);
        expect(container.querySelector('[data-resolved="false"]')).not.toBeNull();
    });

    it('has role="img"', () => {
        render(<Avatar alt="Profile photo" />);
        expect(screen.getByRole('img', { name: 'Profile photo' })).not.toBeNull();
    });

    it('sets aria-label from alt prop', () => {
        render(<Avatar alt="Test Avatar" />);
        expect(screen.getByRole('img', { name: 'Test Avatar' })).not.toBeNull();
    });

    it('sets aria-label from name prop when alt is not provided', () => {
        render(<Avatar name="Wahid" />);
        expect(screen.getByRole('img', { name: 'Avatar for Wahid' })).not.toBeNull();
    });

    it('renders img element when src is provided', () => {
        const { container } = render(<Avatar src="https://example.com/avatar.jpg" size={32} />);
        const img = container.querySelector('img');
        expect(img).not.toBeNull();
        expect(img?.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    });

    it('img has .intrinsic class from CSS module', () => {
        const { container } = render(<Avatar src="https://example.com/avatar.jpg" />);
        const img = container.querySelector('img');
        expect(img?.className).toContain('intrinsic');
    });

    it('renders initial from name when no src', () => {
        const { container } = render(<Avatar name="Wahid" />);
        const span = container.querySelector('[data-oxobz-avatar] > span');
        expect(span?.textContent).toBe('W');
    });

    it('builds img src from username at 2x size', () => {
        const { container } = render(<Avatar username="evilrabbit" size={24} />);
        const img = container.querySelector('img');
        expect(img?.getAttribute('src')).toBe(
            'https://vercel.com/api/www/avatar?s=48&u=evilrabbit',
        );
    });

    it('prefers explicit src over username', () => {
        const { container } = render(
            <Avatar username="evilrabbit" src="https://example.com/x.jpg" />,
        );
        const img = container.querySelector('img');
        expect(img?.getAttribute('src')).toBe('https://example.com/x.jpg');
    });

    it('derives aria-label "Avatar for {username}" when only username is given', () => {
        const { container } = render(<Avatar username="evilrabbit" />);
        const span = container.querySelector('[data-oxobz-avatar]');
        expect(span?.getAttribute('aria-label')).toBe('Avatar for evilrabbit');
    });

    it('renders a 1–2 letter avatar with the initials screen-reader label', () => {
        render(<Avatar letter="SL" placeholder size={32} />);
        expect(screen.getByRole('img', { name: 'Avatar with initials: SL' })).not.toBeNull();
    });

    it('renders letter text as fallback content', () => {
        const { container } = render(<Avatar letter="EK" placeholder />);
        const span = container.querySelector('[data-oxobz-avatar] > span');
        expect(span?.textContent).toBe('EK');
    });

    it('letter takes precedence over the name-derived initial', () => {
        const { container } = render(<Avatar name="Wahid" letter="WF" />);
        const span = container.querySelector('[data-oxobz-avatar] > span');
        expect(span?.textContent).toBe('WF');
    });

    it('sets --size CSS variable from size prop', () => {
        const { container } = render(<Avatar size={48} />);
        const el = container.querySelector('[data-oxobz-avatar]') as HTMLElement;
        expect(el.style.getPropertyValue('--size')).toBe('48px');
    });

    it('applies custom className', () => {
        const { container } = render(<Avatar className="custom-class" />);
        const el = container.querySelector('[data-oxobz-avatar]');
        expect(el?.classList.contains('custom-class')).toBe(true);
    });

    it('forwards ref to the span element', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<Avatar ref={ref} />);
        expect(ref.current).not.toBeNull();
        expect(ref.current?.tagName).toBe('SPAN');
    });

    it('forwards additional props to span', () => {
        const { container } = render(<Avatar data-testid="avatar-el" />);
        expect(container.querySelector('[data-testid="avatar-el"]')).not.toBeNull();
    });
});

/* ------------------------------------------------------------------ */
/*  AvatarGroup                                                        */
/* ------------------------------------------------------------------ */

describe('AvatarGroup', () => {
    it('renders a div container', () => {
        const { container } = render(<AvatarGroup />);
        expect(container.querySelector('div')).not.toBeNull();
    });

    it('renders visible avatars from members prop', () => {
        const members = [
            { username: 'alice', src: 'https://example.com/alice.jpg' },
            { username: 'bob', src: 'https://example.com/bob.jpg' },
        ];
        const { container } = render(<AvatarGroup members={members} />);
        const avatars = container.querySelectorAll('[data-oxobz-avatar]');
        expect(avatars.length).toBe(2);
    });

    it('renders +N overflow text when limit is set', () => {
        const members = [
            { username: 'alice' },
            { username: 'bob' },
            { username: 'carol' },
        ];
        const { container } = render(<AvatarGroup members={members} limit={2} />);
        // Should show 2 avatars + 1 overflow note (+1)
        const noteText = container.querySelector('[aria-label*="more avatars"]');
        expect(noteText).not.toBeNull();
    });

    it('shows correct overflow count', () => {
        const members = [
            { username: 'a' },
            { username: 'b' },
            { username: 'c' },
            { username: 'd' },
        ];
        const { container } = render(<AvatarGroup members={members} limit={2} />);
        // limit=2 → normalCount=1, noteCount=total-normalCount=4-1=3
        const noteSpan = container.querySelector('[aria-label*="3 more avatars"]');
        expect(noteSpan).not.toBeNull();
    });

    it('wraps the trailing member in a note even without a limit', () => {
        const members = [
            { username: 'a' },
            { username: 'b' },
            { username: 'c' },
        ];
        const { container } = render(<AvatarGroup members={members} />);
        // Geist always reserves the last slot as a note; a single trailing
        // member yields aria "1 more avatars in this group" and no "+N" bubble.
        const note = container.querySelector('[aria-label="1 more avatars in this group"]');
        expect(note).not.toBeNull();
        expect(container.textContent).not.toContain('+1');
        // still three avatars rendered in total
        expect(container.querySelectorAll('[data-oxobz-avatar]').length).toBe(3);
    });

    it('shows a "+N" bubble only when 2 or more members collapse', () => {
        const members = [
            { username: 'a' },
            { username: 'b' },
            { username: 'c' },
            { username: 'd' },
            { username: 'e' },
        ];
        const { container } = render(<AvatarGroup members={members} limit={4} />);
        expect(container.querySelector('[aria-label="2 more avatars in this group"]')).not.toBeNull();
        expect(container.textContent).toContain('+2');
    });

    // geistcn generation: every slot carries an inline z-index (all captured
    // stacks are descending — first avatar on top by default).
    it('assigns descending inline z-indexes by default (first slot on top)', () => {
        const members = [{ username: 'a' }, { username: 'b' }];
        const { container } = render(<AvatarGroup members={members} />);
        const group = container.querySelector('div') as HTMLElement;
        const first = group.children[0] as HTMLElement;
        const last = group.children[1] as HTMLElement;
        expect(Number(first.style.zIndex)).toBeGreaterThan(Number(last.style.zIndex));
        // margins come from the CSS module's --avatar-overlap, not inline styles
        expect(first.style.marginLeft).toBe('');
    });

    it('applies a fixed pixel overlap via --avatar-overlap on the wrapper', () => {
        const members = [
            { username: 'a' },
            { username: 'b' },
            { username: 'c' },
        ];
        const { container } = render(<AvatarGroup members={members} overlap={6} />);
        const group = container.querySelector('div') as HTMLElement;
        expect(group.style.getPropertyValue('--avatar-overlap')).toBe('6px');
        expect((group.children[1] as HTMLElement).style.marginLeft).toBe('');
    });

    it('reverse assigns ascending z-index so the LAST slot sits on top', () => {
        const members = [
            { username: 'a' },
            { username: 'b' },
            { username: 'c' },
        ];
        const { container } = render(<AvatarGroup members={members} reverse />);
        const group = container.querySelector('div') as HTMLElement;
        const slots = group.children;
        const firstZ = Number((slots[0] as HTMLElement).style.zIndex);
        const lastZ = Number((slots[slots.length - 1] as HTMLElement).style.zIndex);
        expect(lastZ).toBeGreaterThan(firstZ);
    });

    it('renders children mode when no members prop', () => {
        const { container } = render(
            <AvatarGroup>
                <Avatar name="Alice" />
                <Avatar name="Bob" />
            </AvatarGroup>
        );
        const avatars = container.querySelectorAll('[data-oxobz-avatar]');
        expect(avatars.length).toBe(2);
    });

    it('applies custom className', () => {
        const { container } = render(<AvatarGroup className="custom-group" />);
        expect(container.querySelector('.custom-group')).not.toBeNull();
    });
});

/* ------------------------------------------------------------------ */
/*  AvatarWithIcon                                                     */
/* ------------------------------------------------------------------ */

describe('AvatarWithIcon', () => {
    const TestIcon = () => <svg data-testid="icon-svg" />;

    it('renders the wrapper div', () => {
        const { container } = render(<AvatarWithIcon />);
        expect(container.querySelector('div')).not.toBeNull();
    });

    it('sets --size CSS variable from size prop', () => {
        const { container } = render(<AvatarWithIcon size={40} />);
        const wrapper = container.querySelector('div') as HTMLElement;
        expect(wrapper.style.getPropertyValue('--size')).toBe('40px');
    });

    it('renders icon div when icon prop is provided', () => {
        const { container } = render(<AvatarWithIcon icon={<TestIcon />} />);
        expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });

    it('does NOT render icon div when icon prop is absent', () => {
        const { container } = render(<AvatarWithIcon />);
        expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('sets data-background="false" by default', () => {
        const { container } = render(<AvatarWithIcon icon={<TestIcon />} />);
        expect(container.querySelector('[data-background="false"]')).not.toBeNull();
    });

    it('sets data-background="true" when iconBackground=true', () => {
        const { container } = render(<AvatarWithIcon icon={<TestIcon />} iconBackground />);
        expect(container.querySelector('[data-background="true"]')).not.toBeNull();
    });

    it('sets data-git-type="github" on icon div', () => {
        const { container } = render(
            <AvatarWithIcon icon={<TestIcon />} iconBackground gitType="github" />
        );
        expect(container.querySelector('[data-git-type="github"]')).not.toBeNull();
    });

    it('sets data-git-type="bitbucket" on icon div', () => {
        const { container } = render(
            <AvatarWithIcon icon={<TestIcon />} iconBackground gitType="bitbucket" />
        );
        expect(container.querySelector('[data-git-type="bitbucket"]')).not.toBeNull();
    });

    it('sets data-git-type="gitlab" on icon div', () => {
        const { container } = render(
            <AvatarWithIcon icon={<TestIcon />} iconBackground gitType="gitlab" />
        );
        expect(container.querySelector('[data-git-type="gitlab"]')).not.toBeNull();
    });

    it('does NOT set data-git-type when gitType is not provided', () => {
        const { container } = render(<AvatarWithIcon icon={<TestIcon />} iconBackground />);
        const iconDiv = container.querySelector('[aria-hidden="true"]');
        expect(iconDiv?.getAttribute('data-git-type')).toBeNull();
    });

    it('icon is positioned with left:-3px bottom:-5px', () => {
        const { container } = render(<AvatarWithIcon icon={<TestIcon />} />);
        const iconDiv = container.querySelector('[aria-hidden="true"]') as HTMLElement;
        expect(iconDiv.style.left).toBe('-3px');
        expect(iconDiv.style.bottom).toBe('-5px');
    });

    it('renders Avatar inside wrapper', () => {
        const { container } = render(<AvatarWithIcon src="https://example.com/a.jpg" size={32} />);
        expect(container.querySelector('[data-oxobz-avatar]')).not.toBeNull();
    });

    it('applies custom className to wrapper', () => {
        const { container } = render(<AvatarWithIcon className="custom-wrapper" />);
        expect(container.querySelector('.custom-wrapper')).not.toBeNull();
    });
});

/* ------------------------------------------------------------------ */
/*  GitHubAvatar                                                       */
/* ------------------------------------------------------------------ */

describe('GitHubAvatar', () => {
    it('builds avatar src from username at 2x size', () => {
        const { container } = render(<GitHubAvatar size={32} username="rauchg" />);
        const img = container.querySelector('img');
        expect(img?.getAttribute('src')).toBe('https://avatars.githubusercontent.com/rauchg?s=64');
    });

    it('renders icon div with data-git-type="github" and background', () => {
        const { container } = render(<GitHubAvatar size={32} username="rauchg" />);
        const iconDiv = container.querySelector('[data-git-type="github"]');
        expect(iconDiv).not.toBeNull();
        expect(iconDiv?.getAttribute('data-background')).toBe('true');
    });

    it('icon svg has no Tailwind class — color comes from currentColor', () => {
        // Production markup carries the docs-site Tailwind class text-[#000000];
        // this project has no Tailwind, so the class is intentionally omitted.
        const { container } = render(<GitHubAvatar size={32} username="rauchg" />);
        const svg = container.querySelector('[data-git-type="github"] svg');
        expect(svg).not.toBeNull();
        expect(svg?.classList.contains('text-[#000000]')).toBe(false);
        expect((svg as SVGElement).style.color).toBe('currentcolor');
    });

    it('icon svg matches production dimensions (16px attrs, 14px inline style)', () => {
        const { container } = render(<GitHubAvatar size={32} username="rauchg" />);
        const svg = container.querySelector('[data-git-type="github"] svg') as SVGElement;
        expect(svg.getAttribute('width')).toBe('16');
        expect(svg.getAttribute('height')).toBe('16');
        expect(svg.style.width).toBe('14px');
        expect(svg.style.height).toBe('14px');
    });
});
