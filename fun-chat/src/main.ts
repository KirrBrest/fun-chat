import { initApp } from './app';
import DomElement from './utils/create-element';
import './styles.css';

const root = new DomElement('div', 'app-root');

initApp(root.element);
document.body.append(root.element);
