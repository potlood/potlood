import { IPositionedTextLine } from "./positioned-text-line.js";
import { VirtualFlow } from "../utils/virtual-flow.js";
import { InSequence } from "../utils/in-sequence.js";
import { TextRun } from "./text-run.js";
import { Metrics } from "../utils/metrics.js";
import { FontMetrics } from "../utils/font-metrics.js";
import { Style } from "./style.js";
import { Justification } from "../paragraph/par-style.js";
import { WordSplitter, WordSeperator } from "./word-splitter.js";

export class TextFitter {
    public lines: IPositionedTextLine[];
    public lastXPadding = 0;
    private _run: TextRun;
    private _lineHeight: number;

    constructor(run: TextRun) {
        this._run = run;
        this._lineHeight = this._run.style.lineSpacing;
        this.lines = [];
    }

    public getFlowLines(flow: VirtualFlow): void {
        let inRun = InSequence.First;
        let currentXPadding = this._getInitialXPadding();
        let isFollowing = this._isFollowing;
        if (this._run.texts.length === 0) {
            this.lastXPadding = currentXPadding;
            return;
        }
        this._fixYPosition(isFollowing, flow);
        let txt = this._run.texts.join(' ');
        txt = this._fixCaps(txt);
        const splitter = new WordSplitter(this._fixCaps(txt));
        const words = splitter.words;
        if (this._run.texts.length === 1 && this._run.texts[0] === " ") {
            this.lastXPadding = currentXPadding + FontMetrics.averageCharWidth(this._run.style);
            return;
        }
        let previousEnd = 0;
        let currentLength = 0;
        let numAvailableChars = this._getAvailableChars(currentXPadding, flow);
        let isLastLine = false;
        for(let i = 0; i < words.length; i++) {
            currentLength += words[i].length + 1;
            isLastLine = (i === words.length - 1);
            const isNewLine = splitter.getSeperator(i) === WordSeperator.LineFeed;
            let reachedEndOfLine = isLastLine || isNewLine;
            if (!isLastLine && !this._fitReasonably(currentLength, numAvailableChars, words[i + 1])) {
                // Next word would go over the boundary, chop now.
                reachedEndOfLine = true;
            }
            if (reachedEndOfLine) {
                inRun = (isLastLine) ? InSequence.Last : inRun;
                this._pushNewLine(txt.substr(previousEnd, currentLength), flow, isFollowing, inRun, currentXPadding, this._run.style);
                if (!isLastLine) {
                    isFollowing = false;
                    inRun = InSequence.Middle;
                    currentXPadding = this._getIndentation(inRun);
                    numAvailableChars = this._getAvailableChars(currentXPadding, flow)
                    previousEnd += currentLength;
                    currentLength = 0;
                }
            }
        }
        this.lastXPadding = this._finalXPadding(currentXPadding, flow);
    }

    private get _isFirstRun(): boolean {
        return (this._run.inParagraph === InSequence.First || this._run.inParagraph === InSequence.Only);
    }

    private get _isLastRun(): boolean {
        return (this._run.inParagraph === InSequence.Last || this._run.inParagraph === InSequence.Only);        
    }

    private _pushNewLine(
        txt: string,
        flow: VirtualFlow,
        isFollowing: boolean,
        inRun: InSequence,
        xPadding: number,
        style: Style
    ): void {
        const isLastLine = (inRun === InSequence.Last || inRun === InSequence.Only);
        const isLastRun = (this._run.inParagraph === InSequence.Last || this._run.inParagraph === InSequence.Only);
        const stretched = (style.justification === Justification.both) && !isLastLine;
        this.lines.push({
            text: txt,
            x: flow.getX() + xPadding,
            y: flow.getY(),
            width: flow.getWidth() - xPadding,
            stretched: stretched,
            following: isFollowing,
            color: style.color,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            emphasis: style.emphasis
        });
        if (isLastRun || !isLastLine) {
            flow.advancePosition(this._lineHeight);
        }
    }

    private _fixCaps(txt: string): string {
        if (this._run.style.caps || this._run.style.smallCaps) {
            txt = txt.toLocaleUpperCase();
        }
        return txt;
    }

    private _fixYPosition(isFollowing: boolean, flow: VirtualFlow): void {
        if (!isFollowing) {
            // Text is on baseline, flow is at the top, correcting here.
            flow.advancePosition(FontMetrics.getTopToBaseline(this._run.style));
        }
    }

    private get _isFollowing(): boolean {
        let isFollowing: boolean;
        if (this._run.previousXPos === undefined || this._isFirstRun) {
            isFollowing = false;
        } else {
            isFollowing = true;
        }
        return isFollowing;
    }

    private _getIndentation(inRun: InSequence): number {
        return this._run.style.getIndentation(inRun, this._run.inParagraph);
    }

    private _getAvailableChars(xPadding: number, flow: VirtualFlow): number {
        return FontMetrics.fitCharacters(flow.getWidth() - xPadding, this._run.style);
    }

    /**
     * Does the next word fit reasonably.
     */
    private _fitReasonably(length: number, numAvailableChars: number, nextWord: string | undefined): boolean {
        if (nextWord === undefined) {
            return true;
        }
        const nextLength = length + nextWord.length;
        const numAcceptableChars = numAvailableChars + 1;
        return nextLength <= numAcceptableChars;
    }

    private _getInitialXPadding(): number {
        let xPadding = 0;
        if (this._run.previousXPos === undefined || this._isFirstRun) {
            xPadding = this._getIndentation(InSequence.First);
        } else {
            xPadding = this._run.previousXPos;
        }
        return xPadding;
    }

    private _finalXPadding(currentXPadding: number, flow: VirtualFlow): number {
        if (this._isLastRun) {
            flow.advancePosition(FontMetrics.getBaselineToBottom(this._run.style));
        }
        const lastLineWidth = Metrics.getTextWidth(this.lines[this.lines.length - 1].text, this._run.style);
        return currentXPadding + lastLineWidth;
    }
}