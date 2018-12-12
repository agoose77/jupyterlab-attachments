"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const coreutils_1 = require("@phosphor/coreutils");
const signaling_1 = require("@phosphor/signaling");
const widgets_1 = require("@phosphor/widgets");
const widgets_2 = require("@phosphor/widgets");
const services_1 = require("@jupyterlab/services");
/**
 * The class name added to an output area widget.
 */
const OUTPUT_AREA_CLASS = 'jp-OutputArea';
/**
 * The class name added to the direction children of OutputArea
 */
const OUTPUT_AREA_ITEM_CLASS = 'jp-OutputArea-child';
/**
 * The class name added to actual outputs
 */
const OUTPUT_AREA_OUTPUT_CLASS = 'jp-OutputArea-output';
/**
 * The class name added to prompt children of OutputArea.
 */
const OUTPUT_AREA_PROMPT_CLASS = 'jp-OutputArea-prompt';
/**
 * The class name added to OutputPrompt.
 */
const OUTPUT_PROMPT_CLASS = 'jp-OutputPrompt';
/**
 * The class name added to an execution result.
 */
const EXECUTE_CLASS = 'jp-OutputArea-executeResult';
/**
 * The class name added stdin items of OutputArea
 */
const OUTPUT_AREA_STDIN_ITEM_CLASS = 'jp-OutputArea-stdin-item';
/**
 * The class name added to stdin widgets.
 */
const STDIN_CLASS = 'jp-Stdin';
/**
 * The class name added to stdin data prompt nodes.
 */
const STDIN_PROMPT_CLASS = 'jp-Stdin-prompt';
/**
 * The class name added to stdin data input nodes.
 */
const STDIN_INPUT_CLASS = 'jp-Stdin-input';
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
class OutputArea extends widgets_2.Widget {
    /**
     * Construct an output area widget.
     */
    constructor(options) {
        super();
        /**
         * A public signal used to indicate the number of outputs has changed.
         *
         * #### Notes
         * This is useful for parents who want to apply styling based on the number
         * of outputs. Emits the current number of outputs.
         */
        this.outputLengthChanged = new signaling_1.Signal(this);
        /**
         * Handle an iopub message.
         */
        this._onIOPub = (msg) => {
            let model = this.model;
            let msgType = msg.header.msg_type;
            let output;
            let transient = (msg.content.transient || {});
            let displayId = transient['display_id'];
            let targets;
            switch (msgType) {
                case 'execute_result':
                case 'display_data':
                case 'stream':
                case 'error':
                    output = msg.content;
                    output.output_type = msgType;
                    model.add(output);
                    break;
                case 'clear_output':
                    let wait = msg.content.wait;
                    model.clear(wait);
                    break;
                case 'update_display_data':
                    output = msg.content;
                    output.output_type = 'display_data';
                    targets = this._displayIdMap.get(displayId);
                    if (targets) {
                        for (let index of targets) {
                            model.set(index, output);
                        }
                    }
                    break;
                default:
                    break;
            }
            if (displayId && msgType === 'display_data') {
                targets = this._displayIdMap.get(displayId) || [];
                targets.push(model.length - 1);
                this._displayIdMap.set(displayId, targets);
            }
        };
        /**
         * Handle an execute reply message.
         */
        this._onExecuteReply = (msg) => {
            // API responses that contain a pager are special cased and their type
            // is overridden from 'execute_reply' to 'display_data' in order to
            // render output.
            let model = this.model;
            let content = msg.content;
            let payload = content && content.payload;
            if (!payload || !payload.length) {
                return;
            }
            let pages = payload.filter((i) => i.source === 'page');
            if (!pages.length) {
                return;
            }
            let page = JSON.parse(JSON.stringify(pages[0]));
            let output = {
                output_type: 'display_data',
                data: page.data,
                metadata: {}
            };
            model.add(output);
        };
        this._minHeightTimeout = null;
        this._future = null;
        this._displayIdMap = new Map();
        let model = (this.model = options.model);
        this.addClass(OUTPUT_AREA_CLASS);
        this.rendermime = options.rendermime;
        this.contentFactory =
            options.contentFactory || OutputArea.defaultContentFactory;
        this.layout = new widgets_1.PanelLayout();
        for (let i = 0; i < model.length; i++) {
            let output = model.get(i);
            this._insertOutput(i, output);
        }
        model.changed.connect(this.onModelChanged, this);
        model.stateChanged.connect(this.onStateChanged, this);
    }
    /**
     * A read-only sequence of the chidren widgets in the output area.
     */
    get widgets() {
        return this.layout.widgets;
    }
    /**
     * The kernel future associated with the output area.
     */
    get future() {
        return this._future;
    }
    set future(value) {
        // Bail if the model is disposed.
        if (this.model.isDisposed) {
            throw Error('Model is disposed');
        }
        if (this._future === value) {
            return;
        }
        if (this._future) {
            this._future.dispose();
        }
        this._future = value;
        this.model.clear();
        // Make sure there were no input widgets.
        if (this.widgets.length) {
            this._clear();
            this.outputLengthChanged.emit(this.model.length);
        }
        // Handle published messages.
        value.onIOPub = this._onIOPub;
        // Handle the execute reply.
        value.onReply = this._onExecuteReply;
        // Handle stdin.
        value.onStdin = msg => {
            if (services_1.KernelMessage.isInputRequestMsg(msg)) {
                this.onInputRequest(msg, value);
            }
        };
    }
    /**
     * Dispose of the resources used by the output area.
     */
    dispose() {
        if (this._future) {
            this._future.dispose();
        }
        this._future = null;
        this._displayIdMap.clear();
        super.dispose();
    }
    /**
     * Follow changes on the model state.
     */
    onModelChanged(sender, args) {
        switch (args.type) {
            case 'add':
                this._insertOutput(args.newIndex, args.newValues[0]);
                this.outputLengthChanged.emit(this.model.length);
                break;
            case 'remove':
                // Only clear is supported by the model.
                if (this.widgets.length) {
                    this._clear();
                    this.outputLengthChanged.emit(this.model.length);
                }
                break;
            case 'set':
                this._setOutput(args.newIndex, args.newValues[0]);
                this.outputLengthChanged.emit(this.model.length);
                break;
            default:
                break;
        }
    }
    /**
     * Follow changes on the output model state.
     */
    onStateChanged(sender) {
        for (let i = 0; i < this.model.length; i++) {
            this._setOutput(i, this.model.get(i));
        }
        this.outputLengthChanged.emit(this.model.length);
    }
    /**
     * Clear the widget inputs and outputs.
     */
    _clear() {
        // Bail if there is no work to do.
        if (!this.widgets.length) {
            return;
        }
        // Remove all of our widgets.
        let length = this.widgets.length;
        for (let i = 0; i < length; i++) {
            let widget = this.widgets[0];
            widget.parent = null;
            widget.dispose();
        }
        // Clear the display id map.
        this._displayIdMap.clear();
        // When an output area is cleared and then quickly replaced with new
        // content (as happens with @interact in widgets, for example), the
        // quickly changing height can make the page jitter.
        // We introduce a small delay in the minimum height
        // to prevent this jitter.
        let rect = this.node.getBoundingClientRect();
        this.node.style.minHeight = `${rect.height}px`;
        if (this._minHeightTimeout) {
            clearTimeout(this._minHeightTimeout);
        }
        this._minHeightTimeout = window.setTimeout(() => {
            if (this.isDisposed) {
                return;
            }
            this.node.style.minHeight = '';
        }, 50);
    }
    /**
     * Handle an input request from a kernel.
     */
    onInputRequest(msg, future) {
        // Add an output widget to the end.
        let factory = this.contentFactory;
        let stdinPrompt = msg.content.prompt;
        let password = msg.content.password;
        let panel = new widgets_1.Panel();
        panel.addClass(OUTPUT_AREA_ITEM_CLASS);
        panel.addClass(OUTPUT_AREA_STDIN_ITEM_CLASS);
        let prompt = factory.createOutputPrompt();
        prompt.addClass(OUTPUT_AREA_PROMPT_CLASS);
        panel.addWidget(prompt);
        let input = factory.createStdin({ prompt: stdinPrompt, password, future });
        input.addClass(OUTPUT_AREA_OUTPUT_CLASS);
        panel.addWidget(input);
        let layout = this.layout;
        layout.addWidget(panel);
        /**
         * Wait for the stdin to complete, add it to the model (so it persists)
         * and remove the stdin widget.
         */
        input.value.then(value => {
            // Use stdin as the stream so it does not get combined with stdout.
            this.model.add({
                output_type: 'stream',
                name: 'stdin',
                text: value + '\n'
            });
            panel.dispose();
        });
    }
    /**
     * Update an output in the layout in place.
     */
    _setOutput(index, model) {
        let layout = this.layout;
        let panel = layout.widgets[index];
        let renderer = (panel.widgets
            ? panel.widgets[1]
            : panel);
        if (renderer.renderModel) {
            renderer.renderModel(model);
        }
        else {
            layout.widgets[index].dispose();
            this._insertOutput(index, model);
        }
    }
    /**
     * Render and insert a single output into the layout.
     */
    _insertOutput(index, model) {
        let output = this.createOutputItem(model);
        output.toggleClass(EXECUTE_CLASS, model.executionCount !== null);
        let layout = this.layout;
        layout.insertWidget(index, output);
    }
    /**
     * Create an output item with a prompt and actual output
     */
    createOutputItem(model) {
        let panel = new widgets_1.Panel();
        panel.addClass(OUTPUT_AREA_ITEM_CLASS);
        let prompt = this.contentFactory.createOutputPrompt();
        prompt.executionCount = model.executionCount;
        prompt.addClass(OUTPUT_AREA_PROMPT_CLASS);
        panel.addWidget(prompt);
        let output = this.createRenderedMimetype(model);
        output.addClass(OUTPUT_AREA_OUTPUT_CLASS);
        panel.addWidget(output);
        return panel;
    }
    /**
     * Render a mimetype
     */
    createRenderedMimetype(model) {
        let widget;
        let mimeType = this.rendermime.preferredMimeType(model.data, model.trusted ? 'any' : 'ensure');
        if (mimeType) {
            let metadata = model.metadata;
            let mimeMd = metadata[mimeType];
            let isolated = false;
            // mime-specific higher priority
            if (mimeMd && mimeMd['isolated'] !== undefined) {
                isolated = mimeMd['isolated'];
            }
            else {
                // fallback on global
                isolated = metadata['isolated'];
            }
            let output = this.rendermime.createRenderer(mimeType);
            if (isolated === true) {
                output = new Private.IsolatedRenderer(output);
            }
            output.renderModel(model).catch(error => {
                // Manually append error message to output
                output.node.innerHTML = `<pre>Javascript Error: ${error.message}</pre>`;
                // Remove mime-type-specific CSS classes
                output.node.className = 'p-Widget jp-RenderedText';
                output.node.setAttribute('data-mime-type', 'application/vnd.jupyter.stderr');
            });
            widget = output;
        }
        else {
            widget = new widgets_2.Widget();
            widget.node.innerHTML =
                `No ${model.trusted ? '' : '(safe) '}renderer could be ` +
                    'found for output. It has the following MIME types: ' +
                    Object.keys(model.data).join(', ');
        }
        return widget;
    }
}
exports.OutputArea = OutputArea;
class SimplifiedOutputArea extends OutputArea {
    /**
     * Handle an input request from a kernel by doing nothing.
     */
    onInputRequest(msg, future) {
        return;
    }
    /**
     * Create an output item without a prompt, just the output widgets
     */
    createOutputItem(model) {
        let output = this.createRenderedMimetype(model);
        output.addClass(OUTPUT_AREA_OUTPUT_CLASS);
        return output;
    }
}
exports.SimplifiedOutputArea = SimplifiedOutputArea;
/**
 * A namespace for OutputArea statics.
 */
(function (OutputArea) {
    /**
     * Execute code on an output area.
     */
    function execute(code, output, session, metadata) {
        // Override the default for `stop_on_error`.
        let content = {
            code,
            stop_on_error: true
        };
        if (!session.kernel) {
            return Promise.reject('Session has no kernel.');
        }
        let future = session.kernel.requestExecute(content, false, metadata);
        output.future = future;
        return future.done;
    }
    OutputArea.execute = execute;
    /**
     * The default implementation of `IContentFactory`.
     */
    class ContentFactory {
        /**
         * Create the output prompt for the widget.
         */
        createOutputPrompt() {
            return new OutputPrompt();
        }
        /**
         * Create an stdin widget.
         */
        createStdin(options) {
            return new Stdin(options);
        }
    }
    OutputArea.ContentFactory = ContentFactory;
    /**
     * The default `ContentFactory` instance.
     */
    OutputArea.defaultContentFactory = new ContentFactory();
})(OutputArea = exports.OutputArea || (exports.OutputArea = {}));
/**
 * The default output prompt implementation
 */
class OutputPrompt extends widgets_2.Widget {
    /*
      * Create an output prompt widget.
      */
    constructor() {
        super();
        this._executionCount = null;
        this.addClass(OUTPUT_PROMPT_CLASS);
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
            this.node.textContent = '';
        }
        else {
            this.node.textContent = `[${value}]:`;
        }
    }
}
exports.OutputPrompt = OutputPrompt;
/**
 * The default stdin widget.
 */
class Stdin extends widgets_2.Widget {
    /**
     * Construct a new input widget.
     */
    constructor(options) {
        super({
            node: Private.createInputWidgetNode(options.prompt, options.password)
        });
        this._future = null;
        this._input = null;
        this._promise = new coreutils_1.PromiseDelegate();
        this.addClass(STDIN_CLASS);
        this._input = this.node.getElementsByTagName('input')[0];
        this._input.focus();
        this._future = options.future;
        this._value = options.prompt + ' ';
    }
    /**
     * The value of the widget.
     */
    get value() {
        return this._promise.promise.then(() => this._value);
    }
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
    handleEvent(event) {
        let input = this._input;
        if (event.type === 'keydown') {
            if (event.keyCode === 13) {
                // Enter
                this._future.sendInputReply({
                    value: input.value
                });
                if (input.type === 'password') {
                    this._value += Array(input.value.length + 1).join('·');
                }
                else {
                    this._value += input.value;
                }
                this._promise.resolve(void 0);
            }
        }
    }
    /**
     * Handle `after-attach` messages sent to the widget.
     */
    onAfterAttach(msg) {
        this._input.addEventListener('keydown', this);
        this.update();
    }
    /**
     * Handle `update-request` messages sent to the widget.
     */
    onUpdateRequest(msg) {
        this._input.focus();
    }
    /**
     * Handle `before-detach` messages sent to the widget.
     */
    onBeforeDetach(msg) {
        this._input.removeEventListener('keydown', this);
    }
}
exports.Stdin = Stdin;
/******************************************************************************
 * Private namespace
 ******************************************************************************/
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * Create the node for an InputWidget.
     */
    function createInputWidgetNode(prompt, password) {
        let node = document.createElement('div');
        let promptNode = document.createElement('pre');
        promptNode.className = STDIN_PROMPT_CLASS;
        promptNode.textContent = prompt;
        let input = document.createElement('input');
        input.className = STDIN_INPUT_CLASS;
        if (password) {
            input.type = 'password';
        }
        node.appendChild(promptNode);
        promptNode.appendChild(input);
        return node;
    }
    Private.createInputWidgetNode = createInputWidgetNode;
    /**
     * A renderer for IFrame data.
     */
    class IsolatedRenderer extends widgets_2.Widget {
        /**
         * Create an isolated renderer.
         */
        constructor(wrapped) {
            super({ node: document.createElement('iframe') });
            this.addClass('jp-mod-isolated');
            this._wrapped = wrapped;
            // Once the iframe is loaded, the subarea is dynamically inserted
            let iframe = this.node;
            iframe.frameBorder = '0';
            iframe.scrolling = 'auto';
            iframe.addEventListener('load', () => {
                // Workaround needed by Firefox, to properly render svg inside
                // iframes, see https://stackoverflow.com/questions/10177190/
                // svg-dynamically-added-to-iframe-does-not-render-correctly
                iframe.contentDocument.open();
                // Insert the subarea into the iframe
                // We must directly write the html. At this point, subarea doesn't
                // contain any user content.
                iframe.contentDocument.write(this._wrapped.node.innerHTML);
                iframe.contentDocument.close();
                let body = iframe.contentDocument.body;
                // Adjust the iframe height automatically
                iframe.style.height = body.scrollHeight + 'px';
            });
        }
        /**
         * Render a mime model.
         *
         * @param model - The mime model to render.
         *
         * @returns A promise which resolves when rendering is complete.
         *
         * #### Notes
         * This method may be called multiple times during the lifetime
         * of the widget to update it if and when new data is available.
         */
        renderModel(model) {
            return this._wrapped.renderModel(model).then(() => {
                let win = this.node.contentWindow;
                if (win) {
                    win.location.reload();
                }
            });
        }
    }
    Private.IsolatedRenderer = IsolatedRenderer;
})(Private || (Private = {}));
