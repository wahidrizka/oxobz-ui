'use client';

import {
    createContext,
    forwardRef,
    useContext,
    useId,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import { Label } from '../Label';
import styles from './ChoiceboxGroup.module.css';
import radioStyles from '../Radio/Radio.module.css';
import checkboxStyles from '../Checkbox/Checkbox.module.css';

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ChoiceboxGroupContextValue {
    name: string;
    type: 'radio' | 'checkbox';
    disabled?: boolean;
    /** For radio: single string value. For checkbox: array of string values. */
    value?: string | string[];
    onChange?: (value: string | string[]) => void;
}

const ChoiceboxGroupContext = createContext<ChoiceboxGroupContextValue | null>(
    null,
);

/* ------------------------------------------------------------------ */
/*  ChoiceboxGroup.Item Props                                          */
/* ------------------------------------------------------------------ */

export interface ChoiceboxGroupItemProps
    extends Omit<HTMLAttributes<HTMLLabelElement>, 'title'> {
    /** Title text */
    title: string;

    /** Description text */
    description?: string;

    /** The value for this choice */
    value: string;

    /** Disables this specific item (overrides group disabled) */
    disabled?: boolean;

    /** Custom content rendered below the option row when checked */
    children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  SVG Icons (from Checkbox)                                          */
/* ------------------------------------------------------------------ */

/** Internal SVG used inside the checkbox icon — checkmark + dash */
function CheckboxSvg() {
    return (
        <svg fill="none" height="16" viewBox="0 0 20 20" width="16">
            <path
                d="M14 7L8.5 12.5L6 10"
                stroke="var(--oxobz-background)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
            />
            <line
                stroke="var(--checkbox-color)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="5"
                x2="15"
                y1="10"
                y2="10"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  ChoiceboxGroup.Item                                                */
/* ------------------------------------------------------------------ */

/**
 * A single choicebox item inside a ChoiceboxGroup.
 *
 * Production DOM (radio mode):
 * ```html
 * <label class="stack choicebox checked" data-version="v1" aria-selected="true"
 *        style="--stack-flex:1; --stack-direction:column; ...">
 *   <div class="stack option" data-version="v1"
 *        style="--stack-direction:row; --stack-align:center; ...">
 *     <span class="stack" ...>
 *       <span class="title">Pro Trial</span>
 *       <span class="description">Free for two weeks</span>
 *     </span>
 *     <span class="radio-check radio">
 *       <input class="radio-input geist-sr-only input" type="radio" />
 *       <span class="radio-icon icon" aria-hidden="true" />
 *     </span>
 *   </div>
 *   <span class="content"></span>
 * </label>
 * ```
 */
const ChoiceboxGroupItem = forwardRef<HTMLLabelElement, ChoiceboxGroupItemProps>(
    ({ title, description, value, disabled: itemDisabled, children, className, ...rest }, ref) => {
        const ctx = useContext(ChoiceboxGroupContext);
        // Links the checkbox <input id> to its wrapping <label for> — matches
        // production DOM (`for="checkbox-…"` / `id="checkbox-…"`). Radio mode
        // nests the input directly and needs no id/for pairing. Called
        // unconditionally (before the guard) to satisfy the rules of hooks.
        const checkboxId = `checkbox-${useId()}`;
        /*
         * Produksi menautkan input ke judul pilihannya lewat
         * aria-labelledby="choicebox-title-<id>". Tanpa itu pembaca layar hanya
         * mendengar nilai mentahnya.
         */
        const titleId = `choicebox-title-${useId()}`;
        if (!ctx) {
            throw new Error('ChoiceboxGroup.Item must be used within a ChoiceboxGroup');
        }

        const { type, name, disabled: groupDisabled, value: groupValue, onChange } = ctx;
        const isDisabled = itemDisabled ?? groupDisabled ?? false;

        // Determine checked state
        let isChecked = false;
        if (type === 'radio') {
            isChecked = groupValue === value;
        } else {
            isChecked = Array.isArray(groupValue) && groupValue.includes(value);
        }

        const handleChange = () => {
            if (isDisabled || !onChange) return;

            if (type === 'radio') {
                onChange(value);
            } else {
                // checkbox toggle
                const currentValues = Array.isArray(groupValue) ? groupValue : [];
                if (currentValues.includes(value)) {
                    onChange(currentValues.filter((v) => v !== value));
                } else {
                    onChange([...currentValues, value]);
                }
            }
        };

        // geistcn generation: plain flex classes on the label/option/title
        // wrapper (choicebox-jul2026.html) — the old Stack-variable chrome is
        // gone from production.
        /*
         * Tiap pilihan dibungkus <li>, bukan <label> langsung di dalam <ul>.
         *
         * Terukur di halaman live: <ul> > <li> > <label> > <div>. Yang membawa
         * garis tepi, sudut membulat, dan pemotongan isi adalah <li>-nya
         * (400x70), sedangkan <label> di dalamnya polos (398x68) dan hanya
         * mengurus tata letak kolom. Semua aturan keadaan (.checked,
         * .disabled, .hasContent) menempel pada .choicebox, dan karena label
         * beserta isinya tetap keturunan <li>, aturan itu tetap berlaku.
         */
        return (
            <li
                className={cn(
                    styles.choicebox,
                    isChecked && styles.checked,
                    isDisabled && styles.disabled,
                    children != null && styles.hasContent,
                    className,
                )}
            >
            <label {...rest} ref={ref} className={styles.label}>
                {/* Option row */}
                <div className={styles.option} data-slot="choicebox-group-item-option">
                    {/* Title + Description */}
                    <span
                        className={styles.titleWrapper}
                        data-slot="choicebox-group-item-title-description"
                    >
                        <span className={styles.title} id={titleId}>
                            {title}
                        </span>
                        {description && (
                            <span className={styles.description}>{description}</span>
                        )}
                    </span>

                    {/* Radio / Checkbox indicator */}
                    {type === 'radio' ? (
                        <span
                            className={cn(
                                radioStyles.check,
                                isDisabled && radioStyles.disabled,
                                styles.radio,
                            )}
                        >
                            <input
                                className={cn(
                                    radioStyles.input,
                                    'oxobz-sr-only',
                                    styles.input,
                                )}
                                type="radio"
                                aria-labelledby={titleId}
                                value={value}
                                checked={isChecked}
                                disabled={isDisabled}
                                name={name}
                                onChange={handleChange}
                            />
                            <span
                                aria-hidden="true"
                                className={cn(radioStyles.icon, styles.icon)}
                            />
                        </span>
                    ) : (
                        <label
                            className={cn(
                                checkboxStyles.container,
                                styles.checkbox,
                                isDisabled && checkboxStyles.disabled,
                            )}
                            data-version="v1"
                            htmlFor={checkboxId}
                        >
                            <span className={checkboxStyles.check}>
                                <input
                                    className={cn(
                                        'oxobz-sr-only',
                                        checkboxStyles.input,
                                    )}
                                    id={checkboxId}
                                    type="checkbox"
                                    aria-labelledby={titleId}
                                    value={value}
                                    checked={isChecked}
                                    disabled={isDisabled}
                                    name={name}
                                    onChange={handleChange}
                                />
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        checkboxStyles.icon,
                                        isDisabled && checkboxStyles.disabled,
                                        styles.icon,
                                    )}
                                >
                                    <CheckboxSvg />
                                </span>
                            </span>
                        </label>
                    )}
                </div>

                {/*
                 * Isi khusus hanya dirender saat pilihan ini TERPILIH.
                 *
                 * Terukur di seksi "Custom content" halaman live: pada pilihan
                 * yang terpilih, anak terakhir <label> adalah <span> setinggi
                 * 40px berisi badge; pada yang tidak terpilih, anak terakhirnya
                 * adalah baris pilihan itu sendiri, jadi span isinya memang
                 * tidak ada di DOM. Dokumennya pun menyebut "Custom content is
                 * displayed when selecting the option."
                 */}
                {isChecked && children != null ? (
                    <span className={styles.content}>{children}</span>
                ) : null}
            </label>
            </li>
        );
    },
);

ChoiceboxGroupItem.displayName = 'ChoiceboxGroup.Item';

/* ------------------------------------------------------------------ */
/*  ChoiceboxGroup Props                                               */
/* ------------------------------------------------------------------ */

export interface ChoiceboxGroupProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /** Accessible label for the group (rendered as aria-label or visible Label) */
    label?: string;

    /** Show a visible label above the group (uses Label component) */
    showLabel?: boolean;

    /** 'radio' for single-select, 'checkbox' for multi-select */
    type?: 'radio' | 'checkbox';

    /** Layout direction of items (drives the list's `--stack-direction`) */
    direction?: 'row' | 'column';

    /**
     * Extra className applied to the inner list (`<ul>`) element.
     * Mirrors the official Geist `listClassName` prop.
     */
    listClassName?: string;

    /** Currently selected value(s) — string for radio, string[] for checkbox */
    value?: string | string[];

    /** Callback when selection changes */
    onChange?: (value: string | string[]) => void;

    /** Disables all items */
    disabled?: boolean;

    /** Required attribute */
    required?: boolean;

    /** Children — should contain ChoiceboxGroup.Item */
    children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  ChoiceboxGroup                                                     */
/* ------------------------------------------------------------------ */

/**
 * Compound component providing choicebox group context.
 *
 * Production DOM:
 * ```html
 * <div aria-label="select a plan" aria-multiselectable="false"
 *      aria-required="false"
 *      class="choicebox-group"
 *      role="radiogroup">
 *   <label ...>Label</label>   <!-- optional, when showLabel -->
 *   <ul class="stack" data-version="v1" style="--stack-direction:row; ...">
 *     <!-- ChoiceboxGroup.Item children -->
 *   </ul>
 * </div>
 * ```
 */
function ChoiceboxGroupRoot({
    children,
    className,
    direction = 'row',
    disabled,
    label,
    listClassName,
    onChange,
    required = false,
    showLabel = false,
    type = 'radio',
    value,
    ...rest
}: ChoiceboxGroupProps) {
    const autoId = useId();
    const name = `choicebox-name-${autoId}`;
    const labelId = label && showLabel ? `choicebox-${autoId}` : undefined;
    const isMulti = type === 'checkbox';

    return (
        <ChoiceboxGroupContext.Provider
            value={{ name, type, disabled, value, onChange }}
        >
            <div
                {...rest}
                aria-label={!showLabel ? label : undefined}
                aria-labelledby={showLabel ? labelId : undefined}
                aria-multiselectable={isMulti}
                aria-required={required}
                className={cn(styles['choicebox-group'], className)}
                role={isMulti ? 'group' : 'radiogroup'}
            >
                {showLabel && label && (
                    /*
                     * a11y fix: the group's aria-labelledby must reference a real
                     * element, so the label carries id={labelId}. Production Geist
                     * renders only for={labelId} (dangling reference) — we keep the
                     * for= attribute for fidelity and add the id to make the
                     * accessible name resolve.
                     */
                    /* Tanpa kapitalisasi: label grup di halaman live tampil apa
                       adanya ("Choicebox group disabled"), bukan Title Case. */
                    <Label id={labelId} htmlFor={labelId} data-version="v1" bypassCasing>
                        {label}
                    </Label>
                )}
                {/* geistcn generation: plain flex list (gap-3), no Stack vars */}
                {/* Produksi tidak menaruh atribut apa pun di <ul>, <li>, maupun
                    <label> pilihan; hanya akar grup yang membawa peran dan
                    label ARIA-nya. */}
                <ul
                    className={cn(direction === 'column' && styles.vertical, listClassName)}
                >
                    {children}
                </ul>
            </div>
        </ChoiceboxGroupContext.Provider>
    );
}

ChoiceboxGroupRoot.displayName = 'ChoiceboxGroup';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const ChoiceboxGroup = Object.assign(ChoiceboxGroupRoot, {
    Item: ChoiceboxGroupItem,
});

// `ChoiceboxGroupItem` is exported standalone so it can be imported the way the
// official docs show (`import { ChoiceboxGroup, ChoiceboxGroupItem }`), while the
// compound `ChoiceboxGroup.Item` remains available for the snapshot's usage.
export { ChoiceboxGroup, ChoiceboxGroupItem };
