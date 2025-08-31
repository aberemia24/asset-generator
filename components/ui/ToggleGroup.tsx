
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const toggleButtonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            state: {
                active: 'bg-background text-foreground shadow-sm',
                inactive: 'hover:bg-accent hover:text-accent-foreground',
            },
        },
        defaultVariants: {
            state: 'inactive',
        },
    }
);

export type ToggleButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof toggleButtonVariants>;

/**
 * A single button within a ToggleGroup, with styles for active and inactive states.
 * It's built with class-variance-authority for easy theme customization.
 */
const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ className, state, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(toggleButtonVariants({ state, className }))}
        {...props}
      />
    );
  }
);
ToggleButton.displayName = 'ToggleButton';

/**
 * A container for ToggleButton components, styling them as a connected group.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The ToggleButton components.
 * @param {string} [props.className] - Optional additional class names.
 * @returns {JSX.Element} The rendered toggle group.
 */
const ToggleGroup = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
        {children}
    </div>
);


export { ToggleGroup, ToggleButton };