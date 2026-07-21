/**
 * Avatar — mirrors production structure exactly.
 *
 * Production HTML (from inspect element):
 *
 *   <span class="avatar" data-oxobz-avatar="" data-mask="true"
 *         data-resolved="true" data-version="v1" role="img"
 *         style="--size: 32px;">
 *       <img class="intrinsic" data-nimg="1" ... />
 *   </span>
 *
 * Group:
 *   <div class="group">
 *     <span class="groupAvatar"><span class="avatar" ...>...</span></span>
 *     <span class="note groupAvatar">
 *       <span class="avatar" ...><img .../></span>
 *       <span class="noteText">+2</span>
 *     </span>
 *   </div>
 *
 * AvatarWithIcon:
 *   <div class="iconWrapper" style="--size: 32px;">
 *     <span class="avatar" ...>...</span>
 *     <div class="icon" data-icon-background="true" style="left:-3px;bottom:-5px;">
 *       {icon}
 *     </div>
 *   </div>
 *
 * Git wrappers (Show code):
 *   <GitHubAvatar size={32} username="rauchg" />
 *   <GitLabAvatar size={32} username="leerob" />
 *   <BitbucketAvatar size={32} username="evilrabbit" />
 *
 * Placeholder (Show code):
 *   <Avatar placeholder size={90} />
 */

import {
    forwardRef,
    type HTMLAttributes,
    type ImgHTMLAttributes,
    type ReactNode,
    type CSSProperties,
    Children,
} from 'react';
import { LogoGithub } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Avatar.module.css';

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
    /** Image URL */
    src?: string;
    /** Vercel username. When `src` is absent, the image src is built as
     *  `https://vercel.com/api/www/avatar?s={size*2}&u={username}` (Geist `username` API). */
    username?: string;
    /** Accessible label */
    alt?: string;
    /** Pixel size — set as CSS variable --size */
    size?: number;
    /** Name (used for aria-label & fallback initial) */
    name?: string;
    /** 1–2 uppercase letters shown when no image is available. Screen-reader label is
     *  prefixed with `Avatar with initials:` (Geist `letter` API). */
    letter?: string;
    /** Square instead of circle (data-mask=false) */
    squared?: boolean;
    /** Whether the avatar image has loaded (controls shimmer).
     *  Defaults to `true` when a resolvable src is present, `false` otherwise. */
    resolved?: boolean;
    /** Shorthand for unresolved placeholder avatar (data-resolved="false", aria-label="Placeholder Avatar") */
    placeholder?: boolean;
    /** Extra props forwarded to the inner <img> */
    imgProps?: ImgHTMLAttributes<HTMLImageElement>;
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
    (
        {
            src,
            username,
            alt,
            size = 32,
            name,
            letter,
            squared = false,
            resolved,
            placeholder = false,
            imgProps,
            className,
            style,
            children,
            ...props
        },
        ref,
    ) => {
        // Build the image src: explicit `src` wins, otherwise derive from `username`
        // via Vercel's public avatar service (same URL shape as AvatarGroup members).
        // Note: this is an external runtime dependency on vercel.com — intentional
        // production (Geist) behavior, kept as-is.
        const finalSrc =
            src ??
            (username
                ? `https://vercel.com/api/www/avatar?s=${size * 2}&u=${username}`
                : undefined);

        // `username` also acts as a name for labelling/initials when `name` is absent.
        const effectiveName = name ?? username;

        // Derive resolved: explicit > placeholder > presence of a resolvable src.
        const finalResolved = placeholder
            ? false
            : (resolved ?? Boolean(finalSrc));

        // Derive label. `alt` overrides everything; then a letter avatar gets the
        // Geist screen-reader prefix; then placeholder; then a name-based label.
        let label: string;
        if (alt !== undefined) {
            label = alt;
        } else if (letter) {
            label = `Avatar with initials: ${letter}`;
        } else if (placeholder) {
            label = 'Placeholder Avatar';
        } else if (effectiveName) {
            label = `Avatar for ${effectiveName}`;
        } else {
            label = '';
        }

        const initial = effectiveName ? effectiveName.charAt(0).toUpperCase() : undefined;

        return (
            <span
                ref={ref}
                aria-label={label}
                className={cn(styles.avatar, className)}
                data-oxobz-avatar=""
                data-mask={squared ? 'false' : 'true'}
                data-resolved={String(finalResolved)}
                data-version="v1"
                role="img"
                style={{ '--size': `${size}px`, ...style } as CSSProperties}
                {...props}
            >
                {finalSrc && !placeholder ? (
                    <img
                        data-version="v1"
                        alt={label}
                        title={label}
                        loading="eager"
                        width={size}
                        height={size}
                        decoding="sync"
                        data-nimg="1"
                        className={styles.intrinsic}
                        src={finalSrc}
                        style={{ color: 'transparent' }}
                        {...imgProps}
                    />
                ) : children ? (
                    children
                ) : letter ? (
                    <span>{letter}</span>
                ) : initial ? (
                    <span>{initial}</span>
                ) : null}
            </span>
        );
    },
);

Avatar.displayName = 'Avatar';

/* ------------------------------------------------------------------ */
/*  AvatarGroup                                                        */
/* ------------------------------------------------------------------ */

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
    /** Members (username / src pairs) for declarative API */
    members?: Array<{
        username?: string;
        src?: string;
        alt?: string;
    }>;
    /** Pixel size for each avatar */
    size?: number;
    /** Number of rendered slots (normal avatars + the trailing note). Defaults to
     *  members.length. The last slot is always a note representing the remaining
     *  members; a "+N" bubble is drawn only when 2 or more members collapse into it. */
    limit?: number;
    /** Overlap spacing between stacked avatars. `'auto'` (default) uses the
     *  production-tuned spacing (-10px, the value shipped in the cloned build); a
     *  number sets a fixed pixel overlap instead (Geist `overlap` API). */
    overlap?: 'auto' | number;
    /** Flip the stacking order so the last member sits on top of the stack.
     *  The visual left-to-right order is unchanged (Geist `reverse` API). */
    reverse?: boolean;
}

/**
 * Compute the inline style for a single stacked slot.
 * - Fixed `overlap` (a number) overrides the CSS default -10px on every slot
 *   past the first. `'auto'` returns no margin so the CSS rule stays in effect.
 * - `reverse` makes the last member sit on top by handing each slot a z-index;
 *   slot 0 gets the highest value so, when off, natural DOM order applies and
 *   the markup stays byte-identical to the production snapshot (no z-index).
 */
/**
 * geistcn generation: every slot carries an inline z-index (evidence: all
 * captured stacks are descending — first avatar on top). `reverse` flips to
 * ascending so the LAST member sits on top (documented inference — no
 * captured reverse example distinguishes itself in static markup).
 * Overlap now flows through the wrapper's --avatar-overlap variable, not
 * per-slot margins.
 */
function slotStyle(index: number, count: number, reverse: boolean): CSSProperties {
    return { zIndex: reverse ? index + 1 : count - index };
}

export function AvatarGroup({
    members,
    size = 32,
    limit,
    overlap = 'auto',
    reverse = false,
    children,
    className,
    ...props
}: AvatarGroupProps) {
    /* Declarative mode — members prop */
    if (members && members.length > 0) {
        const total = members.length;
        // Geist always reserves the last visible slot as a "note". The first
        // (limit-1) members render normally; the member at `normalCount` becomes
        // the note, and `noteCount` counts every member from that slot onward.
        // A "+N" bubble is shown only when 2+ members collapse into the note —
        // matching the production snapshot where a single trailing member is
        // wrapped in a note (aria "1 more avatars in this group") without a bubble.
        const normalCount = Math.max(0, Math.min((limit ?? total) - 1, total - 1));
        const normal = members.slice(0, normalCount);
        const noteMember = members[normalCount];
        const noteCount = total - normalCount;
        const showBubble = noteCount >= 2;
        const slotCount = normalCount + 1;

        // Wrapper carries the overlap variable (production: inline
        // `--avatar-overlap: 10px` on the flex wrapper, consumed by the
        // nth-child(n+2) negative margin in the CSS module).
        const groupStyle =
            typeof overlap === 'number'
                ? ({ '--avatar-overlap': `${overlap}px` } as CSSProperties)
                : undefined;

        return (
            <div className={cn(styles.group, className)} style={groupStyle} {...props}>
                {normal.map((m, i) => (
                    <span
                        key={m.username || i}
                        className={styles.groupAvatar}
                        style={slotStyle(i, slotCount, reverse)}
                    >
                        <Avatar src={m.src} username={m.username} alt={m.alt} size={size} />
                    </span>
                ))}
                <span
                    aria-label={`${noteCount} more avatars in this group`}
                    title={`${noteCount} more avatars in this group`}
                    className={cn(styles.note, styles.groupAvatar)}
                    style={slotStyle(normalCount, slotCount, reverse)}
                >
                    <Avatar
                        src={noteMember.src}
                        username={noteMember.username}
                        alt={noteMember.alt}
                        size={size}
                    />
                    {showBubble && (
                        <span className={cn(styles.noteText, 'dark-theme')} data-version="v1">
                            +{noteCount}
                        </span>
                    )}
                </span>
            </div>
        );
    }

    /* Children mode — wrap each child in groupAvatar span */
    const childArray = Children.toArray(children);
    const childGroupStyle =
        typeof overlap === 'number'
            ? ({ '--avatar-overlap': `${overlap}px` } as CSSProperties)
            : undefined;
    return (
        <div className={cn(styles.group, className)} style={childGroupStyle} {...props}>
            {childArray.map((child, i) => (
                <span
                    key={i}
                    className={styles.groupAvatar}
                    style={slotStyle(i, childArray.length, reverse)}
                >
                    {child}
                </span>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  AvatarWithIcon                                                     */
/* ------------------------------------------------------------------ */

export interface AvatarWithIconProps extends HTMLAttributes<HTMLDivElement> {
    /** Icon element shown at bottom-left */
    icon?: ReactNode;
    /** Show background circle behind icon */
    iconBackground?: boolean;
    /** Size in pixels */
    size?: number;
    /** Avatar image src */
    src?: string;
    /** Avatar name */
    name?: string;
    /** Git provider type — affects icon background color */
    gitType?: 'github' | 'bitbucket' | 'gitlab';
}

export function AvatarWithIcon({
    icon,
    iconBackground = false,
    size = 32,
    src,
    name,
    gitType,
    className,
    style,
    children,
    ...props
}: AvatarWithIconProps) {
    // Inspect element: AvatarWithIcon without src still renders with
    // src="https://vercel.com/api/www/avatar?s=64" (default avatar, blue pattern).
    // Falling back to Vercel's public avatar service is intentional production
    // (Geist) behavior — an external runtime dependency on vercel.com.
    const defaultSrc = `https://vercel.com/api/www/avatar?s=${size * 2}`;
    const avatarSrc = src ?? defaultSrc;

    return (
        <div
            className={cn(styles.iconWrapper, className)}
            style={{ '--size': `${size}px`, ...style } as CSSProperties}
            {...props}
        >
            <Avatar src={avatarSrc} name={name} size={size}>
                {children}
            </Avatar>
            {icon && (
                <div
                    aria-hidden="true"
                    className={styles.icon}
                    data-icon-background={String(iconBackground)}
                    data-git-type={gitType}
                    style={{ left: -3, bottom: -5 }}
                >
                    {icon}
                </div>
            )}
        </div>
    );
}


function GitLabSvgIcon() {
    return (
        <svg aria-label="gitlab" height="14" viewBox="0 0 24 22" width="14" style={{ color: 'white' }}>
            <path d="M1.279 8.29L.044 12.294c-.117.367 0 .78.325 1.014l11.323 8.23-.009-.012-.03-.039L1.279 8.29zM22.992 13.308a.905.905 0 00.325-1.014L22.085 8.29 11.693 21.52l11.299-8.212z" fill="currentColor" />
            <path d="M1.279 8.29l10.374 13.197.03.039.01-.006L22.085 8.29H1.28z" fill="currentColor" opacity=".4" />
            <path d="M15.982 8.29l-4.299 13.236-.004.011.014-.017L22.085 8.29h-6.103zM7.376 8.29H1.279l10.374 13.197L7.376 8.29z" fill="currentColor" opacity=".6" />
            <path d="M18.582.308l-2.6 7.982h6.103L19.48.308c-.133-.41-.764-.41-.897 0zM1.279 8.29L3.88.308c.133-.41.764-.41.897 0l2.6 7.982H1.279z" fill="currentColor" opacity=".4" />
        </svg>
    );
}

function BitbucketSvgIcon() {
    return (
        <svg height="14" viewBox="-2 -2 65 59" width="14">
            <defs>
                <linearGradient id="bitbucket-oxobz" x1="104.953%" x2="46.569%" y1="21.921%" y2="75.234%">
                    <stop offset="7%" stopColor="currentColor" stopOpacity=".4" />
                    <stop offset="100%" stopColor="currentColor" />
                </linearGradient>
            </defs>
            <path d="M59.696 18.86h-18.77l-3.15 18.39h-13L9.426 55.47a2.71 2.71 0 001.75.66h40.74a2 2 0 002-1.68l5.78-35.59z" fill="url(#bitbucket-oxobz)" fillRule="nonzero" transform="translate(-.026 .82)" />
            <path d="M2 .82a2 2 0 00-2 2.32l8.49 51.54a2.7 2.7 0 00.91 1.61 2.71 2.71 0 001.75.66l15.76-18.88H24.7l-3.47-18.39h38.44l2.7-16.53a2 2 0 00-2-2.32L2 .82z" fill="currentColor" fillRule="nonzero" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  GitHubAvatar — Show code: <GitHubAvatar size={32} username="rauchg" /> */
/* ------------------------------------------------------------------ */

export interface GitAvatarProps extends Omit<AvatarWithIconProps, 'icon' | 'iconBackground' | 'gitType' | 'src' | 'name'> {
    /** Git username — used to build avatar src URL */
    username: string;
}

/**
 * GitHub Avatar wrapper.
 * - src: https://avatars.githubusercontent.com/{username}?s={size*2}
 * - aria-label: "" (empty — from inspect element)
 * - icon: GitHub SVG built-in
 *
 * Note: production markup carries a Tailwind class `text-[#000000]` on the
 * svg (an artifact of Vercel's docs site). This project has no Tailwind, so
 * the class is dead here and intentionally omitted — the icon color is
 * already handled by fill="currentColor" + the inline `color: currentcolor`
 * that LogoGithub sets by default.
 */
export function GitHubAvatar({ username, size = 32, ...props }: GitAvatarProps) {
    return (
        <AvatarWithIcon
            src={`https://avatars.githubusercontent.com/${username}?s=${size * 2}`}
            size={size}
            icon={<LogoGithub style={{ width: 14, height: 14 }} />}
            iconBackground
            gitType="github"
            {...props}
        />
    );
}

/**
 * GitLab Avatar wrapper.
 * - src: https://vercel.com/api/www/avatar?s={size*2}&u={username}
 * - aria-label: "Avatar for {username}" (from inspect element)
 * - icon: GitLab SVG built-in
 */
export function GitLabAvatar({ username, size = 32, ...props }: GitAvatarProps) {
    return (
        <AvatarWithIcon
            src={`https://vercel.com/api/www/avatar?s=${size * 2}&u=${username}`}
            name={username}
            size={size}
            icon={<GitLabSvgIcon />}
            iconBackground
            gitType="gitlab"
            {...props}
        />
    );
}

/**
 * Bitbucket Avatar wrapper.
 * - src: https://vercel.com/api/www/avatar?s={size*2}&u={username}
 * - aria-label: "Avatar for {username}" (from inspect element)
 * - icon: Bitbucket SVG built-in
 */
export function BitbucketAvatar({ username, size = 32, ...props }: GitAvatarProps) {
    return (
        <AvatarWithIcon
            src={`https://vercel.com/api/www/avatar?s=${size * 2}&u=${username}`}
            name={username}
            size={size}
            icon={<BitbucketSvgIcon />}
            iconBackground
            gitType="bitbucket"
            {...props}
        />
    );
}
