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
export type { BadgeProps, BadgeVariant, BadgeSize, BadgeContrast } from './components/Badge';

export { Avatar, AvatarGroup, AvatarWithIcon, GitHubAvatar, GitLabAvatar, BitbucketAvatar } from './components/Avatar';
export type { AvatarProps, AvatarGroupProps, AvatarWithIconProps, GitAvatarProps } from './components/Avatar';

export { Stack } from './components/Stack';
export type { StackProps } from './components/Stack';

export { Text } from './components/Text';
export type { TextProps } from './components/Text';

export { Book } from './components/Book';
export type { BookProps, BookResponsiveWidth } from './components/Book';

export { Browser } from './components/Browser';
export type { BrowserProps } from './components/Browser';

export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

export { Radio, RadioGroup, RadioGroupItem, useRadio } from './components/Radio';
export type { RadioProps, RadioGroupProps, RadioGroupItemProps, UseRadioOptions, UseRadioReturn } from './components/Radio';

export { Label } from './components/Label';
export type { LabelProps } from './components/Label';

export { ChoiceboxGroup, ChoiceboxGroupItem } from './components/ChoiceboxGroup';
export type { ChoiceboxGroupProps, ChoiceboxGroupItemProps } from './components/ChoiceboxGroup';

export { CodeBlock } from './components/CodeBlock';
export type { CodeBlockProps, SwitcherOption, SwitcherConfig } from './components/CodeBlock';

export { Grid, GridSystem, GridCell } from './components/Grid';
export type { GridSystemProps, GridProps, GridCellProps } from './components/Grid';

export { Button, ButtonLink, CustomButton } from './components/Button';
export type { ButtonProps, ButtonLinkProps, CustomButtonProps, CustomButtonColors, ButtonVariant, ButtonSize, ButtonShape } from './components/Button';

export { Spinner } from './components/Spinner';
export type { SpinnerProps, SpinnerSize } from './components/Spinner';

export { Collapse, CollapseGroup, CollapseItem } from './components/Collapse';
export type { CollapseProps, CollapseGroupProps, CollapseItemProps } from './components/Collapse';

export { Input } from './components/Input';
export type { InputProps, InputSize } from './components/Input';

export { Textarea } from './components/Textarea';
export type { TextareaProps, TextareaSize } from './components/Textarea';

export { Select } from './components/Select';
export type { SelectProps, SelectSize } from './components/Select';

export { Switch, SwitchControl } from './components/Switch';
export type { SwitchProps, SwitchControlProps, SwitchSize } from './components/Switch';

export { Tooltip } from './components/Tooltip';
export type { TooltipProps, TooltipPosition, TooltipType, TooltipBoxAlign } from './components/Tooltip';

export { Note } from './components/Note';
export type { NoteProps, NoteSize, NoteType } from './components/Note';

export { Toggle } from './components/Toggle';
export type { ToggleProps, ToggleSize, ToggleColor, ToggleDirection, ToggleLabelCasing, ToggleIcon } from './components/Toggle';

export { Tabs } from './components/Tabs';
export type { TabsProps, TabsVariant, TabItem } from './components/Tabs';

export { Skeleton } from './components/Skeleton';
export type { SkeletonProps } from './components/Skeleton';

export { Snippet } from './components/Snippet';
export type { SnippetProps, SnippetType } from './components/Snippet';

export { ToastArea, useToasts } from './components/Toast';
export type { ToastAreaProps, ToastControls, ToastOptions, ToastsApi, ToastType } from './components/Toast';

export {
    Modal, ModalBody, ModalHeader, ModalTitle, ModalSubtitle,
    ModalInset, ModalActions, ModalAction,
} from './components/Modal';
export type {
    ModalProps, ModalBodyProps, ModalHeaderProps, ModalTitleProps,
    ModalSubtitleProps, ModalInsetProps, ModalActionsProps, ModalActionProps,
} from './components/Modal';

// Tokens CSS export — users import via:
// import '@oxobz/ui/styles'
