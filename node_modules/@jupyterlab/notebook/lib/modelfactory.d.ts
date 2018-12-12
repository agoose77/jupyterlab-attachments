import { CodeCellModel } from '@jupyterlab/cells';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IModelDB } from '@jupyterlab/observables';
import { Contents } from '@jupyterlab/services';
import { INotebookModel, NotebookModel } from './model';
/**
 * A model factory for notebooks.
 */
export declare class NotebookModelFactory implements DocumentRegistry.IModelFactory<INotebookModel> {
    /**
     * Construct a new notebook model factory.
     */
    constructor(options: NotebookModelFactory.IOptions);
    /**
     * The content model factory used by the NotebookModelFactory.
     */
    readonly contentFactory: NotebookModel.IContentFactory;
    /**
     * The name of the model.
     */
    readonly name: string;
    /**
     * The content type of the file.
     */
    readonly contentType: Contents.ContentType;
    /**
     * The format of the file.
     */
    readonly fileFormat: Contents.FileFormat;
    /**
     * Get whether the model factory has been disposed.
     */
    readonly isDisposed: boolean;
    /**
     * Dispose of the model factory.
     */
    dispose(): void;
    /**
     * Create a new model for a given path.
     *
     * @param languagePreference - An optional kernel language preference.
     *
     * @returns A new document model.
     */
    createNew(languagePreference?: string, modelDB?: IModelDB): INotebookModel;
    /**
     * Get the preferred kernel language given a path.
     */
    preferredLanguage(path: string): string;
    private _disposed;
}
/**
 * The namespace for notebook model factory statics.
 */
export declare namespace NotebookModelFactory {
    /**
     * The options used to initialize a NotebookModelFactory.
     */
    interface IOptions {
        /**
         * The factory for code cell content.
         */
        codeCellContentFactory?: CodeCellModel.IContentFactory;
        /**
         * The content factory used by the NotebookModelFactory.  If
         * given, it will supersede the `codeCellContentFactory`.
         */
        contentFactory?: NotebookModel.IContentFactory;
    }
}
