import Calculator from '@/components/Calculator';
import ApiStatus from '@/components/ApiStatus';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-white text-3xl font-bold tracking-tight mb-1">
          Calculator
        </h1>
        <ApiStatus />
      </div>

      {/* Calculator + History */}
      <Calculator />

      {/* Footer */}
      <p className="mt-10 text-gray-700 text-xs">
        Basic Calculator Application
      </p>
    </main>
  );
}
