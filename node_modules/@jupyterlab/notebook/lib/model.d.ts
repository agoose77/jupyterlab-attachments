import { DocumentModel, DocumentRegistry } from '@jupyterlab/docregistry';
import { ICellModel, ICodeCellModel, IRawCellModel, IMarkdownCellModel, CodeCellModel, CellModel } from '@jupyterlab/cells';
import { nbformat } from '@jupyterlab/coreutils';
import { IObservableJSON, IObservableUndoableList, IModelDB } from '@jupyterlab/observables';
/**
 * The definition of a model object for a notebook widget.
 */
export interface INotebookModel extends DocumentRegistry.IModel {
    /**
     * The list of cells in the notebook.
     */
    readonly cells: IObservableUndoableList<ICellModel>;
    /**
     * The cell model factory for the notebook.
     */
    readonly contentFactory: NotebookModel.IContentFactory;
    /**
     * The major version number of the nbformat.
     */
    readonly nbformat: number;
    /**
     * The minor version number of the nbformat.
     */
    readonly nbformatMinor: number;
    /**
     * The metadata associated with the notebook.
     */
    readonly metadata: IObservableJSON;
    /**
     * The array of deleted cells since the notebook was last run.
     */
    readonly deletedCells: string[];
}
/**
 * An implementation of a notebook Model.
 */
export declare class NotebookModel extends DocumentModel implements INotebookModel {
    /**
     * Construct a new notebook model.
     */
    constructor(options?: NotebookModel.IOptions);
    /**
     * The cell model factory for the notebook.
     */
    readonly contentFactory: NotebookModel.IContentFactory;
    /**
     * The metadata associated with the notebook.
     */
    readonly metadata: IObservableJSON;
    /**
     * Get the observable list of notebook cells.
     */
    readonly cells: IObservableUndoableList<ICellModel>;
    /**
     * The major version number of the nbformat.
     */
    readonly nbformat: number;
    /**
     * The minor version number of the nbformat.
     */
    readonly nbformatMinor: number;
    /**
     * The default kernel name of the document.
     */
    readonly defaultKernelName: string;
    /**
     * The default kernel name of the document.
     */
    readonly deletedCells: string[];
    /**
     * The default kernel language of the document.
     */
    readonly defaultKernelLanguage: string;
    /**
     * Dispose of the resources held by the model.
     */
    dispose(): void;
    /**
     * Serialize the model to a string.
     */
    toString(): string;
    /**
     * Deserialize the model from a string.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromString(value: string): void;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.INotebookContent;
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromJSON(value: nbformat.INotebookContent): void;
    /**
     * Initialize the model with its current state.
     */
    initialize(): void;
    /**
     * Handle a change in the cells list.
     */
    private _onCellsChanged;
    /**
     * Make sure we have the required metadata fields.
     */
    private _ensureMetadata;
    private _cells;
    private _nbformat;
    private _nbformatMinor;
    private _deletedCells;
}
/**
 * The namespace for the `NotebookModel` class statics.
 */
export declare namespace NotebookModel {
    /**
     * An options object for initializing a notebook model.
     */
    interface IOptions {
        /**
         * The language preference for the model.
         */
        languagePreference?: string;
        /**
         * A factory for creating cell models.
         *
         * The default is a shared factory instance.
         */
        contentFactory?: IContentFactory;
        /**
         * A modelDB for storing notebook data.
         */
        modelDB?: IModelDB;
    }
    /**
     * A factory for creating notebook model content.
     */
    interface IContentFactory {
        /**
         * The factory for output area models.
         */
        readonly codeCellContentFactory: CodeCellModel.IContentFactory;
        /**
         * The IModelDB in which to put data for the notebook model.
         */
        modelDB: IModelDB;
        /**
         * Create a new code cell.
         *
         * @param options - The options used to create the cell.
         *
         * @returns A new code cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createCodeCell(options: CodeCellModel.IOptions): ICodeCellModel;
        /**
         * Create a new markdown cell.
         *
         * @param options - The options used to create the cell.
         *
         * @returns A new markdown cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createMarkdownCell(options: CellModel.IOptions): IMarkdownCellModel;
        /**
         * Create a new raw cell.
         *
         * @param options - The options used to create the cell.
         *
         * @returns A new raw cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createRawCell(options: CellModel.IOptions): IRawCellModel;
        /**
         * Clone the content factory with a new IModelDB.
         */
        clone(modelDB: IModelDB): IContentFactory;
    }
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory {
        /**
         * Create a new cell model factory.
         */
        constructor(options: ContentFactory.IOptions);
        /**
         * The factory for code cell content.
         */
        readonly codeCellContentFactory: CodeCellModel.IContentFactory;
        /**
         * The IModelDB in which to put the notebook data.
         */
        readonly modelDB: IModelDB | undefined;
        /**
         * Create a new code cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new code cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         *   If the contentFactory is not provided, the instance
         *   `codeCellContentFactory` will be used.
         */
        createCodeCell(options: CodeCellModel.IOptions): ICodeCellModel;
        /**
         * Create a new markdown cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new markdown cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createMarkdownCell(options: CellModel.IOptions): IMarkdownCellModel;
        /**
         * Create a new raw cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new raw cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createRawCell(options: CellModel.IOptions): IRawCellModel;
        /**
         * Clone the content factory with a new IModelDB.
         */
        clone(modelDB: IModelDB): ContentFactory;
    }
    /**
     * A namespace for the notebook model content factory.
     */
    namespace ContentFactory {
        /**
         * The options used to initialize a `ContentFactory`.
         */
        interface IOptions {
            /**
             * The factory for code cell model content.
             */
            codeCellContentFactory?: CodeCellModel.IContentFactory;
            /**
             * The modelDB in which to place new content.
             */
            modelDB?: IModelDB;
        }
    }
    /**
     * The default `ContentFactory` instance.
     */
    const defaultContentFactory: ContentFactory;
}
