import { DocumentX } from '../document-x';
import { VirtualFlow } from '../utils/virtual-flow';
import { Paragraph } from '../paragraph/paragraph';
import { SvgPainter } from './svg-painter';
import { TableRenderer } from '../table/table-renderer';
import { ParagraphRenderer } from '../paragraph/paragraph-renderer';

export class Renderer {
    private _painter: SvgPainter;
    private _paragraphRenderer: ParagraphRenderer;
    private _tableRenderer: TableRenderer;

    constructor(content: HTMLElement) {
        this._painter = new SvgPainter(content);
        this._paragraphRenderer = new ParagraphRenderer(this._painter);
        this._tableRenderer = new TableRenderer(this._painter, this._paragraphRenderer);
    }

    public renderDocument(docx: DocumentX): number {
        const flow = VirtualFlow.fromSection(docx.section);
        if (docx.section !== undefined && docx.section.pageWidth !== undefined) {
            this._painter.setWidth(docx.section!.pageWidth);
        }
        docx.paragraphs.forEach(parOrTable => {
            parOrTable.performLayout(flow);
        });
        docx.paragraphs.forEach(parOrTable => {
            if (parOrTable instanceof Paragraph) {
                this._paragraphRenderer.renderParagraph(parOrTable);
            } else {
                this._tableRenderer.renderTable(parOrTable);
            }
        });
        return flow.getMaxY(true);
    }

    public clear() {
        this._painter.clear();
    }

    public ensureHeight(newHeight: number): void {
        this._painter.ensureHeight(newHeight);
    }
}
