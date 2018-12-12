"use strict";
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
const React = __importStar(require("react"));
/**
 * The CSS class added to all collapsers.
 */
const COLLAPSER_CLASS = 'jp-Collapser';
/**
 * The CSS class added to the collapser child.
 */
const COLLAPSER_CHILD_CLASS = 'jp-Collapser-child';
/**
 * The CSS class added to input collapsers.
 */
const INPUT_COLLAPSER = 'jp-InputCollapser';
/**
 * The CSS class added to output collapsers.
 */
const OUTPUT_COLLAPSER = 'jp-OutputCollapser';
/**
 * The CSS class added the collapser child when collapsed.
 */
const MOD_COLLAPSED_CLASS = 'jp-mod-collapsed';
/**
 * Abstract collapser base class.
 *
 * ### Notes
 * A collapser is a visible div to the left of a cell's
 * input/output that a user can click on to collapse the
 * input/output.
 */
class Collapser extends apputils_1.VDomRenderer {
    /**
     * Construct a new collapser.
     */
    constructor() {
        super();
        this.addClass(COLLAPSER_CLASS);
    }
    /**
     * Is the input/output of the parent collapsed.
     */
    get collapsed() {
        return false;
    }
    /**
     * Render the collapser with the virtual DOM.
     */
    render() {
        let childClass = COLLAPSER_CHILD_CLASS;
        if (this.collapsed) {
            childClass += ` ${MOD_COLLAPSED_CLASS}`;
        }
        return React.createElement("div", { className: childClass, onClick: e => this.handleClick(e) });
    }
}
exports.Collapser = Collapser;
/**
 * A collapser subclass to collapse a cell's input area.
 */
class InputCollapser extends Collapser {
    /**
     * Construct a new input collapser.
     */
    constructor() {
        super();
        this.addClass(INPUT_COLLAPSER);
    }
    /**
     * Is the cell's input collapsed?
     */
    get collapsed() {
        let cell = this.parent.parent;
        if (cell) {
            return cell.inputHidden;
        }
        else {
            return false;
        }
    }
    /**
     * Handle a click event for the user to collapse the cell's input.
     */
    handleClick(e) {
        let cell = this.parent.parent;
        if (cell) {
            cell.inputHidden = !cell.inputHidden;
        }
        /* We need this until we watch the cell state */
        this.update();
    }
}
exports.InputCollapser = InputCollapser;
/**
 * A collapser subclass to collapse a cell's output area.
 */
class OutputCollapser extends Collapser {
    /**
     * Construct a new output collapser.
     */
    constructor() {
        super();
        this.addClass(OUTPUT_COLLAPSER);
    }
    /**
     * Is the cell's output collapsed?
     */
    get collapsed() {
        let cell = this.parent.parent;
        if (cell) {
            return cell.outputHidden;
        }
        else {
            return false;
        }
    }
    /**
     * Handle a click event for the user to collapse the cell's output.
     */
    handleClick(e) {
        let cell = this.parent.parent;
        if (cell) {
            cell.outputHidden = !cell.outputHidden;
        }
        /* We need this until we watch the cell state */
        this.update();
    }
}
exports.OutputCollapser = OutputCollapser;
