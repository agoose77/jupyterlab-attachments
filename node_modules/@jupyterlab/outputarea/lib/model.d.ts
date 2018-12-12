import { IDisposable } from '@phosphor/disposable';
import { ISignal } from '@phosphor/signaling';
import { nbformat } from '@jupyterlab/coreutils';
import { IObservableList, IModelDB } from '@jupyterlab/observables';
import { IOutputModel } from '@jupyterlab/rendermime';
/**
 * The model for an output area.
 */
export interface IOutputAreaModel extends IDisposable {
    /**
     * A signal emitted when the model state changes.
     */
    readonly stateChanged: ISignal<IOutputAreaModel, void>;
    /**
     * A signal emitted when the model changes.
     */
    readonly changed: ISignal<IOutputAreaModel, IOutputAreaModel.ChangedArgs>;
    /**
     * The length of the items in the model.
     */
    readonly length: number;
    /**
     * Whether the output area is trusted.
     */
    trusted: boolean;
    /**
     * The output content factory used by the model.
     */
    readonly contentFactory: IOutputAreaModel.IContentFactory;
    /**
     * Get an item at the specified index.
     */
    get(index: number): IOutputModel;
    /**
     * Add an output, which may be combined with previous output.
     *
     * #### Notes
     * The output bundle is copied.
     * Contiguous stream outputs of the same `name` are combined.
     */
    add(output: nbformat.IOutput): number;
    /**
     * Set the value at the specified index.
     */
    set(index: number, output: nbformat.IOutput): void;
    /**
     * Clear all of the output.
     *
     * @param wait - Delay clearing the output until the next message is added.
     */
    clear(wait?: boolean): void;
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * This will clear any existing data.
     */
    fromJSON(values: nbformat.IOutput[]): void;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IOutput[];
}
/**
 * The namespace for IOutputAreaModel interfaces.
 */
export declare namespace IOutputAreaModel {
    /**
     * The options used to create a output area model.
     */
    interface IOptions {
        /**
         * The initial values for the model.
         */
        values?: nbformat.IOutput[];
        /**
         * Whether the output is trusted.  The default is false.
         */
        trusted?: boolean;
        /**
         * The output content factory used by the model.
         *
         * If not given, a default factory will be used.
         */
        contentFactory?: IContentFactory;
        /**
         * An optional IModelDB to store the output area model.
         */
        modelDB?: IModelDB;
    }
    /**
     * A type alias for changed args.
     */
    type ChangedArgs = IObservableList.IChangedArgs<IOutputModel>;
    /**
     * The interface for an output content factory.
     */
    interface IContentFactory {
        /**
         * Create an output model.
         */
        createOutputModel(options: IOutputModel.IOptions): IOutputModel;
    }
}
/**
 * The default implementation of the IOutputAreaModel.
 */
export declare class OutputAreaModel implements IOutputAreaModel {
    /**
     * Construct a new observable outputs instance.
     */
    constructor(options?: IOutputAreaModel.IOptions);
    /**
     * A signal emitted when the model state changes.
     */
    readonly stateChanged: ISignal<IOutputAreaModel, void>;
    /**
     * A signal emitted when the model changes.
     */
    readonly changed: ISignal<this, IOutputAreaModel.ChangedArgs>;
    /**
     * Get the length of the items in the model.
     */
    readonly length: number;
    /**
     * Get whether the model is trusted.
     */
    /**
    * Set whether the model is trusted.
    *
    * #### Notes
    * Changing the value will cause all of the models to re-set.
    */
    trusted: boolean;
    /**
     * The output content factory used by the model.
     */
    readonly contentFactory: IOutputAreaModel.IContentFactory;
    /**
     * Test whether the model is disposed.
     */
    readonly isDisposed: boolean;
    /**
     * Dispose of the resources used by the model.
     */
    dispose(): void;
    /**
     * Get an item at the specified index.
     */
    get(index: number): IOutputModel;
    /**
     * Set the value at the specified index.
     */
    set(index: number, value: nbformat.IOutput): void;
    /**
     * Add an output, which may be combined with previous output.
     *
     * #### Notes
     * The output bundle is copied.
     * Contiguous stream outputs of the same `name` are combined.
     */
    add(output: nbformat.IOutput): number;
    /**
     * Clear all of the output.
     *
     * @param wait Delay clearing the output until the next message is added.
     */
    clear(wait?: boolean): void;
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * This will clear any existing data.
     */
    fromJSON(values: nbformat.IOutput[]): void;
    /**
     * Serialize the model to JSON.
     */
    toJSON(): nbformat.IOutput[];
    /**
     * Add an item to the list.
     */
    private _add;
    /**
     * Normalize an output.
     */
    private _normalize;
    /**
     * Remove characters that are overridden by backspace characters.
     */
    private _fixBackspace;
    /**
     * Remove chunks that should be overridden by the effect of
     * carriage return characters.
     */
    private _fixCarriageReturn;
    private _removeOverwrittenChars;
    protected clearNext: boolean;
    protected list: IObservableList<IOutputModel>;
    /**
     * Create an output item and hook up its signals.
     */
    private _createItem;
    /**
     * Handle a change to the list.
     */
    private _onListChanged;
    /**
     * If the serialized version of the outputs have changed due to a remote
     * action, then update the model accordingly.
     */
    private _onSerializedChanged;
    /**
     * Handle a change to an item.
     */
    private _onGenericChange;
    private _lastStream;
    private _lastName;
    private _trusted;
    private _isDisposed;
    private _stateChanged;
    private _changed;
    private _modelDB;
    private _serialized;
    private _changeGuard;
}
/**
 * The namespace for OutputAreaModel class statics.
 */
export declare namespace OutputAreaModel {
    /**
     * The default implementation of a `IModelOutputFactory`.
     */
    class ContentFactory implements IOutputAreaModel.IContentFactory {
        /**
         * Create an output model.
         */
        createOutputModel(options: IOutputModel.IOptions): IOutputModel;
    }
    /**
     * The default output model factory.
     */
    const defaultContentFactory: ContentFactory;
}
