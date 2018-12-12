"use strict";
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const attachments_1 = require("@jupyterlab/attachments");
const coreutils_1 = require("@jupyterlab/coreutils");
const outputarea_1 = require("@jupyterlab/outputarea");
const rendermime_1 = require("@jupyterlab/rendermime");
const coreutils_2 = require("@phosphor/coreutils");
const widgets_1 = require("@phosphor/widgets");
const collapser_1 = require("./collapser");
const headerfooter_1 = require("./headerfooter");
const inputarea_1 = require("./inputarea");
const placeholder_1 = require("./placeholder");
/**
 * The CSS class added to cell widgets.
 */
const CELL_CLASS = 'jp-Cell';
/**
 * The CSS class added to the cell header.
 */
const CELL_HEADER_CLASS = 'jp-Cell-header';
/**
 * The CSS class added to the cell footer.
 */
const CELL_FOOTER_CLASS = 'jp-Cell-footer';
/**
 * The CSS class added to the cell input wrapper.
 */
const CELL_INPUT_WRAPPER_CLASS = 'jp-Cell-inputWrapper';
/**
 * The CSS class added to the cell output wrapper.
 */
const CELL_OUTPUT_WRAPPER_CLASS = 'jp-Cell-outputWrapper';
/**
 * The CSS class added to the cell input area.
 */
const CELL_INPUT_AREA_CLASS = 'jp-Cell-inputArea';
/**
 * The CSS class added to the cell output area.
 */
const CELL_OUTPUT_AREA_CLASS = 'jp-Cell-outputArea';
/**
 * The CSS class added to the cell input collapser.
 */
const CELL_INPUT_COLLAPSER_CLASS = 'jp-Cell-inputCollapser';
/**
 * The CSS class added to the cell output collapser.
 */
const CELL_OUTPUT_COLLAPSER_CLASS = 'jp-Cell-outputCollapser';
/**
 * The class name added to the cell when collapsed.
 */
const COLLAPSED_CLASS = 'jp-mod-collapsed';
/**
 * The class name added to the cell when readonly.
 */
const READONLY_CLASS = 'jp-mod-readOnly';
/**
 * The class name added to code cells.
 */
const CODE_CELL_CLASS = 'jp-CodeCell';
/**
 * The class name added to markdown cells.
 */
const MARKDOWN_CELL_CLASS = 'jp-MarkdownCell';
/**
 * The class name added to rendered markdown output widgets.
 */
const MARKDOWN_OUTPUT_CLASS = 'jp-MarkdownOutput';
/**
 * The class name added to raw cells.
 */
const RAW_CELL_CLASS = 'jp-RawCell';
/**
 * The class name added to a rendered input area.
 */
const RENDERED_CLASS = 'jp-mod-rendered';
const NO_OUTPUTS_CLASS = 'jp-mod-noOutputs';
/**
 * The text applied to an empty markdown cell.
 */
const DEFAULT_MARKDOWN_TEXT = 'Type Markdown and LaTeX: $ α^2 $';
/**
 * The timeout to wait for change activity to have ceased before rendering.
 */
const RENDER_TIMEOUT = 1000;
/******************************************************************************
 * Cell
 ******************************************************************************/
/**
 * A base cell widget.
 */
class Cell extends widgets_1.Widget {
    /**
     * Construct a new base cell widget.
     */
    constructor(options) {
        super();
        this._readOnly = false;
        this._model = null;
        this._inputHidden = false;
        this._input = null;
        this._inputWrapper = null;
        this._inputPlaceholder = null;
        this.addClass(CELL_CLASS);
        let model = (this._model = options.model);
        let contentFactory = (this.contentFactory =
            options.contentFactory || Cell.defaultContentFactory);
        this.layout = new widgets_1.PanelLayout();
        // Header
        let header = contentFactory.createCellHeader();
        header.addClass(CELL_HEADER_CLASS);
        this.layout.addWidget(header);
        // Input
        let inputWrapper = (this._inputWrapper = new widgets_1.Panel());
        inputWrapper.addClass(CELL_INPUT_WRAPPER_CLASS);
        let inputCollapser = new collapser_1.InputCollapser();
        inputCollapser.addClass(CELL_INPUT_COLLAPSER_CLASS);
        let input = (this._input = new inputarea_1.InputArea({ model, contentFactory }));
        input.addClass(CELL_INPUT_AREA_CLASS);
        inputWrapper.addWidget(inputCollapser);
        inputWrapper.addWidget(input);
        this.layout.addWidget(inputWrapper);
        this._inputPlaceholder = new placeholder_1.InputPlaceholder(() => {
            this.inputHidden = !this.inputHidden;
        });
        // Footer
        let footer = this.contentFactory.createCellFooter();
        footer.addClass(CELL_FOOTER_CLASS);
        this.layout.addWidget(footer);
        // Editor settings
        if (options.editorConfig) {
            Object.keys(options.editorConfig).forEach((key) => {
                this.editor.setOption(key, options.editorConfig[key]);
            });
        }
    }
    /**
     * Modify some state for initialization.
     *
     * Should be called at the end of the subclasses's constructor.
     */
    initializeState() {
        const jupyter = this.model.metadata.get('jupyter') || {};
        this.inputHidden = jupyter.source_hidden === true;
        this._readOnly = this.model.metadata.get('editable') === false;
    }
    /**
     * Get the prompt node used by the cell.
     */
    get promptNode() {
        if (!this._inputHidden) {
            return this._input.promptNode;
        }
        else {
            return this._inputPlaceholder.node
                .firstElementChild;
        }
    }
    /**
     * Get the CodeEditorWrapper used by the cell.
     */
    get editorWidget() {
        return this._input.editorWidget;
    }
    /**
     * Get the CodeEditor used by the cell.
     */
    get editor() {
        return this._input.editor;
    }
    /**
     * Get the model used by the cell.
     */
    get model() {
        return this._model;
    }
    /**
     * Get the input area for the cell.
     */
    get inputArea() {
        return this._input;
    }
    /**
     * The read only state of the cell.
     */
    get readOnly() {
        return this._readOnly;
    }
    set readOnly(value) {
        if (value === this._readOnly) {
            return;
        }
        this._readOnly = value;
        this.update();
    }
    /**
     * A promise that resolves when the widget renders for the first time.
     */
    get ready() {
        return Promise.resolve(undefined);
    }
    /**
     * Set the prompt for the widget.
     */
    setPrompt(value) {
        this._input.setPrompt(value);
    }
    /**
     * The view state of input being hidden.
     */
    get inputHidden() {
        return this._inputHidden;
    }
    set inputHidden(value) {
        if (this._inputHidden === value) {
            return;
        }
        let layout = this._inputWrapper.layout;
        if (value) {
            this._input.parent = null;
            layout.addWidget(this._inputPlaceholder);
        }
        else {
            this._inputPlaceholder.parent = null;
            layout.addWidget(this._input);
        }
        this._inputHidden = value;
        this.handleInputHidden(value);
    }
    /**
     * Handle the input being hidden.
     *
     * #### Notes
     * This is called by the `inputHidden` setter so that subclasses
     * can perform actions upon the input being hidden without accessing
     * private state.
     */
    handleInputHidden(value) {
        return;
    }
    /**
     * Clone the cell, using the same model.
     */
    clone() {
        let constructor = this.constructor;
        return new constructor({
            model: this.model,
            contentFactory: this.contentFactory
        });
    }
    /**
     * Dispose of the resources held by the widget.
     */
    dispose() {
        // Do nothing if already disposed.
        if (this.isDisposed) {
            return;
        }
        this._input = null;
        this._model = null;
        this._inputWrapper = null;
        this._inputPlaceholder = null;
        super.dispose();
    }
    /**
     * Handle `after-attach` messages.
     */
    onAfterAttach(msg) {
        this.update();
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        this.editor.focus();
    }
    /**
     * Handle `update-request` messages.
     */
    onUpdateRequest(msg) {
        if (!this._model) {
            return;
        }
        // Handle read only state.
        if (this.editor.getOption('readOnly') !== this._readOnly) {
            this.editor.setOption('readOnly', this._readOnly);
            this.toggleClass(READONLY_CLASS, this._readOnly);
        }
    }
}
exports.Cell = Cell;
/**
 * The namespace for the `Cell` class statics.
 */
(function (Cell) {
    /**
     * The default implementation of an `IContentFactory`.
     *
     * This includes a CodeMirror editor factory to make it easy to use out of the box.
     */
    class ContentFactory {
        /**
         * Create a content factory for a cell.
         */
        constructor(options = {}) {
            this._editorFactory = null;
            this._editorFactory =
                options.editorFactory || inputarea_1.InputArea.defaultEditorFactory;
        }
        /**
         * The readonly editor factory that create code editors
         */
        get editorFactory() {
            return this._editorFactory;
        }
        /**
         * Create a new cell header for the parent widget.
         */
        createCellHeader() {
            return new headerfooter_1.CellHeader();
        }
        /**
         * Create a new cell header for the parent widget.
         */
        createCellFooter() {
            return new headerfooter_1.CellFooter();
        }
        /**
         * Create an input prompt.
         */
        createInputPrompt() {
            return new inputarea_1.InputPrompt();
        }
        /**
         * Create the output prompt for the widget.
         */
        createOutputPrompt() {
            return new outputarea_1.OutputPrompt();
        }
        /**
         * Create an stdin widget.
         */
        createStdin(options) {
            return new outputarea_1.Stdin(options);
        }
    }
    Cell.ContentFactory = ContentFactory;
    /**
     * The default content factory for cells.
     */
    Cell.defaultContentFactory = new ContentFactory();
})(Cell = exports.Cell || (exports.Cell = {}));
/******************************************************************************
 * CodeCell
 ******************************************************************************/
/**
 * A widget for a code cell.
 */
class CodeCell extends Cell {
    /**
     * Construct a code cell widget.
     */
    constructor(options) {
        super(options);
        this._rendermime = null;
        this._outputHidden = false;
        this._outputWrapper = null;
        this._outputPlaceholder = null;
        this._output = null;
        this.addClass(CODE_CELL_CLASS);
        // Only save options not handled by parent constructor.
        let rendermime = (this._rendermime = options.rendermime);
        let contentFactory = this.contentFactory;
        let model = this.model;
        // Insert the output before the cell footer.
        let outputWrapper = (this._outputWrapper = new widgets_1.Panel());
        outputWrapper.addClass(CELL_OUTPUT_WRAPPER_CLASS);
        let outputCollapser = new collapser_1.OutputCollapser();
        outputCollapser.addClass(CELL_OUTPUT_COLLAPSER_CLASS);
        let output = (this._output = new outputarea_1.OutputArea({
            model: model.outputs,
            rendermime,
            contentFactory: contentFactory
        }));
        output.addClass(CELL_OUTPUT_AREA_CLASS);
        // Set a CSS if there are no outputs, and connect a signal for future
        // changes to the number of outputs. This is for conditional styling
        // if there are no outputs.
        if (model.outputs.length === 0) {
            this.addClass(NO_OUTPUTS_CLASS);
        }
        output.outputLengthChanged.connect(this._outputLengthHandler, this);
        outputWrapper.addWidget(outputCollapser);
        outputWrapper.addWidget(output);
        this.layout.insertWidget(2, outputWrapper);
        this._outputPlaceholder = new placeholder_1.OutputPlaceholder(() => {
            this.outputHidden = !this.outputHidden;
        });
        // Modify state
        this.initializeState();
        model.stateChanged.connect(this.onStateChanged, this);
        model.metadata.changed.connect(this.onMetadataChanged, this);
    }
    /**
     * Modify some state for initialization.
     *
     * Should be called at the end of the subclasses's constructor.
     */
    initializeState() {
        super.initializeState();
        const metadataScrolled = this.model.metadata.get('scrolled');
        this.outputsScrolled = metadataScrolled === true;
        const jupyter = this.model.metadata.get('jupyter') || {};
        const collapsed = this.model.metadata.get('collapsed');
        this.outputHidden = collapsed === true || jupyter.outputs_hidden === true;
        this.setPrompt(`${this.model.executionCount || ''}`);
    }
    /**
     * Get the output area for the cell.
     */
    get outputArea() {
        return this._output;
    }
    /**
     * The view state of output being collapsed.
     */
    get outputHidden() {
        return this._outputHidden;
    }
    set outputHidden(value) {
        if (this._outputHidden === value) {
            return;
        }
        let layout = this._outputWrapper.layout;
        if (value) {
            layout.removeWidget(this._output);
            layout.addWidget(this._outputPlaceholder);
            if (this.inputHidden && !this._outputWrapper.isHidden) {
                this._outputWrapper.hide();
            }
        }
        else {
            if (this._outputWrapper.isHidden) {
                this._outputWrapper.show();
            }
            layout.removeWidget(this._outputPlaceholder);
            layout.addWidget(this._output);
        }
        this._outputHidden = value;
    }
    /**
     * Whether the output is in a scrolled state?
     */
    get outputsScrolled() {
        return this._outputsScrolled;
    }
    set outputsScrolled(value) {
        this.toggleClass('jp-mod-outputsScrolled', value);
        this._outputsScrolled = value;
    }
    /**
     * Handle the input being hidden.
     *
     * #### Notes
     * This method is called by the case cell implementation and is
     * subclasses here so the code cell can watch to see when input
     * is hidden without accessing private state.
     */
    handleInputHidden(value) {
        if (!value && this._outputWrapper.isHidden) {
            this._outputWrapper.show();
        }
        else if (value && !this._outputWrapper.isHidden && this._outputHidden) {
            this._outputWrapper.hide();
        }
    }
    /**
     * Clone the cell, using the same model.
     */
    clone() {
        let constructor = this.constructor;
        return new constructor({
            model: this.model,
            contentFactory: this.contentFactory,
            rendermime: this._rendermime
        });
    }
    /**
     * Clone the OutputArea alone, returning a simplified output area, using the same model.
     */
    cloneOutputArea() {
        return new outputarea_1.SimplifiedOutputArea({
            model: this.model.outputs,
            contentFactory: this.contentFactory,
            rendermime: this._rendermime
        });
    }
    /**
     * Dispose of the resources used by the widget.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._output.outputLengthChanged.disconnect(this._outputLengthHandler, this);
        this._rendermime = null;
        this._output = null;
        this._outputWrapper = null;
        this._outputPlaceholder = null;
        super.dispose();
    }
    /**
     * Handle `update-request` messages.
     */
    onUpdateRequest(msg) {
        let value = this.model.metadata.get('collapsed');
        this.toggleClass(COLLAPSED_CLASS, value);
        if (this._output) {
            // TODO: handle scrolled state.
        }
        super.onUpdateRequest(msg);
    }
    /**
     * Handle changes in the model.
     */
    onStateChanged(model, args) {
        switch (args.name) {
            case 'executionCount':
                this.setPrompt(`${model.executionCount || ''}`);
                break;
            default:
                break;
        }
    }
    /**
     * Handle changes in the metadata.
     */
    onMetadataChanged(model, args) {
        switch (args.key) {
            case 'collapsed':
            case 'scrolled':
                this.update();
                break;
            case 'editable':
                this.readOnly = !args.newValue;
                break;
            default:
                break;
        }
    }
    /**
     * Handle changes in the number of outputs in the output area.
     */
    _outputLengthHandler(sender, args) {
        let force = args === 0 ? true : false;
        this.toggleClass(NO_OUTPUTS_CLASS, force);
        /* Turn off scrolling outputs if there are none */
        if (force) {
            this.outputsScrolled = false;
        }
    }
}
exports.CodeCell = CodeCell;
/**
 * The namespace for the `CodeCell` class statics.
 */
(function (CodeCell) {
    /**
     * Execute a cell given a client session.
     */
    function execute(cell, session, metadata) {
        let model = cell.model;
        let code = model.value.text;
        if (!code.trim() || !session.kernel) {
            model.executionCount = null;
            model.outputs.clear();
            return Promise.resolve(void 0);
        }
        let cellId = { cellId: model.id };
        metadata = Object.assign({}, metadata, cellId);
        model.executionCount = null;
        cell.outputHidden = false;
        cell.setPrompt('*');
        model.trusted = true;
        return outputarea_1.OutputArea.execute(code, cell.outputArea, session, metadata)
            .then(msg => {
            model.executionCount = msg.content.execution_count;
            return msg;
        })
            .catch(e => {
            if (e.message === 'Canceled') {
                cell.setPrompt('');
            }
            throw e;
        });
    }
    CodeCell.execute = execute;
})(CodeCell = exports.CodeCell || (exports.CodeCell = {}));
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
class MarkdownCell extends Cell {
    /**
     * Construct a Markdown cell widget.
     */
    constructor(options) {
        super(options);
        this._monitor = null;
        this._renderer = null;
        this._rendered = true;
        this._prevText = '';
        this._ready = new coreutils_2.PromiseDelegate();
        this.addClass(MARKDOWN_CELL_CLASS);
        // Ensure we can resolve attachments:
        this._rendermime = options.rendermime.clone({
            resolver: new attachments_1.AttachmentsResolver({
                parent: options.rendermime.resolver,
                model: this.model.attachments
            })
        });
        // Throttle the rendering rate of the widget.
        this._monitor = new coreutils_1.ActivityMonitor({
            signal: this.model.contentChanged,
            timeout: RENDER_TIMEOUT
        });
        this._monitor.activityStopped.connect(() => {
            if (this._rendered) {
                this.update();
            }
        }, this);
        this._updateRenderedInput().then(() => {
            this._ready.resolve(void 0);
        });
        super.initializeState();
    }
    /**
     * A promise that resolves when the widget renders for the first time.
     */
    get ready() {
        return this._ready.promise;
    }
    /**
     * Whether the cell is rendered.
     */
    get rendered() {
        return this._rendered;
    }
    set rendered(value) {
        if (value === this._rendered) {
            return;
        }
        this._rendered = value;
        this._handleRendered();
    }
    /**
     * Render an input instead of the text editor.
     */
    renderInput(widget) {
        this.addClass(RENDERED_CLASS);
        this.inputArea.renderInput(widget);
    }
    /**
     * Show the text editor instead of rendered input.
     */
    showEditor() {
        this.removeClass(RENDERED_CLASS);
        this.inputArea.showEditor();
    }
    /*
     * Handle `update-request` messages.
     */
    onUpdateRequest(msg) {
        // Make sure we are properly rendered.
        this._handleRendered();
        super.onUpdateRequest(msg);
    }
    /**
     * Handle the rendered state.
     */
    _handleRendered() {
        if (!this._rendered) {
            this.showEditor();
        }
        else {
            this._updateRenderedInput();
            this.renderInput(this._renderer);
        }
    }
    /**
     * Update the rendered input.
     */
    _updateRenderedInput() {
        let model = this.model;
        let text = (model && model.value.text) || DEFAULT_MARKDOWN_TEXT;
        // Do not re-render if the text has not changed.
        if (text !== this._prevText) {
            let mimeModel = new rendermime_1.MimeModel({ data: { 'text/markdown': text } });
            if (!this._renderer) {
                this._renderer = this._rendermime.createRenderer('text/markdown');
                this._renderer.addClass(MARKDOWN_OUTPUT_CLASS);
            }
            this._prevText = text;
            return this._renderer.renderModel(mimeModel);
        }
        return Promise.resolve(void 0);
    }
    /**
     * Clone the cell, using the same model.
     */
    clone() {
        let constructor = this.constructor;
        return new constructor({
            model: this.model,
            contentFactory: this.contentFactory,
            rendermime: this._rendermime
        });
    }
}
exports.MarkdownCell = MarkdownCell;
/******************************************************************************
 * RawCell
 ******************************************************************************/
/**
 * A widget for a raw cell.
 */
class RawCell extends Cell {
    /**
     * Construct a raw cell widget.
     */
    constructor(options) {
        super(options);
        this.addClass(RAW_CELL_CLASS);
        super.initializeState();
    }
    /**
     * Clone the cell, using the same model.
     */
    clone() {
        let constructor = this.constructor;
        return new constructor({
            model: this.model,
            contentFactory: this.contentFactory
        });
    }
}
exports.RawCell = RawCell;
