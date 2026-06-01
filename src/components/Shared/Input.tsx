import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  textarea?: boolean;
  rows?: number;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', textarea, rows = 3, ...props }) => {
  const inputClass = `input ${error ? 'input-error' : ''} ${className}`;
  const commonProps = { className: inputClass, ...props };

  return (
    <div className="mb-4">
      {label && <label className="label">{label}</label>}
      {textarea ? (
        <textarea rows={rows} {...(commonProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input {...(commonProps as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Input;