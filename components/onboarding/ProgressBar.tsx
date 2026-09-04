interface ProgressBarProps {
  currentStep: number; // 1-based
  totalSteps: number;
  /** Localized "Step X of Y" label (already interpolated by the caller). */
  stepLabel: string;
  /** Localized accessible label for the progress track. */
  progressLabel: string;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  stepLabel,
  progressLabel,
}: ProgressBarProps) {
  const clampedStep = Math.min(currentStep, totalSteps);
  const pct = Math.round((clampedStep / totalSteps) * 100);

  return (
    <div className="w-full">
      {/* Step counter */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">
          {stepLabel}
        </span>
        <span className="text-xs font-medium text-zinc-400">{pct}%</span>
      </div>

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={clampedStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={progressLabel}
        className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
