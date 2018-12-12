"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_1 = require("@phosphor/algorithm");
const coreutils_1 = require("@phosphor/coreutils");
const messaging_1 = require("@phosphor/messaging");
const virtualdom_1 = require("@phosphor/virtualdom");
const widgets_1 = require("@phosphor/widgets");
const apputils_1 = require("@jupyterlab/apputils");
const codeeditor_1 = require("@jupyterlab/codeeditor");
const observables_1 = require("@jupyterlab/observables");
/**
 * The class name added to a CellTools instance.
 */
const CELLTOOLS_CLASS = 'jp-CellTools';
/**
 * The class name added to a CellTools tool.
 */
const CHILD_CLASS = 'jp-CellTools-tool';
/**
 * The class name added to a CellTools active cell.
 */
const ACTIVE_CELL_CLASS = 'jp-ActiveCellTool';
/**
 * The class name added to an Editor instance.
 */
const EDITOR_CLASS = 'jp-MetadataEditorTool';
/**
 * The class name added to a KeySelector instance.
 */
const KEYSELECTOR_CLASS = 'jp-KeySelector';
/* tslint:disable */
/**
 * The main menu token.
 */
exports.ICellTools = new coreutils_1.Token('@jupyterlab/notebook:ICellTools');
/**
 * A widget that provides cell metadata tools.
 */
class CellTools extends widgets_1.Widget {
    /**
     * Construct a new CellTools object.
     */
    constructor(options) {
        super();
        this._items = [];
        this.addClass(CELLTOOLS_CLASS);
        this.layout = new widgets_1.PanelLayout();
        this._tracker = options.tracker;
        this._tracker.activeCellChanged.connect(this._onActiveCellChanged, this);
        this._tracker.selectionChanged.connect(this._onSelectionChanged, this);
        this._onActiveCellChanged();
        this._onSelectionChanged();
    }
    /**
     * The active cell widget.
     */
    get activeCell() {
        return this._tracker.activeCell;
    }
    /**
     * The currently selected cells.
     */
    get selectedCells() {
        let selected = [];
        let panel = this._tracker.currentWidget;
        if (!panel) {
            return selected;
        }
        algorithm_1.each(panel.content.widgets, widget => {
            if (panel.content.isSelectedOrActive(widget)) {
                selected.push(widget);
            }
        });
        return selected;
    }
    /**
     * Add a cell tool item.
     */
    addItem(options) {
        let tool = options.tool;
        let rank = 'rank' in options ? options.rank : 100;
        let rankItem = { tool, rank };
        let index = algorithm_1.ArrayExt.upperBound(this._items, rankItem, Private.itemCmp);
        tool.addClass(CHILD_CLASS);
        // Add the tool.
        algorithm_1.ArrayExt.insert(this._items, index, rankItem);
        let layout = this.layout;
        layout.insertWidget(index, tool);
        // Trigger the tool to update its active cell.
        messaging_1.MessageLoop.sendMessage(tool, CellTools.ActiveCellMessage);
    }
    /**
     * Handle the removal of a child
     */
    onChildRemoved(msg) {
        let index = algorithm_1.ArrayExt.findFirstIndex(this._items, item => item.tool === msg.child);
        if (index !== -1) {
            algorithm_1.ArrayExt.removeAt(this._items, index);
        }
    }
    /**
     * Handle a change to the active cell.
     */
    _onActiveCellChanged() {
        if (this._prevActive && !this._prevActive.isDisposed) {
            this._prevActive.metadata.changed.disconnect(this._onMetadataChanged, this);
        }
        let activeCell = this._tracker.activeCell;
        this._prevActive = activeCell ? activeCell.model : null;
        if (activeCell) {
            activeCell.model.metadata.changed.connect(this._onMetadataChanged, this);
        }
        algorithm_1.each(this.children(), widget => {
            messaging_1.MessageLoop.sendMessage(widget, CellTools.ActiveCellMessage);
        });
    }
    /**
     * Handle a change in the selection.
     */
    _onSelectionChanged() {
        algorithm_1.each(this.children(), widget => {
            messaging_1.MessageLoop.sendMessage(widget, CellTools.SelectionMessage);
        });
    }
    /**
     * Handle a change in the metadata.
     */
    _onMetadataChanged(sender, args) {
        let message = new observables_1.ObservableJSON.ChangeMessage(args);
        algorithm_1.each(this.children(), widget => {
            messaging_1.MessageLoop.sendMessage(widget, message);
        });
    }
}
exports.CellTools = CellTools;
/**
 * The namespace for CellTools class statics.
 */
(function (CellTools) {
    /**
     * A singleton conflatable `'activecell-changed'` message.
     */
    // tslint:disable-next-line
    CellTools.ActiveCellMessage = new messaging_1.ConflatableMessage('activecell-changed');
    /**
     * A singleton conflatable `'selection-changed'` message.
     */
    // tslint:disable-next-line
    CellTools.SelectionMessage = new messaging_1.ConflatableMessage('selection-changed');
    /**
     * The base cell tool, meant to be subclassed.
     */
    class Tool extends widgets_1.Widget {
        /**
         * Process a message sent to the widget.
         *
         * @param msg - The message sent to the widget.
         */
        processMessage(msg) {
            super.processMessage(msg);
            switch (msg.type) {
                case 'activecell-changed':
                    this.onActiveCellChanged(msg);
                    break;
                case 'selection-changed':
                    this.onSelectionChanged(msg);
                    break;
                case 'jsonvalue-changed':
                    this.onMetadataChanged(msg);
                    break;
                default:
                    break;
            }
        }
        /**
         * Handle a change to the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        onActiveCellChanged(msg) {
            /* no-op */
        }
        /**
         * Handle a change to the selection.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        onSelectionChanged(msg) {
            /* no-op */
        }
        /**
         * Handle a change to the metadata of the active cell.
         *
         * #### Notes
         * The default implementation is a no-op.
         */
        onMetadataChanged(msg) {
            /* no-op */
        }
    }
    CellTools.Tool = Tool;
    /**
     * A cell tool displaying the active cell contents.
     */
    class ActiveCellTool extends Tool {
        /**
         * Construct a new active cell tool.
         */
        constructor() {
            super();
            this._model = new codeeditor_1.CodeEditor.Model();
            this.addClass(ACTIVE_CELL_CLASS);
            this.addClass('jp-InputArea');
            this.layout = new widgets_1.PanelLayout();
        }
        /**
         * Dispose of the resources used by the tool.
         */
        dispose() {
            if (this._model === null) {
                return;
            }
            this._model.dispose();
            this._model = null;
            super.dispose();
        }
        /**
         * Handle a change to the active cell.
         */
        onActiveCellChanged() {
            let activeCell = this.parent.activeCell;
            let layout = this.layout;
            let count = layout.widgets.length;
            for (let i = 0; i < count; i++) {
                layout.widgets[0].dispose();
            }
            if (this._cellModel && !this._cellModel.isDisposed) {
                this._cellModel.value.changed.disconnect(this._onValueChanged, this);
                this._cellModel.mimeTypeChanged.disconnect(this._onMimeTypeChanged, this);
            }
            if (!activeCell) {
                let cell = new widgets_1.Widget();
                cell.addClass('jp-InputArea-editor');
                cell.addClass('jp-InputArea-editor');
                layout.addWidget(cell);
                this._cellModel = null;
                return;
            }
            let promptNode = activeCell.promptNode
                ? activeCell.promptNode.cloneNode(true)
                : null;
            let prompt = new widgets_1.Widget({ node: promptNode });
            let factory = activeCell.contentFactory.editorFactory;
            let cellModel = (this._cellModel = activeCell.model);
            cellModel.value.changed.connect(this._onValueChanged, this);
            cellModel.mimeTypeChanged.connect(this._onMimeTypeChanged, this);
            this._model.value.text = cellModel.value.text.split('\n')[0];
            this._model.mimeType = cellModel.mimeType;
            let model = this._model;
            let editorWidget = new codeeditor_1.CodeEditorWrapper({ model, factory });
            editorWidget.addClass('jp-InputArea-editor');
            editorWidget.addClass('jp-InputArea-editor');
            editorWidget.editor.setOption('readOnly', true);
            layout.addWidget(prompt);
            layout.addWidget(editorWidget);
        }
        /**
         * Handle a change to the current editor value.
         */
        _onValueChanged() {
            this._model.value.text = this._cellModel.value.text.split('\n')[0];
        }
        /**
         * Handle a change to the current editor mimetype.
         */
        _onMimeTypeChanged() {
            this._model.mimeType = this._cellModel.mimeType;
        }
    }
    CellTools.ActiveCellTool = ActiveCellTool;
    /**
     * A raw metadata editor.
     */
    class MetadataEditorTool extends Tool {
        /**
         * Construct a new raw metadata tool.
         */
        constructor(options) {
            super();
            let editorFactory = options.editorFactory;
            this.addClass(EDITOR_CLASS);
            let layout = (this.layout = new widgets_1.PanelLayout());
            this.editor = new codeeditor_1.JSONEditor({
                editorFactory,
                title: 'Edit Metadata',
                collapsible: true
            });
            layout.addWidget(this.editor);
        }
        /**
         * Handle a change to the active cell.
         */
        onActiveCellChanged(msg) {
            let cell = this.parent.activeCell;
            this.editor.source = cell ? cell.model.metadata : null;
        }
    }
    CellTools.MetadataEditorTool = MetadataEditorTool;
    /**
     * A cell tool that provides a selection for a given metadata key.
     */
    class KeySelector extends Tool {
        /**
         * Construct a new KeySelector.
         */
        constructor(options) {
            super({ node: Private.createSelectorNode(options) });
            /**
             * Get the value for the data.
             */
            this._getValue = (cell) => {
                return cell.model.metadata.get(this.key);
            };
            /**
             * Set the value for the data.
             */
            this._setValue = (cell, value) => {
                cell.model.metadata.set(this.key, value);
            };
            this._changeGuard = false;
            this.addClass(KEYSELECTOR_CLASS);
            this.key = options.key;
            this._validCellTypes = options.validCellTypes || [];
            this._getter = options.getter || this._getValue;
            this._setter = options.setter || this._setValue;
        }
        /**
         * The select node for the widget.
         */
        get selectNode() {
            return this.node.getElementsByTagName('select')[0];
        }
        /**
         * Handle the DOM events for the widget.
         *
         * @param event - The DOM event sent to the widget.
         *
         * #### Notes
         * This method implements the DOM `EventListener` interface and is
         * called in response to events on the notebook panel's node. It should
         * not be called directly by user code.
         */
        handleEvent(event) {
            switch (event.type) {
                case 'change':
                    this.onValueChanged();
                    break;
                default:
                    break;
            }
        }
        /**
         * Handle `after-attach` messages for the widget.
         */
        onAfterAttach(msg) {
            let node = this.selectNode;
            node.addEventListener('change', this);
        }
        /**
         * Handle `before-detach` messages for the widget.
         */
        onBeforeDetach(msg) {
            let node = this.selectNode;
            node.removeEventListener('change', this);
        }
        /**
         * Handle a change to the active cell.
         */
        onActiveCellChanged(msg) {
            let select = this.selectNode;
            let activeCell = this.parent.activeCell;
            if (!activeCell) {
                select.disabled = true;
                select.value = '';
                return;
            }
            let cellType = activeCell.model.type;
            if (this._validCellTypes.length &&
                this._validCellTypes.indexOf(cellType) === -1) {
                select.disabled = true;
                return;
            }
            select.disabled = false;
            this._changeGuard = true;
            let getter = this._getter;
            select.value = JSON.stringify(getter(activeCell));
            this._changeGuard = false;
        }
        /**
         * Handle a change to the metadata of the active cell.
         */
        onMetadataChanged(msg) {
            if (this._changeGuard) {
                return;
            }
            let select = this.selectNode;
            let cell = this.parent.activeCell;
            if (msg.args.key === this.key && cell) {
                this._changeGuard = true;
                let getter = this._getter;
                select.value = JSON.stringify(getter(cell));
                this._changeGuard = false;
            }
        }
        /**
         * Handle a change to the value.
         */
        onValueChanged() {
            let activeCell = this.parent.activeCell;
            if (!activeCell || this._changeGuard) {
                return;
            }
            this._changeGuard = true;
            let select = this.selectNode;
            let setter = this._setter;
            setter(activeCell, JSON.parse(select.value));
            this._changeGuard = false;
        }
    }
    CellTools.KeySelector = KeySelector;
    /**
     * Create a slideshow selector.
     */
    function createSlideShowSelector() {
        let options = {
            key: 'slideshow',
            title: 'Slide Type',
            optionsMap: {
                '-': '-',
                Slide: 'slide',
                'Sub-Slide': 'subslide',
                Fragment: 'fragment',
                Skip: 'skip',
                Notes: 'notes'
            },
            getter: cell => {
                let value = cell.model.metadata.get('slideshow');
                return value && value['slide_type'];
            },
            setter: (cell, value) => {
                let data = cell.model.metadata.get('slideshow') || Object.create(null);
                data = Object.assign({}, data, { slide_type: value });
                cell.model.metadata.set('slideshow', data);
            }
        };
        return new KeySelector(options);
    }
    CellTools.createSlideShowSelector = createSlideShowSelector;
    /**
     * Create an nbcovert selector.
     */
    function createNBConvertSelector(optionsMap) {
        return new KeySelector({
            key: 'raw_mimetype',
            title: 'Raw NBConvert Format',
            optionsMap: optionsMap,
            validCellTypes: ['raw']
        });
    }
    CellTools.createNBConvertSelector = createNBConvertSelector;
})(CellTools = exports.CellTools || (exports.CellTools = {}));
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * A comparator function for widget rank items.
     */
    function itemCmp(first, second) {
        return first.rank - second.rank;
    }
    Private.itemCmp = itemCmp;
    /**
     * Create the node for a KeySelector.
     */
    function createSelectorNode(options) {
        let name = options.key;
        let title = options.title || name[0].toLocaleUpperCase() + name.slice(1);
        let optionNodes = [];
        for (let label in options.optionsMap) {
            let value = JSON.stringify(options.optionsMap[label]);
            optionNodes.push(virtualdom_1.h.option({ value }, label));
        }
        let node = virtualdom_1.VirtualDOM.realize(virtualdom_1.h.div({}, virtualdom_1.h.label(title), virtualdom_1.h.select({}, optionNodes)));
        apputils_1.Styling.styleNode(node);
        return node;
    }
    Private.createSelectorNode = createSelectorNode;
})(Private || (Private = {}));
