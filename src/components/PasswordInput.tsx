import { useId, useState } from "react";
import "./PasswordInput.css";

interface PasswordInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  required?: boolean;
}

function PasswordInput({
  id, label, value, onChange, autoComplete, error, required = false,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="form-field">
      <label htmlFor={inputId} className="form-field__label">{label}</label>
      <div className="password-input">
        <input
          id={inputId} name={inputId}
          type={isVisible ? "text" : "password"}
          className="form-field__input password-input__field"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button" className="password-input__toggle"
          onClick={() => setIsVisible((v) => !v)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
      {error && (
        <p id={errorId} className="form-field__error" role="alert">{error}</p>
      )}
    </div>
  );
}

export default PasswordInput;
