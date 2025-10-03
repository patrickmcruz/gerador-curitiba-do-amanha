
import React from 'react';
import { FutureYear } from '../types';

interface TimeSelectorProps {
  years: FutureYear[];
  selectedYear: FutureYear;
  onYearChange: (year: FutureYear) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ years, selectedYear, onYearChange }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-gray-300">2. Selecione o salto temporal</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        {years.map((year) => (
          <button
            key={year.value}
            onClick={() => onYearChange(year)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue
              ${selectedYear.value === year.value
                ? 'bg-brand-blue text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
          >
            +{year.label}
          </button>
        ))}
      </div>
    </div>
  );
};
