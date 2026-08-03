import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-zinc-700"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={[
          "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3",
          "text-sm text-zinc-900 placeholder:text-zinc-400",
          "transition-colors",
          "focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200",
          "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400",
          error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
