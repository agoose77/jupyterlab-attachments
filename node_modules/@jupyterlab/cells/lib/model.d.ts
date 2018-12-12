import { ISignal, Signal } from '@phosphor/signaling';
import { IAttachmentsModel } from '@jupyterlab/attachments';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { IChangedArgs, nbformat } from '@jupyterlab/coreutils';
import { IObservableJSON, IModelDB, IObservableValue, ObservableValue } from '@jupyterlab/observables';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
/**
 * The definition of a model object for a cell.
 */
export interface ICellModel extends CodeEditor.IModel {
    /**
     * The type of the cell.
     */
    readonly type: nbformat.CellType;
    /**
     * A unique identifier for the cell.
     */
    readonly id: string;
    /**
     * A signal emitted when the content of the model changes.
     */
    readonly contentChanged: ISignal<ICellModel, void>;
    /**
     * A signal emitted when a model state changes.
     */
    readonly stateChanged: ISignal<ICellModel, IChangedArgs<any>>;
    /**
     * Whether the cell is trusted.
     */
    trusted: boolean;
    /**
     * The metadata associated with the cell.
     */
    readonly metadata: IObservableJSON;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.ICell;
}
/**
 * The definition of a model cell object for a cell with attachments.
 */
export interface IAttachmentsCellModel extends ICellModel {
    /**
     * The cell attachments
     */
    readonly attachments: IAttachmentsModel;
}
/**
 * The definition of a code cell.
 */
export interface ICodeCellModel extends ICellModel {
    /**
     * The type of the cell.
     *
     * #### Notes
     * This is a read-only property.
     */
    readonly type: 'code';
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.ICodeCell;
    /**
     * The code cell's prompt number. Will be null if the cell has not been run.
     */
    executionCount: nbformat.ExecutionCount;
    /**
     * The cell outputs.
     */
    readonly outputs: IOutputAreaModel;
}
/**
 * The definition of a markdown cell.
 */
export interface IMarkdownCellModel extends IAttachmentsCellModel {
    /**
     * The type of the cell.
     */
    readonly type: 'markdown';
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IMarkdownCell;
}
/**
 * The definition of a raw cell.
 */
export interface IRawCellModel extends IAttachmentsCellModel {
    /**
     * The type of the cell.
     */
    readonly type: 'raw';
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IRawCell;
}
export declare function isCodeCellModel(model: ICellModel): model is ICodeCellModel;
export declare function isMarkdownCellModel(model: ICellModel): model is IMarkdownCellModel;
export declare function isRawCellModel(model: ICellModel): model is IRawCellModel;
/**
 * An implementation of the cell model.
 */
export declare class CellModel extends CodeEditor.Model implements ICellModel {
    /**
     * Construct a cell model from optional cell content.
     */
    constructor(options: CellModel.IOptions);
    /**
     * The type of cell.
     */
    readonly type: nbformat.CellType;
    /**
     * A signal emitted when the state of the model changes.
     */
    readonly contentChanged: Signal<this, void>;
    /**
     * A signal emitted when a model state changes.
     */
    readonly stateChanged: Signal<this, IChangedArgs<any>>;
    /**
     * The id for the cell.
     */
    readonly id: string;
    /**
     * The metadata associated with the cell.
     */
    readonly metadata: IObservableJSON;
    /**
     * Get the trusted state of the model.
     */
    /**
    * Set the trusted state of the model.
    */
    trusted: boolean;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.ICell;
    /**
     * Handle a change to the trusted state.
     *
     * The default implementation is a no-op.
     */
    onTrustedChanged(trusted: IObservableValue, args: ObservableValue.IChangedArgs): void;
    /**
     * Handle a change to the observable value.
     */
    protected onGenericChange(): void;
}
/**
 * The namespace for `CellModel` statics.
 */
export declare namespace CellModel {
    /**
     * The options used to initialize a `CellModel`.
     */
    interface IOptions {
        /**
         * The source cell data.
         */
        cell?: nbformat.IBaseCell;
        /**
         * An IModelDB in which to store cell data.
         */
        modelDB?: IModelDB;
        /**
         * A unique identifier for this cell.
         */
        id?: string;
    }
}
/**
 * A base implementation for cell models with attachments.
 */
export declare class AttachmentsCellModel extends CellModel {
    /**
     * Construct a new cell with optional attachments.
     */
    constructor(options: AttachmentsCellModel.IOptions);
    /**
     * Get the attachments of the model.
     */
    readonly attachments: IAttachmentsModel;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IRawCell | nbformat.IMarkdownCell;
    private _attachments;
}
/**
 * The namespace for `AttachmentsCellModel` statics.
 */
export declare namespace AttachmentsCellModel {
    /**
     * The options used to initialize a `AttachmentsCellModel`.
     */
    interface IOptions extends CellModel.IOptions {
        /**
         * The factory for attachment model creation.
         */
        contentFactory?: IContentFactory;
    }
    /**
     * A factory for creating code cell model content.
     */
    interface IContentFactory {
        /**
         * Create an output area.
         */
        createAttachmentsModel(options: IAttachmentsModel.IOptions): IAttachmentsModel;
    }
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory implements IContentFactory {
        /**
         * Create an attachments model.
         */
        createAttachmentsModel(options: IAttachmentsModel.IOptions): IAttachmentsModel;
    }
    /**
     * The shared `ContentFactory` instance.
     */
    const defaultContentFactory: ContentFactory;
}
/**
 * An implementation of a raw cell model.
 */
export declare class RawCellModel extends AttachmentsCellModel {
    /**
     * The type of the cell.
     */
    readonly type: 'raw';
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IRawCell;
}
/**
 * An implementation of a markdown cell model.
 */
export declare class MarkdownCellModel extends AttachmentsCellModel {
    /**
     * Construct a markdown cell model from optional cell content.
     */
    constructor(options: CellModel.IOptions);
    /**
     * The type of the cell.
     */
    readonly type: 'markdown';
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IMarkdownCell;
}
/**
 * An implementation of a code cell Model.
 */
export declare class CodeCellModel extends CellModel implements ICodeCellModel {
    /**
     * Construct a new code cell with optional original cell content.
     */
    constructor(options: CodeCellModel.IOptions);
    /**
     * The type of the cell.
     */
    readonly type: 'code';
    /**
     * The execution count of the cell.
     */
    executionCount: nbformat.ExecutionCount;
    /**
     * The cell outputs.
     */
    readonly outputs: IOutputAreaModel;
    /**
     * Dispose of the resources held by the model.
     */
    dispose(): void;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.ICodeCell;
    /**
     * Handle a change to the trusted state.
     */
    onTrustedChanged(trusted: IObservableValue, args: ObservableValue.IChangedArgs): void;
    /**
     * Handle a change to the execution count.
     */
    private _onExecutionCountChanged;
    private _outputs;
}
/**
 * The namespace for `CodeCellModel` statics.
 */
export declare namespace CodeCellModel {
    /**
     * The options used to initialize a `CodeCellModel`.
     */
    interface IOptions extends CellModel.IOptions {
        /**
         * The factory for output area model creation.
         */
        contentFactory?: IContentFactory;
    }
    /**
     * A factory for creating code cell model content.
     */
    interface IContentFactory {
        /**
         * Create an output area.
         */
        createOutputArea(options: IOutputAreaModel.IOptions): IOutputAreaModel;
    }
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory implements IContentFactory {
        /**
         * Create an output area.
         */
        createOutputArea(options: IOutputAreaModel.IOptions): IOutputAreaModel;
    }
    /**
     * The shared `ContentFactory` instance.
     */
    const defaultContentFactory: ContentFactory;
}
