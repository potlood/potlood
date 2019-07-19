import { Xml } from "../xml.js";
import { RunStyle } from "./run-style.js";
import { ParStyle } from "./par-style.js";
import { Style } from "./style.js";
import { NamedStyles } from "./named-styles.js";
import { Metrics } from "../metrics.js";
import { FlowPosition } from "../flow-position.js";
import { VirtualFlow } from "../virtual-flow.js";
import { RunInParagraph } from "../paragraph.js";
import { IPositionedTextLine } from "./positioned-text-line.js";

export enum LineInRun {
    Normal = 0,
    FirstLine = 1,
    LastLine = 2,
    OnlyLine = 3
}

export class TextRun {
    public text: string;
    public style: Style;
    public inParagraph: RunInParagraph = RunInParagraph.OnlyRun;

    public static fromRunNode(rNode: ChildNode, parStyle: ParStyle | undefined, namedStyles: NamedStyles | undefined): TextRun {
        const run = new TextRun("", new Style());
        const presentationNode = Xml.getFirstChildOfName(rNode, "w:rPr");
        if (presentationNode !== undefined && presentationNode.hasChildNodes()) {
            run.style.runStyle = RunStyle.fromPresentationNode(presentationNode);
        }
        if (parStyle !== undefined) {
            run.style.parStyle = parStyle;
        }
        const textNode = Xml.getFirstChildOfName(rNode, "w:t");
        if (textNode !== undefined) {
            const text = textNode.textContent;
            if (text !== null) {
                run.text = text;
            }
        }
        run.style.applyNamedStyles(namedStyles);
        return run;
    }

    constructor(text: string, style: Style) {
        this.style = style;
        this.text = text;
    }

    public getHeight(width: number): number {
        return this.getLines(width).length * Metrics.getLineSpacing(this.style);
    }

    public getLines(width: number): IPositionedTextLine[] {
        const flow = new VirtualFlow(0, width);
        const pos = new FlowPosition(0);
        return this.getFlowLines(flow, pos, RunInParagraph.OnlyRun);
    }

    public getFlowLines(flow: VirtualFlow, pos: FlowPosition, inParagraph: RunInParagraph): IPositionedTextLine[] {
        let remainder = this.text;
        let lines: IPositionedTextLine[] = [];
        const yDelta = Metrics.getLineSpacing(this.style);
        let inRun = (inParagraph === RunInParagraph.FirstRun || inParagraph === RunInParagraph.OnlyRun) ? LineInRun.FirstLine : LineInRun.Normal;
        while(remainder.length > 0) {
            let usedWidth = 0;
            const line = this.fitText(remainder, this.style, flow.getWidth(pos));
            if (remainder.length === line.length) {
                // Check for last line of run.
                if (inRun == LineInRun.FirstLine) {
                    inRun = LineInRun.OnlyLine;
                } else {
                    inRun = LineInRun.LastLine;
                }
                if (inParagraph !== RunInParagraph.LastRun && inParagraph !== RunInParagraph.OnlyRun) {
                    usedWidth = Metrics.getTextWidth(line, this.style) - this.style.identation;
                }
            }
            lines.push({ text: line, pos: pos.clone(), claim: usedWidth, inRun: inRun});
            if (usedWidth === 0) {
                pos.add(yDelta);
            }
            remainder = remainder.substring(line.length);
            inRun = LineInRun.Normal;
        }
        return lines;
    }

    private stripLastWord(text: string): string | undefined {
        const stop = text.lastIndexOf(' ');
        if (stop < 0) {
            return undefined;
        }
        if (stop === 0) {
            return this.stripLastWord(text.substring(1));
        }
        return text.substring(0, stop);
    }
    
    private fitText(
        text: string,
        style: Style,
        width: number
    ): string {
        let subText = text;
        const identation = style.identation;
        while (Metrics.getTextWidth(subText, style) + identation > width) {
            const stripped = this.stripLastWord(subText);
            if (stripped === undefined) {
                break;
            }
            subText = stripped;
        }
        return subText;
    }    
}