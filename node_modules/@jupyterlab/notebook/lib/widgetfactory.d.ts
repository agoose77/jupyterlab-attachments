import { IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';
import { RenderMimeRegistry } from '@jupyterlab/rendermime';
import { INotebookModel } from './model';
import { NotebookPanel } from './panel';
import { StaticNotebook } from './widget';
/**
 * A widget factory for notebook panels.
 */
export declare class NotebookWidgetFactory extends ABCWidgetFactory<NotebookPanel, INotebookModel> {
    /**
     * Construct a new notebook widget factory.
     *
     * @param options - The options used to construct the factory.
     */
    constructor(options: NotebookWidgetFactory.IOptions<NotebookPanel>);
    readonly rendermime: RenderMimeRegistry;
    /**
     * The content factory used by the widget factory.
     */
    readonly contentFactory: NotebookPanel.IContentFactory;
    /**
     * The service used to look up mime types.
     */
    readonly mimeTypeService: IEditorMimeTypeService;
    /**
     * A configuration object for cell editor settings.
     */
    editorConfig: StaticNotebook.IEditorConfig;
    /**
     * Create a new widget.
     *
     * #### Notes
     * The factory will start the appropriate kernel and populate
     * the default toolbar items using `ToolbarItems.populateDefaults`.
     */
    protected createNewWidget(context: DocumentRegistry.IContext<INotebookModel>): NotebookPanel;
    /**
     * Default factory for toolbar items to be added after the widget is created.
     */
    protected defaultToolbarFactory(widget: NotebookPanel): DocumentRegistry.IToolbarItem[];
    private _editorConfig;
}
/**
 * The namespace for `NotebookWidgetFactory` statics.
 */
export declare namespace NotebookWidgetFactory {
    /**
     * The options used to construct a `NotebookWidgetFactory`.
     */
    interface IOptions<T extends NotebookPanel> extends DocumentRegistry.IWidgetFactoryOptions<T> {
        rendermime: RenderMimeRegistry;
        /**
         * A notebook panel content factory.
         */
        contentFactory: NotebookPanel.IContentFactory;
        /**
         * The service used to look up mime types.
         */
        mimeTypeService: IEditorMimeTypeService;
        /**
         * The notebook cell editor configuration.
         */
        editorConfig?: StaticNotebook.IEditorConfig;
    }
}
