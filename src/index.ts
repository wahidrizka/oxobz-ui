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

export { Menu, MenuContainer, MenuButton, MenuItem, MenuItemLocked, MenuLink, MenuSection, MenuDivider } from './components/Menu';
export type { MenuProps, MenuPosition, MenuContainerProps, MenuButtonProps, MenuItemProps, MenuItemLockedProps, MenuLinkProps, MenuSectionProps, MenuDividerProps } from './components/Menu';

export { Progress } from './components/Progress';
export type { ProgressProps, ProgressType, ProgressColors, ProgressStop } from './components/Progress';

export { Pagination } from './components/Pagination';
export type { PaginationProps, PaginationLink } from './components/Pagination';

export { Slider } from './components/Slider';
export type { SliderProps } from './components/Slider';

export { LoadingDots } from './components/LoadingDots';
export type { LoadingDotsProps, LoadingDotsSize } from './components/LoadingDots';

export { Kbd } from './components/Kbd';
export type { KbdProps } from './components/Kbd';

export { StatusDot } from './components/StatusDot';
export type { StatusDotProps, StatusDotState } from './components/StatusDot';

export { Gauge } from './components/Gauge';
export type { GaugeProps, GaugeSize, GaugeArcPriority, GaugeColors } from './components/Gauge';

export { Combobox, ComboboxInput, ComboboxList, ComboboxOption } from './components/Combobox';
export type { ComboboxProps, ComboboxInputProps, ComboboxListProps, ComboboxOptionProps, ComboboxSize } from './components/Combobox';

export { Breadcrumbs, BreadcrumbsItem } from './components/Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbsItemProps, BreadcrumbsVariant } from './components/Breadcrumbs';

export { Card } from './components/Card';
export type { CardProps, CardDirection } from './components/Card';

export { Separator } from './components/Separator';
export type { SeparatorProps, SeparatorOrientation } from './components/Separator';

export { Description } from './components/Description';
export type { DescriptionProps, DescriptionAlign } from './components/Description';

export { Error } from './components/Error';
export type { ErrorProps, ErrorActionProps, ErrorSize } from './components/Error';

export { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from './components/EmptyState';
export type { EmptyStateProps, EmptyStateIconProps, EmptyStateTitleProps, EmptyStateDescriptionProps } from './components/EmptyState';

export { Feedback } from './components/Feedback';
export type { FeedbackProps, FeedbackRating, FeedbackSubmitData, FeedbackTopic, FeedbackType } from './components/Feedback';

export { CopyButton } from './components/CopyButton';
export type { CopyButtonProps } from './components/CopyButton';

export { ClearableInput } from './components/ClearableInput';
export type { ClearableInputProps } from './components/ClearableInput';

export { SearchInput } from './components/SearchInput';
export type { SearchInputProps } from './components/SearchInput';

export { LoadMoreButton } from './components/LoadMoreButton';
export type { LoadMoreButtonProps } from './components/LoadMoreButton';

export { TextWithCopyButton } from './components/TextWithCopyButton';
export type { TextWithCopyButtonProps } from './components/TextWithCopyButton';

export { ShowMore } from './components/ShowMore';
export type { ShowMoreProps } from './components/ShowMore';

export { Code } from './components/Code';
export type { CodeProps } from './components/Code';

export { MiddleTruncate } from './components/MiddleTruncate';
export type { MiddleTruncateProps } from './components/MiddleTruncate';

export { Entity, EntityContent, EntityList } from './components/Entity';
export type { EntityProps, EntityAs, EntityContentProps, EntityListProps } from './components/Entity';

export { Banner } from './components/Banner';
export type { BannerProps, BannerButton } from './components/Banner';

export { ProjectBanner } from './components/ProjectBanner';
export type { ProjectBannerProps, ProjectBannerVariant, ProjectBannerCallToAction } from './components/ProjectBanner';

export { ErrorCard } from './components/ErrorCard';
export type { ErrorCardProps } from './components/ErrorCard';

export {
    Fieldset, FieldsetContent, FieldsetTitle, FieldsetSubtitle,
    FieldsetFooter, FieldsetFooterStatus, FieldsetFooterActions, FieldsetFooterAction,
    ErrorText, WarningText, DisabledWall,
} from './components/Fieldset';
export type {
    FieldsetProps, FieldsetType, FieldsetContentProps, FieldsetTitleProps,
    FieldsetSubtitleProps, FieldsetFooterProps, FieldsetFooterStatusProps,
    FieldsetFooterActionsProps, FieldsetFooterActionProps,
    ErrorTextProps, WarningTextProps, DisabledWallProps,
} from './components/Fieldset';

export { Scroller } from './components/Scroller';
export type { ScrollerProps, ScrollerOverflow } from './components/Scroller';

export { ThemeSwitcher } from './components/ThemeSwitcher';
export type { ThemeSwitcherProps } from './components/ThemeSwitcher';

export {
    TableRoot, Table, TableColgroup, TableCol, TableHeader,
    TableRow, TableHead, TableBody, TableCell, TableFooter,
} from './components/Table';
export type {
    TableRootProps, TableProps, TableColgroupProps, TableColProps, TableHeaderProps,
    TableRowProps, TableHeadProps, TableBodyProps, TableCellProps, TableFooterProps,
} from './components/Table';

export { FileTree, Tree, Folder, File } from './components/FileTree';
export type { TreeProps, FolderProps, FileProps, FileType } from './components/FileTree';

export { JsonView, makeJsonViewHighlightPattern } from './components/JsonView';
export type { JsonViewProps, JsonValue } from './components/JsonView';

export { Phone } from './components/Phone';
export type { PhoneProps } from './components/Phone';

export { Video } from './components/Video';
export type { VideoProps } from './components/Video';

export { SplitButton, SplitButtonMenuItem } from './components/SplitButton';
export type { SplitButtonProps, SplitButtonMenuItemProps, SplitButtonVariant, SplitButtonMenuAlignment } from './components/SplitButton';

export { Calendar, CalendarPopover, getDefaultCalendarPresets } from './components/Calendar';
export type {
    CalendarProps,
    CalendarSize,
    DateValue,
    RangeValue,
    WeekDayIndex,
    CalendarPopoverProps,
    CalendarPopoverSize,
    CalendarPreset,
    CalendarTimezone,
} from './components/Calendar';

// Tokens CSS export — users import via:
// import '@oxobz/ui/styles'
