import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Badge.module.css';

export type BadgeVariant =
    | 'gray' | 'blue' | 'red' | 'amber' | 'green' | 'teal' | 'purple' | 'pink'
    | 'gray-subtle' | 'blue-subtle' | 'red-subtle' | 'amber-subtle'
    | 'green-subtle' | 'teal-subtle' | 'purple-subtle' | 'pink-subtle'
    | 'inverted' | 'turbo' | 'trial' | 'pill';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    icon?: ReactNode;
    /** Render as a link (pill variant) */
    href?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = 'gray', size = 'md', icon, href, className, children, ...props }, ref) => {

        // Pill variant renders as <a>, otherwise <span>
        const Tag = (href ? 'a' : 'span') as 'span';

        return (
            <Tag
                ref={ref}
                className={cn(
                    styles.badge,
                    styles[variant],
                    styles[size],
                    className,
                )}
                data-oxobz-badge=""
                data-version="v2"
                {...(href ? { href } : {})}
                {...props}
            >
                <span className={styles.contentContainer}>
                    {icon && <span className={styles.iconContainer}>{icon}</span>}
                    {children}
                </span>
            </Tag>
        );
    },
);

Badge.displayName = 'Badge';
