import { PASSWORD_MIN_LENGTH } from '../constants';

const HAS_UPPERCASE = /[A-Z]/;
const HAS_SPECIAL = /[^a-zA-Z0-9]/;

const ERROR_EMPTY = 'Field is required';
const ERROR_TRIM = 'No spaces at the beginning or end';
const ERROR_MIN_LENGTH = `At least ${PASSWORD_MIN_LENGTH} characters required`;
const ERROR_SAME_AS_NAME = 'Password must not match the name';
const ERROR_UPPERCASE = 'At least one uppercase letter required';
const ERROR_SPECIAL =
  'At least one special character required (letters and digits are allowed)';

export function validatePassword(
  value: string,
  userName: string
): string | null {
  const trimmed = value.trim();

  if (value.length === 0 || trimmed.length === 0) {
    return ERROR_EMPTY;
  }

  if (value !== trimmed) {
    return ERROR_TRIM;
  }

  if (trimmed.length < PASSWORD_MIN_LENGTH) {
    return ERROR_MIN_LENGTH;
  }

  if (userName.length > 0 && trimmed.toLowerCase() === userName.toLowerCase()) {
    return ERROR_SAME_AS_NAME;
  }

  if (!HAS_UPPERCASE.test(trimmed)) {
    return ERROR_UPPERCASE;
  }

  if (!HAS_SPECIAL.test(trimmed)) {
    return ERROR_SPECIAL;
  }

  return null;
}
