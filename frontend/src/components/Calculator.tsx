'use client';

import { useState, useCallback } from 'react';
import { calculate } from '@/services/calculator.service';
import { Operator, HistoryEntry } from '@/types/calculator.types';
import HistoryPanel from './HistoryPanel';

// ── Types ──────────────────────────────────────────────────────────────────────

type CalcState = {
  display: string;       // what's shown on screen
  firstNum: string;      // first operand (buffered)
  operator: Operator | null;
  waitingForSecond: boolean; // true after operator is pressed
  justCalculated: boolean;   // true right after = was pressed
};

const INITIAL_STATE: CalcState = {
  display: '0',
  firstNum: '',
  operator: null,
  waitingForSecond: false,
  justCalculated: false,
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function Display({ value, expression }: { value: string; expression: string }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 mb-4 text-right min-h-[96px] flex flex-col justify-between">
      <span className="text-gray-500 text-sm h-5 truncate">{expression}</span>
      <span className="text-white text-4xl font-light tracking-wider truncate">
        {value}
      </span>
    </div>
  );
}

type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'number' | 'operator' | 'action' | 'equals';
  wide?: boolean;
};

function CalcButton({ label, onClick, variant = 'number', wide = false }: ButtonProps) {
  const base = 'rounded-2xl text-xl font-medium h-16 transition-all duration-100 active:scale-95 select-none cursor-pointer flex items-center justify-center';
  const variants: Record<string, string> = {
    number:   'bg-gray-700 hover:bg-gray-600 text-white',
    operator: 'bg-orange-500 hover:bg-orange-400 text-white',
    action:   'bg-gray-500 hover:bg-gray-400 text-white',
    equals:   'bg-orange-500 hover:bg-orange-400 text-white',
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant]} ${wide ? 'col-span-2' : ''}`}
    >
      {label}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Calculator() {
  const [state, setState] = useState<CalcState>(INITIAL_STATE);
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Input handlers ───────────────────────────────────────────────────────────

  const handleDigit = useCallback((digit: string) => {
    setError(null);
    setState((prev) => {
      if (prev.waitingForSecond || prev.justCalculated) {
        return { ...prev, display: digit, waitingForSecond: false, justCalculated: false };
      }
      if (prev.display === '0' && digit !== '.') return { ...prev, display: digit };
      if (digit === '.' && prev.display.includes('.')) return prev;
      if (prev.display.length >= 12) return prev;
      return { ...prev, display: prev.display + digit };
    });
  }, []);

  const handleOperator = useCallback((op: Operator) => {
    setError(null);
    setState((prev) => {
      setExpression(`${prev.display} ${op}`);
      return {
        ...prev,
        firstNum: prev.display,
        operator: op,
        waitingForSecond: true,
        justCalculated: false,
      };
    });
  }, []);

  const handleEquals = useCallback(async () => {
    setState((prev) => {
      if (!prev.operator || prev.waitingForSecond) return prev;

      const a = parseFloat(prev.firstNum);
      const b = parseFloat(prev.display);
      const op = prev.operator;
      const expr = `${prev.firstNum} ${op} ${prev.display}`;

      setExpression(expr + ' =');
      setLoading(true);
      setError(null);

      calculate({ a, b, operator: op })
        .then((res) => {
          if (res.success && res.data) {
            const resultStr = String(res.data.result);
            setState((s) => ({
              ...s,
              display: resultStr,
              firstNum: resultStr,
              operator: null,
              waitingForSecond: false,
              justCalculated: true,
            }));
            setHistory((h) => [
              {
                id: crypto.randomUUID(),
                expression: res.data!.expression,
                result: res.data!.result,
                operation: res.data!.operation,
                timestamp: res.data!.timestamp,
              },
              ...h.slice(0, 19), // keep last 20
            ]);
          } else {
            setError(res.message || 'Calculation failed');
            setState((s) => ({ ...s, display: 'Error' }));
          }
        })
        .catch(() => setError('Network error — is the backend running?'))
        .finally(() => setLoading(false));

      return prev; // will be updated in the .then above
    });
  }, []);

  const handleClear = useCallback(() => {
    setState(INITIAL_STATE);
    setExpression('');
    setError(null);
  }, []);

  const handleToggleSign = useCallback(() => {
    setState((prev) => ({
      ...prev,
      display: prev.display.startsWith('-')
        ? prev.display.slice(1)
        : `-${prev.display}`,
    }));
  }, []);

  const handlePercent = useCallback(() => {
    setState((prev) => ({
      ...prev,
      display: String(parseFloat(prev.display) / 100),
    }));
  }, []);

  const handleBackspace = useCallback(() => {
    setState((prev) => {
      if (prev.display.length <= 1 || prev.justCalculated) {
        return { ...prev, display: '0' };
      }
      return { ...prev, display: prev.display.slice(0, -1) };
    });
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6 items-start justify-center">
      {/* Calculator */}
      <div className="bg-gray-800 rounded-3xl p-5 w-80 shadow-2xl shadow-black/50">
        <Display
          value={loading ? '...' : state.display}
          expression={expression}
        />

        {error && (
          <p className="text-red-400 text-xs text-center mb-3 bg-red-950/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Button grid */}
        <div className="grid grid-cols-4 gap-3">
          {/* Row 1 */}
          <CalcButton label="AC"  onClick={handleClear}       variant="action" />
          <CalcButton label="+/-" onClick={handleToggleSign}  variant="action" />
          <CalcButton label="%"   onClick={handlePercent}     variant="action" />
          <CalcButton label="÷"   onClick={() => handleOperator('/')}  variant="operator" />

          {/* Row 2 */}
          <CalcButton label="7" onClick={() => handleDigit('7')} />
          <CalcButton label="8" onClick={() => handleDigit('8')} />
          <CalcButton label="9" onClick={() => handleDigit('9')} />
          <CalcButton label="×" onClick={() => handleOperator('*')} variant="operator" />

          {/* Row 3 */}
          <CalcButton label="4" onClick={() => handleDigit('4')} />
          <CalcButton label="5" onClick={() => handleDigit('5')} />
          <CalcButton label="6" onClick={() => handleDigit('6')} />
          <CalcButton label="−" onClick={() => handleOperator('-')} variant="operator" />

          {/* Row 4 */}
          <CalcButton label="1" onClick={() => handleDigit('1')} />
          <CalcButton label="2" onClick={() => handleDigit('2')} />
          <CalcButton label="3" onClick={() => handleDigit('3')} />
          <CalcButton label="+" onClick={() => handleOperator('+')} variant="operator" />

          {/* Row 5 */}
          <CalcButton label="⌫" onClick={handleBackspace} variant="action" />
          <CalcButton label="0" onClick={() => handleDigit('0')} />
          <CalcButton label="." onClick={() => handleDigit('.')} />
          <CalcButton label="=" onClick={handleEquals} variant="equals" />
        </div>
      </div>

      {/* History panel */}
      <HistoryPanel history={history} onClear={() => setHistory([])} />
    </div>
  );
}
