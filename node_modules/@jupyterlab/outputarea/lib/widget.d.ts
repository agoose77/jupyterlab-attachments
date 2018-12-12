import { JSONObject } from '@phosphor/coreutils';
import { Message } from '@phosphor/messaging';
import { Signal } from '@phosphor/signaling';
import { Widget } from '@phosphor/widgets';
import { IClientSession } from '@jupyterlab/apputils';
import { nbformat } from '@jupyterlab/coreutils';
import { IOutputModel, RenderMimeRegistry } from '@jupyterlab/rendermime';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { IOutputAreaModel } from './model';
/******************************************************************************
 * OutputArea
 ******************************************************************************/
/**
 * An output area widget.
 *
 * #### Notes
 * The widget model must be set separately and can be changed
 * at any time.  Consumers of the widget must account for a
 * `null` model, and may want to listen to the `modelChanged`
 * signal.
 */
export declare class OutputArea extends Widget {
    /**
     * Construct an output area widget.
     */
    constructor(options: OutputArea.IOptions);
    /**
     * The model used by the widget.
     */
    readonly model: IOutputAreaModel;
    /**
     * The content factory used by the widget.
     */
    readonly contentFactory: OutputArea.IContentFactory;
    /**
     * The rendermime instance used by the widget.
     */
    readonly rendermime: RenderMimeRegistry;
    /**
     * A read-only sequence of the chidren widgets in the output area.
     */
    readonly widgets: ReadonlyArray<Widget>;
    /**
     * A public signal used to indicate the number of outputs has changed.
     *
     * #### Notes
     * This is useful for parents who want to apply styling based on the number
     * of outputs. Emits the current number of outputs.
     */
    readonly outputLengthChanged: Signal<this, number>;
    /**
     * The kernel future associated with the output area.
     */
    future: Kernel.IFuture;
    /**
     * Dispose of the resources used by the output area.
     */
    dispose(): void;
    /**
     * Follow changes on the model state.
     */
    protected onModelChanged(sender: IOutputAreaModel, args: IOutputAreaModel.ChangedArgs): void;
    /**
     * Follow changes on the output model state.
     */
    protected onStateChanged(sender: IOutputAreaModel): void;
    /**
     * Clear the widget inputs and outputs.
     */
    private _clear;
    /**
     * Handle an input request from a kernel.
     */
    protected onInputRequest(msg: KernelMessage.IInputRequestMsg, future: Kernel.IFuture): void;
    /**
     * Update an output in the layout in place.
     */
    private _setOutput;
    /**
     * Render and insert a single output into the layout.
     */
    private _insertOutput;
    /**
     * Create an output item with a prompt and actual output
     */
    protected createOutputItem(model: IOutputModel): Widget;
    /**
     * Render a mimetype
     */
    protected createRenderedMimetype(model: IOutputModel): Widget;
    /**
     * Handle an iopub message.
     */
    private _onIOPub;
    /**
     * Handle an execute reply message.
     */
    private _onExecuteReply;
    private _minHeightTimeout;
    private _future;
    private _displayIdMap;
}
export declare class SimplifiedOutputArea extends OutputArea {
    /**
     * Handle an input request from a kernel by doing nothing.
     */
    protected onInputRequest(msg: KernelMessage.IInputRequestMsg, future: Kernel.IFuture): void;
    /**
     * Create an output item without a prompt, just the output widgets
     */
    protected createOutputItem(model: IOutputModel): Widget;
}
/**
 * A namespace for OutputArea statics.
 */
export declare namespace OutputArea {
    /**
     * The options to create an `OutputArea`.
     */
    interface IOptions {
        /**
         * The model used by the widget.
         */
        model: IOutputAreaModel;
        /**
         * The content factory used by the widget to create children.
         */
        contentFactory?: IContentFactory;
        /**
         * The rendermime instance used by the widget.
         */
        rendermime: RenderMimeRegistry;
    }
    /**
     * Execute code on an output area.
     */
    function execute(code: string, output: OutputArea, session: IClientSession, metadata?: JSONObject): Promise<KernelMessage.IExecuteReplyMsg>;
    /**
     * An output area widget content factory.
     *
     * The content factory is used to create children in a way
     * that can be customized.
     */
    interface IContentFactory {
        /**
         * Create an output prompt.
         */
        createOutputPrompt(): IOutputPrompt;
        /**
         * Create an stdin widget.
         */
        createStdin(options: Stdin.IOptions): IStdin;
    }
    /**
     * The default implementation of `IContentFactory`.
     */
    class ContentFactory implements IContentFactory {
        /**
         * Create the output prompt for the widget.
         */
        createOutputPrompt(): IOutputPrompt;
        /**
         * Create an stdin widget.
         */
        createStdin(options: Stdin.IOptions): IStdin;
    }
    /**
     * The default `ContentFactory` instance.
     */
    const defaultContentFactory: ContentFactory;
}
/******************************************************************************
 * OutputPrompt
 ******************************************************************************/
/**
 * The interface for an output prompt.
 */
export interface IOutputPrompt extends Widget {
    /**
     * The execution count for the prompt.
     */
    executionCount: nbformat.ExecutionCount;
}
/**
 * The default output prompt implementation
 */
export declare class OutputPrompt extends Widget implements IOutputPrompt {
    constructor();
    /**
     * The execution count for the prompt.
     */
    executionCount: nbformat.ExecutionCount;
    private _executionCount;
}
/******************************************************************************
 * Stdin
 ******************************************************************************/
/**
 * The stdin interface
 */
export interface IStdin extends Widget {
    /**
     * The stdin value.
     */
    readonly value: Promise<string>;
}
/**
 * The default stdin widget.
 */
export declare class Stdin extends Widget implements IStdin {
    /**
     * Construct a new input widget.
     */
    constructor(options: Stdin.IOptions);
    /**
     * The value of the widget.
     */
    readonly value: Promise<string>;
    /**
     * Handle the DOM events for the widget.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the dock panel's node. It should
     * not be called directly by user code.
     */
    handleEvent(event: Event): void;
    /**
     * Handle `after-attach` messages sent to the widget.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `update-request` messages sent to the widget.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle `before-detach` messages sent to the widget.
     */
    protected onBeforeDetach(msg: Message): void;
    private _future;
    private _input;
    private _value;
    private _promise;
}
export declare namespace Stdin {
    /**
     * The options to create a stdin widget.
     */
    interface IOptions {
        /**
         * The prompt text.
         */
        prompt: string;
        /**
         * Whether the input is a password.
         */
        password: boolean;
        /**
         * The kernel future associated with the request.
         */
        future: Kernel.IFuture;
    }
}
