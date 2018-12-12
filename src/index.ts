import {
    JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
    IMainMenu
} from '@jupyterlab/mainmenu'

import {
    ICommandPalette
} from '@jupyterlab/apputils';
import {
    INotebookTracker
} from '@jupyterlab/notebook';

import {
    ICellModel, IMarkdownCellModel
} from '@jupyterlab/cells'

// import {
//     JSONObject,
// } from '@phosphor/coreutils';

import {
    getOpenPath,
    // DocumentManager,
    IDocumentManager,
} from '@jupyterlab/docmanager';


import { nbformat } from '@jupyterlab/coreutils';

//
// import {
//     Widget, Menu
// } from '@phosphor/widgets';

import '../style/index.css';


namespace CommandIDs {
    export const cutCellAttachment = 'notebook:cut-cell-attachment';
    export const copyCellAttachment = 'notebook:copy-cell-attachment';
    export const pasteCellAttachment = 'notebook:paste-cell-attachment';
    export const insertImage = 'notebook:insert-image';
}
;


function cellModelIsIMarkdownCellModel(model: ICellModel): model is IMarkdownCellModel {
    console.log((<IMarkdownCellModel>model).type, "TYPE",  (<IMarkdownCellModel>model).type === "markdown");
    return (<IMarkdownCellModel>model).type === "markdown";
}

/**
 * Initialization data for the jupyterlab-attachments extension.
 */
const extension: JupyterLabPlugin<void> = {
    id: 'jupyterlab-attachments',
    autoStart: true,
    requires: [ICommandPalette, IMainMenu, INotebookTracker, IDocumentManager],
    activate: (app: JupyterLab, palette: ICommandPalette, mainMenu: IMainMenu, notebookTracker: INotebookTracker,
               docManager: IDocumentManager) => {
        console.log('JupyterLab extension [4] jupyterlab-attachments is activated!');

        // Add an application command
        app.commands.addCommand(CommandIDs.insertImage, {
            label: 'Insert Image',
            execute: () => {
                let model = notebookTracker.activeCell.model;
                if (cellModelIsIMarkdownCellModel(model)) {
                    console.log("ISMD");
                    let attachments = model.attachments;

                    // Print existing
                    attachments.keys.forEach(key => {
                        console.log(key, attachments.get(key).toJSON(), attachments.get(key));
                    });

                    // Dialogue to request path of image
                    getOpenPath(docManager.services.contents).then(path => {
                        if (!path) {
                            return;
                        }
                        // Load image from path
                        docManager.services.contents.get(path, {
                            content: true,
                            type: "file", format: "base64"
                        }).then(args => {
                                let {name, mimetype, content} = args;
                                let bundle: nbformat.IMimeBundle = {};
                                bundle[mimetype] = content;
                                attachments.set(name, bundle);

                                var markdown = `![${name}](${name})`;
                                model.value.insert(0, markdown);
                                console.log(args);
                            },
                            () => {
                                console.log("Couldn't open path");
                            }
                        );
                    });

                }
            }
        });

        // add to mainMenu

        // const cellAttachmentActionsGroup = [CommandIDs.cutCellAttachment,
        //     CommandIDs.copyCellAttachment,
        //     CommandIDs.pasteCellAttachment].map(
        //     command => {
        //         return {command};
        //     }
        // );

        // mainMenu.editMenu.addGroup(cellAttachmentActionsGroup, 10);

        // Add to edit menu
        const insertImageGroup = [CommandIDs.insertImage].map(
            command => {
                return {command};
            }
        );
        mainMenu.editMenu.addGroup(insertImageGroup, 200);

        // Add to command palette
        let category = 'Notebook Cell Operations';
        [
            CommandIDs.insertImage
        ].forEach(command => {
            palette.addItem({command, category});
        });
    }
};

export default extension;
