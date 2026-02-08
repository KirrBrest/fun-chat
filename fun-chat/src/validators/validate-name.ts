import { NAME_MIN_LENGTH } from '../constants';

const ALLOWED_PATTERN = /^[a-zA-Z0-9@-]+$/;

const ERROR_EMPTY = 'Field is required';
const ERROR_TRIM = 'No spaces at the beginning or end';
const ERROR_MIN_LENGTH = `At least ${NAME_MIN_LENGTH} characters required`;
const ERROR_INVALID_CHARS =
  'Only Latin letters, digits and characters "-", "@" are allowed';

export function validateName(value: string): string | null {
  const trimmed = value.trim();

  if (value.length === 0 || trimmed.length === 0) {
    return ERROR_EMPTY;
  }

  if (value !== trimmed) {
    return ERROR_TRIM;
  }

  if (trimmed.length < NAME_MIN_LENGTH) {
    return ERROR_MIN_LENGTH;
  }

  if (!ALLOWED_PATTERN.test(trimmed)) {
    return ERROR_INVALID_CHARS;
  }

  return null;
}
