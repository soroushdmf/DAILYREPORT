import React, { useState, useEffect } from 'react';
import { DailyLogState } from '../types';

interface CopyFromDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (data: DailyLogState) => void;
}

const CopyFromDateModal: React.FC<CopyFromDateModalProps> = ({ isOpen, onClose, onCopy }) => {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('dailyLog_'));
      const dates = keys.map(key => key.replace('dailyLog_', '')).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (selectedDate) {
      const savedData = localStorage.getItem(`dailyLog_${selectedDate}`);
      if (savedData) {
        onCopy(JSON.parse(savedData));
        onClose();
      } else {
        alert('Could not find data for the selected date.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Copy from Previous Report</h2>
        
        {availableDates.length > 0 ? (
          <>
            <p className="mb-4 text-slate-600 dark:text-slate-400">Select a date to copy the report data from.</p>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {availableDates.map(date => (
                <option key={date} value={date}>{new Date(date + 'T00:00:00').toLocaleDateString()}</option>
              ))}
            </select>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
              >
                Copy Data
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-slate-600 dark:text-slate-400">No saved reports found.</p>
            <div className="mt-6 flex justify-end">
               <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CopyFromDateModal;