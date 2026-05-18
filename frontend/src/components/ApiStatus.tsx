'use client';

import { useEffect, useState } from 'react';

type Status = 'checking' | 'online' | 'offline';

export default function ApiStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/health`,
          { signal: AbortSignal.timeout(3000) }
        );
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
    };

    check();
    const id = setInterval(check, 30_000); // recheck every 30 s
    return () => clearInterval(id);
  }, []);

  const colors: Record<Status, string> = {
    checking: 'bg-yellow-400',
    online:   'bg-green-400',
    offline:  'bg-red-400',
  };

  const labels: Record<Status, string> = {
    checking: 'Connecting to API...',
    online:   'API Online',
    offline:  'API Offline — start the backend',
  };

  return (
    <div className="flex items-center gap-2 text-sm text-center ml-8">
      <span className={`w-2 h-2 rounded-full ${colors[status]} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      <span className="text-gray-400 ">{labels[status]}</span>
    </div>
  );
}
