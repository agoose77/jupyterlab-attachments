import { Widget } from '@phosphor/widgets';
import { CodeEditor, CodeEditorWrapper } from '@jupyterlab/codeeditor';
import { ICellModel } from './model';
/******************************************************************************
 * InputArea
 ******************************************************************************/
/**
 * An input area widget, which hosts a prompt and an editor widget.
 */
export declare class InputArea extends Widget {
    /**
     * Construct an input area widget.
     */
    constructor(options: InputArea.IOptions);
    /**
     * The model used by the widget.
     */
    readonly model: ICellModel;
    /**
     * The content factory used by the widget.
     */
    readonly contentFactory: InputArea.IContentFactory;
    /**
     * Get the CodeEditorWrapper used by the cell.
     */
    readonly editorWidget: CodeEditorWrapper;
    /**
     * Get the CodeEditor used by the cell.
     */
    readonly editor: CodeEditor.IEditor;
    /**
     * Get the prompt node used by the cell.
     */
    readonly promptNode: HTMLElement;
    /**
     * Render an input instead of the text editor.
     */
    renderInput(widget: Widget): void;
    /**
     * Show the text editor.
     */
    showEditor(): void;
    /**
     * Set the prompt of the input area.
     */
    setPrompt(value: string): void;
    /**
     * Dispose of the resources held by the widget.
     */
    dispose(): void;
    private _prompt;
    private _editor;
    private _rendered;
}
/**
 * A namespace for `InputArea` statics.
 */
export declare namespace InputArea {
    /**
     * The options used to create an `InputArea`.
     */
    interface IOptions {
        /**
         * The model used by the widget.
         */
        model: ICellModel;
        /**
         * The content factory used by the widget to create children.
         *
         * Defaults to one that uses CodeMirror.
         */
        contentFactory?: IContentFactory;
    }
    /**
     * An input area widget content factory.
     *
     * The content factory is used to create children in a way
     * that can be customized.
     */
    interface IContentFactory {
        /**
         * The editor factory we need to include in `CodeEditorWratter.IOptions`.
         *
         * This is a separate readonly attribute rather than a factory method as we need
         * to pass it around.
         */
        readonly editorFactory: CodeEditor.Factory;
        /**
         * Create an input prompt.
         */
        createInputPrompt(): IInputPrompt;
    }
    /**
     * Default implementation of `IContentFactory`.
     *
     * This defaults to using an `editorFactory` based on CodeMirror.
     */
    class ContentFactory implements IContentFactory {
        /**
         * Construct a `ContentFactory`.
         */
        constructor(options?: ContentFactory.IOptions);
        /**
         * Return the `CodeEditor.Factory` being used.
         */
        readonly editorFactory: CodeEditor.Factory;
        /**
         * Create an input prompt.
         */
        createInputPrompt(): IInputPrompt;
        private _editor;
    }
    /**
     * A namespace for the input area content factory.
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
     * The default editor factory singleton based on CodeMirror.
     */
    const defaultEditorFactory: CodeEditor.Factory;
    /**
     * The default `ContentFactory` instance.
     */
    const defaultContentFactory: ContentFactory;
}
/******************************************************************************
 * InputPrompt
 ******************************************************************************/
/**
 * The interface for the input prompt.
 */
export interface IInputPrompt extends Widget {
    /**
     * The execution count of the prompt.
     */
    executionCount: string;
}
/**
 * The default input prompt implementation.
 */
export declare class InputPrompt extends Widget implements IInputPrompt {
    constructor();
    /**
     * The execution count for the prompt.
     */
    executionCount: string;
    private _executionCount;
}
