import Button from '../utils/button';
import Tag from '../utils/tag';
import { AuthPageMode, AuthSubmitHandler } from '../types/types';
import { isHTMLInputElement } from '../types/type-guards';
import { validateName } from '../validators/validate-name';
import { validatePassword } from '../validators/validate-password';

const LOGIN_TITLE = 'Log in to chat';
const REGISTER_TITLE = 'Register for chat';
const NAME_PLACEHOLDER = 'Enter name';
const PASSWORD_PLACEHOLDER = 'Enter password';
const NAME_INPUT_ID = 'auth-name';
const PASSWORD_INPUT_ID = 'auth-password';
const LOGIN_BUTTON_TEXT = 'Log in';
const REGISTER_BUTTON_TEXT = 'Register';

function getAuthTitle(mode: AuthPageMode): string {
  if (mode === 'register') {
    return REGISTER_TITLE;
  }

  return LOGIN_TITLE;
}

function getSubmitButtonText(mode: AuthPageMode): string {
  if (mode === 'register') {
    return REGISTER_BUTTON_TEXT;
  }

  return LOGIN_BUTTON_TEXT;
}

function setFieldError(errorElement: Tag, message: string): void {
  errorElement.element.textContent = message;
}

function makeTrySubmit(
  nameInput: Tag,
  passwordInput: Tag,
  nameError: Tag,
  passwordError: Tag,
  formError: Tag,
  onSubmit: AuthSubmitHandler
): () => void {
  return function trySubmit(): void {
    const nameEl = nameInput.element;
    const passwordEl = passwordInput.element;

    if (!isHTMLInputElement(nameEl) || !isHTMLInputElement(passwordEl)) {
      return;
    }

    setFieldError(formError, '');

    const userName = nameEl.value.trim();
    const password = passwordEl.value.trim();

    const nameErrorMsg = validateName(nameEl.value);
    const passwordErrorMsg = validatePassword(passwordEl.value, userName);

    setFieldError(nameError, nameErrorMsg ?? '');
    setFieldError(passwordError, passwordErrorMsg ?? '');

    if (nameErrorMsg !== null || passwordErrorMsg !== null) {
      return;
    }

    onSubmit(userName, password, (message: string) => {
      setFieldError(formError, message);
    });
  };
}

function buildNameField(): {
  wrapper: Tag;
  input: Tag;
  error: Tag;
} {
  const nameWrapper = new Tag('div', 'auth-field');
  const nameLabel = new Tag('label', 'auth-label', NAME_PLACEHOLDER);
  const nameInput = new Tag('input', 'auth-input');
  const nameError = new Tag('span', 'auth-error');

  nameLabel.setAttribute('for', NAME_INPUT_ID);
  nameInput.setAttribute('id', NAME_INPUT_ID);
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('placeholder', NAME_PLACEHOLDER);

  nameWrapper.element.append(
    nameLabel.element,
    nameInput.element,
    nameError.element
  );

  return {
    wrapper: nameWrapper,
    input: nameInput,
    error: nameError,
  };
}

function buildPasswordField(): {
  wrapper: Tag;
  input: Tag;
  error: Tag;
} {
  const passwordWrapper = new Tag('div', 'auth-field');
  const passwordLabel = new Tag('label', 'auth-label', PASSWORD_PLACEHOLDER);
  const passwordInput = new Tag('input', 'auth-input');
  const passwordError = new Tag('span', 'auth-error');

  passwordLabel.setAttribute('for', PASSWORD_INPUT_ID);
  passwordInput.setAttribute('id', PASSWORD_INPUT_ID);
  passwordInput.setAttribute('type', 'password');
  passwordInput.setAttribute('placeholder', PASSWORD_PLACEHOLDER);

  passwordWrapper.element.append(
    passwordLabel.element,
    passwordInput.element,
    passwordError.element
  );

  return {
    wrapper: passwordWrapper,
    input: passwordInput,
    error: passwordError,
  };
}

function buildAuthForm(mode: AuthPageMode, onSubmit: AuthSubmitHandler): Tag {
  const form = new Tag('form', 'auth-form');
  const nameField = buildNameField();
  const passwordField = buildPasswordField();
  const formError = new Tag('span', 'auth-error');
  const trySubmit = makeTrySubmit(
    nameField.input,
    passwordField.input,
    nameField.error,
    passwordField.error,
    formError,
    onSubmit
  );

  const submitButton = new Button(
    'auth-submit',
    getSubmitButtonText(mode),
    trySubmit
  );

  submitButton.setAttribute('type', 'button');

  form.addEventListener('submit', (event: Event) => {
    event.preventDefault();
    trySubmit();
  });

  form.addEventListener('keydown', (event: Event) => {
    if ('key' in event && event.key === 'Enter') {
      event.preventDefault();
      trySubmit();
    }
  });

  form.element.append(
    nameField.wrapper.element,
    passwordField.wrapper.element,
    formError.element,
    submitButton.element
  );

  return form;
}

export function createAuthPage(
  mode: AuthPageMode,
  onSubmit: AuthSubmitHandler
): HTMLElement {
  const container = new Tag('section', 'page auth-page');
  const title = new Tag('h1', 'page-title', getAuthTitle(mode));
  const form = buildAuthForm(mode, onSubmit);

  container.element.append(title.element, form.element);

  return container.element;
}
