import Tag from '../utils/tag';
import {
  AUTHOR_GITHUB_URL,
  AUTHOR_NICKNAME,
  SCHOOL_NAME,
  SCHOOL_URL,
  SCHOOL_LOGO_URL,
} from '../constants';
import { isHTMLAnchorElement } from '../types/type-guards';

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function createFooter(): HTMLElement {
  const footer = new Tag('footer', 'app-footer');
  const content = new Tag('div', 'footer-content');
  const schoolLink = new Tag('a', 'footer-school-link');
  const logo = new Tag('img', 'footer-logo');
  const schoolName = new Tag('span', 'footer-school', SCHOOL_NAME);
  const authorLink = new Tag('a', 'footer-author', AUTHOR_NICKNAME);
  const currentYear = new Date().getFullYear();
  const yearText = new Tag('time', 'footer-year', currentYear.toString());

  yearText.setAttribute('datetime', currentYear.toString());

  logo.setAttribute('src', toSafeString(SCHOOL_LOGO_URL));
  logo.setAttribute('alt', toSafeString(SCHOOL_NAME));

  const schoolLinkEl = schoolLink.element;

  if (isHTMLAnchorElement(schoolLinkEl)) {
    schoolLinkEl.href = SCHOOL_URL;
    schoolLinkEl.target = '_blank';
    schoolLinkEl.rel = 'noreferrer';
  }

  schoolLink.element.append(logo.element, schoolName.element);

  const authorElement = authorLink.element;

  if (isHTMLAnchorElement(authorElement)) {
    authorElement.href = toSafeString(AUTHOR_GITHUB_URL);
    authorElement.target = '_blank';
    authorElement.rel = 'noreferrer';
  }

  content.element.append(
    schoolLink.element,
    authorLink.element,
    yearText.element
  );
  footer.element.append(content.element);

  return footer.element;
}
