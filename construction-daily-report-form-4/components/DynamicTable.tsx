import React from 'react';
import IconButton from './IconButton';
import { PlusIcon, TrashIcon } from './icons';

interface DynamicTableProps<T> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  columns: { header: string; render: (item: T, index: number) => React.ReactNode, className?: string }[];
  newItemFactory: () => T;
  footer?: React.ReactNode;
  selectedItems?: string[];
  onSelectionChange?: (newSelectedIds: string[]) => void;
  onDeleteSelected?: (ids: string[]) => void;
}

const DynamicTable = <T extends { id: string }>(
  { items, setItems, columns, newItemFactory, footer, selectedItems = [], onSelectionChange = () => {}, onDeleteSelected = () => {} }: DynamicTableProps<T>
) => {

  const handleAddItem = () => {
    setItems(prev => [...prev, newItemFactory()]);
  };

  const handleRemoveItem = (idToRemove: string) => {
    setItems(prev => prev.filter(item => item.id !== idToRemove));
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      onSelectionChange(items.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (id: string, isChecked: boolean) => {
    if (isChecked) {
      onSelectionChange([...selectedItems, id]);
    } else {
      onSelectionChange(selectedItems.filter(itemId => itemId !== id));
    }
  };
  
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;

  return (
    <div className="w-full">
      {selectedItems.length > 0 && (
        <div className="mb-4 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{selectedItems.length} item(s) selected</p>
            <button
                type="button"
                onClick={() => onDeleteSelected(selectedItems)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
                <TrashIcon />
                Delete Selected
            </button>
        </div>
      )}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        <table className="min-w-full bg-white dark:bg-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="py-3 px-4 w-12 text-center">
                <input 
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600 border-slate-300 dark:border-slate-500 dark:bg-slate-600 rounded focus:ring-blue-500"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all items"
                />
              </th>
              {columns.map((col, idx) => (
                <th key={idx} className={`py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {items && items.length > 0 ? items.map((item, index) => (
              <tr key={item.id} className={`transition-colors duration-150 ${selectedItems.includes(item.id) ? 'bg-blue-50 dark:bg-blue-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <td className="py-2 px-4 w-12 text-center">
                   <input 
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600 border-slate-300 dark:border-slate-500 dark:bg-slate-600 rounded focus:ring-blue-500"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    aria-label={`Select item ${index + 1}`}
                  />
                </td>
                {columns.map((col, idx) => (
                  <td key={idx} className={`py-2 px-4 whitespace-nowrap ${col.className || ''}`}>
                    {col.render(item, index)}
                  </td>
                ))}
                <td className="py-2 px-4 whitespace-nowrap">
                  <IconButton onClick={() => handleRemoveItem(item.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20">
                    <TrashIcon />
                  </IconButton>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <p className="font-semibold">No entries yet.</p>
                  <p className="text-sm">Click "Add Row" to get started.</p>
                </td>
              </tr>
            )}
            {footer}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-start">
        <button
          type="button"
          onClick={handleAddItem}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          <PlusIcon />
          Add Row
        </button>
      </div>
    </div>
  );
};

export default DynamicTable;