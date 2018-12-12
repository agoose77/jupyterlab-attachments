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
    console.log(model.type, "TYPE", model.type === "markdown");
    return model.type === "markdown";
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
                    docmanager_1.getOpenPath(docManager.services.contents).then(path => {
                        if (!path) {
                            return;
                        }
                        // Load image from path
                        docManager.services.contents.get(path, {
                            content: true,
                            type: "file", format: "base64"
                        }).then(args => {
                            let { name, mimetype, content } = args;
                            let bundle = {};
                            bundle[mimetype] = content;
                            attachments.set(name, bundle);
                            var markdown = `![${name}](${name})`;
                            model.value.insert(0, markdown);
                            console.log(args);
                        }, () => {
                            console.log("Couldn't open path");
                        });
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
