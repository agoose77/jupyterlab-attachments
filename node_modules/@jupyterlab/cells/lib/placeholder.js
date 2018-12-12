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
const React = __importStar(require("react"));
const apputils_1 = require("@jupyterlab/apputils");
/**
 * The CSS class added to placeholders.
 */
const PLACEHOLDER_CLASS = 'jp-Placeholder';
/**
 * The CSS classes added to input placeholder prompts.
 */
const INPUT_PROMPT_CLASS = 'jp-Placeholder-prompt jp-InputPrompt';
/**
 * The CSS classes added to output placeholder prompts.
 */
const OUTPUT_PROMPT_CLASS = 'jp-Placeholder-prompt jp-OutputPrompt';
/**
 * The CSS class added to placeholder content.
 */
const CONTENT_CLASS = 'jp-Placeholder-content';
/**
 * The CSS class added to input placeholders.
 */
const INPUT_PLACEHOLDER_CLASS = 'jp-InputPlaceholder';
/**
 * The CSS class added to output placeholders.
 */
const OUTPUT_PLACEHOLDER_CLASS = 'jp-OutputPlaceholder';
/**
 * An abstract base class for placeholders
 *
 * ### Notes
 * A placeholder is the element that is shown when input/output
 * is hidden.
 */
class Placeholder extends apputils_1.VDomRenderer {
    /**
     * Construct a new placeholder.
     */
    constructor(callback) {
        super();
        this.addClass(PLACEHOLDER_CLASS);
        this._callback = callback;
    }
    /**
     * Handle the click event.
     */
    handleClick(e) {
        let callback = this._callback;
        callback(e);
    }
}
exports.Placeholder = Placeholder;
/**
 * The input placeholder class.
 */
class InputPlaceholder extends Placeholder {
    /**
     * Construct a new input placeholder.
     */
    constructor(callback) {
        super(callback);
        this.addClass(INPUT_PLACEHOLDER_CLASS);
    }
    /**
     * Render the input placeholder using the virtual DOM.
     */
    render() {
        return [
            React.createElement("div", { className: INPUT_PROMPT_CLASS, key: "input" }),
            React.createElement("div", { className: CONTENT_CLASS, onClick: e => this.handleClick(e), key: "content" },
                React.createElement("div", { className: "jp-MoreHorizIcon" }))
        ];
    }
}
exports.InputPlaceholder = InputPlaceholder;
/**
 * The output placeholder class.
 */
class OutputPlaceholder extends Placeholder {
    /**
     * Construct a new output placeholder.
     */
    constructor(callback) {
        super(callback);
        this.addClass(OUTPUT_PLACEHOLDER_CLASS);
    }
    /**
     * Render the output placeholder using the virtual DOM.
     */
    render() {
        return [
            React.createElement("div", { className: OUTPUT_PROMPT_CLASS, key: "output" }),
            React.createElement("div", { className: CONTENT_CLASS, onClick: e => this.handleClick(e), key: "content" },
                React.createElement("div", { className: "jp-MoreHorizIcon" }))
        ];
    }
}
exports.OutputPlaceholder = OutputPlaceholder;
