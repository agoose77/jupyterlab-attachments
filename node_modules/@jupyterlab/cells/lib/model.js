"use strict";
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const coreutils_1 = require("@phosphor/coreutils");
const signaling_1 = require("@phosphor/signaling");
const attachments_1 = require("@jupyterlab/attachments");
const codeeditor_1 = require("@jupyterlab/codeeditor");
const coreutils_2 = require("@phosphor/coreutils");
const outputarea_1 = require("@jupyterlab/outputarea");
function isCodeCellModel(model) {
    return model.type === 'code';
}
exports.isCodeCellModel = isCodeCellModel;
function isMarkdownCellModel(model) {
    return model.type === 'markdown';
}
exports.isMarkdownCellModel = isMarkdownCellModel;
function isRawCellModel(model) {
    return model.type === 'raw';
}
exports.isRawCellModel = isRawCellModel;
/**
 * An implementation of the cell model.
 */
class CellModel extends codeeditor_1.CodeEditor.Model {
    /**
     * Construct a cell model from optional cell content.
     */
    constructor(options) {
        super({ modelDB: options.modelDB });
        /**
         * A signal emitted when the state of the model changes.
         */
        this.contentChanged = new signaling_1.Signal(this);
        /**
         * A signal emitted when a model state changes.
         */
        this.stateChanged = new signaling_1.Signal(this);
        this.id = options.id || coreutils_2.UUID.uuid4();
        this.value.changed.connect(this.onGenericChange, this);
        let cellType = this.modelDB.createValue('type');
        cellType.set(this.type);
        let observableMetadata = this.modelDB.createMap('metadata');
        observableMetadata.changed.connect(this.onGenericChange, this);
        let cell = options.cell;
        let trusted = this.modelDB.createValue('trusted');
        trusted.changed.connect(this.onTrustedChanged, this);
        if (!cell) {
            trusted.set(false);
            return;
        }
        trusted.set(!!cell.metadata['trusted']);
        delete cell.metadata['trusted'];
        if (Array.isArray(cell.source)) {
            this.value.text = cell.source.join('');
        }
        else {
            this.value.text = cell.source;
        }
        let metadata = coreutils_1.JSONExt.deepCopy(cell.metadata);
        if (this.type !== 'raw') {
            delete metadata['format'];
        }
        if (this.type !== 'code') {
            delete metadata['collapsed'];
            delete metadata['scrolled'];
        }
        for (let key in metadata) {
            observableMetadata.set(key, metadata[key]);
        }
    }
    /**
     * The metadata associated with the cell.
     */
    get metadata() {
        return this.modelDB.get('metadata');
    }
    /**
     * Get the trusted state of the model.
     */
    get trusted() {
        return this.modelDB.getValue('trusted');
    }
    /**
     * Set the trusted state of the model.
     */
    set trusted(newValue) {
        let oldValue = this.trusted;
        if (oldValue === newValue) {
            return;
        }
        this.modelDB.setValue('trusted', newValue);
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        let metadata = Object.create(null);
        for (let key of this.metadata.keys()) {
            let value = JSON.parse(JSON.stringify(this.metadata.get(key)));
            metadata[key] = value;
        }
        if (this.trusted) {
            metadata['trusted'] = true;
        }
        return {
            cell_type: this.type,
            source: this.value.text,
            metadata
        };
    }
    /**
     * Handle a change to the trusted state.
     *
     * The default implementation is a no-op.
     */
    onTrustedChanged(trusted, args) {
        /* no-op */
    }
    /**
     * Handle a change to the observable value.
     */
    onGenericChange() {
        this.contentChanged.emit(void 0);
    }
}
exports.CellModel = CellModel;
/**
 * A base implementation for cell models with attachments.
 */
class AttachmentsCellModel extends CellModel {
    /**
     * Construct a new cell with optional attachments.
     */
    constructor(options) {
        super(options);
        this._attachments = null;
        let factory = options.contentFactory || AttachmentsCellModel.defaultContentFactory;
        let attachments;
        let cell = options.cell;
        if (cell && (cell.cell_type === 'raw' || cell.cell_type === 'markdown')) {
            attachments = cell
                .attachments;
        }
        this._attachments = factory.createAttachmentsModel({
            values: attachments,
            modelDB: this.modelDB
        });
        this._attachments.stateChanged.connect(this.onGenericChange, this);
    }
    /**
     * Get the attachments of the model.
     */
    get attachments() {
        return this._attachments;
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        let cell = super.toJSON();
        if (this.attachments.length) {
            cell.attachments = this.attachments.toJSON();
        }
        return cell;
    }
}
exports.AttachmentsCellModel = AttachmentsCellModel;
/**
 * The namespace for `AttachmentsCellModel` statics.
 */
(function (AttachmentsCellModel) {
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory {
        /**
         * Create an attachments model.
         */
        createAttachmentsModel(options) {
            return new attachments_1.AttachmentsModel(options);
        }
    }
    AttachmentsCellModel.ContentFactory = ContentFactory;
    /**
     * The shared `ContentFactory` instance.
     */
    AttachmentsCellModel.defaultContentFactory = new ContentFactory();
})(AttachmentsCellModel = exports.AttachmentsCellModel || (exports.AttachmentsCellModel = {}));
/**
 * An implementation of a raw cell model.
 */
class RawCellModel extends AttachmentsCellModel {
    /**
     * The type of the cell.
     */
    get type() {
        return 'raw';
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        return super.toJSON();
    }
}
exports.RawCellModel = RawCellModel;
/**
 * An implementation of a markdown cell model.
 */
class MarkdownCellModel extends AttachmentsCellModel {
    /**
     * Construct a markdown cell model from optional cell content.
     */
    constructor(options) {
        super(options);
        // Use the Github-flavored markdown mode.
        this.mimeType = 'text/x-ipythongfm';
    }
    /**
     * The type of the cell.
     */
    get type() {
        return 'markdown';
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        return super.toJSON();
    }
}
exports.MarkdownCellModel = MarkdownCellModel;
/**
 * An implementation of a code cell Model.
 */
class CodeCellModel extends CellModel {
    /**
     * Construct a new code cell with optional original cell content.
     */
    constructor(options) {
        super(options);
        this._outputs = null;
        let factory = options.contentFactory || CodeCellModel.defaultContentFactory;
        let trusted = this.trusted;
        let cell = options.cell;
        let outputs = [];
        let executionCount = this.modelDB.createValue('executionCount');
        if (!executionCount.get()) {
            if (cell && cell.cell_type === 'code') {
                executionCount.set(cell.execution_count || null);
                outputs = cell.outputs;
            }
            else {
                executionCount.set(null);
            }
        }
        executionCount.changed.connect(this._onExecutionCountChanged, this);
        this._outputs = factory.createOutputArea({
            trusted,
            values: outputs,
            modelDB: this.modelDB
        });
        this._outputs.changed.connect(this.onGenericChange, this);
    }
    /**
     * The type of the cell.
     */
    get type() {
        return 'code';
    }
    /**
     * The execution count of the cell.
     */
    get executionCount() {
        return this.modelDB.getValue('executionCount');
    }
    set executionCount(newValue) {
        let oldValue = this.executionCount;
        if (newValue === oldValue) {
            return;
        }
        this.modelDB.setValue('executionCount', newValue || null);
    }
    /**
     * The cell outputs.
     */
    get outputs() {
        return this._outputs;
    }
    /**
     * Dispose of the resources held by the model.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._outputs.dispose();
        this._outputs = null;
        super.dispose();
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        let cell = super.toJSON();
        cell.execution_count = this.executionCount || null;
        cell.outputs = this.outputs.toJSON();
        return cell;
    }
    /**
     * Handle a change to the trusted state.
     */
    onTrustedChanged(trusted, args) {
        if (this._outputs) {
            this._outputs.trusted = args.newValue;
        }
        this.stateChanged.emit({
            name: 'trusted',
            oldValue: args.oldValue,
            newValue: args.newValue
        });
    }
    /**
     * Handle a change to the execution count.
     */
    _onExecutionCountChanged(count, args) {
        this.contentChanged.emit(void 0);
        this.stateChanged.emit({
            name: 'executionCount',
            oldValue: args.oldValue,
            newValue: args.newValue
        });
    }
}
exports.CodeCellModel = CodeCellModel;
/**
 * The namespace for `CodeCellModel` statics.
 */
(function (CodeCellModel) {
    /**
     * The default implementation of an `IContentFactory`.
     */
    class ContentFactory {
        /**
         * Create an output area.
         */
        createOutputArea(options) {
            return new outputarea_1.OutputAreaModel(options);
        }
    }
    CodeCellModel.ContentFactory = ContentFactory;
    /**
     * The shared `ContentFactory` instance.
     */
    CodeCellModel.defaultContentFactory = new ContentFactory();
})(CodeCellModel = exports.CodeCellModel || (exports.CodeCellModel = {}));
