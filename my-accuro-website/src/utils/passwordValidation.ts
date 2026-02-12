export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'At least one uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'At least one number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'At least one special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*]/.test(p) },
];

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors = PASSWORD_REQUIREMENTS
    .filter((req) => !req.test(password))
    .map((req) => req.label);

  return { isValid: errors.length === 0, errors };
}

export function getPasswordStrength(password: string): '' | 'Weak' | 'Medium' | 'Strong' {
  if (password.length === 0) return '';
  const { errors } = validatePassword(password);
  if (errors.length === 0) return 'Strong';
  if (errors.length <= 2) return 'Medium';
  return 'Weak';
}
