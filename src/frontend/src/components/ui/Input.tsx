"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors
              ${
                error
                  ? "border-danger focus:ring-danger"
                  : "border-border focus:ring-accent"
              }
              ${icon ? "pl-10" : ""}
              bg-surface text-text
              focus:outline-none focus:ring-2 focus:border-transparent
              placeholder:text-text-subtle
              disabled:opacity-50 disabled:bg-surface-muted
              ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-text-subtle">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Also export a Textarea version
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <textarea
        className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors
          ${
            error
              ? "border-danger focus:ring-danger"
              : "border-border focus:ring-accent"
          }
          bg-surface text-text
          focus:outline-none focus:ring-2 focus:border-transparent
          placeholder:text-text-subtle
          resize-none ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  icon,
  options,
  placeholder,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none">
            {icon}
          </div>
        )}
        <select
          className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors appearance-none
            ${
              error
                ? "border-danger focus:ring-danger"
                : "border-border focus:ring-accent"
            }
            ${icon ? "pl-10" : ""}
            bg-surface text-text
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:opacity-50 ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

export default Input;
