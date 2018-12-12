"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const coreutils_1 = require("@phosphor/coreutils");
const signaling_1 = require("@phosphor/signaling");
const docregistry_1 = require("@jupyterlab/docregistry");
const widget_1 = require("./widget");
/**
 * The class name added to notebook panels.
 */
const NOTEBOOK_PANEL_CLASS = 'jp-NotebookPanel';
const NOTEBOOK_PANEL_TOOLBAR_CLASS = 'jp-NotebookPanel-toolbar';
const NOTEBOOK_PANEL_NOTEBOOK_CLASS = 'jp-NotebookPanel-notebook';
/**
 * A widget that hosts a notebook toolbar and content area.
 *
 * #### Notes
 * The widget keeps the document metadata in sync with the current
 * kernel on the context.
 */
class NotebookPanel extends docregistry_1.DocumentWidget {
    /**
     * Construct a new notebook panel.
     */
    constructor(options) {
        super(options);
        this._activated = new signaling_1.Signal(this);
        // Set up CSS classes
        this.addClass(NOTEBOOK_PANEL_CLASS);
        this.toolbar.addClass(NOTEBOOK_PANEL_TOOLBAR_CLASS);
        this.content.addClass(NOTEBOOK_PANEL_NOTEBOOK_CLASS);
        // Set up things related to the context
        this.content.model = this.context.model;
        this.context.session.kernelChanged.connect(this._onKernelChanged, this);
        this.revealed.then(() => {
            // Set the document edit mode on initial open if it looks like a new document.
            if (this.content.widgets.length === 1) {
                let cellModel = this.content.widgets[0].model;
                if (cellModel.type === 'code' && cellModel.value.text === '') {
                    this.content.mode = 'edit';
                }
            }
        });
    }
    /**
     * A signal emitted when the panel has been activated.
     */
    get activated() {
        return this._activated;
    }
    /**
     * The client session used by the panel.
     */
    get session() {
        return this.context.session;
    }
    /**
     * The content factory for the notebook.
     *
     * TODO: deprecate this in favor of the .content attribute
     *
     */
    get contentFactory() {
        return this.content.contentFactory;
    }
    /**
     * The rendermime instance for the notebook.
     *
     * TODO: deprecate this in favor of the .content attribute
     *
     */
    get rendermime() {
        return this.content.rendermime;
    }
    /**
     * The model for the widget.
     */
    get model() {
        return this.content ? this.content.model : null;
    }
    /**
     * Dispose of the resources used by the widget.
     */
    dispose() {
        this.content.dispose();
        super.dispose();
    }
    /**
     * Handle `'activate-request'` messages.
     */
    onActivateRequest(msg) {
        super.onActivateRequest(msg);
        // TODO: do we still need to emit this signal? Who is using it?
        this._activated.emit(void 0);
    }
    /**
     * Handle a change in the kernel by updating the document metadata.
     */
    _onKernelChanged(sender, args) {
        if (!this.model || !args.newValue) {
            return;
        }
        let { newValue } = args;
        newValue.ready.then(() => {
            if (this.model) {
                this._updateLanguage(newValue.info.language_info);
            }
        });
        this._updateSpec(newValue);
    }
    /**
     * Update the kernel language.
     */
    _updateLanguage(language) {
        this.model.metadata.set('language_info', language);
    }
    /**
     * Update the kernel spec.
     */
    _updateSpec(kernel) {
        kernel.getSpec().then(spec => {
            if (this.isDisposed) {
                return;
            }
            this.model.metadata.set('kernelspec', {
                name: kernel.name,
                display_name: spec.display_name,
                language: spec.language
            });
        });
    }
}
exports.NotebookPanel = NotebookPanel;
/**
 * A namespace for `NotebookPanel` statics.
 */
(function (NotebookPanel) {
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory extends widget_1.Notebook.ContentFactory {
        /**
         * Create a new content area for the panel.
         */
        createNotebook(options) {
            return new widget_1.Notebook(options);
        }
    }
    NotebookPanel.ContentFactory = ContentFactory;
    /**
     * Default content factory for the notebook panel.
     */
    NotebookPanel.defaultContentFactory = new ContentFactory();
    /* tslint:disable */
    /**
     * The notebook renderer token.
     */
    NotebookPanel.IContentFactory = new coreutils_1.Token('@jupyterlab/notebook:IContentFactory');
    /* tslint:enable */
})(NotebookPanel = exports.NotebookPanel || (exports.NotebookPanel = {}));
