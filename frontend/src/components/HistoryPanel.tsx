'use client';

import { HistoryEntry } from '@/types/calculator.types';

interface Props {
  history: HistoryEntry[];
  onClear: () => void;
}

const OPERATION_COLORS: Record<string, string> = {
  addition:       'text-green-400',
  subtraction:    'text-blue-400',
  multiplication: 'text-yellow-400',
  division:       'text-purple-400',
};

export default function HistoryPanel({ history, onClear }: Props) {
  return (
    <div className="bg-gray-800 rounded-3xl p-5 w-72 shadow-2xl shadow-black/50 max-h-[520px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-300 font-semibold text-lg">History</h2>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="overflow-y-auto flex-1 space-y-2 pr-1">
        {history.length === 0 ? (
          <p className="text-gray-600 text-sm text-center mt-8">
            No calculations yet.
            <br />
            Results will appear here.
          </p>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-900 rounded-xl px-4 py-3"
            >
              <p className="text-gray-400 text-sm">{entry.expression}</p>
              <div className="flex items-center justify-between mt-1">
                <span
                  className={`text-xs capitalize ${OPERATION_COLORS[entry.operation] ?? 'text-gray-500'}`}
                >
                  {entry.operation}
                </span>
                <span className="text-xs text-gray-600">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
