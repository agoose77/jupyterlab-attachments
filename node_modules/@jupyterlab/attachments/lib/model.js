"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const observables_1 = require("@jupyterlab/observables");
const rendermime_1 = require("@jupyterlab/rendermime");
const signaling_1 = require("@phosphor/signaling");
/**
 * The default implementation of the IAttachmentsModel.
 */
class AttachmentsModel {
    /**
     * Construct a new observable outputs instance.
     */
    constructor(options = {}) {
        this._map = new observables_1.ObservableMap();
        this._isDisposed = false;
        this._stateChanged = new signaling_1.Signal(this);
        this._changed = new signaling_1.Signal(this);
        this._modelDB = null;
        this._serialized = null;
        this._changeGuard = false;
        this.contentFactory =
            options.contentFactory || AttachmentsModel.defaultContentFactory;
        if (options.values) {
            for (let key of Object.keys(options.values)) {
                this.set(key, options.values[key]);
            }
        }
        this._map.changed.connect(this._onMapChanged, this);
        // If we are given a IModelDB, keep an up-to-date
        // serialized copy of the AttachmentsModel in it.
        if (options.modelDB) {
            this._modelDB = options.modelDB;
            this._serialized = this._modelDB.createValue('attachments');
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
     * The keys of the attachments in the model.
     */
    get keys() {
        return this._map.keys();
    }
    /**
     * Get the length of the items in the model.
     */
    get length() {
        return this._map.keys().length;
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
        this._map.dispose();
        signaling_1.Signal.clearData(this);
    }
    /**
     * Whether the specified key is set.
     */
    has(key) {
        return this._map.has(key);
    }
    /**
     * Get an item at the specified key.
     */
    get(key) {
        return this._map.get(key);
    }
    /**
     * Set the value at the specified key.
     */
    set(key, value) {
        // Normalize stream data.
        let item = this._createItem({ value });
        this._map.set(key, item);
    }
    /**
     * Clear all of the attachments.
     */
    clear() {
        this._map.values().forEach((item) => {
            item.dispose();
        });
        this._map.clear();
    }
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * This will clear any existing data.
     */
    fromJSON(values) {
        this.clear();
        Object.keys(values).forEach(key => {
            this.set(key, values[key]);
        });
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        let ret = {};
        for (let key of this._map.keys()) {
            ret[key] = this._map.get(key).toJSON();
        }
        return ret;
    }
    /**
     * Create an attachment item and hook up its signals.
     */
    _createItem(options) {
        let factory = this.contentFactory;
        let item = factory.createAttachmentModel(options);
        item.changed.connect(this._onGenericChange, this);
        return item;
    }
    /**
     * Handle a change to the list.
     */
    _onMapChanged(sender, args) {
        if (this._serialized && !this._changeGuard) {
            this._changeGuard = true;
            this._serialized.set(this.toJSON());
            this._changeGuard = false;
        }
        this._changed.emit(args);
        this._stateChanged.emit(void 0);
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
exports.AttachmentsModel = AttachmentsModel;
/**
 * The namespace for AttachmentsModel class statics.
 */
(function (AttachmentsModel) {
    /**
     * The default implementation of a `IAttachemntsModel.IContentFactory`.
     */
    class ContentFactory {
        /**
         * Create an attachment model.
         */
        createAttachmentModel(options) {
            return new rendermime_1.AttachmentModel(options);
        }
    }
    AttachmentsModel.ContentFactory = ContentFactory;
    /**
     * The default attachment model factory.
     */
    AttachmentsModel.defaultContentFactory = new ContentFactory();
})(AttachmentsModel = exports.AttachmentsModel || (exports.AttachmentsModel = {}));
/**
 * A resolver for cell attachments 'attchment:filename'.
 *
 * Will resolve to a data: url.
 */
class AttachmentsResolver {
    /**
     * Create an attachments resolver object.
     */
    constructor(options) {
        this._parent = options.parent || null;
        this._model = options.model;
    }
    /**
     * Resolve a relative url to a correct server path.
     */
    resolveUrl(url) {
        if (this._parent && !url.startsWith('attachment:')) {
            return this._parent.resolveUrl(url);
        }
        return Promise.resolve(url);
    }
    /**
     * Get the download url of a given absolute server path.
     */
    getDownloadUrl(path) {
        if (this._parent && !path.startsWith('attachment:')) {
            return this._parent.getDownloadUrl(path);
        }
        // Return a data URL with the data of the url
        const key = path.slice('attachment:'.length);
        if (!this._model.has(key)) {
            // Resolve with unprocessed path, to show as broken image
            return Promise.resolve(path);
        }
        const { data } = this._model.get(key);
        const mimeType = Object.keys(data)[0];
        // Only support known safe types:
        if (rendermime_1.imageRendererFactory.mimeTypes.indexOf(mimeType) === -1) {
            return Promise.reject(`Cannot render unknown image mime type "${mimeType}".`);
        }
        const dataUrl = `data:${mimeType};base64,${data[mimeType]}`;
        return Promise.resolve(dataUrl);
    }
    /**
     * Whether the URL should be handled by the resolver
     * or not.
     */
    isLocal(url) {
        if (this._parent && !url.startsWith('attachment:')) {
            return this._parent.isLocal(url);
        }
        return true;
    }
}
exports.AttachmentsResolver = AttachmentsResolver;
