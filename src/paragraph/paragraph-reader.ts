import { Xml } from "../utils/xml.js";
import { Paragraph, RunInParagraph } from "./paragraph.js";
import { TextRun } from "../text/text-run.js";
import { TextReader } from "../text/text-reader.js";
import { DrawingRun } from "../drawing/drawing-run.js";
import { DocumentX } from "../document-x.js";
import { ParStyle } from "./par-style.js";
import { DrawingReader } from "../drawing/drawing-reader.js";

export class ParagraphReader {
    public static readParagraph(docx: DocumentX, pNode: Node): Paragraph {
        let numberingRun: TextRun | undefined;
        const runs: (TextRun | DrawingRun)[] = [];
        const parStyle = this.readStyle(docx, pNode);
        if (parStyle !== undefined && parStyle._numStyle !== undefined) {
            numberingRun = new TextRun(parStyle._numStyle.getPrefixText(), parStyle._numStyle.style);
        }
        pNode.childNodes.forEach(node => {
            if (node.nodeName === "w:hyperlink") {
                const firstChild = node.firstChild;
                if (firstChild !== null) {
                    node = firstChild;
                }
            }
            if (node.nodeName === "w:r") {
                const drawingNode = Xml.getFirstChildOfName(node, "w:drawing");
                if (drawingNode !== undefined) {
                    const drawing = DrawingReader.readDrawingRun(drawingNode, docx);
                    runs.push(drawing);
                } else {
                    const run = TextReader.readTextRun(node, parStyle, docx.styles);
                    run.inParagraph = RunInParagraph.Normal;
                    runs.push(run);
                }
            }
        });
        const firstRun = runs[0];
        if (runs.length == 1 && firstRun instanceof TextRun) {
            firstRun.inParagraph = RunInParagraph.OnlyRun;
        } else if (runs.length > 0) {
            if (firstRun instanceof TextRun) {
                firstRun.inParagraph = RunInParagraph.FirstRun;
            }
            const lastRun = runs[runs.length - 1];
            if (lastRun instanceof TextRun) {
                lastRun.inParagraph = RunInParagraph.LastRun;
            }
        }
        return new Paragraph(runs, numberingRun);
    }

    private static readStyle(docx: DocumentX, pNode: Node): ParStyle {
        const parPrNode = Xml.getFirstChildOfName(pNode, "w:pPr");
        if (parPrNode !== undefined) {
            const parStyle = ParStyle.fromParPresentationNode(parPrNode);
            parStyle.applyNamedStyles(docx.styles);
            parStyle.applyNumberings(docx.numberings);
            return parStyle;
        }
        return new ParStyle();
    }

}