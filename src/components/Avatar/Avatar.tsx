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
 *     <div class="icon" data-background="true" style="left:-3px;bottom:-5px;">
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

import React, {
    forwardRef,
    type HTMLAttributes,
    type ImgHTMLAttributes,
    type ReactNode,
    type CSSProperties,
    Children,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Avatar.module.css';

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
    /** Image URL */
    src?: string;
    /** Accessible label */
    alt?: string;
    /** Pixel size — set as CSS variable --size */
    size?: number;
    /** Name (used for aria-label & fallback initial) */
    name?: string;
    /** Square instead of circle (data-mask=false) */
    squared?: boolean;
    /** Whether the avatar image has loaded (controls shimmer).
     *  Defaults to `true` when `src` is provided, `false` otherwise. */
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
            alt,
            size = 32,
            name,
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
        // Derive resolved: explicit > placeholder > src presence
        const finalResolved = placeholder
            ? false
            : (resolved ?? Boolean(src));

        // Derive label: placeholder > alt > name-based > ""
        const label = placeholder
            ? (alt ?? 'Placeholder Avatar')
            : (alt ?? (name ? `Avatar for ${name}` : ''));

        const initial = name ? name.charAt(0).toUpperCase() : undefined;

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
                {src && !placeholder ? (
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
                        src={src}
                        style={{ color: 'transparent' }}
                        {...imgProps}
                    />
                ) : children ? (
                    children
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
    /** Max rendered items (normal + note). Defaults to members.length.
     *  Note avatar is always the member at position limit-1.
     *  noteText = total - limit + 1. */
    limit?: number;
}

export function AvatarGroup({
    members,
    size = 32,
    limit,
    children,
    className,
    ...props
}: AvatarGroupProps) {
    /* Declarative mode — members prop */
    if (members && members.length > 0) {
        const N = limit ?? members.length;
        const overflow = members.length - N; // 0 when no limit or limit >= members
        const hasNote = overflow > 0;
        // When note present: show first (N-1) normally, then note at position N-1
        // When no note: show all N normally
        const normalCount = hasNote ? N - 1 : N;
        const normal = members.slice(0, normalCount);
        const noteAvatar = hasNote ? members[normalCount] : null;
        // noteCount = total members not shown normally (includes the one in the note)
        const noteCount = members.length - normalCount;

        return (
            <div className={cn(styles.group, className)} {...props}>
                {normal.map((m, i) => (
                    <span key={m.username || i} className={styles.groupAvatar}>
                        <Avatar
                            src={m.src || (m.username ? `https://vercel.com/api/www/avatar?s=${size * 2}&u=${m.username}` : undefined)}
                            name={m.username}
                            alt={m.alt || (m.username ? `Avatar for ${m.username}` : undefined)}
                            size={size}
                        />
                    </span>
                ))}
                {noteAvatar && (
                    <span
                        aria-label={`${noteCount} more avatars in this group`}
                        title={`${noteCount} more avatars in this group`}
                        className={cn(styles.note, styles.groupAvatar)}
                    >
                        <Avatar
                            src={noteAvatar.src || (noteAvatar.username ? `https://vercel.com/api/www/avatar?s=${size * 2}&u=${noteAvatar.username}` : undefined)}
                            name={noteAvatar.username}
                            alt={noteAvatar.alt || (noteAvatar.username ? `Avatar for ${noteAvatar.username}` : undefined)}
                            size={size}
                        />
                        <span
                            className={cn(styles.noteText, 'dark-theme')}
                            data-version="v1"
                            style={{
                                '--text-color': 'var(--ds-gray-1000)',
                                '--text-size': '0.625rem',
                                '--text-line-height': '0.75rem',
                                '--text-letter-spacing': 'initial',
                                '--text-weight': '600',
                            } as React.CSSProperties}
                        >+{noteCount}</span>
                    </span>
                )}
            </div>
        );
    }

    /* Children mode — wrap each child in groupAvatar span */
    const childArray = Children.toArray(children);
    return (
        <div className={cn(styles.group, className)} {...props}>
            {childArray.map((child, i) => (
                <span key={i} className={styles.groupAvatar}>
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
    // src="https://vercel.com/api/www/avatar?s=64" (default avatar, blue pattern)
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
                    data-background={String(iconBackground)}
                    data-git-type={gitType}
                    style={{ left: -3, bottom: -5 }}
                >
                    {icon}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Git SVG Icons (private — exact from production inspect element)    */
/* ------------------------------------------------------------------ */

function GitHubSvgIcon() {
    return (
        <svg className="text-[#000000]" data-testid="oxobz-icon" height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ width: 14, height: 14, color: 'currentcolor' }}>
            <g clipPath="url(#clip0_872_3147)">
                <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.57879 0 7.99729C0 11.5361 2.29 14.5251 5.47 15.5847C5.87 15.6547 6.02 15.4148 6.02 15.2049C6.02 15.0149 6.01 14.3851 6.01 13.7154C4 14.0852 3.48 13.2255 3.32 12.7757C3.23 12.5458 2.84 11.836 2.5 11.6461C2.22 11.4961 1.82 11.1262 2.49 11.1162C3.12 11.1062 3.57 11.696 3.72 11.936C4.44 13.1455 5.59 12.8057 6.05 12.5957C6.12 12.0759 6.33 11.726 6.56 11.5261C4.78 11.3262 2.92 10.6364 2.92 7.57743C2.92 6.70773 3.23 5.98797 3.74 5.42816C3.66 5.22823 3.38 4.40851 3.82 3.30888C3.82 3.30888 4.49 3.09895 6.02 4.1286C6.66 3.94866 7.34 3.85869 8.02 3.85869C8.7 3.85869 9.38 3.94866 10.02 4.1286C11.55 3.08895 12.22 3.30888 12.22 3.30888C12.66 4.40851 12.38 5.22823 12.3 5.42816C12.81 5.98797 13.12 6.69773 13.12 7.57743C13.12 10.6464 11.25 11.3262 9.47 11.5261C9.76 11.776 10.01 12.2558 10.01 13.0056C10.01 14.0752 10 14.9349 10 15.2049C10 15.4148 10.15 15.6647 10.55 15.5847C12.1381 15.0488 13.5182 14.0284 14.4958 12.6673C15.4735 11.3062 15.9996 9.67293 16 7.99729C16 3.57879 12.42 0 8 0Z" fill="currentColor" />
            </g>
            <defs>
                <clipPath id="clip0_872_3147">
                    <rect width="16" height="16" fill="white" />
                </clipPath>
            </defs>
        </svg>
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
 */
export function GitHubAvatar({ username, size = 32, ...props }: GitAvatarProps) {
    return (
        <AvatarWithIcon
            src={`https://avatars.githubusercontent.com/${username}?s=${size * 2}`}
            size={size}
            icon={<GitHubSvgIcon />}
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
