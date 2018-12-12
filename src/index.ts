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
    ICellModel, IMarkdownCellModel, Cell
} from '@jupyterlab/cells'

// import {
//     JSONObject,
// } from '@phosphor/coreutils';

import {
    getOpenPath,
    // DocumentManager,
    IDocumentManager,
} from '@jupyterlab/docmanager';


import {nbformat} from '@jupyterlab/coreutils';

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
    return (<IMarkdownCellModel>model).type === "markdown";
}


/**
 * Whether there is an active notebook.
 */
function activeNotebookExists(app: JupyterLab, tracker: INotebookTracker): boolean {
    return (
        tracker.currentWidget !== null &&
        tracker.currentWidget === app.shell.currentWidget
    );
}


/**
 * Return active cell if only single cell is selected else null.
 */
function getActiveCellIfSingle(tracker: INotebookTracker): Cell {
    const {content} = tracker.currentWidget;
    // If there are selections that are not the active cell,
    // this command is confusing, so disable it.

    const index = content.activeCellIndex;
    for (let i = 0; i < content.widgets.length; ++i) {
        if (content.isSelected(content.widgets[i]) && i !== index) {
            return null;
        }
    }
    return content.activeCell;
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
            isEnabled: () => {
                if (!activeNotebookExists(app, notebookTracker))
                    return false;

                // Can only have one active cell
                let activeCell = getActiveCellIfSingle(notebookTracker);
                if (activeCell === null)
                    return false;

                return cellModelIsIMarkdownCellModel(activeCell.model);
            },
            execute: () => {
                let activeCell = notebookTracker.activeCell;
                if (activeCell === null)
                    return;

                let model = activeCell.model;
                if (!cellModelIsIMarkdownCellModel(model))
                    return;

                let attachments = model.attachments;

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
                            // Create MIMEBundle
                            let {name, mimetype, content} = args;
                            let bundle: nbformat.IMimeBundle = {};
                            bundle[mimetype] = content;

                            // Store attachment
                            attachments.set(name, bundle);

                            // Markdown template string to insert image
                            let markdown = `![${name}](${name})`;
                            model.value.insert(model.value.text.length, markdown);
                        },
                        () => {
                            console.log(`jupyterlab-attachments: Error, couldn't open path ${path}`);
                        }
                    );
                });
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
