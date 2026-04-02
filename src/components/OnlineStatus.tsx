import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getPendingSyncIds } from '@/lib/syncService';

export function OnlineStatus() {
  const isOnline = useOnlineStatus();
  const pendingCount = getPendingSyncIds().length;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {isOnline ? (
        <div className="flex items-center gap-1 text-emerald-600">
          <Wifi className="w-3.5 h-3.5" />
          <span>Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-amber-600">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </div>
      )}
      {pendingCount > 0 && (
        <span className="text-amber-600">({pendingCount} pending)</span>
      )}
    </div>
  );
}
