import './ui/style.css';
import './ui/app.js';

import React from 'react';
import ReactDOM from 'react-dom/client';

import ReactMountShell from './ui/ReactMountShell.jsx';
import { bootEngine } from './engine/index.js';

const reactMountNode = document.createElement('div');
reactMountNode.id = 'react-mount-boundary';
reactMountNode.setAttribute('aria-hidden', 'true');
reactMountNode.style.display = 'none';
document.body.appendChild(reactMountNode);

ReactDOM.createRoot(reactMountNode).render(
  React.createElement(React.StrictMode, null, React.createElement(ReactMountShell))
);

bootEngine();
