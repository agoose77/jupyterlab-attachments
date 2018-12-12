"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const widgets_1 = require("@phosphor/widgets");
const actions_1 = require("./actions");
const apputils_1 = require("@jupyterlab/apputils");
/**
 * The class name added to toolbar save button.
 */
const TOOLBAR_SAVE_CLASS = 'jp-SaveIcon';
/**
 * The class name added to toolbar insert button.
 */
const TOOLBAR_INSERT_CLASS = 'jp-AddIcon';
/**
 * The class name added to toolbar cut button.
 */
const TOOLBAR_CUT_CLASS = 'jp-CutIcon';
/**
 * The class name added to toolbar copy button.
 */
const TOOLBAR_COPY_CLASS = 'jp-CopyIcon';
/**
 * The class name added to toolbar paste button.
 */
const TOOLBAR_PASTE_CLASS = 'jp-PasteIcon';
/**
 * The class name added to toolbar run button.
 */
const TOOLBAR_RUN_CLASS = 'jp-RunIcon';
/**
 * The class name added to toolbar cell type dropdown wrapper.
 */
const TOOLBAR_CELLTYPE_CLASS = 'jp-Notebook-toolbarCellType';
/**
 * The class name added to toolbar cell type dropdown.
 */
const TOOLBAR_CELLTYPE_DROPDOWN_CLASS = 'jp-Notebook-toolbarCellTypeDropdown';
/**
 * A namespace for the default toolbar items.
 */
var ToolbarItems;
(function (ToolbarItems) {
    /**
     * Create save button toolbar item.
     */
    function createSaveButton(panel) {
        return new apputils_1.ToolbarButton({
            iconClassName: TOOLBAR_SAVE_CLASS + ' foo jp-Icon jp-Icon-16',
            onClick: () => {
                if (panel.context.model.readOnly) {
                    return apputils_1.showDialog({
                        title: 'Cannot Save',
                        body: 'Document is read-only',
                        buttons: [apputils_1.Dialog.okButton()]
                    });
                }
                panel.context.save().then(() => {
                    if (!panel.isDisposed) {
                        return panel.context.createCheckpoint();
                    }
                });
            },
            tooltip: 'Save the notebook contents and create checkpoint'
        });
    }
    ToolbarItems.createSaveButton = createSaveButton;
    /**
     * Create an insert toolbar item.
     */
    function createInsertButton(panel) {
        return new apputils_1.ToolbarButton({
            iconClassName: TOOLBAR_INSERT_CLASS + ' jp-Icon jp-Icon-16',
            onClick: () => {
                actions_1.NotebookActions.insertBelow(panel.content);
            },
            tooltip: 'Insert a cell below'
        });
    }
    ToolbarItems.createInsertButton = createInsertButton;
    /**
     * Create a cut toolbar item.
     */
    function createCutButton(panel) {
        return new apputils_1.ToolbarButton({
            iconClassName: TOOLBAR_CUT_CLASS + ' jp-Icon jp-Icon-16',
            onClick: () => {
                actions_1.NotebookActions.cut(panel.content);
            },
            tooltip: 'Cut the selected cells'
        });
    }
    ToolbarItems.createCutButton = createCutButton;
    /**
     * Create a copy toolbar item.
     */
    function createCopyButton(panel) {
        return new apputils_1.ToolbarButton({
            iconClassName: TOOLBAR_COPY_CLASS + ' jp-Icon jp-Icon-16',
            onClick: () => {
                actions_1.NotebookActions.copy(panel.content);
            },
            tooltip: 'Copy the selected cells'
        });
    }
    ToolbarItems.createCopyButton = createCopyButton;
    /**
     * Create a paste toolbar item.
     */
    function createPasteButton(panel) {
        return new apputils_1.ToolbarButton({
            iconClassName: TOOLBAR_PASTE_CLASS + ' jp-Icon jp-Icon-16',
            onClick: () => {
                actions_1.NotebookActions.paste(panel.content);
            },
            tooltip: 'Paste cells from the clipboard'
        });
    }
    ToolbarItems.createPasteButton = createPasteButton;
    /**
     * Create a run toolbar item.
     */
    function createRunButton(panel) {
        return new apputils_1.ToolbarButton({
            iconClassName: TOOLBAR_RUN_CLASS + ' jp-Icon jp-Icon-16',
            onClick: () => {
                actions_1.NotebookActions.runAndAdvance(panel.content, panel.session);
            },
            tooltip: 'Run the selected cells and advance'
        });
    }
    ToolbarItems.createRunButton = createRunButton;
    /**
     * Create a cell type switcher item.
     *
     * #### Notes
     * It will display the type of the current active cell.
     * If more than one cell is selected but are of different types,
     * it will display `'-'`.
     * When the user changes the cell type, it will change the
     * cell types of the selected cells.
     * It can handle a change to the context.
     */
    function createCellTypeItem(panel) {
        return new CellTypeSwitcher(panel.content);
    }
    ToolbarItems.createCellTypeItem = createCellTypeItem;
    /**
     * Add the default items to the panel toolbar.
     */
    function populateDefaults(panel) {
        let toolbar = panel.toolbar;
        toolbar.addItem('save', createSaveButton(panel));
        toolbar.addItem('insert', createInsertButton(panel));
        toolbar.addItem('cut', createCutButton(panel));
        toolbar.addItem('copy', createCopyButton(panel));
        toolbar.addItem('paste', createPasteButton(panel));
        toolbar.addItem('run', createRunButton(panel));
        toolbar.addItem('interrupt', apputils_1.Toolbar.createInterruptButton(panel.session));
        toolbar.addItem('restart', apputils_1.Toolbar.createRestartButton(panel.session));
        toolbar.addItem('cellType', createCellTypeItem(panel));
        toolbar.addItem('spacer', apputils_1.Toolbar.createSpacerItem());
        toolbar.addItem('kernelName', apputils_1.Toolbar.createKernelNameItem(panel.session));
        toolbar.addItem('kernelStatus', apputils_1.Toolbar.createKernelStatusItem(panel.session));
    }
    ToolbarItems.populateDefaults = populateDefaults;
    /**
     * Get the default toolbar items for panel
     */
    function getDefaultItems(panel) {
        return [
            { name: 'save', widget: createSaveButton(panel) },
            { name: 'insert', widget: createInsertButton(panel) },
            { name: 'cut', widget: createCutButton(panel) },
            { name: 'copy', widget: createCopyButton(panel) },
            { name: 'paste', widget: createPasteButton(panel) },
            { name: 'run', widget: createRunButton(panel) },
            {
                name: 'interrupt',
                widget: apputils_1.Toolbar.createInterruptButton(panel.session)
            },
            {
                name: 'restart',
                widget: apputils_1.Toolbar.createRestartButton(panel.session)
            },
            { name: 'cellType', widget: createCellTypeItem(panel) },
            { name: 'spacer', widget: apputils_1.Toolbar.createSpacerItem() },
            {
                name: 'kernelName',
                widget: apputils_1.Toolbar.createKernelNameItem(panel.session)
            },
            {
                name: 'kernelStatus',
                widget: apputils_1.Toolbar.createKernelStatusItem(panel.session)
            }
        ];
    }
    ToolbarItems.getDefaultItems = getDefaultItems;
})(ToolbarItems = exports.ToolbarItems || (exports.ToolbarItems = {}));
/**
 * A toolbar widget that switches cell types.
 */
class CellTypeSwitcher extends widgets_1.Widget {
    /**
     * Construct a new cell type switcher.
     */
    constructor(widget) {
        super({ node: createCellTypeSwitcherNode() });
        this._changeGuard = false;
        this._wildCard = null;
        this._select = null;
        this._notebook = null;
        this.addClass(TOOLBAR_CELLTYPE_CLASS);
        this._select = this.node.firstChild;
        apputils_1.Styling.wrapSelect(this._select);
        this._wildCard = document.createElement('option');
        this._wildCard.value = '-';
        this._wildCard.textContent = '-';
        this._notebook = widget;
        // Set the initial value.
        if (widget.model) {
            this._updateValue();
        }
        // Follow the type of the active cell.
        widget.activeCellChanged.connect(this._updateValue, this);
        // Follow a change in the selection.
        widget.selectionChanged.connect(this._updateValue, this);
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
        switch (event.type) {
            case 'change':
                this._evtChange(event);
                break;
            case 'keydown':
                this._evtKeyDown(event);
                break;
            default:
                break;
        }
    }
    /**
     * Handle `after-attach` messages for the widget.
     */
    onAfterAttach(msg) {
        this._select.addEventListener('change', this);
        this._select.addEventListener('keydown', this);
    }
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach(msg) {
        this._select.removeEventListener('change', this);
        this._select.removeEventListener('keydown', this);
    }
    /**
     * Handle `changed` events for the widget.
     */
    _evtChange(event) {
        let select = this._select;
        let widget = this._notebook;
        if (select.value === '-') {
            return;
        }
        if (!this._changeGuard) {
            let value = select.value;
            actions_1.NotebookActions.changeCellType(widget, value);
            widget.activate();
        }
    }
    /**
     * Handle `keydown` events for the widget.
     */
    _evtKeyDown(event) {
        if (event.keyCode === 13) {
            // Enter
            this._notebook.activate();
        }
    }
    /**
     * Update the value of the dropdown from the widget state.
     */
    _updateValue() {
        let widget = this._notebook;
        let select = this._select;
        if (!widget.activeCell) {
            return;
        }
        let mType = widget.activeCell.model.type;
        for (let i = 0; i < widget.widgets.length; i++) {
            let child = widget.widgets[i];
            if (widget.isSelectedOrActive(child)) {
                if (child.model.type !== mType) {
                    mType = '-';
                    select.appendChild(this._wildCard);
                    break;
                }
            }
        }
        if (mType !== '-') {
            select.remove(3);
        }
        this._changeGuard = true;
        select.value = mType;
        this._changeGuard = false;
    }
}
/**
 * Create the node for the cell type switcher.
 */
function createCellTypeSwitcherNode() {
    let div = document.createElement('div');
    let select = document.createElement('select');
    for (let t of ['Code', 'Markdown', 'Raw']) {
        let option = document.createElement('option');
        option.value = t.toLowerCase();
        option.textContent = t;
        select.appendChild(option);
    }
    select.className = TOOLBAR_CELLTYPE_DROPDOWN_CLASS;
    div.appendChild(select);
    return div;
}
