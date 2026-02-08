export default class DomElement {
  public element: HTMLElement;

  constructor(tag: string, className: string = '', textContent: string = '') {
    this.element = document.createElement(tag);
    if (className) {
      const tokens = className
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0);
      for (const token of tokens) {
        this.element.classList.add(token);
      }
    }
    if (textContent) this.element.textContent = textContent;
  }

  public append(child: HTMLElement | DomElement): void {
    if (child instanceof DomElement) {
      this.element.append(child.element);
    } else {
      this.element.append(child);
    }
  }

  public addEventListener(type: string, listener: EventListener): void {
    this.element.addEventListener(type, listener);
  }

  public setAttribute(name: string, value: string): void {
    this.element.setAttribute(name, value);
  }
}
