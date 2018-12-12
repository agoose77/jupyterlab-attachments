import { Token } from '@phosphor/coreutils';
import { Message } from '@phosphor/messaging';
import { ISignal } from '@phosphor/signaling';
import { IClientSession } from '@jupyterlab/apputils';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { RenderMimeRegistry } from '@jupyterlab/rendermime';
import { INotebookModel } from './model';
import { Notebook } from './widget';
/**
 * A widget that hosts a notebook toolbar and content area.
 *
 * #### Notes
 * The widget keeps the document metadata in sync with the current
 * kernel on the context.
 */
export declare class NotebookPanel extends DocumentWidget<Notebook, INotebookModel> {
    /**
     * Construct a new notebook panel.
     */
    constructor(options: DocumentWidget.IOptions<Notebook, INotebookModel>);
    /**
     * A signal emitted when the panel has been activated.
     */
    readonly activated: ISignal<this, void>;
    /**
     * The client session used by the panel.
     */
    readonly session: IClientSession;
    /**
     * The content factory for the notebook.
     *
     * TODO: deprecate this in favor of the .content attribute
     *
     */
    readonly contentFactory: Notebook.IContentFactory;
    /**
     * The rendermime instance for the notebook.
     *
     * TODO: deprecate this in favor of the .content attribute
     *
     */
    readonly rendermime: RenderMimeRegistry;
    /**
     * The notebook used by the widget.
     */
    readonly content: Notebook;
    /**
     * The model for the widget.
     */
    readonly model: INotebookModel;
    /**
     * Dispose of the resources used by the widget.
     */
    dispose(): void;
    /**
     * Handle `'activate-request'` messages.
     */
    protected onActivateRequest(msg: Message): void;
    /**
     * Handle a change in the kernel by updating the document metadata.
     */
    private _onKernelChanged;
    /**
     * Update the kernel language.
     */
    private _updateLanguage;
    /**
     * Update the kernel spec.
     */
    private _updateSpec;
    private _activated;
}
/**
 * A namespace for `NotebookPanel` statics.
 */
export declare namespace NotebookPanel {
    /**
     * A content factory interface for NotebookPanel.
     */
    interface IContentFactory extends Notebook.IContentFactory {
        /**
         * Create a new content area for the panel.
         */
        createNotebook(options: Notebook.IOptions): Notebook;
    }
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory extends Notebook.ContentFactory implements IContentFactory {
        /**
         * Create a new content area for the panel.
         */
        createNotebook(options: Notebook.IOptions): Notebook;
    }
    /**
     * Default content factory for the notebook panel.
     */
    const defaultContentFactory: ContentFactory;
    /**
     * The notebook renderer token.
     */
    const IContentFactory: Token<IContentFactory>;
}
