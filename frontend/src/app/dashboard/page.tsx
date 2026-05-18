'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getHistory } from '@/services/calculator.service';
import { CalculationHistoryEntry } from '@/types';
import Calculator from '@/components/calculator/Calculator';
import HistoryPanel from '@/components/calculator/HistoryPanel';
import Navbar from '@/components/ui/Navbar';

export default function DashboardPage() {
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();

  const [history,        setHistory]        = useState<CalculationHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load history from DB on mount
  useEffect(() => {
    if (!token) return;
    setHistoryLoading(true);
    getHistory(token)
      .then((res) => {
        if (res.success && res.data) {
          setHistory(res.data.calculations);
        }
      })
      .finally(() => setHistoryLoading(false));
  }, [token]);

  // Called by Calculator after each successful calculation
  const handleNewCalculation = useCallback((entry: CalculationHistoryEntry) => {
    setHistory((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleDeleteEntry = useCallback((id: number) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="flex items-start justify-center gap-6 p-8 pt-12">
        <Calculator onNewCalculation={handleNewCalculation} />

        <HistoryPanel
          entries={history}
          onClear={handleClearHistory}
          onDelete={handleDeleteEntry}
          loading={historyLoading}
        />
      </main>

      <p className="text-center text-gray-700 text-xs pb-6">
        Branch 2 — Database-Driven Application
      </p>
    </div>
  );
}
