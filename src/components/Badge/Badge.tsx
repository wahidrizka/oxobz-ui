import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Badge.module.css';

export type BadgeVariant =
    | 'gray' | 'blue' | 'red' | 'amber' | 'green' | 'teal' | 'purple' | 'pink'
    | 'inverted' | 'turbo' | 'trial' | 'pill';
export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeContrast = 'low';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    /** Tone the color variant down for dense surfaces (renders the "-subtle" style) */
    contrast?: BadgeContrast;
    icon?: ReactNode;
    /** Render as a link (pill variant) */
    href?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = 'gray', size = 'md', contrast, icon, href, className, children, ...props }, ref) => {

        // Pill variant renders as <a>, otherwise <span>
        const Tag = (href ? 'a' : 'span') as 'span';

        // contrast="low" derives the subtle class from the variant (e.g. blue -> blue-subtle)
        const variantClass = contrast === 'low' ? `${variant}-subtle` : variant;

        return (
            <Tag
                ref={ref}
                className={cn(
                    styles.badge,
                    styles.capitalize,
                    styles[variantClass],
                    styles[size],
                    className,
                )}
                data-oxobz-badge=""
                data-version="v2"
                {...(href ? { href } : {})}
                {...props}
            >
                <span className={styles.contentContainer}>
                    {icon && (
                        <span className={styles.iconContainer} data-slot="icon">
                            {icon}
                        </span>
                    )}
                    {children}
                </span>
            </Tag>
        );
    },
);

Badge.displayName = 'Badge';
