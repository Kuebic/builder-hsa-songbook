// Type definitions for test utilities and mocks
import { ReactElement, ReactNode, MouseEventHandler, ChangeEventHandler } from 'react';

// Common button props
export interface ButtonProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  asChild?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: unknown;
}

// Input props
export interface InputProps {
  placeholder?: string;
  className?: string;
  value?: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  type?: string;
  disabled?: boolean;
  [key: string]: unknown;
}

// Badge props
export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

// Card component props
export interface CardProps {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}

// Dialog component props
export interface DialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface DialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

// Dropdown menu props
export interface DropdownMenuProps {
  children: ReactNode;
}

export interface DropdownMenuContentProps {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  disabled?: boolean;
}

export interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

// Sheet component props
export interface SheetProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface SheetContentProps {
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export interface SheetTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

// Select component props
export interface SelectProps {
  children: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  [key: string]: unknown;
}

export interface SelectTriggerProps {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}

export interface SelectContentProps {
  children: ReactNode;
  [key: string]: unknown;
}

export interface SelectItemProps {
  children: ReactNode;
  value: string;
  [key: string]: unknown;
}

export interface SelectValueProps {
  placeholder?: string;
  currentValue?: string;
  [key: string]: unknown;
}

// Tabs component props
export interface TabsProps {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  [key: string]: unknown;
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}

export interface TabsTriggerProps {
  children: ReactNode;
  value: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface TabsContentProps {
  children: ReactNode;
  value: string;
  className?: string;
  [key: string]: unknown;
}

// Skeleton props
export interface SkeletonProps {
  className?: string;
}

// Progress props
export interface ProgressProps {
  value?: number;
  className?: string;
  max?: number;
}

// Icon props (for Lucide icons)
export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
  fill?: string;
  strokeWidth?: number;
}

// Clerk mock props
export interface ClerkSignInButtonProps {
  children: ReactNode;
  mode?: 'modal' | 'redirect';
  redirectUrl?: string;
  [key: string]: unknown;
}

export interface ClerkSignOutButtonProps {
  children: ReactNode;
  redirectUrl?: string;
  [key: string]: unknown;
}

export interface ClerkUserButtonProps {
  afterSignOutUrl?: string;
  appearance?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MockClerkUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  [key: string]: unknown;
}