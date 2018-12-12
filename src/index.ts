import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import '../style/index.css';


/**
 * Initialization data for the jupyterlab-attachments extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab-attachments',
  autoStart: true,
  activate: (app: JupyterLab) => {
    console.log('JupyterLab extension jupyterlab-attachments is activated!');
  }
};

export default extension;
