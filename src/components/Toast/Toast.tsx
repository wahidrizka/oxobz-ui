'use client';

import { Component, createRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Portal } from '@radix-ui/react-portal';
import { Cross, RotateCounterClockwise } from '@oxobz/icons';
import { Button, ButtonLink } from '../Button';
import { cn } from '../../utils/cn';
import styles from './Toast.module.css';

/*
 * Port of production's own toasts, read from the live bundle of
 * vercel.com/geist on 10 Nov 2026 (turbopack module 615745). Three pieces,
 * as there:
 *
 *   toasts     a global object whose methods can be called from anywhere,
 *              even before anything is mounted (calls wait for the area)
 *   <Toasts>   the area. Mounted once; it owns the list and renders it
 *              through Radix Portal into <body>, only while there is a toast
 *   useToasts  returns that same global object
 *
 * Every timing below is production's: a toast becomes visible 10ms after it
 * mounts, leaves by itself after 3500ms (unless it has an action or
 * `preserve`), pauses while the area is hovered, and takes 160ms to go.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ToastType = 'success' | 'warning' | 'error';

/** A visual header with a fixed height. */
export interface ToastVisual {
    height: number;
    component: ReactNode;
}

export interface ToastOptions {
    /** Identity of the toast. A second message with the same key is ignored. */
    key?: string;

    /** Message body. */
    text?: ReactNode;

    /** Color. Set by the `success`, `warning` and `error` helpers. */
    type?: ToastType;

    /** Label of the primary action. Its presence adds the action row and keeps the toast open. */
    action?: ReactNode;

    onAction?: () => void;

    /** Turns the primary action into a link. */
    actionHref?: string;

    /** Label of the secondary action (default "Dismiss"). */
    cancelAction?: ReactNode;

    onCancelAction?: () => void;

    /** Adds an Undo button next to the dismiss button. */
    onUndoAction?: () => void;

    /** Keep the toast until dismissed. `false` lets a toast with an action leave by itself. */
    preserve?: boolean;

    /** Milliseconds before the toast leaves by itself (default 3500). */
    timeout?: number;

    /** Move focus to the action when the toast appears. */
    autoFocus?: boolean;

    /** Header above the message, bleeding to the card edges. */
    visual?: ReactNode | ToastVisual;

    /** Removes the card padding. */
    fullBleed?: boolean;

    /** Clips the content to the rounded card. */
    overflowHidden?: boolean;

    /** Hides the dismiss button. */
    hideX?: boolean;

    /** Lets the message take the full width. */
    fullWidth?: boolean;

    /** Class for the card. */
    containerClassName?: string;

    /** Called when the toast is removed; `true` when the user pressed the dismiss button. */
    onRemove?: (dismissedByUser: boolean) => void;
}

type ToastInput = string | ToastOptions;

interface ToastMessage extends ToastOptions {
    key: string;
    height?: number;
    shouldHide?: boolean;
}

export interface ToastsApi {
    clear: () => void;
    error: (input?: ToastInput) => void;
    message: (input: ToastInput) => void;
    removeToast: (index: number) => void;
    removeToastByKey: (key: string | string[]) => void;
    setMessage: (input: ToastInput) => void;
    setHiding: () => void;
    success: (input?: ToastInput) => void;
    warning: (input?: ToastInput) => void;
}

/* ------------------------------------------------------------------ */
/*  One toast                                                          */
/* ------------------------------------------------------------------ */

interface ToastProps extends ToastOptions {
    testId: string;
    heights: Array<number | undefined>;
    hovering: boolean;
    position: number;
    shouldHide?: boolean;
    onMount: (height: number) => void;
    remove: (dismissedByUser: boolean) => void;
}

interface ToastState {
    visible: boolean;
    hiding: boolean;
    hovering: boolean;
}

const isVisualWithHeight = (visual: ReactNode | ToastVisual): visual is ToastVisual =>
    visual !== null && typeof visual === 'object' && 'height' in visual;

/*
 * Production builds data-testid by kebab-casing each part with lodash. This
 * covers the same cases for keys made of letters and digits; the default key
 * is a timestamp, which stays as it is.
 */
function testIdPart(value: string): string {
    return (
        value
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .match(/[A-Za-z0-9]+/g)
            ?.join('-')
            .toLowerCase() ?? ''
    );
}

class Toast extends Component<ToastProps, ToastState> {
    ref = createRef<HTMLDivElement>();

    actionElement: HTMLElement | null = null;

    hider: ReturnType<typeof setTimeout> | undefined;

    requestAnimationId = 0;

    static getDerivedStateFromProps(props: ToastProps): Partial<ToastState> {
        return props.hovering ? { hovering: true } : { hovering: false };
    }

    state: ToastState = { visible: false, hiding: false, hovering: false };

    setActionElement = (element: HTMLElement | null) => {
        this.actionElement = element;
    };

    componentDidMount() {
        const element = this.ref.current;
        this.requestAnimationId = requestAnimationFrame(() => {
            if (!element) return;
            const { height } = element.getBoundingClientRect();
            this.props.onMount(height);
        });
        setTimeout(() => {
            this.setState({ visible: true });
            if (this.props.cancelAction || this.props.action) {
                if (this.actionElement && this.props.autoFocus) this.actionElement.focus();
            }
        }, 10);
        const stays = (this.props.action || this.props.preserve) && this.props.preserve !== false;
        if (!stays) {
            this.hider = setTimeout(this.hide, this.props.timeout ?? 3500);
        }
    }

    componentWillUnmount() {
        clearTimeout(this.hider);
        cancelAnimationFrame(this.requestAnimationId);
    }

    componentDidUpdate(_prevProps: ToastProps, prevState: ToastState) {
        if (this.props.shouldHide) {
            this.hider = setTimeout(this.hide, 300);
            return;
        }
        if (this.props.preserve || (this.props.action && this.props.preserve !== false)) return;
        if (this.state.hovering) {
            clearTimeout(this.hider);
        } else if (prevState.hovering && !this.state.hovering) {
            this.hider = setTimeout(this.hide, this.props.timeout ?? 3500);
        }
    }

    hide = (dismissedByUser: boolean | void = false) => {
        this.setState({ hiding: true }, () => {
            setTimeout(() => {
                this.props.remove(dismissedByUser === true);
            }, 160);
        });
    };

    /* A toast behind the newest one is shrunk and tucked under it. */
    calculateHeight = (): CSSProperties | undefined => {
        const { heights, position } = this.props;
        if (position === 0) return undefined;
        return {
            maxHeight: 50,
            transform: `translate3d(0, calc(-${heights[0]}px + 100% + ${-20 * position}px), -${position}px) scale(${1 - (position / 100) * 5})`,
        };
    };

    render() {
        const {
            testId,
            text,
            action,
            onAction,
            cancelAction,
            onCancelAction,
            overflowHidden,
            containerClassName,
            type,
            fullBleed,
            position,
            heights,
            onUndoAction,
            visual,
            hideX,
            fullWidth,
            actionHref,
        } = this.props;
        const { hiding, visible } = this.state;

        /* Where this toast sits once the stack is fanned out on hover. */
        const offset =
            position === 0
                ? 0
                : heights
                      .slice(0, position)
                      .filter(Boolean)
                      .reduce<number>((sum, height) => (sum && height ? sum + height : sum), 20 * position);

        const hasActions = Boolean(cancelAction || action);
        const style: (CSSProperties & Record<`--${string}`, string>) | undefined = visible
            ? {
                  maxHeight: heights[position],
                  ...this.calculateHeight(),
                  '--y': `${-1 * (offset || 0)}px`,
                  '--z': `-${position}px`,
                  '--max-height': `${heights[position]}px`,
              }
            : undefined;

        return (
            <div
                aria-atomic
                aria-labelledby={hasActions ? 'toast-message' : ''}
                className={cn(
                    styles.toastContainer,
                    containerClassName,
                    visible && styles.visible,
                    hiding && styles.hiding,
                    type && styles[type],
                    fullBleed && styles.fullBleed,
                    (overflowHidden || visual) && styles.overflowHidden,
                )}
                data-oxobz-toast=""
                data-testid={[type ? `oxobz-toast-${type}` : 'oxobz-toast', testIdPart(testId)]
                    .filter(Boolean)
                    .join('/')}
                data-version="v1"
                ref={this.ref}
                role={hasActions ? 'alertdialog' : 'status'}
                style={style}
            >
                <div className={styles.toast}>
                    {visual ? (
                        <div
                            className={styles.visual}
                            style={{ height: isVisualWithHeight(visual) ? visual.height : undefined }}
                        >
                            {isVisualWithHeight(visual) ? visual.component : visual}
                        </div>
                    ) : null}
                    <div
                        className={cn(styles.message, (hideX || fullWidth) && styles.fullWidth)}
                        id="toast-message"
                    >
                        {(type === 'success' || type === 'error') && (
                            <span className="oxobz-sr-only">{type}: </span>
                        )}
                        <span>{text}</span>
                        {action !== undefined || hideX ? null : (
                            <div className={cn(styles.controls, type && styles[`controls-${type}`])}>
                                {onUndoAction !== undefined && (
                                    <Button
                                        aria-label="Undo"
                                        className={styles.undo}
                                        onClick={() => {
                                            onUndoAction();
                                            this.hide();
                                        }}
                                        shape="square"
                                        size="small"
                                        svgOnly
                                        typeName="button"
                                        variant="tertiary"
                                    >
                                        <RotateCounterClockwise />
                                    </Button>
                                )}
                                <Button
                                    aria-label="Dismiss toast"
                                    onClick={() => this.hide(true)}
                                    shape="square"
                                    size="small"
                                    svgOnly
                                    typeName="button"
                                    variant="tertiary"
                                >
                                    <Cross />
                                </Button>
                            </div>
                        )}
                    </div>
                    {action ? (
                        <div className={styles.actions}>
                            <Button
                                className={cn(styles.cancel, type && styles[`cancel-${type}`])}
                                onClick={() => {
                                    this.hide();
                                    onCancelAction?.();
                                }}
                                ref={this.setActionElement}
                                size="small"
                                variant="tertiary"
                            >
                                {cancelAction || 'Dismiss'}
                            </Button>
                            {actionHref ? (
                                <ButtonLink
                                    href={actionHref}
                                    onClick={() => {
                                        onAction?.();
                                        this.hide();
                                    }}
                                    ref={cancelAction ? null : this.setActionElement}
                                    size="small"
                                    variant="default"
                                >
                                    {action}
                                </ButtonLink>
                            ) : (
                                <Button
                                    onClick={() => {
                                        onAction?.();
                                        this.hide();
                                    }}
                                    ref={cancelAction ? null : this.setActionElement}
                                    size="small"
                                    variant="default"
                                >
                                    {action}
                                </Button>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }
}

/* ------------------------------------------------------------------ */
/*  The global object                                                  */
/* ------------------------------------------------------------------ */

let hasSingleton = false;
const mountedAreas: Toasts[] = [];
let resolveApi: (api: ToastsApi) => void = () => undefined;
let apiReady = new Promise<ToastsApi>((resolve) => {
    resolveApi = resolve;
});

/* Each method waits for an area to exist, then runs on it. */
const deferred =
    <K extends keyof ToastsApi>(name: K) =>
    (...args: Parameters<ToastsApi[K]>): void => {
        apiReady
            .then((api) => {
                (api[name] as (...a: Parameters<ToastsApi[K]>) => void)(...args);
            })
            .catch(() => undefined);
    };

const deferredApi = (): ToastsApi => ({
    clear: deferred('clear'),
    error: deferred('error'),
    message: deferred('message'),
    removeToast: deferred('removeToast'),
    removeToastByKey: deferred('removeToastByKey'),
    setMessage: deferred('setMessage'),
    setHiding: deferred('setHiding'),
    success: deferred('success'),
    warning: deferred('warning'),
});

export const toasts: ToastsApi & { readonly loaded: boolean; current: ToastsApi } = {
    ...deferredApi(),
    get loaded() {
        return hasSingleton;
    },
    current: deferredApi(),
};

export const useToasts = () => toasts;

/* ------------------------------------------------------------------ */
/*  The area                                                           */
/* ------------------------------------------------------------------ */

export interface ToastsProps {
    /** Anchor the stack to the horizontal center instead of the right edge. */
    center?: boolean;

    /** Element to render the area into, instead of <body>. */
    containerRef?: RefObject<HTMLElement | null>;
}

interface ToastsState {
    hovering: boolean;
    messages: ToastMessage[];
    offsetBottom: number;
}

const asOptions = (input: ToastInput): ToastOptions =>
    typeof input === 'string' ? { text: input } : input;

export class Toasts extends Component<ToastsProps, ToastsState> {
    viewportRafId: number | undefined;

    /* Not read on the server, where there is no window (production only
       ever renders this in the browser). Inside a frame it stays unset. */
    topWindow: Window | undefined =
        typeof window === 'undefined' || window.self !== window.top
            ? undefined
            : (window.top ?? window);

    state: ToastsState = { hovering: false, messages: [], offsetBottom: 0 };

    singleton = false;

    componentDidMount() {
        mountedAreas.push(this);
        if (this.topWindow?.visualViewport) {
            this.topWindow.visualViewport.addEventListener('resize', this.onViewportChange);
            this.onViewportChange();
        }
        if (!hasSingleton) {
            hasSingleton = true;
            this.singleton = true;
        }
        if (this.singleton) this.takeOverToastMethods();
    }

    takeOverToastMethods = () => {
        resolveApi({
            clear: this.clear,
            error: this.error,
            message: this.message,
            removeToast: this.removeToast,
            removeToastByKey: this.removeToastByKey,
            setMessage: this.setMessage,
            setHiding: this.setHiding,
            success: this.success,
            warning: this.warning,
        });
    };

    componentWillUnmount() {
        this.topWindow?.visualViewport?.removeEventListener('resize', this.onViewportChange);
        if (this.viewportRafId) cancelAnimationFrame(this.viewportRafId);
        const index = mountedAreas.indexOf(this);
        if (index > -1) mountedAreas.splice(index, 1);
        if (this.singleton) {
            hasSingleton = false;
            apiReady = new Promise<ToastsApi>((resolve) => {
                resolveApi = resolve;
            });
            this.singleton = false;
            if (mountedAreas.length > 0) {
                hasSingleton = true;
                mountedAreas[0].singleton = true;
                mountedAreas[0].takeOverToastMethods();
                mountedAreas[0].forceUpdate();
            }
        }
    }

    message = (input: ToastInput) => {
        const options = asOptions(input);
        const key = options.key || String(Date.now());
        this.setState((state) => {
            const { messages } = state;
            if (messages.findIndex((message) => message.key === key) !== -1) return null;
            return { messages: [...messages, { ...options, key }] };
        });
    };

    setMessage = (input: ToastInput) => {
        const options = asOptions(input);
        this.setState({ messages: [{ ...options, key: options.key || 'toast-0' }] });
    };

    setHiding = () => {
        this.setState({
            messages: this.state.messages.map((message) => ({ ...message, shouldHide: true })),
        });
    };

    error = (input?: ToastInput) => {
        this.message({ ...(input ? asOptions(input) : { text: 'An error occurred.' }), type: 'error' });
    };

    success = (input?: ToastInput) => {
        this.message({ ...(input ? asOptions(input) : { text: 'Success!' }), type: 'success' });
    };

    warning = (input?: ToastInput) => {
        this.message({ ...(input ? asOptions(input) : { text: 'Warning!' }), type: 'warning' });
    };

    onMouseEnter = () => {
        this.setState({ hovering: true });
    };

    onMouseLeave = () => {
        this.setState({ hovering: false });
    };

    /* Keeps the stack above an on-screen keyboard. */
    onViewportChange = () => {
        if (this.viewportRafId) cancelAnimationFrame(this.viewportRafId);
        this.viewportRafId = requestAnimationFrame(() => {
            const height = this.topWindow?.visualViewport?.height;
            if (this.topWindow && height) {
                const offsetBottom = this.topWindow.innerHeight - height;
                if (offsetBottom !== this.state.offsetBottom) this.setState({ offsetBottom });
            }
        });
    };

    removeToast = (index: number) => {
        this.setState((state) => {
            const { messages } = state;
            messages.splice(index, 1);
            return { messages };
        });
    };

    removeToastByKey = (key: string | string[]) => {
        const many = Array.isArray(key);
        this.setState((state) => ({
            messages: state.messages.filter((message) =>
                many ? !key.includes(message.key) : message.key !== key,
            ),
        }));
    };

    handleToastHeight = (height: number, index: number) => {
        if (!height) return;
        requestAnimationFrame(() => {
            const messages = [...this.state.messages];
            if (messages[index]) {
                messages[index].height = height;
                this.setState({ messages });
            }
        });
    };

    clear = () => {
        this.setState({ messages: [] });
    };

    render() {
        if (!this.singleton) return null;
        const { center } = this.props;
        const { messages, offsetBottom } = this.state;
        if (!messages.length) return null;
        const style: CSSProperties & Record<`--${string}`, string> = {
            '--offset-bottom': `${offsetBottom}px`,
        };
        return (
            <Portal container={this.props.containerRef?.current}>
                <div
                    className={cn(
                        styles.toastArea,
                        center && styles.center,
                        messages.length > 1 && styles.multiple,
                    )}
                    data-testid="toasts/list"
                    onMouseEnter={this.onMouseEnter}
                    onMouseLeave={this.onMouseLeave}
                    onTouchEnd={this.onMouseLeave}
                    onTouchStart={this.onMouseEnter}
                    style={style}
                >
                    {messages.map((message, index) => {
                        const { key, height: _height, onRemove, ...options } = message;
                        return (
                            <Toast
                                heights={messages.map((each) => each.height).reverse()}
                                hovering={this.state.hovering}
                                key={key}
                                onMount={(height) => this.handleToastHeight(height, index)}
                                position={messages.length - index - 1}
                                remove={(dismissedByUser) => {
                                    onRemove?.(dismissedByUser);
                                    this.removeToastByKey(key);
                                }}
                                testId={key}
                                {...options}
                            />
                        );
                    })}
                </div>
            </Portal>
        );
    }
}
