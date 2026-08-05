interface ProgressBarProps {
  currentStep: number; // 1-based
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const pct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full">
      {/* Step counter */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-medium text-zinc-400">{pct}%</span>
      </div>

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label="Onboarding progress"
        className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100"
      >
        <div
          className="h-full rounded-full bg-zinc-900 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
