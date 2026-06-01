import React from 'react';
import { Input } from '../Shared';
import '../../styles/passportinput.css';

export interface PassportData {
  passportNumber: string;
  passportIssuedBy: string;
  passportIssueDate: string;
}

interface PassportInputProps {
  value: PassportData;
  onChange: (data: PassportData) => void;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
}

const PassportInput: React.FC<PassportInputProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  compact = false,
}) => {
  const handleChange = (field: keyof PassportData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  if (compact) {
    return (
      <div className="passport-input-compact">
        <Input
          label="Паспорт (серия+номер)"
          value={value.passportNumber}
          onChange={(e) => handleChange('passportNumber', e.target.value)}
          disabled={disabled}
          required={required}
          placeholder="AB1234567"
        />
      </div>
    );
  }

  return (
    <div className="passport-input">
      <Input
        label="Паспорт (серия+номер)"
        value={value.passportNumber}
        onChange={(e) => handleChange('passportNumber', e.target.value)}
        disabled={disabled}
        required={required}
        placeholder="AB1234567"
      />
      <Input
        label="Кем выдан"
        value={value.passportIssuedBy}
        onChange={(e) => handleChange('passportIssuedBy', e.target.value)}
        disabled={disabled}
        placeholder="Отделением УВД ..."
      />
      <Input
        label="Дата выдачи"
        type="date"
        value={value.passportIssueDate}
        onChange={(e) => handleChange('passportIssueDate', e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};

export default PassportInput;