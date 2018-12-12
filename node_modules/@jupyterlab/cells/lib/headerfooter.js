"use strict";
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const widgets_1 = require("@phosphor/widgets");
/**
 * The CSS class added to the cell header.
 */
const CELL_HEADER_CLASS = 'jp-CellHeader';
/**
 * The CSS class added to the cell footer.
 */
const CELL_FOOTER_CLASS = 'jp-CellFooter';
/**
 * Default implementation of a cell header.
 */
class CellHeader extends widgets_1.Widget {
    /**
     * Construct a new cell header.
     */
    constructor() {
        super();
        this.addClass(CELL_HEADER_CLASS);
    }
}
exports.CellHeader = CellHeader;
/**
 * Default implementation of a cell footer.
 */
class CellFooter extends widgets_1.Widget {
    /**
     * Construct a new cell footer.
     */
    constructor() {
        super();
        this.addClass(CELL_FOOTER_CLASS);
    }
}
exports.CellFooter = CellFooter;
