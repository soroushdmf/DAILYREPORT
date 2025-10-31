import React from 'react';

const GeminiIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 17.75a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 0 0 0-3.5ZM5.5 12.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3ZM12 2.75a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 0 0 0-3.5ZM18.5 12.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3Z"/>
        <path fill="currentColor" d="m12 8.752l-2.002 4.004l-4.004 2.002l4.004 2.002l2.002 4.004l2.002-4.004l4.004-2.002l-4.004-2.002L12 8.752Z" opacity="0.5"/>
    </svg>
);

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


interface GeminiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onClick: () => void;
    isLoading: boolean;
    children: React.ReactNode;
}

const GeminiButton: React.FC<GeminiButtonProps> = ({ onClick, isLoading, children, ...props }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            {...props}
        >
            {isLoading ? <LoadingSpinner /> : <GeminiIcon />}
            {children}
        </button>
    );
};

export default GeminiButton;
