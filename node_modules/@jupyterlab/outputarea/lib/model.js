"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_1 = require("@phosphor/algorithm");
const signaling_1 = require("@phosphor/signaling");
const coreutils_1 = require("@jupyterlab/coreutils");
const observables_1 = require("@jupyterlab/observables");
const rendermime_1 = require("@jupyterlab/rendermime");
/**
 * The default implementation of the IOutputAreaModel.
 */
class OutputAreaModel {
    /**
     * Construct a new observable outputs instance.
     */
    constructor(options = {}) {
        this.clearNext = false;
        this.list = null;
        this._trusted = false;
        this._isDisposed = false;
        this._stateChanged = new signaling_1.Signal(this);
        this._changed = new signaling_1.Signal(this);
        this._modelDB = null;
        this._serialized = null;
        this._changeGuard = false;
        this._trusted = !!options.trusted;
        this.contentFactory =
            options.contentFactory || OutputAreaModel.defaultContentFactory;
        this.list = new observables_1.ObservableList();
        if (options.values) {
            algorithm_1.each(options.values, value => {
                this._add(value);
            });
        }
        this.list.changed.connect(this._onListChanged, this);
        // If we are given a IModelDB, keep an up-to-date
        // serialized copy of the OutputAreaModel in it.
        if (options.modelDB) {
            this._modelDB = options.modelDB;
            this._serialized = this._modelDB.createValue('outputs');
            if (this._serialized.get()) {
                this.fromJSON(this._serialized.get());
            }
            else {
                this._serialized.set(this.toJSON());
            }
            this._serialized.changed.connect(this._onSerializedChanged, this);
        }
    }
    /**
     * A signal emitted when the model state changes.
     */
    get stateChanged() {
        return this._stateChanged;
    }
    /**
     * A signal emitted when the model changes.
     */
    get changed() {
        return this._changed;
    }
    /**
     * Get the length of the items in the model.
     */
    get length() {
        return this.list ? this.list.length : 0;
    }
    /**
     * Get whether the model is trusted.
     */
    get trusted() {
        return this._trusted;
    }
    /**
     * Set whether the model is trusted.
     *
     * #### Notes
     * Changing the value will cause all of the models to re-set.
     */
    set trusted(value) {
        if (value === this._trusted) {
            return;
        }
        let trusted = (this._trusted = value);
        for (let i = 0; i < this.list.length; i++) {
            let item = this.list.get(i);
            let value = item.toJSON();
            item.dispose();
            item = this._createItem({ value, trusted });
            this.list.set(i, item);
        }
    }
    /**
     * Test whether the model is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources used by the model.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        this.list.dispose();
        signaling_1.Signal.clearData(this);
    }
    /**
     * Get an item at the specified index.
     */
    get(index) {
        return this.list.get(index);
    }
    /**
     * Set the value at the specified index.
     */
    set(index, value) {
        // Normalize stream data.
        this._normalize(value);
        let item = this._createItem({ value, trusted: this._trusted });
        this.list.set(index, item);
    }
    /**
     * Add an output, which may be combined with previous output.
     *
     * #### Notes
     * The output bundle is copied.
     * Contiguous stream outputs of the same `name` are combined.
     */
    add(output) {
        // If we received a delayed clear message, then clear now.
        if (this.clearNext) {
            this.clear();
            this.clearNext = false;
        }
        return this._add(output);
    }
    /**
     * Clear all of the output.
     *
     * @param wait Delay clearing the output until the next message is added.
     */
    clear(wait = false) {
        this._lastStream = '';
        if (wait) {
            this.clearNext = true;
            return;
        }
        algorithm_1.each(this.list, (item) => {
            item.dispose();
        });
        this.list.clear();
    }
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * This will clear any existing data.
     */
    fromJSON(values) {
        this.clear();
        algorithm_1.each(values, value => {
            this._add(value);
        });
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        return algorithm_1.toArray(algorithm_1.map(this.list, (output) => output.toJSON()));
    }
    /**
     * Add an item to the list.
     */
    _add(value) {
        let trusted = this._trusted;
        // Normalize the value.
        this._normalize(value);
        // Consolidate outputs if they are stream outputs of the same kind.
        if (coreutils_1.nbformat.isStream(value) &&
            this._lastStream &&
            value.name === this._lastName) {
            // In order to get a list change event, we add the previous
            // text to the current item and replace the previous item.
            // This also replaces the metadata of the last item.
            this._lastStream += value.text;
            value.text = this._lastStream;
            this._removeOverwrittenChars(value);
            let item = this._createItem({ value, trusted });
            let index = this.length - 1;
            let prev = this.list.get(index);
            prev.dispose();
            this.list.set(index, item);
            return index;
        }
        if (coreutils_1.nbformat.isStream(value)) {
            this._removeOverwrittenChars(value);
        }
        // Create the new item.
        let item = this._createItem({ value, trusted });
        // Update the stream information.
        if (coreutils_1.nbformat.isStream(value)) {
            this._lastStream = value.text;
            this._lastName = value.name;
        }
        else {
            this._lastStream = '';
        }
        // Add the item to our list and return the new length.
        return this.list.push(item);
    }
    /**
     * Normalize an output.
     */
    _normalize(value) {
        if (coreutils_1.nbformat.isStream(value)) {
            if (Array.isArray(value.text)) {
                value.text = value.text.join('\n');
            }
        }
    }
    /**
     * Remove characters that are overridden by backspace characters.
     */
    _fixBackspace(txt) {
        let tmp = txt;
        do {
            txt = tmp;
            // Cancel out anything-but-newline followed by backspace
            tmp = txt.replace(/[^\n]\x08/gm, '');
        } while (tmp.length < txt.length);
        return txt;
    }
    /**
     * Remove chunks that should be overridden by the effect of
     * carriage return characters.
     */
    _fixCarriageReturn(txt) {
        let tmp = txt;
        // Handle multiple carriage returns before a newline
        tmp = tmp.replace(/\r\r+\n/gm, '\r\n');
        // Remove chunks that should be overridden by carriage returns
        do {
            // Remove any chunks preceding a carriage return unless carriage
            // return followed by a newline
            tmp = tmp.replace(/^[^\n]*(?:\r(?!\n))+/gm, '');
        } while (tmp.search(/\r(?!\n)/) > -1);
        do {
            // Replace remaining \r\n characters with a newline
            tmp = tmp.replace(/\r\n/gm, '\n');
        } while (tmp.indexOf('\r\n') > -1);
        return tmp;
    }
    /*
     * Remove characters overridden by backspaces and carriage returns
     */
    _removeOverwrittenChars(value) {
        let tmp = value.text;
        value.text = this._fixCarriageReturn(this._fixBackspace(tmp));
    }
    /**
     * Create an output item and hook up its signals.
     */
    _createItem(options) {
        let factory = this.contentFactory;
        let item = factory.createOutputModel(options);
        item.changed.connect(this._onGenericChange, this);
        return item;
    }
    /**
     * Handle a change to the list.
     */
    _onListChanged(sender, args) {
        if (this._serialized && !this._changeGuard) {
            this._changeGuard = true;
            this._serialized.set(this.toJSON());
            this._changeGuard = false;
        }
        this._changed.emit(args);
    }
    /**
     * If the serialized version of the outputs have changed due to a remote
     * action, then update the model accordingly.
     */
    _onSerializedChanged(sender, args) {
        if (!this._changeGuard) {
            this._changeGuard = true;
            this.fromJSON(args.newValue);
            this._changeGuard = false;
        }
    }
    /**
     * Handle a change to an item.
     */
    _onGenericChange() {
        this._stateChanged.emit(void 0);
    }
}
exports.OutputAreaModel = OutputAreaModel;
/**
 * The namespace for OutputAreaModel class statics.
 */
(function (OutputAreaModel) {
    /**
     * The default implementation of a `IModelOutputFactory`.
     */
    class ContentFactory {
        /**
         * Create an output model.
         */
        createOutputModel(options) {
            return new rendermime_1.OutputModel(options);
        }
    }
    OutputAreaModel.ContentFactory = ContentFactory;
    /**
     * The default output model factory.
     */
    OutputAreaModel.defaultContentFactory = new ContentFactory();
})(OutputAreaModel = exports.OutputAreaModel || (exports.OutputAreaModel = {}));
