import {
    cloneElement,
    forwardRef,
    isValidElement,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Badge.module.css';

export type BadgeVariant =
    | 'gray' | 'blue' | 'red' | 'amber' | 'green' | 'teal' | 'purple' | 'pink'
    | 'inverted' | 'turbo' | 'trial' | 'pill';
export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeContrast = 'low';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    /** Tone the color variant down for dense surfaces (renders the "-subtle" style) */
    contrast?: BadgeContrast;
    icon?: ReactNode;
    /** Render as a link (pill variant) */
    href?: string;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
    ({ variant = 'gray', size = 'md', contrast, icon, href, className, children, ...props }, ref) => {

        /*
         * Akar badge adalah <div>, bukan <span>.
         *
         * Terukur di halaman Badge live 30 Agu 2026: ke-73 badge produksi
         * memakai <div>. Varian bertautan tetap <a>.
         */
        const Tag = (href ? 'a' : 'div') as 'div';

        // contrast="low" derives the subtle class from the variant (e.g. blue -> blue-subtle)
        // and adds the shared `subtle` class that paints the ::before overlay.
        /*
         * Ikon di dalam badge memakai data-slot="icon", bukan penanda ikon
         * biasa. Terukur di halaman Badge live 30 Agu 2026: svg ikon badge
         * produksi membawa data-slot="icon", dan aturan gaya badge-nya pun
         * menunjuk `data-[slot=icon]`. Di luar badge, ikon tetap memakai
         * penanda bawaannya.
         */
        /*
         * Ikon badge produksi membawa `class="relative"` di svg-nya (terukur
         * 31 Agu 2026, 51 svg di halaman Badge). Kelas itu ditambahkan saat
         * clone, digabung dengan className yang mungkin sudah dibawa ikon.
         * Posisi relative juga tetap diset lewat CSS module `.badge svg` supaya
         * konsumen standalone (tanpa Tailwind) tetap benar.
         */
        const ikonBadge = isValidElement(icon)
            ? cloneElement(
                  icon as ReactElement<{ 'data-slot'?: string; className?: string }>,
                  {
                      'data-slot': 'icon',
                      className: cn(
                          'relative',
                          (icon as ReactElement<{ className?: string }>).props.className,
                      ),
                  },
              )
            : icon;

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
                /*
                 * TANPA penanda komponen. Badge produksi TIDAK membawa
                 * data-slot/data-version/penanda apa pun (murni kelas Tailwind,
                 * terukur 31 Agu 2026 di 79 badge). CLAUDE.md sempat mencatat
                 * "Badge satu-satunya v2 mengikuti versi produksi", tapi
                 * ternyata produksi tak punya data-version sama sekali; jadi
                 * "mengikuti versi produksi" = tanpa penanda. Ini perubahan
                 * yang mematahkan API (penunjuk `[data-oxobz-badge]` berhenti
                 * bekerja), masuk rilis 0.8.0.
                 */
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
                {ikonBadge}
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
