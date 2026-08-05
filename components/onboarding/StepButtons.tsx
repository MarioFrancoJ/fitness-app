import Button from "@/components/ui/Button";

interface StepButtonsProps {
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isNextDisabled?: boolean;
}

export default function StepButtons({
  onNext,
  onBack,
  nextLabel = "Continue",
  backLabel = "Back",
  isNextDisabled = false,
}: StepButtonsProps) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {/* Back — only rendered when a handler is provided */}
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack}>
          {backLabel}
        </Button>
      ) : (
        // Spacer so Continue stays right-aligned when there's no Back
        <span />
      )}

      {onNext && (
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={isNextDisabled}
        >
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
