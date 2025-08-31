
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const loadingSpinnerVariants = cva(
    'animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
    {
        variants: {
            size: {
                default: 'h-8 w-8',
                button: 'h-5 w-5',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
);

export type LoadingSpinnerProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof loadingSpinnerVariants>;

/**
 * A simple, reusable animated spinner component for indicating loading states.
 * It supports different sizes.
 * @param {LoadingSpinnerProps} props - The component props.
 * @returns {JSX.Element} The rendered loading spinner.
 */
const LoadingSpinner = ({ className, size, ...props }: LoadingSpinnerProps) => {
    return (
      <div
        className={cn(loadingSpinnerVariants({ size, className }))}
        role="status"
        {...props}
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
    );
};

export default LoadingSpinner;
