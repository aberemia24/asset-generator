
import React from 'react';

/**
 * A simple, styled badge component.
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props - The component props.
 * @returns {JSX.Element} The rendered badge.
 */
const Badge = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
        {...props}
        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-accent"
    >
        {children}
    </button>
);

export default Badge;