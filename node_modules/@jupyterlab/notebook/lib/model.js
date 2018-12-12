"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const docregistry_1 = require("@jupyterlab/docregistry");
const cells_1 = require("@jupyterlab/cells");
const coreutils_1 = require("@jupyterlab/coreutils");
const coreutils_2 = require("@phosphor/coreutils");
const celllist_1 = require("./celllist");
/**
 * An implementation of a notebook Model.
 */
class NotebookModel extends docregistry_1.DocumentModel {
    /**
     * Construct a new notebook model.
     */
    constructor(options = {}) {
        super(options.languagePreference, options.modelDB);
        this._nbformat = coreutils_1.nbformat.MAJOR_VERSION;
        this._nbformatMinor = coreutils_1.nbformat.MINOR_VERSION;
        let factory = options.contentFactory || NotebookModel.defaultContentFactory;
        this.contentFactory = factory.clone(this.modelDB.view('cells'));
        this._cells = new celllist_1.CellList(this.modelDB, this.contentFactory);
        // Add an initial code cell by default.
        if (!this._cells.length) {
            this._cells.push(factory.createCodeCell({}));
        }
        this._cells.changed.connect(this._onCellsChanged, this);
        // Handle initial metadata.
        let metadata = this.modelDB.createMap('metadata');
        if (!metadata.has('language_info')) {
            let name = options.languagePreference || '';
            metadata.set('language_info', { name });
        }
        this._ensureMetadata();
        metadata.changed.connect(this.triggerContentChange, this);
        this._deletedCells = [];
    }
    /**
     * The metadata associated with the notebook.
     */
    get metadata() {
        return this.modelDB.get('metadata');
    }
    /**
     * Get the observable list of notebook cells.
     */
    get cells() {
        return this._cells;
    }
    /**
     * The major version number of the nbformat.
     */
    get nbformat() {
        return this._nbformat;
    }
    /**
     * The minor version number of the nbformat.
     */
    get nbformatMinor() {
        return this._nbformatMinor;
    }
    /**
     * The default kernel name of the document.
     */
    get defaultKernelName() {
        let spec = this.metadata.get('kernelspec');
        return spec ? spec.name : '';
    }
    /**
     * The default kernel name of the document.
     */
    get deletedCells() {
        return this._deletedCells;
    }
    /**
     * The default kernel language of the document.
     */
    get defaultKernelLanguage() {
        let info = this.metadata.get('language_info');
        return info ? info.name : '';
    }
    /**
     * Dispose of the resources held by the model.
     */
    dispose() {
        // Do nothing if already disposed.
        if (this.cells === null) {
            return;
        }
        let cells = this.cells;
        this._cells = null;
        cells.dispose();
        super.dispose();
    }
    /**
     * Serialize the model to a string.
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }
    /**
     * Deserialize the model from a string.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromString(value) {
        this.fromJSON(JSON.parse(value));
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        let cells = [];
        for (let i = 0; i < this.cells.length; i++) {
            let cell = this.cells.get(i);
            cells.push(cell.toJSON());
        }
        this._ensureMetadata();
        let metadata = Object.create(null);
        for (let key of this.metadata.keys()) {
            metadata[key] = JSON.parse(JSON.stringify(this.metadata.get(key)));
        }
        return {
            metadata,
            nbformat_minor: this._nbformatMinor,
            nbformat: this._nbformat,
            cells
        };
    }
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromJSON(value) {
        let cells = [];
        let factory = this.contentFactory;
        for (let cell of value.cells) {
            switch (cell.cell_type) {
                case 'code':
                    cells.push(factory.createCodeCell({ cell }));
                    break;
                case 'markdown':
                    cells.push(factory.createMarkdownCell({ cell }));
                    break;
                case 'raw':
                    cells.push(factory.createRawCell({ cell }));
                    break;
                default:
                    continue;
            }
        }
        this.cells.beginCompoundOperation();
        this.cells.clear();
        this.cells.pushAll(cells);
        this.cells.endCompoundOperation();
        let oldValue = 0;
        let newValue = 0;
        this._nbformatMinor = coreutils_1.nbformat.MINOR_VERSION;
        this._nbformat = coreutils_1.nbformat.MAJOR_VERSION;
        if (value.nbformat !== this._nbformat) {
            oldValue = this._nbformat;
            this._nbformat = newValue = value.nbformat;
            this.triggerStateChange({ name: 'nbformat', oldValue, newValue });
        }
        if (value.nbformat_minor > this._nbformatMinor) {
            oldValue = this._nbformatMinor;
            this._nbformatMinor = newValue = value.nbformat_minor;
            this.triggerStateChange({ name: 'nbformatMinor', oldValue, newValue });
        }
        // Update the metadata.
        this.metadata.clear();
        let metadata = value.metadata;
        for (let key in metadata) {
            // orig_nbformat is not intended to be stored per spec.
            if (key === 'orig_nbformat') {
                continue;
            }
            this.metadata.set(key, metadata[key]);
        }
        this._ensureMetadata();
        this.dirty = true;
    }
    /**
     * Initialize the model with its current state.
     */
    initialize() {
        super.initialize();
        this.cells.clearUndo();
    }
    /**
     * Handle a change in the cells list.
     */
    _onCellsChanged(list, change) {
        switch (change.type) {
            case 'add':
                change.newValues.forEach(cell => {
                    cell.contentChanged.connect(this.triggerContentChange, this);
                });
                break;
            case 'remove':
                break;
            case 'set':
                change.newValues.forEach(cell => {
                    cell.contentChanged.connect(this.triggerContentChange, this);
                });
                break;
            default:
                break;
        }
        let factory = this.contentFactory;
        // Add code cell if there are no cells remaining.
        if (!this.cells.length) {
            // Add the cell in a new context to avoid triggering another
            // cell changed event during the handling of this signal.
            requestAnimationFrame(() => {
                if (!this.isDisposed && !this.cells.length) {
                    this.cells.push(factory.createCodeCell({}));
                }
            });
        }
        this.triggerContentChange();
    }
    /**
     * Make sure we have the required metadata fields.
     */
    _ensureMetadata() {
        let metadata = this.metadata;
        if (!metadata.has('language_info')) {
            metadata.set('language_info', { name: '' });
        }
        if (!metadata.has('kernelspec')) {
            metadata.set('kernelspec', { name: '', display_name: '' });
        }
    }
}
exports.NotebookModel = NotebookModel;
/**
 * The namespace for the `NotebookModel` class statics.
 */
(function (NotebookModel) {
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory {
        /**
         * Create a new cell model factory.
         */
        constructor(options) {
            this.codeCellContentFactory =
                options.codeCellContentFactory || cells_1.CodeCellModel.defaultContentFactory;
            this.modelDB = options.modelDB;
        }
        /**
         * Create a new code cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new code cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         *   If the contentFactory is not provided, the instance
         *   `codeCellContentFactory` will be used.
         */
        createCodeCell(options) {
            if (options.contentFactory) {
                options.contentFactory = this.codeCellContentFactory;
            }
            if (this.modelDB) {
                if (!options.id) {
                    options.id = coreutils_2.UUID.uuid4();
                }
                options.modelDB = this.modelDB.view(options.id);
            }
            return new cells_1.CodeCellModel(options);
        }
        /**
         * Create a new markdown cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new markdown cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createMarkdownCell(options) {
            if (this.modelDB) {
                if (!options.id) {
                    options.id = coreutils_2.UUID.uuid4();
                }
                options.modelDB = this.modelDB.view(options.id);
            }
            return new cells_1.MarkdownCellModel(options);
        }
        /**
         * Create a new raw cell.
         *
         * @param source - The data to use for the original source data.
         *
         * @returns A new raw cell. If a source cell is provided, the
         *   new cell will be initialized with the data from the source.
         */
        createRawCell(options) {
            if (this.modelDB) {
                if (!options.id) {
                    options.id = coreutils_2.UUID.uuid4();
                }
                options.modelDB = this.modelDB.view(options.id);
            }
            return new cells_1.RawCellModel(options);
        }
        /**
         * Clone the content factory with a new IModelDB.
         */
        clone(modelDB) {
            return new ContentFactory({
                modelDB: modelDB,
                codeCellContentFactory: this.codeCellContentFactory
            });
        }
    }
    NotebookModel.ContentFactory = ContentFactory;
    /**
     * The default `ContentFactory` instance.
     */
    NotebookModel.defaultContentFactory = new ContentFactory({});
})(NotebookModel = exports.NotebookModel || (exports.NotebookModel = {}));
