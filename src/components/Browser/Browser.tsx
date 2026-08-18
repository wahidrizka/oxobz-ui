'use client';

import { forwardRef, useCallback, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import styles from './Browser.module.css';
import { ArrowLeft, ArrowRight, RefreshClockwise, Copy, Check } from '@oxobz/icons';

// ---- Types ----

export interface BrowserProps extends React.HTMLAttributes<HTMLDivElement> {
    /** URL displayed in the address bar */
    address?: string;
    /** Content rendered inside the browser frame */
    children?: ReactNode;
}

// ---- Helpers ----

/**
 * Strip the scheme and a leading `www.` for display, matching Geist's address
 * bar (input `https://www.vercel.com` renders as `vercel.com`). The full value
 * is preserved for copying.
 */
function normalizeAddress(url: string): string {
    return url.replace(/^[a-z]+:\/\//i, '').replace(/^www\./i, '');
}

// ---- Component ----

/**
 * Browser — a realistic browser-style frame for showcasing content.
 * Production equivalent of Geist's Browser component.
 */
export const Browser = forwardRef<HTMLDivElement, BrowserProps>(
    ({ address, children, className, ...props }, ref) => {
        const [copied, setCopied] = useState(false);
        const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        const handleCopy = useCallback(() => {
            if (!address) return;
            navigator.clipboard.writeText(address).then(() => {
                setCopied(true);
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => setCopied(false), 2000);
            });
        }, [address]);
        return (
            <div ref={ref} className={cn(styles.containerQuery, className)} {...props}>
                <div className={styles.browser} data-oxobz-browser="">
                    {/* Header bar */}
                    <div className={styles.header} data-oxobz-browser-header-root="true">
                        {/* Left: traffic lights + nav */}
                        <div className={styles.headerLeft}>
                            <div className={styles.trafficLights}>
                                <div className={styles.dotRed} />
                                <div className={styles.dotYellow} />
                                <div className={styles.dotGreen} />
                            </div>
                            <div className={styles.navIcons}>
                                <ArrowLeft size={14} color="gray-900" />
                                <ArrowRight size={14} color="gray-900" />
                                {/*
                                  * `data-glyph="circular"` ada di ikon ini pada DOM produksi
                                  * (diukur di halaman live 10 Agu 2026). Atribut itu penanda
                                  * bentuk yang dipakai dua aturan CSS Geist untuk merapikan
                                  * jarak ikon DI DALAM Badge; di kepala Browser tidak ada
                                  * aturan yang cocok, jadi tidak ada efek visual. Ditulis di
                                  * sini supaya DOM sama persis.
                                  *
                                  * Tempat yang benar sebenarnya di @oxobz/icons, karena di
                                  * produksi penanda ini melekat pada ikonnya, bukan pada
                                  * pemakainya. Pemetaan lengkapnya ada di paket privat Vercel
                                  * dan baru satu yang bisa kita ukur, jadi keputusannya
                                  * dicatat di tasks/todo.md.
                                  */}
                                <RefreshClockwise size={14} color="gray-900" data-glyph="circular" />
                            </div>
                        </div>

                        {/* Center: address bar */}
                        <div className={styles.headerCenter}>
                            {address && (
                                <div className={styles.addressBar}>
                                    <div className={styles.addressText}>{normalizeAddress(address)}</div>
                                    {/*
                                     * Tombol Copy produksi adalah komponen Button
                                     * varian tertiary, bukan <button> polos:
                                     * DOM-nya membawa data-geist-button, penanda
                                     * react-aria, dan kelas geist-new-tertiary.
                                     * Ukuran 24x24 dengan radius 4px adalah
                                     * penimpaan di atasnya, bukan ukuran bawaan.
                                     */}
                                    <Button
                                        variant="tertiary"
                                        svgOnly
                                        aria-label="Copy"
                                        onClick={handleCopy}
                                        className={styles.copyButton}
                                    >
                                        <div className={styles.copyButtonIcon}>
                                            <div className={copied ? styles.copyIconStateVisible : styles.copyIconStateHidden}>
                                                <Check size={12} />
                                            </div>
                                            <div className={copied ? styles.copyIconStateHidden : styles.copyIconStateVisible}>
                                                <Copy size={12} />
                                            </div>
                                        </div>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Right: empty placeholder */}
                        <div className={styles.headerRight} />
                    </div>

                    {/* Content slot */}
                    {children}
                </div>
            </div>
        );
    },
);

Browser.displayName = 'Browser';
