import { Style } from "./style.js";
import { VirtualFlow } from "../utils/virtual-flow.js";
import { InSequence } from "../utils/in-sequence.js";
import { IPositionedTextLine } from "./positioned-text-line.js";
import { ILayoutable } from "../utils/i-layoutable.js";
import { TextFitter } from "./text-fitter.js";
import { Metrics } from "../utils/metrics.js";

export class TextRun implements ILayoutable {
    public texts: string[];
    public style: Style;
    public inParagraph: InSequence = InSequence.Only;
    public linkTarget: string | undefined = undefined;
    public previousXPos: number | undefined;
    public lastXPos = 0;
    private _lines: IPositionedTextLine[] | undefined = undefined;

    constructor(texts: string[], style: Style) {
        this.style = style;
        this.texts = texts;
    }

    public getUsedWidth(): number {
        const lines = this.getLines();
        return lines[0].width;
    }

    public getWidthOfLastLine(): number {
        const lines = this.getLines();
        return Metrics.getTextWidth(lines[lines.length - 1].text, this.style);
    }

    public getHeight(): number {
        return this.getLines().length * this.style.lineSpacing;
    }

    public getLines(): IPositionedTextLine[] {
        let lines: IPositionedTextLine[];
        if (this._lines !== undefined) {
            lines = this._lines;
        } else {
            throw new Error("Rendering text which hasn't been included in layout");
        }
        return lines;
    }

    public get hasEmptyText(): boolean {
        return this.texts.length === 0;
    }

    public performLayout(flow: VirtualFlow): void {
        if (this._lines === undefined) {
            this._lines = this._getFlowLines(flow);
        }
    }

    private _getFlowLines(flow: VirtualFlow): IPositionedTextLine[] {
        let lines: IPositionedTextLine[] = [];
        if (!this.style.invisible) {
            const fitter = new TextFitter(this);
            fitter.getFlowLines(flow);
            this.lastXPos = fitter.lastXPadding;
            lines = fitter.lines;
        } else {
            this.lastXPos = 0;
        }
        return lines;
    }
}