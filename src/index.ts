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
    Contents
} from '@jupyterlab/services';

import {
    IFileBrowserFactory
} from '@jupyterlab/filebrowser';

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
    export const insertImageFromFileBrowser = 'notebook:insert-image-from-file-browser';
}

/**
 * Test whether the given ICellModel is an IAttachmentsCellModel.
 */
function cellModelIsIAttachmentsCellModel(model: ICellModel): model is IAttachmentsCellModel {
    return (<IAttachmentsCellModel>model).attachments !== undefined;
}


/**
 * Test whether there is an active notebook.
 */
function activeNotebookExists(app: JupyterLab, tracker: INotebookTracker): boolean {
    return (
        tracker.currentWidget !== null &&
        tracker.currentWidget === app.shell.currentWidget
    );
}


/**
 * Return active cell if only single cell is selected, otherwise return null.
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
 * Cut or copy attachments from cell, depending upon flag.
 */
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
 * Insert Markdown code to embed image attachment.
 */
function insertImageFromAttachment(attachmentName: string, cellModel: ICellModel) {
    // Markdown template string to insert image
    const markdown = `![${attachmentName}](attachment:${attachmentName})`;
    cellModel.value.insert(cellModel.value.text.length, markdown);
}

/**
 * Create cell attachment from IFileModel
 */
function createAttachmentFromFileModel(fileModel: Contents.IModel, cellModel: IAttachmentsCellModel) {
    // Create MIMEBundle
    const {name, mimetype, content} = fileModel;
    const bundle: nbformat.IMimeBundle = {};
    bundle[mimetype] = content;
    cellModel.attachments.set(name, bundle);
}


/**
 * Initialization data for the jupyterlab-attachments extension.
 */
const extension: JupyterLabPlugin<void> = {
    id: 'jupyterlab-attachments',
    autoStart: true,
    requires: [ICommandPalette, IMainMenu, INotebookTracker, IDocumentManager, IFileBrowserFactory],
    activate: (app: JupyterLab,
               palette: ICommandPalette,
               mainMenu: IMainMenu,
               notebookTracker: INotebookTracker,
               docManager: IDocumentManager,
               fileBrowserFactory: IFileBrowserFactory) => {
        console.log('JupyterLab extension jupyterlab-attachments is activated!');

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
                const cellModel = notebookTracker.activeCell.model;
                if (!cellModelIsIAttachmentsCellModel(cellModel))
                    return;

                // Dialogue to request path of image
                getOpenPath(docManager.services.contents).then(path => {
                    if (!path) {
                        return;
                    }
                    // Load image from path
                    docManager.services.contents.get(path, {
                        content: true,
                        type: "file", format: "base64"
                    }).then(fileModel => {
                            createAttachmentFromFileModel(fileModel, cellModel);
                            insertImageFromAttachment(fileModel.name, cellModel);
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

            const content = notebookTracker.currentWidget.content;
            const selectedOrActiveCells = content.widgets.filter(cell => content.isSelectedOrActive(cell));
            return selectedOrActiveCells.length > 0;
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

                notebook.mode = 'command';

                // Paste attachments from all sources, for all targets
                const attachmentData = clipboard.getData(JUPYTER_ATTACHMENTS_MIME) as nbformat.IAttachments[];
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
        function insertFromFileBrowserIsActive(){
            const widget = notebookTracker.currentWidget;
            if (!widget) {
                return false;
            }
            const browser = fileBrowserFactory.tracker.currentWidget;
            const fileModel = browser.selectedItems().next();
            if (fileModel === undefined) {
                return false;
            }
            if (fileModel.mimetype === null || !fileModel.mimetype.includes("image")) {
                return false;
            }
            const activeCell = widget.content.activeCell;
            return cellModelIsIAttachmentsCellModel(activeCell.model);
        }
        app.commands.addCommand(CommandIDs.insertImageFromFileBrowser, {
            execute: () => {
                if (!insertFromFileBrowserIsActive())
                    return;

                const widget = notebookTracker.currentWidget;
                const browser = fileBrowserFactory.tracker.currentWidget;
                const fileModel = browser.selectedItems().next();
                const cellModel = widget.content.activeCell.model;
                if (!cellModelIsIAttachmentsCellModel(cellModel)) {
                    return;
                }

                let content = fileModel.content;
                let promise: Promise<Contents.IModel>;
                // If missing, load contents from file
                if (content === null) {
                    promise = docManager.services.contents.get(fileModel.path, {
                        content: true,
                        type: "file",
                        format: "base64"
                    });
                } else {
                    promise = Promise.resolve(fileModel);
                }
                // Create attachment from file and insert into markdown cell
                return promise.then(fileModel => {
                        createAttachmentFromFileModel(fileModel, cellModel);
                        insertImageFromAttachment(fileModel.name, cellModel);
                    },
                    () => {
                        console.log(`jupyterlab-attachments: Error, couldn't open path ${fileModel.path}`);
                    }
                );
            },
            isVisible: insertFromFileBrowserIsActive,
            iconClass: 'jp-MaterialIcon jp-AddIcon',
            label: 'Insert Image as Attachment',
            mnemonic: 0
        });

        app.commands.addCommand(CommandIDs.insertImageFromFileBrowser, {
            execute: () => {
                const widget = notebookTracker.currentWidget;

                if (!widget) {
                    return;
                }
                console.log(widget);
            },
            iconClass: 'jp-MaterialIcon jp-AddIcon',
            label: 'Attach to Active Cell',
            mnemonic: 0
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
            CommandIDs.insertImage, CommandIDs.copyCellAttachments, CommandIDs.cutCellAttachments, CommandIDs.pasteCellAttachments
        ].forEach(command => {
            palette.addItem({command, category});
        });

        // matches only non-directory items
        const selectorNotDir = '.jp-DirListing-item[data-isdir="false"]';

        app.contextMenu.addItem({
            command: CommandIDs.insertImageFromFileBrowser,
            selector: selectorNotDir,
            rank: 1
        });
    }
};

export default extension;
