import DomElement from './create-element';

export default class Button extends DomElement {
  constructor(className: string, text: string, onClick: () => void) {
    super('button', className, text);
    this.addEventListener('click', onClick);
  }
}
