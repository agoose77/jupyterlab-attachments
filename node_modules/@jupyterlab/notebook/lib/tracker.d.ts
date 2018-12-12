import { IInstanceTracker, InstanceTracker } from '@jupyterlab/apputils';
import { Cell } from '@jupyterlab/cells';
import { Token } from '@phosphor/coreutils';
import { ISignal } from '@phosphor/signaling';
import { NotebookPanel } from './';
/**
 * An object that tracks notebook widgets.
 */
export interface INotebookTracker extends IInstanceTracker<NotebookPanel> {
    /**
     * The currently focused cell.
     *
     * #### Notes
     * If there is no cell with the focus, then this value is `null`.
     */
    readonly activeCell: Cell;
    /**
     * A signal emitted when the current active cell changes.
     *
     * #### Notes
     * If there is no cell with the focus, then `null` will be emitted.
     */
    readonly activeCellChanged: ISignal<this, Cell>;
    /**
     * A signal emitted when the selection state changes.
     */
    readonly selectionChanged: ISignal<this, void>;
}
/**
 * The notebook tracker token.
 */
export declare const INotebookTracker: Token<INotebookTracker>;
export declare class NotebookTracker extends InstanceTracker<NotebookPanel> implements INotebookTracker {
    /**
     * The currently focused cell.
     *
     * #### Notes
     * This is a read-only property. If there is no cell with the focus, then this
     * value is `null`.
     */
    readonly activeCell: Cell;
    /**
     * A signal emitted when the current active cell changes.
     *
     * #### Notes
     * If there is no cell with the focus, then `null` will be emitted.
     */
    readonly activeCellChanged: ISignal<this, Cell>;
    /**
     * A signal emitted when the selection state changes.
     */
    readonly selectionChanged: ISignal<this, void>;
    /**
     * Add a new notebook panel to the tracker.
     *
     * @param panel - The notebook panel being added.
     */
    add(panel: NotebookPanel): Promise<void>;
    /**
     * Dispose of the resources held by the tracker.
     */
    dispose(): void;
    /**
     * Handle the current change event.
     */
    protected onCurrentChanged(widget: NotebookPanel): void;
    private _onActiveCellChanged;
    private _onSelectionChanged;
    private _activeCell;
    private _activeCellChanged;
    private _selectionChanged;
}
