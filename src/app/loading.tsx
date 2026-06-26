import { RefreshCw } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 rounded-full bg-brand-purple/10 border border-brand-purple/20 w-fit glow-purple">
          <RefreshCw className="h-8 w-8 text-brand-purple animate-spin" />
        </div>
        <h3 className="text-sm font-bold text-text-secondary animate-pulse">Loading Open Source Matches...</h3>
      </div>
    </div>
  );
}
