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
        // and adds the shared `subtle` class that paints the ::before overlay.
        const subtle = contrast === 'low';
        const variantClass = subtle ? `${variant}-subtle` : variant;

        return (
            <Tag
                ref={ref}
                className={cn(
                    styles.badge,
                    styles.capitalize,
                    subtle && styles.subtle,
                    styles[variantClass],
                    styles[size],
                    className,
                )}
                data-oxobz-badge=""
                data-version="v2"
                {...(href ? { href } : {})}
                {...props}
            >
                {/* Icon and label are SIBLINGS, matching production: the gap
                    between them is the badge's own `gap`, not the label's. */}
                {/*
                 * Ikon dirender LANGSUNG sebagai anak badge, tanpa span
                 * pembungkus. Terukur di halaman live: svg ikon badge adalah
                 * anak langsung elemen badge dan ber-position relative,
                 * sementara punya kita dulu terbungkus span sehingga svg-nya
                 * static.
                 */}
                {icon}
                {/*
                 * Varian pill (yang dirender sebagai <a>) menaruh teksnya
                 * LANGSUNG, tanpa pembungkus. Terukur di seksi Pill halaman
                 * live: keenam badge di sana berupa <a> yang teksnya jadi anak
                 * langsung, sedangkan badge biasa tetap memakai pembungkus
                 * `min-w-0 relative inline-flex items-center`.
                 */}
                {href ? children : <span className={styles.contentContainer}>{children}</span>}
            </Tag>
        );
    },
);

Badge.displayName = 'Badge';
