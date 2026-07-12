import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

const ErrorAlert = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="w-full max-w-2xl mx-auto bg-brand-deep/80 backdrop-blur-sm border border-rose-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-rose-500/10 rounded-full shrink-0 mt-1 md:mt-0 border border-rose-500/20">
          <AlertOctagon className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h4 className="text-white font-bold text-lg mb-1">Analysis Failed</h4>
          <p className="text-brand-muted leading-relaxed text-sm">{message}</p>
        </div>
      </div>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-brand-border text-brand-muted border border-white/10 rounded-lg hover:bg-white hover:text-black transition-colors focus:ring-2 focus:ring-rose-500/50 focus:outline-none font-medium text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
