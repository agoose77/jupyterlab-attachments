import { IClientSession } from '@jupyterlab/apputils';
import { nbformat } from '@jupyterlab/coreutils';
import { Cell } from '@jupyterlab/cells';
import { ISignal } from '@phosphor/signaling';
import { Notebook } from './widget';
/**
 * A collection of actions that run against notebooks.
 *
 * #### Notes
 * All of the actions are a no-op if there is no model on the notebook.
 * The actions set the widget `mode` to `'command'` unless otherwise specified.
 * The actions will preserve the selection on the notebook widget unless
 * otherwise specified.
 */
export declare class NotebookActions {
    /**
     * A signal that emits whenever a cell is run.
     */
    static readonly executed: ISignal<any, {
        notebook: Notebook;
        cell: Cell;
    }>;
    /**
     * A private constructor for the `NotebookActions` class.
     *
     * #### Notes
     * This class can never be instantiated. Its static member `executed` will be
     * merged with the `NotebookActions` namespace. The reason it exists as a
     * standalone class is because at run time, the `Private.executed` variable
     * does not yet exist, so it needs to be referenced via a getter.
     */
    private constructor();
}
/**
 * A namespace for `NotebookActions` static methods.
 */
export declare namespace NotebookActions {
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
    function splitCell(notebook: Notebook): void;
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
    function mergeCells(notebook: Notebook): void;
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
    function deleteCells(notebook: Notebook): void;
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
    function insertAbove(notebook: Notebook): void;
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
    function insertBelow(notebook: Notebook): void;
    /**
     * Move the selected cell(s) down.
     *
     * @param notebook = The target notebook widget.
     */
    function moveDown(notebook: Notebook): void;
    /**
     * Move the selected cell(s) up.
     *
     * @param widget - The target notebook widget.
     */
    function moveUp(notebook: Notebook): void;
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
    function changeCellType(notebook: Notebook, value: nbformat.CellType): void;
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
    function run(notebook: Notebook, session?: IClientSession): Promise<boolean>;
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
    function runAndAdvance(notebook: Notebook, session?: IClientSession): Promise<boolean>;
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
    function runAndInsert(notebook: Notebook, session?: IClientSession): Promise<boolean>;
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
    function runAll(notebook: Notebook, session?: IClientSession): Promise<boolean>;
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
    function runAllAbove(notebook: Notebook, session?: IClientSession): Promise<boolean>;
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
    function runAllBelow(notebook: Notebook, session?: IClientSession): Promise<boolean>;
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
    function selectAbove(notebook: Notebook): void;
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
    function selectBelow(notebook: Notebook): void;
    /**
     * Extend the selection to the cell above.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This is a no-op if the first cell is the active cell.
     * The new cell will be activated.
     */
    function extendSelectionAbove(notebook: Notebook): void;
    /**
     * Extend the selection to the cell below.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This is a no-op if the last cell is the active cell.
     * The new cell will be activated.
     */
    function extendSelectionBelow(notebook: Notebook): void;
    /**
     * Select all of the cells of the notebook.
     *
     * @param notebook - the target notebook widget.
     */
    function selectAll(notebook: Notebook): void;
    /**
     * Deselect all of the cells of the notebook.
     *
     * @param notebook - the targe notebook widget.
     */
    function deselectAll(notebook: Notebook): void;
    /**
     * Copy the selected cell data to a clipboard.
     *
     * @param notebook - The target notebook widget.
     */
    function copy(notebook: Notebook): void;
    /**
     * Cut the selected cell data to a clipboard.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This action can be undone.
     * A new code cell is added if all cells are cut.
     */
    function cut(notebook: Notebook): void;
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
    function paste(notebook: Notebook, mode?: 'below' | 'above' | 'replace'): void;
    /**
     * Undo a cell action.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This is a no-op if if there are no cell actions to undo.
     */
    function undo(notebook: Notebook): void;
    /**
     * Redo a cell action.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * This is a no-op if there are no cell actions to redo.
     */
    function redo(notebook: Notebook): void;
    /**
     * Toggle the line number of all cells.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The original state is based on the state of the active cell.
     * The `mode` of the widget will be preserved.
     */
    function toggleAllLineNumbers(notebook: Notebook): void;
    /**
     * Clear the code outputs of the selected cells.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The widget `mode` will be preserved.
     */
    function clearOutputs(notebook: Notebook): void;
    /**
     * Clear all the code outputs on the widget.
     *
     * @param notebook - The target notebook widget.
     *
     * #### Notes
     * The widget `mode` will be preserved.
     */
    function clearAllOutputs(notebook: Notebook): void;
    /**
     * Hide the code on selected code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function hideCode(notebook: Notebook): void;
    /**
     * Show the code on selected code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function showCode(notebook: Notebook): void;
    /**
     * Hide the code on all code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function hideAllCode(notebook: Notebook): void;
    /**
     * Show the code on all code cells.
     *
     * @param widget - The target notebook widget.
     */
    function showAllCode(notebook: Notebook): void;
    /**
     * Hide the output on selected code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function hideOutput(notebook: Notebook): void;
    /**
     * Show the output on selected code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function showOutput(notebook: Notebook): void;
    /**
     * Hide the output on all code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function hideAllOutputs(notebook: Notebook): void;
    /**
     * Show the output on all code cells.
     *
     * @param notebook - The target notebook widget.
     */
    function showAllOutputs(notebook: Notebook): void;
    /**
     * Enable output scrolling for all selected cells.
     *
     * @param notebook - The target notebook widget.
     */
    function enableOutputScrolling(notebook: Notebook): void;
    /**
     * Disable output scrolling for all selected cells.
     *
     * @param notebook - The target notebook widget.
     */
    function disableOutputScrolling(notebook: Notebook): void;
    /**
     * Persists the collapsed state of all code cell outputs to the model.
     *
     * @param notebook - The target notebook widget.
     */
    function persistViewState(notebook: Notebook): void;
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
    function setMarkdownHeader(notebook: Notebook, level: number): void;
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
    function trust(notebook: Notebook): Promise<void>;
}
