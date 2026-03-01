// @oxobz/ui — Entry Point
// Only components verified 100% consistent with Geist production are exported.

// Theme
export { ThemeProvider, useTheme } from './ThemeProvider';
export type { ThemeProviderProps, Theme } from './ThemeProvider';

// Utils
export { cn } from './utils/cn';
export type { Size, ColorVariant, BaseComponentProps } from './utils/types';

// Components — Verified ✅
export { Badge } from './components/Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './components/Badge';

export { Avatar, AvatarGroup, AvatarWithIcon, GitHubAvatar, GitLabAvatar, BitbucketAvatar } from './components/Avatar';
export type { AvatarProps, AvatarGroupProps, AvatarWithIconProps, GitAvatarProps } from './components/Avatar';

export { Stack } from './components/Stack';
export type { StackProps } from './components/Stack';

export { Text } from './components/Text';
export type { TextProps } from './components/Text';

export { Book } from './components/Book';
export type { BookProps } from './components/Book';

export { Button, ButtonLink } from './components/Button';
export type { ButtonProps, ButtonLinkProps, ButtonVariant, ButtonSize, ButtonShape } from './components/Button';

export { Spinner } from './components/Spinner';
export type { SpinnerProps } from './components/Spinner';

// Tokens CSS export — users import via:
// import '@oxobz/ui/styles'
