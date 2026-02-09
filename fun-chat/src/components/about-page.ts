import Button from '../utils/button';
import {
  AUTHOR_EMAIL_GMAIL,
  AUTHOR_EMAIL_YANDEX,
  AUTHOR_FULL_NAME,
  AUTHOR_GITHUB_URL,
  AUTHOR_IMAGE_PATH,
} from '../constants';
import Tag from '../utils/tag';

const ABOUT_TITLE = 'About';
const BACK_LABEL = 'Back';
const APP_DESCRIPTION =
  'Fun Chat is a simple real-time chat application. Connect, sign in, and message other users in a minimal, distraction-free interface.';
const AUTHOR_BIO =
  'Beginner frontend programmer with more than 20 years of experience in commerce.';
const GITHUB_LABEL = 'GitHub';

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function createAppBlock(): HTMLElement {
  const appBlock = new Tag('div', 'about-block');
  const appHeading = new Tag('h2', 'about-heading', 'About the app');
  const appText = new Tag('p', 'about-text', APP_DESCRIPTION);
  appBlock.append(appHeading.element);
  appBlock.append(appText.element);

  return appBlock.element;
}

function createAuthorBlock(): HTMLElement {
  const authorBlock = new Tag('div', 'about-block about-author');
  const authorHeading = new Tag('h2', 'about-heading', 'Author');
  const authorContent = new Tag('div', 'about-author-content');
  const img = document.createElement('img');
  img.src = toSafeString(AUTHOR_IMAGE_PATH);
  img.alt = toSafeString(AUTHOR_FULL_NAME);
  img.className = 'about-author-photo';
  const authorInfo = new Tag('div', 'about-author-info');
  const authorNameEl = new Tag(
    'p',
    'about-author-name',
    toSafeString(AUTHOR_FULL_NAME)
  );
  const authorBio = new Tag('p', 'about-text', AUTHOR_BIO);
  const githubLink = document.createElement('a');
  githubLink.href = toSafeString(AUTHOR_GITHUB_URL);
  githubLink.target = '_blank';
  githubLink.rel = 'noopener noreferrer';
  githubLink.className = 'about-github-link';
  githubLink.textContent = GITHUB_LABEL;
  const emailYandex = document.createElement('a');
  emailYandex.href = `mailto:${toSafeString(AUTHOR_EMAIL_YANDEX)}`;
  emailYandex.className = 'about-github-link';
  emailYandex.textContent = toSafeString(AUTHOR_EMAIL_YANDEX);
  const emailGmail = document.createElement('a');
  emailGmail.href = `mailto:${toSafeString(AUTHOR_EMAIL_GMAIL)}`;
  emailGmail.className = 'about-github-link';
  emailGmail.textContent = toSafeString(AUTHOR_EMAIL_GMAIL);
  authorInfo.append(authorNameEl.element);
  authorInfo.append(authorBio.element);
  authorInfo.append(githubLink);
  authorInfo.append(emailYandex);
  authorInfo.append(emailGmail);
  authorContent.append(img);
  authorContent.append(authorInfo.element);
  authorBlock.append(authorHeading.element);
  authorBlock.append(authorContent.element);

  return authorBlock.element;
}

export function createAboutPage(): HTMLElement {
  const container = new Tag('section', 'page about-page');
  const title = new Tag('h1', 'page-title', ABOUT_TITLE);
  const backButton = new Button('nav-button', BACK_LABEL, () => {
    globalThis.history.back();
  });

  container.append(title);
  container.append(createAppBlock());
  container.append(createAuthorBlock());
  container.append(backButton);

  return container.element;
}
