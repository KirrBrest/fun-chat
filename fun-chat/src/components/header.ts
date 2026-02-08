import Button from '../utils/button';
import Tag from '../utils/tag';
import {
  APP_NAME,
  AppState,
  AuthPageMode,
  NavigateHandler,
  ROUTE_PATHS,
  RoutePath,
} from '../types/types';

const REGISTRATION_LABEL = 'Register';
const LOGIN_LABEL = 'Sign in';
const LOGOUT_LABEL = 'Log out';
const ABOUT_LABEL = 'About us';

function getAuthModeByPath(path: RoutePath): AuthPageMode {
  if (path === ROUTE_PATHS.register) {
    return 'register';
  }

  return 'login';
}

function getMainButtonLabel(path: RoutePath, isAuthenticated: boolean): string {
  if (isAuthenticated) {
    return LOGOUT_LABEL;
  }

  const mode: AuthPageMode = getAuthModeByPath(path);

  if (mode === 'register') {
    return LOGIN_LABEL;
  }

  return REGISTRATION_LABEL;
}

function getMainButtonTargetPath(
  path: RoutePath,
  isAuthenticated: boolean
): RoutePath | null {
  if (isAuthenticated) {
    return ROUTE_PATHS.login;
  }

  const mode: AuthPageMode = getAuthModeByPath(path);

  if (mode === 'register') {
    return ROUTE_PATHS.login;
  }

  return ROUTE_PATHS.register;
}

function createMainNavButton(
  appState: AppState,
  currentPath: RoutePath,
  onNavigate: NavigateHandler,
  onLogout: () => void
): Button {
  const mainButtonLabel: string = getMainButtonLabel(
    currentPath,
    appState.auth.user !== null
  );
  const targetPath: RoutePath | null = getMainButtonTargetPath(
    currentPath,
    appState.auth.user !== null
  );

  return new Button('nav-button nav-button--primary', mainButtonLabel, () => {
    if (appState.auth.user !== null) {
      onLogout();
      return;
    }

    if (targetPath !== null) {
      onNavigate(targetPath);
    }
  });
}

function createAboutNavButton(onNavigate: NavigateHandler): Button {
  return new Button('nav-button', ABOUT_LABEL, () => {
    onNavigate(ROUTE_PATHS.about);
  });
}

export function createHeader(
  appState: AppState,
  currentPath: RoutePath,
  onNavigate: NavigateHandler,
  onLogout: () => void
): HTMLElement {
  const header = new Tag('header', 'app-header');
  const title = new Tag('h1', 'app-title', APP_NAME);
  const userLabel =
    appState.auth.user === null ? '' : `User: ${appState.auth.user.name}`;
  const userName = new Tag('span', 'app-user', userLabel);
  const nav = new Tag('nav', 'app-nav');

  const mainButton = createMainNavButton(
    appState,
    currentPath,
    onNavigate,
    onLogout
  );
  const aboutButton = createAboutNavButton(onNavigate);

  nav.element.append(mainButton.element, aboutButton.element);
  header.element.append(title.element, userName.element, nav.element);

  return header.element;
}
