import { IIterator, IterableOrArrayLike } from '@phosphor/algorithm';
import { ISignal } from '@phosphor/signaling';
import { ICellModel } from '@jupyterlab/cells';
import { IObservableList, IObservableUndoableList, IModelDB } from '@jupyterlab/observables';
import { NotebookModel } from './model';
/**
 * A cell list object that supports undo/redo.
 */
export declare class CellList implements IObservableUndoableList<ICellModel> {
    /**
     * Construct the cell list.
     */
    constructor(modelDB: IModelDB, factory: NotebookModel.IContentFactory);
    type: 'List';
    /**
     * A signal emitted when the cell list has changed.
     */
    readonly changed: ISignal<this, IObservableList.IChangedArgs<ICellModel>>;
    /**
     * Test whether the cell list has been disposed.
     */
    readonly isDisposed: boolean;
    /**
     * Test whether the list is empty.
     *
     * @returns `true` if the cell list is empty, `false` otherwise.
     *
     * #### Notes
     * This is a read-only property.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     */
    readonly isEmpty: boolean;
    /**
     * Get the length of the cell list.
     *
     * @return The number of cells in the cell list.
     *
     * #### Notes
     * This is a read-only property.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     */
    readonly length: number;
    /**
     * Create an iterator over the cells in the cell list.
     *
     * @returns A new iterator starting at the front of the cell list.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     */
    iter(): IIterator<ICellModel>;
    /**
     * Dispose of the resources held by the cell list.
     */
    dispose(): void;
    /**
     * Get the cell at the specified index.
     *
     * @param index - The positive integer index of interest.
     *
     * @returns The cell at the specified index.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral or out of range.
     */
    get(index: number): ICellModel;
    /**
     * Set the cell at the specified index.
     *
     * @param index - The positive integer index of interest.
     *
     * @param cell - The cell to set at the specified index.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral or out of range.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cell to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    set(index: number, cell: ICellModel): void;
    /**
     * Add a cell to the back of the cell list.
     *
     * @param cell - The cell to add to the back of the cell list.
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cell to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    push(cell: ICellModel): number;
    /**
     * Insert a cell into the cell list at a specific index.
     *
     * @param index - The index at which to insert the cell.
     *
     * @param cell - The cell to set at the specified index.
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Notes
     * The `index` will be clamped to the bounds of the cell list.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cell to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    insert(index: number, cell: ICellModel): void;
    /**
     * Remove the first occurrence of a cell from the cell list.
     *
     * @param cell - The cell of interest.
     *
     * @returns The index of the removed cell, or `-1` if the cell
     *   is not contained in the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * Iterators pointing at the removed cell and beyond are invalidated.
     */
    removeValue(cell: ICellModel): number;
    /**
     * Remove and return the cell at a specific index.
     *
     * @param index - The index of the cell of interest.
     *
     * @returns The cell at the specified index, or `undefined` if the
     *   index is out of range.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * Iterators pointing at the removed cell and beyond are invalidated.
     *
     * #### Undefined Behavior
     * An `index` which is non-integral.
     */
    remove(index: number): ICellModel;
    /**
     * Remove all cells from the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * All current iterators are invalidated.
     */
    clear(): void;
    /**
     * Move a cell from one index to another.
     *
     * @parm fromIndex - The index of the element to move.
     *
     * @param toIndex - The index to move the element to.
     *
     * #### Complexity
     * Constant.
     *
     * #### Iterator Validity
     * Iterators pointing at the lesser of the `fromIndex` and the `toIndex`
     * and beyond are invalidated.
     *
     * #### Undefined Behavior
     * A `fromIndex` or a `toIndex` which is non-integral.
     */
    move(fromIndex: number, toIndex: number): void;
    /**
     * Push a set of cells to the back of the cell list.
     *
     * @param cells - An iterable or array-like set of cells to add.
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cells to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    pushAll(cells: IterableOrArrayLike<ICellModel>): number;
    /**
     * Insert a set of items into the cell list at the specified index.
     *
     * @param index - The index at which to insert the cells.
     *
     * @param cells - The cells to insert at the specified index.
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity.
     * Linear.
     *
     * #### Iterator Validity
     * No changes.
     *
     * #### Notes
     * The `index` will be clamped to the bounds of the cell list.
     *
     * #### Undefined Behavior.
     * An `index` which is non-integral.
     *
     * #### Notes
     * This should be considered to transfer ownership of the
     * cells to the `CellList`. As such, `cell.dispose()` should
     * not be called by other actors.
     */
    insertAll(index: number, cells: IterableOrArrayLike<ICellModel>): number;
    /**
     * Remove a range of items from the cell list.
     *
     * @param startIndex - The start index of the range to remove (inclusive).
     *
     * @param endIndex - The end index of the range to remove (exclusive).
     *
     * @returns The new length of the cell list.
     *
     * #### Complexity
     * Linear.
     *
     * #### Iterator Validity
     * Iterators pointing to the first removed cell and beyond are invalid.
     *
     * #### Undefined Behavior
     * A `startIndex` or `endIndex` which is non-integral.
     */
    removeRange(startIndex: number, endIndex: number): number;
    /**
     * Whether the object can redo changes.
     */
    readonly canRedo: boolean;
    /**
     * Whether the object can undo changes.
     */
    readonly canUndo: boolean;
    /**
     * Begin a compound operation.
     *
     * @param isUndoAble - Whether the operation is undoable.
     *   The default is `true`.
     */
    beginCompoundOperation(isUndoAble?: boolean): void;
    /**
     * End a compound operation.
     */
    endCompoundOperation(): void;
    /**
     * Undo an operation.
     */
    undo(): void;
    /**
     * Redo an operation.
     */
    redo(): void;
    /**
     * Clear the change stack.
     */
    clearUndo(): void;
    private _onOrderChanged;
    private _isDisposed;
    private _cellOrder;
    private _cellMap;
    private _changed;
    private _factory;
}
