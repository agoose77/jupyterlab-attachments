"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mainmenu_1 = require("@jupyterlab/mainmenu");
const apputils_1 = require("@jupyterlab/apputils");
const notebook_1 = require("@jupyterlab/notebook");
// import {
//     JSONObject,
// } from '@phosphor/coreutils';
const docmanager_1 = require("@jupyterlab/docmanager");
//
// import {
//     Widget, Menu
// } from '@phosphor/widgets';
require("../style/index.css");
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.cutCellAttachment = 'notebook:cut-cell-attachment';
    CommandIDs.copyCellAttachment = 'notebook:copy-cell-attachment';
    CommandIDs.pasteCellAttachment = 'notebook:paste-cell-attachment';
    CommandIDs.insertImage = 'notebook:insert-image';
})(CommandIDs || (CommandIDs = {}));
;
function cellModelIsIMarkdownCellModel(model) {
    return model.type === "markdown";
}
/**
 * Whether there is an active notebook.
 */
function activeNotebookExists(app, tracker) {
    return (tracker.currentWidget !== null &&
        tracker.currentWidget === app.shell.currentWidget);
}
/**
 * Return active cell if only single cell is selected else null.
 */
function getActiveCellIfSingle(tracker) {
    const { content } = tracker.currentWidget;
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
const extension = {
    id: 'jupyterlab-attachments',
    autoStart: true,
    requires: [apputils_1.ICommandPalette, mainmenu_1.IMainMenu, notebook_1.INotebookTracker, docmanager_1.IDocumentManager],
    activate: (app, palette, mainMenu, notebookTracker, docManager) => {
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
                docmanager_1.getOpenPath(docManager.services.contents).then(path => {
                    if (!path) {
                        return;
                    }
                    // Load image from path
                    docManager.services.contents.get(path, {
                        content: true,
                        type: "file", format: "base64"
                    }).then(args => {
                        // Create MIMEBundle
                        let { name, mimetype, content } = args;
                        let bundle = {};
                        bundle[mimetype] = content;
                        // Store attachment
                        attachments.set(name, bundle);
                        // Markdown template string to insert image
                        let markdown = `![${name}](${name})`;
                        model.value.insert(model.value.text.length, markdown);
                    }, () => {
                        console.log(`jupyterlab-attachments: Error, couldn't open path ${path}`);
                    });
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
        const insertImageGroup = [CommandIDs.insertImage].map(command => {
            return { command };
        });
        mainMenu.editMenu.addGroup(insertImageGroup, 200);
        // Add to command palette
        let category = 'Notebook Cell Operations';
        [
            CommandIDs.insertImage
        ].forEach(command => {
            palette.addItem({ command, category });
        });
    }
};
exports.default = extension;
