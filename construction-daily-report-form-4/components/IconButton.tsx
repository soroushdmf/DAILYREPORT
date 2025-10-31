
import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center p-2 rounded-full transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
   