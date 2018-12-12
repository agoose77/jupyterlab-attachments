"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
/**
 * A model factory for notebooks.
 */
class NotebookModelFactory {
    /**
     * Construct a new notebook model factory.
     */
    constructor(options) {
        this._disposed = false;
        let codeCellContentFactory = options.codeCellContentFactory;
        this.contentFactory =
            options.contentFactory ||
                new model_1.NotebookModel.ContentFactory({ codeCellContentFactory });
    }
    /**
     * The name of the model.
     */
    get name() {
        return 'notebook';
    }
    /**
     * The content type of the file.
     */
    get contentType() {
        return 'notebook';
    }
    /**
     * The format of the file.
     */
    get fileFormat() {
        return 'json';
    }
    /**
     * Get whether the model factory has been disposed.
     */
    get isDisposed() {
        return this._disposed;
    }
    /**
     * Dispose of the model factory.
     */
    dispose() {
        this._disposed = true;
    }
    /**
     * Create a new model for a given path.
     *
     * @param languagePreference - An optional kernel language preference.
     *
     * @returns A new document model.
     */
    createNew(languagePreference, modelDB) {
        let contentFactory = this.contentFactory;
        return new model_1.NotebookModel({ languagePreference, contentFactory, modelDB });
    }
    /**
     * Get the preferred kernel language given a path.
     */
    preferredLanguage(path) {
        return '';
    }
}
exports.NotebookModelFactory = NotebookModelFactory;
