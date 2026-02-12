import React from 'react';
import { PASSWORD_REQUIREMENTS, getPasswordStrength } from '../utils/passwordValidation';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);

  return (
    <div>
      {password && (
        <p className={`text-xs font-medium mb-1 ${
          strength === 'Strong' ? 'text-green-600' :
          strength === 'Medium' ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          Password strength: {strength}
        </p>
      )}
      <p className="text-xs text-muted-foreground font-medium mb-1">Password must contain:</p>
      <ul className="text-xs space-y-1">
        {PASSWORD_REQUIREMENTS.map((req, i) => {
          const met = password.length > 0 && req.test(password);
          return (
            <li key={i} className={met ? 'text-green-600' : 'text-muted-foreground'}>
              {met ? '\u2713' : '\u25CB'} {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
