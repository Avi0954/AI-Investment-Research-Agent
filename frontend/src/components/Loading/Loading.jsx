import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

const PIPELINE_STEPS = [
  { id: 'validate', name: 'Validating entity...', duration: 500 },
  { id: 'yahoo', name: 'Retrieving market data...', duration: 1500 },
  { id: 'metrics', name: 'Extracting financials...', duration: 800 },
  { id: 'news', name: 'Scanning recent news...', duration: 2000 },
  { id: 'sec', name: 'Analyzing SEC filings...', duration: 2500 },
  { id: 'merge', name: 'Normalizing research...', duration: 1000 },
  { id: 'groq', name: 'Running Groq AI models...', duration: 3500 },
  { id: 'recommendation', name: 'Synthesizing report...', duration: 1000 }
];

const Loading = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    let accDuration = 0;
    const timeouts = [];

    PIPELINE_STEPS.forEach((step, idx) => {
      accDuration += step.duration;
      const t = setTimeout(() => {
        setCurrentStepIndex(Math.min(idx + 1, PIPELINE_STEPS.length - 1));
      }, accDuration);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col max-w-lg w-full bg-brand-deep rounded-2xl p-6 border border-brand-border">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="w-5 h-5 text-white animate-spin" />
        <span className="font-mono text-sm font-semibold text-white">Agent is thinking...</span>
      </div>

      <div className="flex flex-col gap-4">
        {PIPELINE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isRunning = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;

          if (isPending && idx > currentStepIndex + 1) return null; // Only show up to next step

          return (
            <div key={step.id} className={cn("flex items-center gap-3 text-sm transition-all duration-500", 
              isCompleted ? "text-brand-muted" : isRunning ? "text-white" : "text-brand-muted/50 opacity-50"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : isRunning ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-brand-border" />
              )}
              <span className="font-mono">{step.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Loading;
