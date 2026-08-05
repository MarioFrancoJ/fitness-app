interface StepCardProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function StepCard({ title, subtitle, children }: StepCardProps) {
  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            {subtitle}
          </p>
        )}
      </div>

      {/* Step-specific content */}
      {children}
    </div>
  );
}
