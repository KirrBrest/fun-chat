import Button from '../utils/button';
import Tag from '../utils/tag';

const ABOUT_TITLE = 'About Us';
const BACK_LABEL = 'Back';

export function createAboutPage(): HTMLElement {
  const container = new Tag('section', 'page about-page');
  const title = new Tag('h1', 'page-title', ABOUT_TITLE);
  const backButton = new Button('nav-button', BACK_LABEL, () => {
    globalThis.history.back();
  });

  container.append(title);
  container.append(backButton);

  return container.element;
}
