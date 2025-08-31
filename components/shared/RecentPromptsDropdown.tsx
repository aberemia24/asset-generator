
import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';

interface RecentPromptsDropdownProps {
    prompts: string[];
    onSelect: (prompt: string) => void;
}

/**
 * A dropdown menu component that displays a list of recently used prompts.
 * Allows users to quickly select a past prompt to reuse.
 * @param {RecentPromptsDropdownProps} props - The component props.
 * @returns {JSX.Element | null} The recent prompts dropdown, or null if there are no prompts.
 */
const RecentPromptsDropdown = ({ prompts, onSelect }: RecentPromptsDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    if (!prompts || prompts.length === 0) {
        return null;
    }

    const handleSelect = (prompt: string) => {
        onSelect(prompt);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative inline-block text-left">
            <div>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-auto px-2 py-1 text-xs"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                >
                    Recent
                </Button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-card ring-1 ring-border focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1 max-h-60 overflow-y-auto" role="none">
                        {prompts.map((prompt, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelect(prompt)}
                                className="text-left w-full block px-4 py-2 text-sm text-card-foreground hover:bg-accent"
                                role="menuitem"
                                title={prompt}
                            >
                                <span className="truncate block">{prompt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecentPromptsDropdown;