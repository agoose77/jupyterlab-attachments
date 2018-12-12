import { JSONValue, Token } from '@phosphor/coreutils';
import { ConflatableMessage, Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';
import { Cell } from '@jupyterlab/cells';
import { CodeEditor, JSONEditor } from '@jupyterlab/codeeditor';
import { nbformat } from '@jupyterlab/coreutils';
import { ObservableJSON } from '@jupyterlab/observables';
import { INotebookTracker } from './';
/**
 * The main menu token.
 */
export declare const ICellTools: Token<ICellTools>;
/**
 * The interface for cell metadata tools.
 */
export interface ICellTools extends CellTools {
}
/**
 * A widget that provides cell metadata tools.
 */
export declare class CellTools extends Widget {
    /**
     * Construct a new CellTools object.
     */
    constructor(options: CellTools.IOptions);
    /**
     * The active cell widget.
     */
    readonly activeCell: Cell | null;
    /**
     * The currently selected cells.
     */
    readonly selectedCells: Cell[];
    /**
     * Add a cell tool item.
     */
    addItem(options: CellTools.IAddOptions): void;
    /**
     * Handle the removal of a child
     */
    protected onChildRemoved(msg: Widget.ChildMessage): void;
    /**
     * Handle a change to the active cell.
     */
    private _onActiveCellChanged;
    /**
     * Handle a change in the selection.
     */
    private _onSelectionChanged;
    /**
     * Handle a change in the metadata.
     */
    private _onMetadataChanged;
    private _items;
    private _tracker;
    private _prevActive;
}
/**
 * The namespace for CellTools class statics.
 */
export declare namespace CellTools {
    /**
     * The options used to create a CellTools object.
     */
    interface IOptions {
        /**
         * The notebook tracker used by the cell tools.
         */
        tracker: INotebookTracker;
    }
    /**
     * The options used to add an item to the cell tools.
     */
    interface IAddOptions {
        /**
         * The tool to add to the cell tools area.
         */
        tool: Tool;
        /**
         * The rank order of the widget among its siblings.
         */
        rank?: number;
    }
    /**
     * A singleton conflatable `'activecell-changed'` message.
     */
    const ActiveCellMessage: ConflatableMessage;
    /**
     * A singleton conflatable `'selection-changed'` message.
     */
    const SelectionMessage: ConflatableMessage;
    /**
     * The base cell tool, meant to be subclassed.
     */
    class Tool extends Widget {
        /**
         * The cell tools object.
         */
        readonly parent: ICellTools;
        /**
         * Process a message sent to the widget.
         *
         * @param msg - The message sent to the widget.
         */
        processMessage(msg: Message): void;
        /**
         * Handle a change to the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        protected onActiveCellChanged(msg: Message): void;
        /**
         * Handle a change to the selection.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        protected onSelectionChanged(msg: Message): void;
        /**
         * Handle a change to the metadata of the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        protected onMetadataChanged(msg: ObservableJSON.ChangeMessage): void;
    }
    /**
     * A cell tool displaying the active cell contents.
     */
    class ActiveCellTool extends Tool {
        /**
         * Construct a new active cell tool.
         */
        constructor();
        /**
         * Dispose of the resources used by the tool.
         */
        dispose(): void;
        /**
         * Handle a change to the active cell.
         */
        protected onActiveCellChanged(): void;
        /**
         * Handle a change to the current editor value.
         */
        private _onValueChanged;
        /**
         * Handle a change to the current editor mimetype.
         */
        private _onMimeTypeChanged;
        private _model;
        private _cellModel;
    }
    /**
     * A raw metadata editor.
     */
    class MetadataEditorTool extends Tool {
        /**
         * Construct a new raw metadata tool.
         */
        constructor(options: MetadataEditorTool.IOptions);
        /**
         * The editor used by the tool.
         */
        readonly editor: JSONEditor;
        /**
         * Handle a change to the active cell.
         */
        protected onActiveCellChanged(msg: Message): void;
    }
    /**
     * The namespace for `MetadataEditorTool` static data.
     */
    namespace MetadataEditorTool {
        /**
         * The options used to initialize a metadata editor tool.
         */
        interface IOptions {
            /**
             * The editor factory used by the tool.
             */
            editorFactory: CodeEditor.Factory;
        }
    }
    /**
     * A cell tool that provides a selection for a given metadata key.
     */
    class KeySelector extends Tool {
        /**
         * Construct a new KeySelector.
         */
        constructor(options: KeySelector.IOptions);
        /**
         * The metadata key used by the selector.
         */
        readonly key: string;
        /**
         * The select node for the widget.
         */
        readonly selectNode: HTMLSelectElement;
        /**
         * Handle the DOM events for the widget.
         *
         * @param event - The DOM event sent to the widget.
         *
         * #### Notes
         * This method implements the DOM `EventListener` interface and is
         * called in response to events on the notebook panel's node. It should
         * not be called directly by user code.
         */
        handleEvent(event: Event): void;
        /**
         * Handle `after-attach` messages for the widget.
         */
        protected onAfterAttach(msg: Message): void;
        /**
         * Handle `before-detach` messages for the widget.
         */
        protected onBeforeDetach(msg: Message): void;
        /**
         * Handle a change to the active cell.
         */
        protected onActiveCellChanged(msg: Message): void;
        /**
         * Handle a change to the metadata of the active cell.
         */
        protected onMetadataChanged(msg: ObservableJSON.ChangeMessage): void;
        /**
         * Handle a change to the value.
         */
        protected onValueChanged(): void;
        /**
         * Get the value for the data.
         */
        private _getValue;
        /**
         * Set the value for the data.
         */
        private _setValue;
        private _changeGuard;
        private _validCellTypes;
        private _getter;
        private _setter;
    }
    /**
     * The namespace for `KeySelector` static data.
     */
    namespace KeySelector {
        /**
         * The options used to initialize a keyselector.
         */
        interface IOptions {
            /**
             * The metadata key of interest.
             */
            key: string;
            /**
             * The map of options to values.
             */
            optionsMap: {
                [key: string]: JSONValue;
            };
            /**
             * The optional title of the selector - defaults to capitalized `key`.
             */
            title?: string;
            /**
             * The optional valid cell types - defaults to all valid types.
             */
            validCellTypes?: nbformat.CellType[];
            /**
             * An optional value getter for the selector.
             *
             * @param cell - The currently active cell.
             *
             * @returns The appropriate value for the selector.
             */
            getter?: (cell: Cell) => JSONValue;
            /**
             * An optional value setter for the selector.
             *
             * @param cell - The currently active cell.
             *
             * @param value - The value of the selector.
             *
             * #### Notes
             * The setter should set the appropriate metadata value
             * given the value of the selector.
             */
            setter?: (cell: Cell, value: JSONValue) => void;
        }
    }
    /**
     * Create a slideshow selector.
     */
    function createSlideShowSelector(): KeySelector;
    /**
     * Create an nbcovert selector.
     */
    function createNBConvertSelector(optionsMap: {
        [key: string]: JSONValue;
    }): KeySelector;
}
