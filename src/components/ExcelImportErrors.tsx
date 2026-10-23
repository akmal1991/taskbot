import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ExcelImportErrors: React.FC<{ errors: string[] }> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-200 space-y-1"
    >
      <div className="font-bold flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        <span>Import xatolari:</span>
      </div>
      <ul className="list-disc pl-6 space-y-1">
        {errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
      </ul>
    </div>
  );
};
