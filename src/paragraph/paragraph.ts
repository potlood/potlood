import { TextRun } from "../text/text-run";
import { ILayoutable } from "../utils/i-layoutable";
import { VirtualFlow } from "../utils/virtual-flow";
import { ParStyle } from "./par-style";
import { FontMetrics } from "../utils/font-metrics";

export enum ParagraphType {
    Text = 0,
    TableCell = 1,
    Drawing = 2
}

export interface IRun extends ILayoutable {
    getUsedWidth(): number;
    getHeight(): number;
    previousXPos: number | undefined;
    lastXPos: number | undefined;
}

export class Paragraph implements ILayoutable {
    private _type: ParagraphType;
    private _runs: IRun[];
    private _numberingRun: TextRun | undefined;

    constructor(runs: IRun[], numberingRun: TextRun | undefined) {
        this._type = ParagraphType.Text;
        this._runs = runs;
        this._numberingRun = numberingRun;
    }

    public get style(): ParStyle {
        let idx = 0;
        while(idx < this._runs.length && !(this._runs[idx] instanceof TextRun)) {
            idx++;
            if (idx == this._runs.length) {
                return new ParStyle();
            }
        }
        const foundRun = this._runs[idx];
        if (foundRun === undefined) {
            return new ParStyle();
        }
        return (foundRun as TextRun).style.parStyle;
    }

    public get runs(): IRun[] {
        return this._runs!;
    }

    public get numberingRun(): TextRun | undefined {
        return this._numberingRun;
    }

    public get type(): ParagraphType {
        return this._type;
    }

    public set type(type: ParagraphType) {
        this._type = type;
        this._runs.forEach(run => {
            if (run instanceof TextRun) {
                run.paragraphType = type;
            }
        })
    }

    public getUsedWidth(availableWidth: number): number {
        let usedWidth = 0;
        const runs = this.runs;
        for(let i = 0; i < runs.length; i++) {
            const runsWidth = runs[i].getUsedWidth();
            if (runsWidth >= availableWidth) {
                usedWidth = availableWidth;
                break;
            }
            usedWidth += runsWidth;
        }
        return Math.min(usedWidth, availableWidth);
    }

    public getHeight(): number {
        const style = this.style;
        let height = (style !== undefined) ? style.spacingAfter + style.spacingBefore : 0;
        this.runs.forEach(run => {
            height += run.getHeight();
        });
        return height;
    }

    public performLayout(flow: VirtualFlow): void {
        flow.mentionParagraphPosition();
        const startY = flow.getY();
        let previousXPos: number | undefined = 0;
        if (this.style !== undefined) {
            flow.advancePosition(this.style.spacingBefore);
        }
        if (this.style.tabStops !== undefined) {
            this.style.tabStops.forEach(stop => {
                stop.performLayout(flow);
                if (stop.isClear) {
                    flow.removeTabStop();
                } else {
                    flow.addTabStop(stop);
                }
            });
        }
        if (this._numberingRun !== undefined) {
            const clonedFlow = flow.clone();
            // Fix bug in TextFitter.
            clonedFlow.advancePosition(-FontMetrics.getTopToBaseline(this._numberingRun.style));
            this._numberingRun.performLayout(clonedFlow);
            previousXPos = this._numberingRun.lastXPos;
        }
        this.runs.forEach(run => {
            run.previousXPos = previousXPos;
            run.performLayout(flow);
            previousXPos = run.lastXPos;
            flow.mentionCharacterPosition(run.lastXPos!);
        });
        if (this.style !== undefined) {
            flow.advancePosition(this.style.spacingAfter);
        }
        const lineSpacing = this._getLineSpacing();
        if (flow.getY() - startY < lineSpacing) {
            flow.advancePosition(lineSpacing);
        }
    }

    private _getLineSpacing(): number {
        return (this.runs[0] instanceof TextRun) ? (this.runs[0] as TextRun).style.lineSpacing : 10;
    }
}