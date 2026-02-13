import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="block text-sm text-forge-text-muted mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full px-3 py-2 rounded-md bg-forge-bg border text-forge-text text-sm placeholder:text-forge-text-muted focus:outline-none focus:ring-2 focus:ring-forge-accent/50 focus:border-forge-accent transition-colors ${
              error ? "border-forge-danger" : "border-forge-border"
            } ${icon ? "pl-9" : ""} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-forge-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
