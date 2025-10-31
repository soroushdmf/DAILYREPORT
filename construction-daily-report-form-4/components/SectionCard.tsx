import React from 'react';

interface SectionCardProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  ({ id, title, children, className = '', actions }, ref) => {
    return (
      <div id={id} ref={ref} className={`bg-white dark:bg-slate-800 shadow-md rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        <div className="p-4 md:p-6 space-y-4">
          {children}
        </div>
      </div>
    );
  }
);

export default SectionCard;