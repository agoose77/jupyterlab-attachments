"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
const cells_1 = require("@jupyterlab/cells");
const algorithm_1 = require("@phosphor/algorithm");
const domutils_1 = require("@phosphor/domutils");
const signaling_1 = require("@phosphor/signaling");
const React = __importStar(require("react"));
// The message to display to the user when prompting to trust the notebook.
const TRUST_MESSAGE = (React.createElement("p", null,
    "A trusted Jupyter notebook may execute hidden malicious code when you open it.",
    React.createElement("br", null),
    "Selecting trust will re-render this notebook in a trusted state.",
    React.createElement("br", null),
    "For more information, see the",
    React.createElement("a", { href: "https://jupyter-notebook.readthedocs.io/en/stable/security.html" }, "Jupyter security documentation")));
/**
 * The mimetype used for Jupyter cell data.
 */
const JUPYTER_CELL_MIME = 'application/vnd.jupyter.cells';
/**
 * A collection of actions that run against notebooks.
 *
 * #### Notes
 * All of the actions are a no-op if there is no model on the notebook.
 * The actions set the widget `mode` to `'command'` unless otherwise specified.
 * The actions will preserve the selection on the notebook widget unless
 * otherwise specified.
 */
class NotebookActions {
    /**
     * A signal that emits whenever a cell is run.
     */
    static get executed() {
        return Private.executed;
    }
    /**
     * A private constructor for the `NotebookActions` class.
     *
     * #### Notes
     * This class can never be instantiated. Its static member `executed` will be
     * merged with the `NotebookActions` namespace. The reason it exists as a
     * standalone class is because at run time, the `Private.executed` variable
     * does not yet exist, so it needs to be referenced via a getter.
     */
    constructor() { }
}
exports.NotebookActions = NotebookActions;
/**
 * A namespace for `NotebookActions` static methods.
 */
(function (NotebookActions) {
    /**
     * Split the active cell into two cells.
     *
     * @param widget - The target notebook widget.
     *
     * #### Notes
     * It will preserve the existing mode.
     * The second cell will be activated.
     * The existing selection will be cleared.
     * The leading whitespace in the second cell will be removed.
     * If there is no content, two empty cells will be created.
     * Both cells will have the same type as the original cell.
     * This action can be undone.
     */
    function splitCell(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.deselectAll();
        const nbModel = notebook.model;
        const index = notebook.activeCellIndex;
        const child = notebook.widgets[index];
        const editor = child.editor;
        const position = editor.getCursorPosition();
        const offset = editor.getOffsetAt(position);
        const orig = child.model.value.text;
        // Create new models to preserve history.
        const clone0 = Private.cloneCell(nbModel, child.model);
        const clone1 = Private.cloneCell(nbModel, child.model);
        if (clone0.type === 'code') {
            clone0.outputs.clear();
        }
        clone0.value.text = orig
            .slice(0, offset)
            .replace(/^\n+/, '')
            .replace(/\n+$/, '');
        clone1.value.text = orig
            .slice(offset)
            .replace(/^\n+/, '')
            .replace(/\n+$/, '');
        // Make the changes while preserving history.
        const cells = nbModel.cells;
        cells.beginCompoundOperation();
        cells.set(index, clone0);
        cells.insert(index + 1, clone1);
        cells.endCompoundOperation();
        notebook.activeCellIndex++;
        Private.handleState(notebook, state);
    }
    NotebookActions.splitCell = splitCell;
    /**
     * Merge the selected cells.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The widget mode will be preserved.
     * If only one cell is selected, the next cell will be selected.
     * If the active cell is a code cell, its outputs will be cleared.
     * This action can be undone.
     * The final cell will have the same type as the active cell.
     * If the active cell is a markdown cell, it will be unrendered.
     */
    function mergeCells(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        const toMerge = [];
        const toDelete = [];
        const model = notebook.model;
        const cells = model.cells;
        const primary = notebook.activeCell;
        const active = notebook.activeCellIndex;
        // Get the cells to merge.
        notebook.widgets.forEach((child, index) => {
            if (notebook.isSelectedOrActive(child)) {
                toMerge.push(child.model.value.text);
                if (index !== active) {
                    toDelete.push(child.model);
                }
            }
        });
        // Check for only a single cell selected.
        if (toMerge.length === 1) {
            // Bail if it is the last cell.
            if (active === cells.length - 1) {
                return;
            }
            // Otherwise merge with the next cell.
            const cellModel = cells.get(active + 1);
            toMerge.push(cellModel.value.text);
            toDelete.push(cellModel);
        }
        notebook.deselectAll();
        // Create a new cell for the source to preserve history.
        const newModel = Private.cloneCell(model, primary.model);
        newModel.value.text = toMerge.join('\n\n');
        if (newModel.type === 'code') {
            newModel.outputs.clear();
        }
        // Make the changes while preserving history.
        cells.beginCompoundOperation();
        cells.set(active, newModel);
        toDelete.forEach(cell => {
            cells.removeValue(cell);
        });
        cells.endCompoundOperation();
        // If the original cell is a markdown cell, make sure
        // the new cell is unrendered.
        if (primary instanceof cells_1.MarkdownCell) {
            notebook.activeCell.rendered = false;
        }
        Private.handleState(notebook, state);
    }
    NotebookActions.mergeCells = mergeCells;
    /**
     * Delete the selected cells.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The cell after the last selected cell will be activated.
     * It will add a code cell if all cells are deleted.
     * This action can be undone.
     */
    function deleteCells(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        Private.deleteCells(notebook);
        Private.handleState(notebook, state);
    }
    NotebookActions.deleteCells = deleteCells;
    /**
     * Insert a new code cell above the active cell.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The widget mode will be preserved.
     * This action can be undone.
     * The existing selection will be cleared.
     * The new cell will the active cell.
     */
    function insertAbove(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        const model = notebook.model;
        const cell = model.contentFactory.createCodeCell({});
        const active = notebook.activeCellIndex;
        model.cells.insert(active, cell);
        // Make the newly inserted cell active.
        notebook.activeCellIndex = active;
        notebook.deselectAll();
        Private.handleState(notebook, state, true);
    }
    NotebookActions.insertAbove = insertAbove;
    /**
     * Insert a new code cell below the active cell.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The widget mode will be preserved.
     * This action can be undone.
     * The existing selection will be cleared.
     * The new cell will be the active cell.
     */
    function insertBelow(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        const model = notebook.model;
        const cell = model.contentFactory.createCodeCell({});
        model.cells.insert(notebook.activeCellIndex + 1, cell);
        // Make the newly inserted cell active.
        notebook.activeCellIndex++;
        notebook.deselectAll();
        Private.handleState(notebook, state, true);
    }
    NotebookActions.insertBelow = insertBelow;
    /**
     * Move the selected cell(s) down.
     *
     * @param notebook = The target notebook widget.
     */
    function moveDown(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        const cells = notebook.model.cells;
        const widgets = notebook.widgets;
        cells.beginCompoundOperation();
        for (let i = cells.length - 2; i > -1; i--) {
            if (notebook.isSelectedOrActive(widgets[i])) {
                if (!notebook.isSelectedOrActive(widgets[i + 1])) {
                    cells.move(i, i + 1);
                    if (notebook.activeCellIndex === i) {
                        notebook.activeCellIndex++;
                    }
                    notebook.select(widgets[i + 1]);
                    notebook.deselect(widgets[i]);
                }
            }
        }
        cells.endCompoundOperation();
        Private.handleState(notebook, state, true);
    }
    NotebookActions.moveDown = moveDown;
    /**
     * Move the selected cell(s) up.
     *
     * @param widget - The target notebook widget.
     */
    function moveUp(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        const cells = notebook.model.cells;
        const widgets = notebook.widgets;
        cells.beginCompoundOperation();
        for (let i = 1; i < cells.length; i++) {
            if (notebook.isSelectedOrActive(widgets[i])) {
                if (!notebook.isSelectedOrActive(widgets[i - 1])) {
                    cells.move(i, i - 1);
                    if (notebook.activeCellIndex === i) {
                        notebook.activeCellIndex--;
                    }
                    notebook.select(widgets[i - 1]);
                    notebook.deselect(widgets[i]);
                }
            }
        }
        cells.endCompoundOperation();
        Private.handleState(notebook, state, true);
    }
    NotebookActions.moveUp = moveUp;
    /**
     * Change the selected cell type(s).
     *
     * @param notebook - The target notebook widget.
     *
     * @param value - The target cell type.
     *
     * #### Notes
     * It should preserve the widget mode.
     * This action can be undone.
     * The existing selection will be cleared.
     * Any cells converted to markdown will be unrendered.
     */
    function changeCellType(notebook, value) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        Private.changeCellType(notebook, value);
        Private.handleState(notebook, state);
    }
    NotebookActions.changeCellType = changeCellType;
    /**
     * Run the selected cell(s).
     *
     * @param notebook - The target notebook widget.
     *
     * @param session - The optional client session object.
     *
     * #### Notes
     * The last selected cell will be activated, but not scrolled into view.
     * The existing selection will be cleared.
     * An execution error will prevent the remaining code cells from executing.
     * All markdown cells will be rendered.
     */
    function run(notebook, session) {
        if (!notebook.model || !notebook.activeCell) {
            return Promise.resolve(false);
        }
        const state = Private.getState(notebook);
        const promise = Private.runSelected(notebook, session);
        Private.handleRunState(notebook, state, false);
        return promise;
    }
    NotebookActions.run = run;
    /**
     * Run the selected cell(s) and advance to the next cell.
     *
     * @param notebook - The target notebook widget.
     *
     * @param session - The optional client session object.
     *
     * #### Notes
     * The existing selection will be cleared.
     * The cell after the last selected cell will be activated and scrolled into view.
     * An execution error will prevent the remaining code cells from executing.
     * All markdown cells will be rendered.
     * If the last selected cell is the last cell, a new code cell
     * will be created in `'edit'` mode.  The new cell creation can be undone.
     */
    function runAndAdvance(notebook, session) {
        if (!notebook.model || !notebook.activeCell) {
            return Promise.resolve(false);
        }
        const state = Private.getState(notebook);
        const promise = Private.runSelected(notebook, session);
        const model = notebook.model;
        if (notebook.activeCellIndex === notebook.widgets.length - 1) {
            const cell = model.contentFactory.createCodeCell({});
            model.cells.push(cell);
            notebook.activeCellIndex++;
            notebook.mode = 'edit';
        }
        else {
            notebook.activeCellIndex++;
        }
        Private.handleRunState(notebook, state, true);
        return promise;
    }
    NotebookActions.runAndAdvance = runAndAdvance;
    /**
     * Run the selected cell(s) and insert a new code cell.
     *
     * @param notebook - The target notebook widget.
     *
     * @param session - The optional client session object.
     *
     * #### Notes
     * An execution error will prevent the remaining code cells from executing.
     * All markdown cells will be rendered.
     * The widget mode will be set to `'edit'` after running.
     * The existing selection will be cleared.
     * The cell insert can be undone.
     * The new cell will be scrolled into view.
     */
    function runAndInsert(notebook, session) {
        if (!notebook.model || !notebook.activeCell) {
            return Promise.resolve(false);
        }
        const state = Private.getState(notebook);
        const promise = Private.runSelected(notebook, session);
        const model = notebook.model;
        const cell = model.contentFactory.createCodeCell({});
        model.cells.insert(notebook.activeCellIndex + 1, cell);
        notebook.activeCellIndex++;
        notebook.mode = 'edit';
        Private.handleRunState(notebook, state, true);
        return promise;
    }
    NotebookActions.runAndInsert = runAndInsert;
    /**
     * Run all of the cells in the notebook.
     *
     * @param notebook - The target notebook widget.
     *
     * @param session - The optional client session object.
     *
     * #### Notes
     * The existing selection will be cleared.
     * An execution error will prevent the remaining code cells from executing.
     * All markdown cells will be rendered.
     * The last cell in the notebook will be activated and scrolled into view.
     */
    function runAll(notebook, session) {
        if (!notebook.model || !notebook.activeCell) {
            return Promise.resolve(false);
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(child => {
            notebook.select(child);
        });
        const promise = Private.runSelected(notebook, session);
        Private.handleRunState(notebook, state, true);
        return promise;
    }
    NotebookActions.runAll = runAll;
    /**
     * Run all of the cells before the currently active cell (exclusive).
     *
     * @param notebook - The target notebook widget.
     *
     * @param session - The optional client session object.
     *
     * #### Notes
     * The existing selection will be cleared.
     * An execution error will prevent the remaining code cells from executing.
     * All markdown cells will be rendered.
     * The currently active cell will remain selected.
     */
    function runAllAbove(notebook, session) {
        const { activeCell, activeCellIndex, model } = notebook;
        if (!model || !activeCell || activeCellIndex < 1) {
            return Promise.resolve(false);
        }
        const state = Private.getState(notebook);
        notebook.activeCellIndex--;
        notebook.deselectAll();
        for (let i = 0; i < notebook.activeCellIndex; ++i) {
            notebook.select(notebook.widgets[i]);
        }
        const promise = Private.runSelected(notebook, session);
        notebook.activeCellIndex++;
        Private.handleRunState(notebook, state, true);
        return promise;
    }
    NotebookActions.runAllAbove = runAllAbove;
    /**
     * Run all of the cells after the currently active cell (inclusive).
     *
     * @param notebook - The target notebook widget.
     *
     * @param session - The optional client session object.
     *
     * #### Notes
     * The existing selection will be cleared.
     * An execution error will prevent the remaining code cells from executing.
     * All markdown cells will be rendered.
     * The last cell in the notebook will be activated and scrolled into view.
     */
    function runAllBelow(notebook, session) {
        if (!notebook.model || !notebook.activeCell) {
            return Promise.resolve(false);
        }
        const state = Private.getState(notebook);
        notebook.deselectAll();
        for (let i = notebook.activeCellIndex; i < notebook.widgets.length; ++i) {
            notebook.select(notebook.widgets[i]);
        }
        const promise = Private.runSelected(notebook, session);
        Private.handleRunState(notebook, state, true);
        return promise;
    }
    NotebookActions.runAllBelow = runAllBelow;
    /**
     * Select the above the active cell.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The widget mode will be preserved.
     * This is a no-op if the first cell is the active cell.
     * The existing selection will be cleared.
     */
    function selectAbove(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        if (notebook.activeCellIndex === 0) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.activeCellIndex -= 1;
        notebook.deselectAll();
        Private.handleState(notebook, state, true);
    }
    NotebookActions.selectAbove = selectAbove;
    /**
     * Select the cell below the active cell.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The widget mode will be preserved.
     * This is a no-op if the last cell is the active cell.
     * The existing selection will be cleared.
     */
    function selectBelow(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        if (notebook.activeCellIndex === notebook.widgets.length - 1) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.activeCellIndex += 1;
        notebook.deselectAll();
        Private.handleState(notebook, state, true);
    }
    NotebookActions.selectBelow = selectBelow;
    /**
     * Extend the selection to the cell above.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This is a no-op if the first cell is the active cell.
     * The new cell will be activated.
     */
    function extendSelectionAbove(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        // Do not wrap around.
        if (notebook.activeCellIndex === 0) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.mode = 'command';
        notebook.extendContiguousSelectionTo(notebook.activeCellIndex - 1);
        Private.handleState(notebook, state, true);
    }
    NotebookActions.extendSelectionAbove = extendSelectionAbove;
    /**
     * Extend the selection to the cell below.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This is a no-op if the last cell is the active cell.
     * The new cell will be activated.
     */
    function extendSelectionBelow(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        // Do not wrap around.
        if (notebook.activeCellIndex === notebook.widgets.length - 1) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.mode = 'command';
        notebook.extendContiguousSelectionTo(notebook.activeCellIndex + 1);
        Private.handleState(notebook, state, true);
    }
    NotebookActions.extendSelectionBelow = extendSelectionBelow;
    /**
     * Select all of the cells of the notebook.
     *
     * @param notebook - the target notebook widget.
     */
    function selectAll(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        notebook.widgets.forEach(child => {
            notebook.select(child);
        });
    }
    NotebookActions.selectAll = selectAll;
    /**
     * Deselect all of the cells of the notebook.
     *
     * @param notebook - the targe notebook widget.
     */
    function deselectAll(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        notebook.deselectAll();
    }
    NotebookActions.deselectAll = deselectAll;
    /**
     * Copy the selected cell data to a clipboard.
     *
     * @param notebook - The target notebook widget.
     */
    function copy(notebook) {
        Private.copyOrCut(notebook, false);
    }
    NotebookActions.copy = copy;
    /**
     * Cut the selected cell data to a clipboard.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This action can be undone.
     * A new code cell is added if all cells are cut.
     */
    function cut(notebook) {
        Private.copyOrCut(notebook, true);
    }
    NotebookActions.cut = cut;
    /**
     * Paste cells from the application clipboard.
     *
     * @param notebook - The target notebook widget.
     *
     * @param mode - the mode of the paste operation: 'below' pastes cells
     *   below the active cell, 'above' pastes cells above the active cell,
     *   and 'replace' removes the currently selected cells and pastes cells
     *   in their place.
     *
     * #### Notes
     * The last pasted cell becomes the active cell.
     * This is a no-op if there is no cell data on the clipboard.
     * This action can be undone.
     */
    function paste(notebook, mode = 'below') {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const clipboard = apputils_1.Clipboard.getInstance();
        if (!clipboard.hasData(JUPYTER_CELL_MIME)) {
            return;
        }
        const state = Private.getState(notebook);
        const values = clipboard.getData(JUPYTER_CELL_MIME);
        const model = notebook.model;
        notebook.mode = 'command';
        const newCells = values.map(cell => {
            switch (cell.cell_type) {
                case 'code':
                    return model.contentFactory.createCodeCell({ cell });
                case 'markdown':
                    return model.contentFactory.createMarkdownCell({ cell });
                default:
                    return model.contentFactory.createRawCell({ cell });
            }
        });
        const cells = notebook.model.cells;
        let index;
        cells.beginCompoundOperation();
        // Set the starting index of the paste operation depending upon the mode.
        switch (mode) {
            case 'below':
                index = notebook.activeCellIndex;
                break;
            case 'above':
                index = notebook.activeCellIndex - 1;
                break;
            case 'replace':
                // Find the cells to delete.
                const toDelete = [];
                notebook.widgets.forEach((child, index) => {
                    const deletable = child.model.metadata.get('deletable') !== false;
                    if (notebook.isSelectedOrActive(child) && deletable) {
                        toDelete.push(index);
                    }
                });
                // If cells are not deletable, we may not have anything to delete.
                if (toDelete.length > 0) {
                    // Delete the cells as one undo event.
                    toDelete.reverse().forEach(i => {
                        cells.remove(i);
                    });
                }
                index = toDelete[0];
                break;
            default:
                break;
        }
        newCells.forEach(cell => {
            cells.insert(++index, cell);
        });
        cells.endCompoundOperation();
        notebook.activeCellIndex += newCells.length;
        notebook.deselectAll();
        Private.handleState(notebook, state);
    }
    NotebookActions.paste = paste;
    /**
     * Undo a cell action.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This is a no-op if if there are no cell actions to undo.
     */
    function undo(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.mode = 'command';
        notebook.model.cells.undo();
        notebook.deselectAll();
        Private.handleState(notebook, state);
    }
    NotebookActions.undo = undo;
    /**
     * Redo a cell action.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This is a no-op if there are no cell actions to redo.
     */
    function redo(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.mode = 'command';
        notebook.model.cells.redo();
        notebook.deselectAll();
        Private.handleState(notebook, state);
    }
    NotebookActions.redo = redo;
    /**
     * Toggle the line number of all cells.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The original state is based on the state of the active cell.
     * The `mode` of the widget will be preserved.
     */
    function toggleAllLineNumbers(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        const config = notebook.editorConfig;
        const lineNumbers = !(config.code.lineNumbers &&
            config.markdown.lineNumbers &&
            config.raw.lineNumbers);
        const newConfig = {
            code: Object.assign({}, config.code, { lineNumbers }),
            markdown: Object.assign({}, config.markdown, { lineNumbers }),
            raw: Object.assign({}, config.raw, { lineNumbers })
        };
        notebook.editorConfig = newConfig;
        Private.handleState(notebook, state);
    }
    NotebookActions.toggleAllLineNumbers = toggleAllLineNumbers;
    /**
     * Clear the code outputs of the selected cells.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The widget `mode` will be preserved.
     */
    function clearOutputs(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        algorithm_1.each(notebook.model.cells, (cell, index) => {
            const child = notebook.widgets[index];
            if (notebook.isSelectedOrActive(child) && cell.type === 'code') {
                cell.outputs.clear();
                child.outputHidden = false;
                cell.executionCount = null;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.clearOutputs = clearOutputs;
    /**
     * Clear all the code outputs on the widget.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The widget `mode` will be preserved.
     */
    function clearAllOutputs(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        algorithm_1.each(notebook.model.cells, (cell, index) => {
            const child = notebook.widgets[index];
            if (cell.type === 'code') {
                cell.outputs.clear();
                cell.executionCount = null;
                child.outputHidden = false;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.clearAllOutputs = clearAllOutputs;
    /**
     * Hide the code on selected code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function hideCode(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (notebook.isSelectedOrActive(cell) && cell.model.type === 'code') {
                cell.inputHidden = true;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.hideCode = hideCode;
    /**
     * Show the code on selected code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function showCode(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (notebook.isSelectedOrActive(cell) && cell.model.type === 'code') {
                cell.inputHidden = false;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.showCode = showCode;
    /**
     * Hide the code on all code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function hideAllCode(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (cell.model.type === 'code') {
                cell.inputHidden = true;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.hideAllCode = hideAllCode;
    /**
     * Show the code on all code cells.
     *
     * @param widget - The target notebook widget.
     */
    function showAllCode(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (cell.model.type === 'code') {
                cell.inputHidden = false;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.showAllCode = showAllCode;
    /**
     * Hide the output on selected code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function hideOutput(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (notebook.isSelectedOrActive(cell) && cell.model.type === 'code') {
                cell.outputHidden = true;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.hideOutput = hideOutput;
    /**
     * Show the output on selected code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function showOutput(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (notebook.isSelectedOrActive(cell) && cell.model.type === 'code') {
                cell.outputHidden = false;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.showOutput = showOutput;
    /**
     * Hide the output on all code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function hideAllOutputs(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (cell.model.type === 'code') {
                cell.outputHidden = true;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.hideAllOutputs = hideAllOutputs;
    /**
     * Show the output on all code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function showAllOutputs(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (cell.model.type === 'code') {
                cell.outputHidden = false;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.showAllOutputs = showAllOutputs;
    /**
     * Enable output scrolling for all selected cells.
     *
     * @param notebook - The target notebook widget.
     */
    function enableOutputScrolling(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (notebook.isSelectedOrActive(cell) && cell.model.type === 'code') {
                cell.outputsScrolled = true;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.enableOutputScrolling = enableOutputScrolling;
    /**
     * Disable output scrolling for all selected cells.
     *
     * @param notebook - The target notebook widget.
     */
    function disableOutputScrolling(notebook) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            if (notebook.isSelectedOrActive(cell) && cell.model.type === 'code') {
                cell.outputsScrolled = false;
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.disableOutputScrolling = disableOutputScrolling;
    /**
     * Persists the collapsed state of all code cell outputs to the model.
     *
     * @param notebook - The target notebook widget.
     */
    function persistViewState(notebook) {
        if (!notebook.model) {
            return;
        }
        const state = Private.getState(notebook);
        notebook.widgets.forEach(cell => {
            const { model, inputHidden } = cell;
            const metadata = model.metadata;
            const jupyter = metadata.get('jupyter') || {};
            if (inputHidden) {
                jupyter.source_hidden = true;
            }
            else {
                delete jupyter.source_hidden;
            }
            if (cell.model.type === 'code') {
                const { outputHidden, outputsScrolled } = cell;
                // set both metadata keys
                // https://github.com/jupyterlab/jupyterlab/pull/3981#issuecomment-391139167
                if (outputHidden) {
                    model.metadata.set('collapsed', true);
                    jupyter.outputs_hidden = true;
                }
                else {
                    model.metadata.delete('collapsed');
                    delete jupyter.outputs_hidden;
                }
                if (outputsScrolled) {
                    model.metadata.set('scrolled', true);
                }
                else {
                    model.metadata.delete('scrolled');
                }
            }
            if (Object.keys(jupyter).length === 0) {
                metadata.delete('jupyter');
            }
            else {
                metadata.set('jupyter', jupyter);
            }
        });
        Private.handleState(notebook, state);
    }
    NotebookActions.persistViewState = persistViewState;
    /**
     * Set the markdown header level.
     *
     * @param notebook - The target notebook widget.
     *
     * @param level - The header level.
     *
     * #### Notes
     * All selected cells will be switched to markdown.
     * The level will be clamped between 1 and 6.
     * If there is an existing header, it will be replaced.
     * There will always be one blank space after the header.
     * The cells will be unrendered.
     */
    function setMarkdownHeader(notebook, level) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = Private.getState(notebook);
        const cells = notebook.model.cells;
        level = Math.min(Math.max(level, 1), 6);
        notebook.widgets.forEach((child, index) => {
            if (notebook.isSelectedOrActive(child)) {
                Private.setMarkdownHeader(cells.get(index), level);
            }
        });
        Private.changeCellType(notebook, 'markdown');
        Private.handleState(notebook, state);
    }
    NotebookActions.setMarkdownHeader = setMarkdownHeader;
    /**
     * Trust the notebook after prompting the user.
     *
     * @param notebook - The target notebook widget.
     *
     * @returns a promise that resolves when the transaction is finished.
     *
     * #### Notes
     * No dialog will be presented if the notebook is already trusted.
     */
    function trust(notebook) {
        if (!notebook.model) {
            return Promise.resolve();
        }
        // Do nothing if already trusted.
        const cells = algorithm_1.toArray(notebook.model.cells);
        const trusted = cells.every(cell => cell.trusted);
        if (trusted) {
            return apputils_1.showDialog({
                body: 'Notebook is already trusted',
                buttons: [apputils_1.Dialog.okButton()]
            }).then(() => undefined);
        }
        return apputils_1.showDialog({
            body: TRUST_MESSAGE,
            title: 'Trust this notebook?',
            buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.warnButton()]
        }).then(result => {
            if (result.button.accept) {
                cells.forEach(cell => {
                    cell.trusted = true;
                });
            }
        });
    }
    NotebookActions.trust = trust;
})(NotebookActions = exports.NotebookActions || (exports.NotebookActions = {}));
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * A signal that emits whenever a cell is run.
     */
    Private.executed = new signaling_1.Signal({});
    /**
     * Get the state of a widget before running an action.
     */
    function getState(notebook) {
        return {
            wasFocused: notebook.node.contains(document.activeElement),
            activeCell: notebook.activeCell
        };
    }
    Private.getState = getState;
    /**
     * Handle the state of a widget after running an action.
     */
    function handleState(notebook, state, scrollIfNeeded = false) {
        const { activeCell, node } = notebook;
        if (state.wasFocused || notebook.mode === 'edit') {
            notebook.activate();
        }
        if (scrollIfNeeded) {
            domutils_1.ElementExt.scrollIntoViewIfNeeded(node, activeCell.node);
        }
    }
    Private.handleState = handleState;
    /**
     * Handle the state of a widget after running a run action.
     */
    function handleRunState(notebook, state, scroll = false) {
        if (state.wasFocused || notebook.mode === 'edit') {
            notebook.activate();
        }
        if (scroll) {
            // Scroll to the top of the previous active cell output.
            const rect = state.activeCell.inputArea.node.getBoundingClientRect();
            notebook.scrollToPosition(rect.bottom, 45);
        }
    }
    Private.handleRunState = handleRunState;
    /**
     * Clone a cell model.
     */
    function cloneCell(model, cell) {
        switch (cell.type) {
            case 'code':
                // TODO why isn't modeldb or id passed here?
                return model.contentFactory.createCodeCell({ cell: cell.toJSON() });
            case 'markdown':
                // TODO why isn't modeldb or id passed here?
                return model.contentFactory.createMarkdownCell({ cell: cell.toJSON() });
            default:
                // TODO why isn't modeldb or id passed here?
                return model.contentFactory.createRawCell({ cell: cell.toJSON() });
        }
    }
    Private.cloneCell = cloneCell;
    /**
     * Run the selected cells.
     */
    function runSelected(notebook, session) {
        notebook.mode = 'command';
        let lastIndex = notebook.activeCellIndex;
        const selected = notebook.widgets.filter((child, index) => {
            const active = notebook.isSelectedOrActive(child);
            if (active) {
                lastIndex = index;
            }
            return active;
        });
        notebook.activeCellIndex = lastIndex;
        notebook.deselectAll();
        return Promise.all(selected.map(child => runCell(notebook, child, session)))
            .then(results => {
            if (notebook.isDisposed) {
                return false;
            }
            // Post an update request.
            notebook.update();
            return results.every(result => result);
        })
            .catch(reason => {
            if (reason.message === 'KernelReplyNotOK') {
                selected.map((cell) => {
                    // Remove '*' prompt from cells that didn't execute
                    if (cell.model.executionCount == null) {
                        cell.setPrompt('');
                    }
                });
            }
            else {
                throw reason;
            }
            notebook.update();
            return false;
        });
    }
    Private.runSelected = runSelected;
    /**
     * Run a cell.
     */
    function runCell(notebook, cell, session) {
        switch (cell.model.type) {
            case 'markdown':
                cell.rendered = true;
                cell.inputHidden = false;
                Private.executed.emit({ notebook, cell });
                break;
            case 'code':
                if (session) {
                    return cells_1.CodeCell.execute(cell, session, {
                        deletedCells: notebook.model.deletedCells
                    })
                        .then(reply => {
                        notebook.model.deletedCells.splice(0, notebook.model.deletedCells.length);
                        if (cell.isDisposed) {
                            return false;
                        }
                        if (!reply) {
                            return true;
                        }
                        if (reply.content.status === 'ok') {
                            const content = reply.content;
                            if (content.payload && content.payload.length) {
                                handlePayload(content, notebook, cell);
                            }
                            return true;
                        }
                        else {
                            throw new Error('KernelReplyNotOK');
                        }
                    })
                        .catch(reason => {
                        if (reason.message !== 'Canceled') {
                            throw reason;
                        }
                        return false;
                    })
                        .then(ran => {
                        if (ran) {
                            Private.executed.emit({ notebook, cell });
                        }
                        return ran;
                    });
                }
                cell.model.executionCount = null;
                break;
            default:
                break;
        }
        return Promise.resolve(true);
    }
    /**
     * Handle payloads from an execute reply.
     *
     * #### Notes
     * Payloads are deprecated and there are no official interfaces for them in
     * the kernel type definitions.
     * See [Payloads (DEPRECATED)](https://jupyter-client.readthedocs.io/en/latest/messaging.html#payloads-deprecated).
     */
    function handlePayload(content, notebook, cell) {
        const setNextInput = content.payload.filter(i => {
            return i.source === 'set_next_input';
        })[0];
        if (!setNextInput) {
            return;
        }
        const text = setNextInput.text;
        const replace = setNextInput.replace;
        if (replace) {
            cell.model.value.text = text;
            return;
        }
        // Create a new code cell and add as the next cell.
        const newCell = notebook.model.contentFactory.createCodeCell({});
        const cells = notebook.model.cells;
        const index = algorithm_1.ArrayExt.firstIndexOf(algorithm_1.toArray(cells), cell.model);
        newCell.value.text = text;
        if (index === -1) {
            cells.push(newCell);
        }
        else {
            cells.insert(index + 1, newCell);
        }
    }
    /**
     * Copy or cut the selected cell data to the application clipboard.
     *
     * @param notebook - The target notebook widget.
     *
     * @param cut - Whether to copy or cut.
     */
    function copyOrCut(notebook, cut) {
        if (!notebook.model || !notebook.activeCell) {
            return;
        }
        const state = getState(notebook);
        const clipboard = apputils_1.Clipboard.getInstance();
        notebook.mode = 'command';
        clipboard.clear();
        let data = notebook.widgets
            .filter(cell => notebook.isSelectedOrActive(cell))
            .map(cell => cell.model.toJSON())
            .map(cellJSON => {
            if (cellJSON.metadata.deletable !== undefined) {
                delete cellJSON.metadata.deletable;
            }
            return cellJSON;
        });
        clipboard.setData(JUPYTER_CELL_MIME, data);
        if (cut) {
            deleteCells(notebook);
        }
        else {
            notebook.deselectAll();
        }
        handleState(notebook, state);
    }
    Private.copyOrCut = copyOrCut;
    /**
     * Change the selected cell type(s).
     *
     * @param notebook - The target notebook widget.
     *
     * @param value - The target cell type.
     *
     * #### Notes
     * It should preserve the widget mode.
     * This action can be undone.
     * The existing selection will be cleared.
     * Any cells converted to markdown will be unrendered.
     */
    function changeCellType(notebook, value) {
        const model = notebook.model;
        const cells = model.cells;
        cells.beginCompoundOperation();
        notebook.widgets.forEach((child, index) => {
            if (!notebook.isSelectedOrActive(child)) {
                return;
            }
            if (child.model.type !== value) {
                const cell = child.model.toJSON();
                let newCell;
                switch (value) {
                    case 'code':
                        newCell = model.contentFactory.createCodeCell({ cell });
                        break;
                    case 'markdown':
                        newCell = model.contentFactory.createMarkdownCell({ cell });
                        if (child.model.type === 'code') {
                            newCell.trusted = false;
                        }
                        break;
                    default:
                        newCell = model.contentFactory.createRawCell({ cell });
                        if (child.model.type === 'code') {
                            newCell.trusted = false;
                        }
                }
                cells.set(index, newCell);
            }
            if (value === 'markdown') {
                // Fetch the new widget and unrender it.
                child = notebook.widgets[index];
                child.rendered = false;
            }
        });
        cells.endCompoundOperation();
        notebook.deselectAll();
    }
    Private.changeCellType = changeCellType;
    /**
     * Delete the selected cells.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The cell after the last selected cell will be activated.
     * If the last cell is deleted, then the previous one will be activated.
     * It will add a code cell if all cells are deleted.
     * This action can be undone.
     */
    function deleteCells(notebook) {
        const model = notebook.model;
        const cells = model.cells;
        const toDelete = [];
        notebook.mode = 'command';
        // Find the cells to delete.
        notebook.widgets.forEach((child, index) => {
            const deletable = child.model.metadata.get('deletable') !== false;
            if (notebook.isSelectedOrActive(child) && deletable) {
                toDelete.push(index);
                notebook.model.deletedCells.push(child.model.id);
            }
        });
        // If cells are not deletable, we may not have anything to delete.
        if (toDelete.length > 0) {
            // Delete the cells as one undo event.
            cells.beginCompoundOperation();
            // Delete cells in reverse order to maintain the correct indices.
            toDelete.reverse().forEach(index => {
                cells.remove(index);
            });
            // Add a new cell if the notebook is empty. This is done
            // within the compound operation to make the deletion of
            // a notebook's last cell undoable.
            if (!cells.length) {
                cells.push(model.contentFactory.createCodeCell({}));
            }
            cells.endCompoundOperation();
            // Select the *first* interior cell not deleted or the cell
            // *after* the last selected cell.
            // Note: The activeCellIndex is clamped to the available cells,
            // so if the last cell is deleted the previous cell will be activated.
            // The *first* index is the index of the last cell in the initial
            // toDelete list due to the `reverse` operation above.
            notebook.activeCellIndex = toDelete[0] - toDelete.length + 1;
        }
        // Deselect any remaining, undeletable cells. Do this even if we don't
        // delete anything so that users are aware *something* happened.
        notebook.deselectAll();
    }
    Private.deleteCells = deleteCells;
    /**
     * Set the markdown header level of a cell.
     */
    function setMarkdownHeader(cell, level) {
        // Remove existing header or leading white space.
        let source = cell.value.text;
        const regex = /^(#+\s*)|^(\s*)/;
        const newHeader = Array(level + 1).join('#') + ' ';
        const matches = regex.exec(source);
        if (matches) {
            source = source.slice(matches[0].length);
        }
        cell.value.text = newHeader + source;
    }
    Private.setMarkdownHeader = setMarkdownHeader;
})(Private || (Private = {}));
