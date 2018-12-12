"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const docregistry_1 = require("@jupyterlab/docregistry");
const default_toolbar_1 = require("./default-toolbar");
const panel_1 = require("./panel");
const widget_1 = require("./widget");
/**
 * A widget factory for notebook panels.
 */
class NotebookWidgetFactory extends docregistry_1.ABCWidgetFactory {
    /**
     * Construct a new notebook widget factory.
     *
     * @param options - The options used to construct the factory.
     */
    constructor(options) {
        super(options);
        this.rendermime = options.rendermime;
        this.contentFactory =
            options.contentFactory || panel_1.NotebookPanel.defaultContentFactory;
        this.mimeTypeService = options.mimeTypeService;
        this._editorConfig =
            options.editorConfig || widget_1.StaticNotebook.defaultEditorConfig;
    }
    /**
     * A configuration object for cell editor settings.
     */
    get editorConfig() {
        return this._editorConfig;
    }
    set editorConfig(value) {
        this._editorConfig = value;
    }
    /**
     * Create a new widget.
     *
     * #### Notes
     * The factory will start the appropriate kernel and populate
     * the default toolbar items using `ToolbarItems.populateDefaults`.
     */
    createNewWidget(context) {
        let rendermime = this.rendermime.clone({ resolver: context.urlResolver });
        let nbOptions = {
            rendermime,
            contentFactory: this.contentFactory,
            mimeTypeService: this.mimeTypeService,
            editorConfig: this._editorConfig
        };
        let content = this.contentFactory.createNotebook(nbOptions);
        return new panel_1.NotebookPanel({ context, content });
    }
    /**
     * Default factory for toolbar items to be added after the widget is created.
     */
    defaultToolbarFactory(widget) {
        return default_toolbar_1.ToolbarItems.getDefaultItems(widget);
    }
}
exports.NotebookWidgetFactory = NotebookWidgetFactory;
