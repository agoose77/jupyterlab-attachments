"use strict";
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const widgets_1 = require("@phosphor/widgets");
const widgets_2 = require("@phosphor/widgets");
const codeeditor_1 = require("@jupyterlab/codeeditor");
const codemirror_1 = require("@jupyterlab/codemirror");
/**
 * The class name added to input area widgets.
 */
const INPUT_AREA_CLASS = 'jp-InputArea';
/**
 * The class name added to the prompt area of cell.
 */
const INPUT_AREA_PROMPT_CLASS = 'jp-InputArea-prompt';
/**
 * The class name added to OutputPrompt.
 */
const INPUT_PROMPT_CLASS = 'jp-InputPrompt';
/**
 * The class name added to the editor area of the cell.
 */
const INPUT_AREA_EDITOR_CLASS = 'jp-InputArea-editor';
/******************************************************************************
 * InputArea
 ******************************************************************************/
/**
 * An input area widget, which hosts a prompt and an editor widget.
 */
class InputArea extends widgets_2.Widget {
    /**
     * Construct an input area widget.
     */
    constructor(options) {
        super();
        this._prompt = null;
        this._editor = null;
        this._rendered = null;
        this.addClass(INPUT_AREA_CLASS);
        let model = (this.model = options.model);
        let contentFactory = (this.contentFactory =
            options.contentFactory || InputArea.defaultContentFactory);
        // Prompt
        let prompt = (this._prompt = contentFactory.createInputPrompt());
        prompt.addClass(INPUT_AREA_PROMPT_CLASS);
        // Editor
        let editorOptions = { model, factory: contentFactory.editorFactory };
        let editor = (this._editor = new codeeditor_1.CodeEditorWrapper(editorOptions));
        editor.addClass(INPUT_AREA_EDITOR_CLASS);
        let layout = (this.layout = new widgets_1.PanelLayout());
        layout.addWidget(prompt);
        layout.addWidget(editor);
    }
    /**
     * Get the CodeEditorWrapper used by the cell.
     */
    get editorWidget() {
        return this._editor;
    }
    /**
     * Get the CodeEditor used by the cell.
     */
    get editor() {
        return this._editor.editor;
    }
    /**
     * Get the prompt node used by the cell.
     */
    get promptNode() {
        return this._prompt.node;
    }
    /**
     * Render an input instead of the text editor.
     */
    renderInput(widget) {
        let layout = this.layout;
        if (this._rendered) {
            this._rendered.parent = null;
        }
        this._editor.hide();
        this._rendered = widget;
        layout.addWidget(widget);
    }
    /**
     * Show the text editor.
     */
    showEditor() {
        if (this._rendered) {
            this._rendered.parent = null;
        }
        this._editor.show();
    }
    /**
     * Set the prompt of the input area.
     */
    setPrompt(value) {
        this._prompt.executionCount = value;
    }
    /**
     * Dispose of the resources held by the widget.
     */
    dispose() {
        // Do nothing if already disposed.
        if (this.isDisposed) {
            return;
        }
        this._prompt = null;
        this._editor = null;
        this._rendered = null;
        super.dispose();
    }
}
exports.InputArea = InputArea;
/**
 * A namespace for `InputArea` statics.
 */
(function (InputArea) {
    /**
     * Default implementation of `IContentFactory`.
     *
     * This defaults to using an `editorFactory` based on CodeMirror.
     */
    class ContentFactory {
        /**
         * Construct a `ContentFactory`.
         */
        constructor(options = {}) {
            this._editor = null;
            this._editor = options.editorFactory || InputArea.defaultEditorFactory;
        }
        /**
         * Return the `CodeEditor.Factory` being used.
         */
        get editorFactory() {
            return this._editor;
        }
        /**
         * Create an input prompt.
         */
        createInputPrompt() {
            return new InputPrompt();
        }
    }
    InputArea.ContentFactory = ContentFactory;
    /**
     * A function to create the default CodeMirror editor factory.
     */
    function _createDefaultEditorFactory() {
        let editorServices = new codemirror_1.CodeMirrorEditorFactory();
        return editorServices.newInlineEditor;
    }
    /**
     * The default editor factory singleton based on CodeMirror.
     */
    InputArea.defaultEditorFactory = _createDefaultEditorFactory();
    /**
     * The default `ContentFactory` instance.
     */
    InputArea.defaultContentFactory = new ContentFactory({});
})(InputArea = exports.InputArea || (exports.InputArea = {}));
/**
 * The default input prompt implementation.
 */
class InputPrompt extends widgets_2.Widget {
    /*
     * Create an output prompt widget.
     */
    constructor() {
        super();
        this._executionCount = null;
        this.addClass(INPUT_PROMPT_CLASS);
    }
    /**
     * The execution count for the prompt.
     */
    get executionCount() {
        return this._executionCount;
    }
    set executionCount(value) {
        this._executionCount = value;
        if (value === null) {
            this.node.textContent = ' ';
        }
        else {
            this.node.textContent = `[${value || ' '}]:`;
        }
    }
}
exports.InputPrompt = InputPrompt;
