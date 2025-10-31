import React from 'react';
import { SavingIcon, CheckCircleIcon } from './icons';

export type SaveStatus = 'saving' | 'saved' | 'idle';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status }) => {
  let content;
  switch (status) {
    case 'saving':
      content = (
        <>
          <SavingIcon />
          <span>Saving...</span>
        </>
      );
      break;
    case 'saved':
      content = (
        <>
          <CheckCircleIcon />
          <span>All changes saved</span>
        </>
      );
      break;
    default:
       return null; 
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 transition-opacity duration-300">
      {content}
    </div>
  );
};

export default SaveStatusIndicator;
