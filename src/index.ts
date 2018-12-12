import {
    JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
    IMainMenu
} from '@jupyterlab/mainmenu'

import {
    ICommandPalette,
    Clipboard
} from '@jupyterlab/apputils';

import {
    INotebookTracker, Notebook
} from '@jupyterlab/notebook';

import {
    ICellModel, IAttachmentsCellModel, Cell
} from '@jupyterlab/cells'

import {
    getOpenPath,
    IDocumentManager,
} from '@jupyterlab/docmanager';

import {
    nbformat
} from '@jupyterlab/coreutils';

import '../style/index.css';

/**
 * The mimetype used for Jupyter cell data.
 */
const JUPYTER_ATTACHMENTS_MIME = 'application/vnd.jupyter.attachments';


namespace CommandIDs {
    export const cutCellAttachments = 'notebook:cut-cell-attachment';
    export const copyCellAttachments = 'notebook:copy-cell-attachment';
    export const pasteCellAttachments = 'notebook:paste-cell-attachment';
    export const insertImage = 'notebook:insert-image';
}
;


function cellModelIsIAttachmentsCellModel(model: ICellModel): model is IAttachmentsCellModel {
    return (<IAttachmentsCellModel>model).attachments !== undefined;
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


function cutOrCopyAttachments(notebook: Notebook, cut: boolean = false) {
    const model = notebook.activeCell.model;
    if (!cellModelIsIAttachmentsCellModel(model))
        return;

    const clipboard = Clipboard.getInstance();
    const attachmentCells = notebook.widgets.filter(cell => notebook.isSelectedOrActive(cell)
    ).filter(
        cell => cellModelIsIAttachmentsCellModel(cell.model)
    );

    notebook.mode = 'command';
    clipboard.clear();

    // Copy attachments
    const attachmentsJSONArray = attachmentCells.map(
        cell => (<IAttachmentsCellModel>cell.model).attachments.toJSON()
    );
    clipboard.setData(JUPYTER_ATTACHMENTS_MIME, attachmentsJSONArray);

    if (cut) {
        // Clear attachments
        attachmentCells.forEach(cell => {
            (<IAttachmentsCellModel>cell.model).attachments.clear()
        });
    }

    notebook.deselectAll();
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
                const activeCell = getActiveCellIfSingle(notebookTracker);
                if (activeCell === null)
                    return false;

                // Must be a markdown cell (supporting attachments)
                return activeCell.model.type == "markdown";
            },
            execute: () => {
                const model = notebookTracker.activeCell.model;
                if (!cellModelIsIAttachmentsCellModel(model))
                    return;

                const attachments = model.attachments;

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
                            const {name, mimetype, content} = args;
                            const bundle: nbformat.IMimeBundle = {};
                            bundle[mimetype] = content;

                            // Store attachment
                            attachments.set(name, bundle);

                            // Markdown template string to insert image
                            const markdown = `![${name}](attachment:${name})`;
                            model.value.insert(model.value.text.length, markdown);
                        },
                        () => {
                            console.log(`jupyterlab-attachments: Error, couldn't open path ${path}`);
                        }
                    );
                });
            }
        });


        /**
         * Test whether the cell attachment commands (cut, copy, paste) are enabled
         */
        function cellAttachmentCommandIsEnabled() {
            if (!activeNotebookExists(app, notebookTracker))
                return false;

            const notebook = notebookTracker.currentWidget.content;
            const selectedCells = notebook.widgets.filter(cell => notebook.isSelectedOrActive(cell));
            // As long as cells are selected or active
            return selectedCells.length > 0;
        }

        app.commands.addCommand(CommandIDs.cutCellAttachments, {
            label: 'Cut Cell Attachments',
            isEnabled: cellAttachmentCommandIsEnabled,
            execute: () => {
                cutOrCopyAttachments(notebookTracker.currentWidget.content, true);
            }

        });

        app.commands.addCommand(CommandIDs.copyCellAttachments, {
            label: 'Copy Cell Attachments',
            isEnabled: cellAttachmentCommandIsEnabled,
            execute: () => {
                cutOrCopyAttachments(notebookTracker.currentWidget.content);
            }
        });

        app.commands.addCommand(CommandIDs.pasteCellAttachments, {
            label: 'Paste Cell Attachments',
            isEnabled: () => {
                const clipboard = Clipboard.getInstance();
                if (!clipboard.hasData(JUPYTER_ATTACHMENTS_MIME)) {
                    return false;
                }
                return cellAttachmentCommandIsEnabled();
            },

            execute: () => {
                const notebook = notebookTracker.currentWidget.content;
                const attachmentCells = notebook.widgets.filter(
                    cell => notebook.isSelectedOrActive(cell)
                ).filter(
                    cell => cellModelIsIAttachmentsCellModel(cell.model)
                );

                const clipboard = Clipboard.getInstance();
                if (!clipboard.hasData(JUPYTER_ATTACHMENTS_MIME)) {
                    return;
                }

                const attachmentData = clipboard.getData(JUPYTER_ATTACHMENTS_MIME) as nbformat.IAttachments[];
                notebook.mode = 'command';

                console.log(attachmentData);

                attachmentData.forEach(data => {
                    attachmentCells.forEach(cell => {
                            Object.keys(data).forEach(key => {
                                const model = (<IAttachmentsCellModel>cell.model);
                                model.attachments.set(key, data[key])
                            })
                        }
                    )
                });


                notebook.deselectAll();
            }
        });

        // Add to main menu
        const cellAttachmentActionsGroup = [CommandIDs.cutCellAttachments,
            CommandIDs.copyCellAttachments,
            CommandIDs.pasteCellAttachments].map(
            command => {
                return {command};
            }
        );

        mainMenu.editMenu.addGroup(cellAttachmentActionsGroup, 10);

        // Add to edit menu
        const insertImageGroup = [CommandIDs.insertImage].map(
            command => {
                return {command};
            }
        );
        mainMenu.editMenu.addGroup(insertImageGroup, 11);

        // Add to command palette
        const category = 'Notebook Cell Operations';
        [
            CommandIDs.insertImage
        ].forEach(command => {
            palette.addItem({command, category});
        });
    }
};

export default extension;
