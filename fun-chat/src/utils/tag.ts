import DomElement from './create-element';

export default class Tag extends DomElement {
  constructor(tag: string, className: string, text?: string) {
    super(tag, className, text);
  }
}
