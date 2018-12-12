import { IClientSession } from '@jupyterlab/apputils';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { CodeEditor, CodeEditorWrapper } from '@jupyterlab/codeeditor';
import { IObservableMap } from '@jupyterlab/observables';
import { OutputArea, IOutputPrompt, IStdin, Stdin } from '@jupyterlab/outputarea';
import { RenderMimeRegistry } from '@jupyterlab/rendermime';
import { KernelMessage } from '@jupyterlab/services';
import { JSONValue, JSONObject } from '@phosphor/coreutils';
import { Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';
import { ICellHeader, ICellFooter } from './headerfooter';
import { InputArea, IInputPrompt } from './inputarea';
import { ICellModel, ICodeCellModel, IMarkdownCellModel, IRawCellModel } from './model';
/******************************************************************************
 * Cell
 ******************************************************************************/
/**
 * A base cell widget.
 */
export declare class Cell extends Widget {
    /**
     * Construct a new base cell widget.
     */
    constructor(options: Cell.IOptions);
    /**
     * Modify some state for initialization.
     *
     * Should be called at the end of the subclasses's constructor.
     */
    protected initializeState(): void;
    /**
     * The content factory used by the widget.
     */
    readonly contentFactory: Cell.IContentFactory;
    /**
     * Get the prompt node used by the cell.
     */
    readonly promptNode: HTMLElement;
    /**
     * Get the CodeEditorWrapper used by the cell.
     */
    readonly editorWidget: CodeEditorWrapper;
    /**
     * Get the CodeEditor used by the cell.
     */
    readonly editor: CodeEditor.IEditor;
    /**
     * Get the model used by the cell.
     */
    readonly model: ICellModel;
    /**
     * Get the input area for the cell.
     */
    readonly inputArea: InputArea;
    /**
     * The read only state of the cell.
     */
    readOnly: boolean;
    /**
     * A promise that resolves when the widget renders for the first time.
     */
    readonly ready: Promise<void>;
    /**
     * Set the prompt for the widget.
     */
    setPrompt(value: string): void;
    /**
     * The view state of input being hidden.
     */
    inputHidden: boolean;
    /**
     * Handle the input being hidden.
     *
     * #### Notes
     * This is called by the `inputHidden` setter so that subclasses
     * can perform actions upon the input being hidden without accessing
     * private state.
     */
    protected handleInputHidden(value: boolean): void;
    /**
     * Clone the cell, using the same model.
     */
    clone(): Cell;
    /**
     * Dispose of the resources held by the widget.
     */
    dispose(): void;
    /**
     * Handle `after-attach` messages.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `'activate-request'` messages.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Handle `update-request` messages.
     */
    protected onUpdateRequest(msg: Message): void;
    private _readOnly;
    private _model;
    private _inputHidden;
    private _input;
    private _inputWrapper;
    private _inputPlaceholder;
}
/**
 * The namespace for the `Cell` class statics.
 */
export declare namespace Cell {
    /**
     * An options object for initializing a cell widget.
     */
    interface IOptions {
        /**
         * The model used by the cell.
         */
        model: ICellModel;
        /**
         * The factory object for customizable cell children.
         */
        contentFactory?: IContentFactory;
        /**
         * The configuration options for the text editor widget.
         */
        editorConfig?: Partial<CodeEditor.IConfig>;
    }
    /**
     * The factory object for customizable cell children.
     *
     * This is used to allow users of cells to customize child content.
     *
     * This inherits from `OutputArea.IContentFactory` to avoid needless nesting and
     * provide a single factory object for all notebook/cell/outputarea related
     * widgets.
     */
    interface IContentFactory extends OutputArea.IContentFactory, InputArea.IContentFactory {
        /**
         * Create a new cell header for the parent widget.
         */
        createCellHeader(): ICellHeader;
        /**
         * Create a new cell header for the parent widget.
         */
        createCellFooter(): ICellFooter;
    }
    /**
     * The default implementation of an `IContentFactory`.
     *
     * This includes a CodeMirror editor factory to make it easy to use out of the box.
     */
    class ContentFactory implements IContentFactory {
        /**
         * Create a content factory for a cell.
         */
        constructor(options?: ContentFactory.IOptions);
        /**
         * The readonly editor factory that create code editors
         */
        readonly editorFactory: CodeEditor.Factory;
        /**
         * Create a new cell header for the parent widget.
         */
        createCellHeader(): ICellHeader;
        /**
         * Create a new cell header for the parent widget.
         */
        createCellFooter(): ICellFooter;
        /**
         * Create an input prompt.
         */
        createInputPrompt(): IInputPrompt;
        /**
         * Create the output prompt for the widget.
         */
        createOutputPrompt(): IOutputPrompt;
        /**
         * Create an stdin widget.
         */
        createStdin(options: Stdin.IOptions): IStdin;
        private _editorFactory;
    }
    /**
     * A namespace for cell content factory.
     */
    namespace ContentFactory {
        /**
         * Options for the content factory.
         */
        interface IOptions {
            /**
             * The editor factory used by the content factory.
             *
             * If this is not passed, a default CodeMirror editor factory
             * will be used.
             */
            editorFactory?: CodeEditor.Factory;
        }
    }
    /**
     * The default content factory for cells.
     */
    const defaultContentFactory: ContentFactory;
}
/******************************************************************************
 * CodeCell
 ******************************************************************************/
/**
 * A widget for a code cell.
 */
export declare class CodeCell extends Cell {
    /**
     * Construct a code cell widget.
     */
    constructor(options: CodeCell.IOptions);
    /**
     * The model used by the widget.
     */
    readonly model: ICodeCellModel;
    /**
     * Modify some state for initialization.
     *
     * Should be called at the end of the subclasses's constructor.
     */
    protected initializeState(): void;
    /**
     * Get the output area for the cell.
     */
    readonly outputArea: OutputArea;
    /**
     * The view state of output being collapsed.
     */
    outputHidden: boolean;
    /**
     * Whether the output is in a scrolled state?
     */
    outputsScrolled: boolean;
    /**
     * Handle the input being hidden.
     *
     * #### Notes
     * This method is called by the case cell implementation and is
     * subclasses here so the code cell can watch to see when input
     * is hidden without accessing private state.
     */
    protected handleInputHidden(value: boolean): void;
    /**
     * Clone the cell, using the same model.
     */
    clone(): CodeCell;
    /**
     * Clone the OutputArea alone, returning a simplified output area, using the same model.
     */
    cloneOutputArea(): OutputArea;
    /**
     * Dispose of the resources used by the widget.
     */
    dispose(): void;
    /**
     * Handle `update-request` messages.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle changes in the model.
     */
    protected onStateChanged(model: ICellModel, args: IChangedArgs<any>): void;
    /**
     * Handle changes in the metadata.
     */
    protected onMetadataChanged(model: IObservableMap<JSONValue>, args: IObservableMap.IChangedArgs<JSONValue>): void;
    /**
     * Handle changes in the number of outputs in the output area.
     */
    private _outputLengthHandler;
    private _rendermime;
    private _outputHidden;
    private _outputsScrolled;
    private _outputWrapper;
    private _outputPlaceholder;
    private _output;
}
/**
 * The namespace for the `CodeCell` class statics.
 */
export declare namespace CodeCell {
    /**
     * An options object for initializing a base cell widget.
     */
    interface IOptions extends Cell.IOptions {
        /**
         * The model used by the cell.
         */
        model: ICodeCellModel;
        /**
         * The mime renderer for the cell widget.
         */
        rendermime: RenderMimeRegistry;
    }
    /**
     * Execute a cell given a client session.
     */
    function execute(cell: CodeCell, session: IClientSession, metadata?: JSONObject): Promise<KernelMessage.IExecuteReplyMsg>;
}
/******************************************************************************
 * MarkdownCell
 ******************************************************************************/
/**
 * A widget for a Markdown cell.
 *
 * #### Notes
 * Things get complicated if we want the rendered text to update
 * any time the text changes, the text editor model changes,
 * or the input area model changes.  We don't support automatically
 * updating the rendered text in all of these cases.
 */
export declare class MarkdownCell extends Cell {
    /**
     * Construct a Markdown cell widget.
     */
    constructor(options: MarkdownCell.IOptions);
    /**
     * The model used by the widget.
     */
    readonly model: IMarkdownCellModel;
    /**
     * A promise that resolves when the widget renders for the first time.
     */
    readonly ready: Promise<void>;
    /**
     * Whether the cell is rendered.
     */
    rendered: boolean;
    /**
     * Render an input instead of the text editor.
     */
    protected renderInput(widget: Widget): void;
    /**
     * Show the text editor instead of rendered input.
     */
    protected showEditor(): void;
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle the rendered state.
     */
    private _handleRendered;
    /**
     * Update the rendered input.
     */
    private _updateRenderedInput;
    /**
     * Clone the cell, using the same model.
     */
    clone(): MarkdownCell;
    private _monitor;
    private _renderer;
    private _rendermime;
    private _rendered;
    private _prevText;
    private _ready;
}
/**
 * The namespace for the `CodeCell` class statics.
 */
export declare namespace MarkdownCell {
    /**
     * An options object for initializing a base cell widget.
     */
    interface IOptions extends Cell.IOptions {
        /**
         * The model used by the cell.
         */
        model: IMarkdownCellModel;
        /**
         * The mime renderer for the cell widget.
         */
        rendermime: RenderMimeRegistry;
    }
}
/******************************************************************************
 * RawCell
 ******************************************************************************/
/**
 * A widget for a raw cell.
 */
export declare class RawCell extends Cell {
    /**
     * Construct a raw cell widget.
     */
    constructor(options: Cell.IOptions);
    /**
     * Clone the cell, using the same model.
     */
    clone(): RawCell;
    /**
     * The model used by the widget.
     */
    readonly model: IRawCellModel;
}
/**
 * The namespace for the `RawCell` class statics.
 */
export declare namespace RawCell {
    /**
     * An options object for initializing a base cell widget.
     */
    interface IOptions extends Cell.IOptions {
        /**
         * The model used by the cell.
         */
        model: IRawCellModel;
    }
}
