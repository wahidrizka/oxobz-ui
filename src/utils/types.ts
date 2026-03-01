/**
 * Shared type definitions for @oxobz/ui
 */

/** ClassValue for cn() utility */
export type ClassValue = string | number | undefined | null | false | 0n;

/** Common size variants matching Geist */
export type Size = 'small' | 'medium' | 'large';

/** Common color variants */
export type ColorVariant = 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning';

/** Component base props — extend React.HTMLAttributes */
export interface BaseComponentProps {
    className?: string;
}
