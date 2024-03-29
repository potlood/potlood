import { DocumentX } from "../document-x";
import { Table } from "./table";
import { Xml } from "../utils/xml";
import { Metrics } from "../utils/metrics";
import { TableColumn } from "./table-column";
import { TableRow } from "./table-row";
import { TableStyle } from "./table-style";
import { TableCell } from "./table-cell";
import { ParagraphType } from "../paragraph/paragraph";
import { TableBorder, TableBorderType } from "./table-border";
import { Justification } from "../paragraph/par-style";
import { ParagraphReader } from "../paragraph/paragraph-reader";
import { TableBorderSet } from "./table-border-set";
import { TableMarginSet } from "./table-margin-set";
import { InSequence } from "../utils/in-sequence";

export class TableReader {
    public static readTable(docx: DocumentX, tableNode: ChildNode): Table {
        const table = new Table(docx);
        let rowOrder = InSequence.First;
        tableNode.childNodes.forEach(child => {
            switch(child.nodeName) {
                case "w:tr":
                    const row = this.readTableRow(child, table);
                    row.setOrder(rowOrder);
                    table.rows.push(row);
                    rowOrder = InSequence.Middle;
                    break;
                case "w:tblPr":
                    table.style = this.readTableStyle(child);
                    break;
                case "w:tblGrid":
                    let start = 0;
                    child.childNodes.forEach(col => {
                        if (col.nodeName === "w:gridCol") {
                            const w = Xml.getAttribute(col, "w:w");
                            if (w !== undefined) {
                                const width = Metrics.convertTwipsToPixels(parseInt(w));
                                table.columns.push(new TableColumn(start, width));
                                start += width;
                            }
                        }
                    });
                    break;
                default:
                    console.log(`Don't know how to parse ${child.nodeName} during Table reading.`);
                    break;
            }
        });
        if (table.rows.length === 1) {
            table.rows[0].setOrder(InSequence.Only);
        } else {
            table.rows[table.rows.length - 1].setOrder(InSequence.Last);
        }
        return table;
    }

    private static readTableRow(rowNode: ChildNode, table: Table): TableRow {
        const row = new TableRow(table);
        const rowStyle = new TableStyle();
        rowStyle.higherStyle = table.style;
        let colIndex = 0;
        rowNode.childNodes.forEach(cellNode => {
            if (cellNode.nodeName === "w:tc") {
                const cell = this.readTableCell(cellNode, table, rowStyle, colIndex);
                colIndex += cell.numColumns;
                row.cells.push(cell);
            }
        });
        return row;
    }

    private static readTableCell(cellNode: ChildNode, table: Table, rowStyle: TableStyle, colIndex: number): TableCell {
        const style = new TableStyle();
        const cell = new TableCell(table.columns, style, colIndex);
        cellNode.childNodes.forEach(child => {
            switch(child.nodeName) {
                case "w:p":
                    const par = ParagraphReader.readParagraph(table.docx, child);
                    par.type = ParagraphType.TableCell;
                    cell.pars.push(par);
                    break;
                case "w:tcPr":
                    this.readTableCellPresentation(child, rowStyle, style);
                    break;
                default:
                    console.log(`Don't know how to parse ${child.nodeName} during TableCell reading.`);
                    break;
            }
        });
        const id = Xml.getAttribute(cellNode, "w:id");
        if (id !== undefined) {
            cell.id = id;
        }
        return cell;
    }

    private static readTableCellPresentation(cellPrNode: ChildNode, rowStyle: TableStyle, cellStyle: TableStyle): void {
        cellStyle.higherStyle = rowStyle;
        cellPrNode.childNodes.forEach(child => {
            switch (child.nodeName) {
                case "w:tcW":
                    const w = Xml.getAttribute(child, "w:w");
                    if (w !== undefined) {
                        cellStyle.width = Metrics.convertTwipsToPixels(parseInt(w));
                    }
                    break;
                case "w:gridSpan":
                    const columnSpan = Xml.getStringValue(child);
                    if (columnSpan !== undefined) {
                        cellStyle.columnSpan = parseInt(columnSpan);
                    }
                    break;
                case "w:tcBorders":
                    cellStyle.borders = this.readBorders(child);
                    break;
                case "w:tcMar":
                    cellStyle.margins = this.readCellMargins(child);
                    break;
                case "w:shd":
                    const shading = Xml.getAttribute(child, "w:fill");
                    if (shading !== undefined) {
                        cellStyle.shading = shading;
                    }
                    break;
                case "w:vMerge":
                    let rowSpan = InSequence.Middle;
                    const vMerge = Xml.getStringValue(child);
                    if (vMerge !== undefined && vMerge === "restart") {
                        rowSpan = InSequence.First;
                    }
                    cellStyle.rowSpanOrder = rowSpan;
                    break;
                case "w:vAlign":
                    // TODO: Implement.
                    break;
                default:
                    console.log(`Don't know how to parse ${child.nodeName} during Table Cell Style reading.`);
                    break;
            }
        });
    }

    private static readBorders(bordersNode: ChildNode): TableBorderSet {
        const borders = new TableBorderSet();
        bordersNode.childNodes.forEach(node => {
            const name = node.nodeName;
            switch (name) {
                case "w:left":
                case "w:start":
                    borders.borderStart = this.readTableBorder(node);
                    break;
                case "w:right":
                case "w:end":
                    borders.borderEnd = this.readTableBorder(node);
                    break;
                case "w:top":
                    borders.borderTop = this.readTableBorder(node);
                    break;
                case "w:bottom":
                    borders.borderBottom = this.readTableBorder(node);
                    break;
                case "w:insideH":
                    borders.borderHorizontal = this.readTableBorder(node);
                    break;
                case "w:insideV":
                    borders.borderVertical = this.readTableBorder(node);
                    break;
                default:
                    console.log(`Don't know how to parse ${node.nodeName} during Table Borders reading.`);
                    break;
            }
        });
        return borders;
    }

    private static readCellMargins(cellMarginNode: ChildNode): TableMarginSet {
        const margins = new TableMarginSet();
        cellMarginNode.childNodes.forEach(node => {
            const name = node.nodeName;
            switch (name) {
                case "w:left":
                    const left = Xml.getAttribute(node, "w:w");
                    if (left !== undefined) {
                        margins.cellMarginStart = Metrics.convertTwipsToPixels(parseInt(left));
                    }
                    break;
                case "w:start":
                    const start = Xml.getAttribute(node, "w:w");
                    if (start !== undefined) {
                        margins.cellMarginStart = Metrics.convertTwipsToPixels(parseInt(start));
                    }
                    break;
                case "w:right":
                    const right = Xml.getAttribute(node, "w:w");
                    if (right !== undefined) {
                        margins.cellMarginEnd = Metrics.convertTwipsToPixels(parseInt(right));
                    }
                    break;
                case "w:end":
                    const end = Xml.getAttribute(node, "w:w");
                    if (end !== undefined) {
                        margins.cellMarginEnd = Metrics.convertTwipsToPixels(parseInt(end));
                    }
                    break;
                case "w:top":
                    const top = Xml.getAttribute(node, "w:w");
                    if (top !== undefined) {
                        margins.cellMarginTop = Metrics.convertTwipsToPixels(parseInt(top));
                    }
                    break;
                case "w:bottom":
                    const bottom = Xml.getAttribute(node, "w:w");
                    if (bottom !== undefined) {
                        margins.cellMarginBottom = Metrics.convertTwipsToPixels(parseInt(bottom));
                    }
                    break;
                default:
                    console.log(`Don't know how to parse ${node.nodeName} during Table Cell Margins reading.`);
                    break;
            }
        });
        return margins;
    }

    private static readTableBorder(borderNode: ChildNode): TableBorder {
        // TODO: Handle frame, shadow
        const border = new TableBorder();
        const val = Xml.getAttribute(borderNode, "w:val");
        if (val !== undefined) {
            border.type = this.parseTableBorderType(val);
        }
        const sz = Xml.getAttribute(borderNode, "w:sz");
        if (sz !== undefined) {
            // Border size is in quarter points.
            border.size = Metrics.convertPointToPixels(parseInt(sz, 10) / 4);
        }
        const space = Xml.getAttribute(borderNode, "w:space");
        if (space !== undefined) {
            border.spacing = Metrics.convertTwipsToPixels(parseInt(space, 10));
        }
        const color = Xml.getAttribute(borderNode, "w:color");
        if (color !== undefined) {
            border.color = color;
        }
        return border;
    }

    private static parseTableBorderType(input: string): TableBorderType {
        let borderType = TableBorderType.None;
        switch(input) {
            case "single":
                borderType = TableBorderType.Single;
                break;
            case "dashDotStroked":
                borderType = TableBorderType.DashDotStroked;
                break;
            case "dashed":
                borderType = TableBorderType.Dashed;
                break;
            case "dashSmallGap":
                borderType = TableBorderType.DashSmallGap;
                break;
            case "dotDash":
                borderType = TableBorderType.DotDash;
                break;
            case "dotDotDash":
                borderType = TableBorderType.DotDotDash;
                break;
            case "dotted":
                borderType = TableBorderType.Dotted;
                break;
            case "double":
                borderType = TableBorderType.Double;
                break;
            case "doubleWave":
                borderType = TableBorderType.DoubleWave;
                break;
            case "inset":
                borderType = TableBorderType.Inset;
                break;
            case "outset":
                borderType = TableBorderType.Outset;
                break;
            case "thick":
                borderType = TableBorderType.Thick;
                break;
            case "thickThinLargeGap":
                borderType = TableBorderType.ThickThinLargeGap;
                break;
            case "thickThinMediumGap":
                borderType = TableBorderType.ThickThinMediumGap;
                break;
            case "thickThinSmallGap":
                borderType = TableBorderType.ThickThinSmallGap;
                break;
            case "thinThickLargeGap":
                borderType = TableBorderType.ThinThickLargeGap;
                break;
            case "thinThickMediumGap":
                borderType = TableBorderType.ThinThickMediumGap;
                break;
            case "thinThickSmallGap":
                borderType = TableBorderType.ThinThickSmallGap;
                break;
            case "thinThickThinLargeGap":
                borderType = TableBorderType.ThinThickThinLargeGap;
                break;
            case "thinThickThinMediumGap":
                borderType = TableBorderType.ThinThickThinMediumGap;
                break;
            case "thinThickThinSmallGap":
                borderType = TableBorderType.ThinThickThinSmallGap;
                break;
            case "threeDEmboss":
                borderType = TableBorderType.Emboss3D;
                break;
            case "threeDEngrave":
                borderType = TableBorderType.Engrave3D;
                break;
            case "triple":
                borderType = TableBorderType.Triple;
                break;
            case "wave":
                borderType = TableBorderType.Wave;
                break;
            case "none":
            case "nil":
            default:
                borderType = TableBorderType.None;
                break;
        }
        return borderType;
    }

    private static readTableStyle(tblPrNode: ChildNode): TableStyle {
        const style = new TableStyle();
        tblPrNode.childNodes.forEach(child => {
            switch (child.nodeName) {
                case "w:tblBorders":
                    style.borders = this.readBorders(child);
                    break;
                case "w:tblCellMar":
                    style.margins = this.readCellMargins(child);
                    break;
                case "w:jc":
                    const justification = Xml.getStringValue(child);
                    if (justification !== undefined) {
                        style.justification = Justification[justification as keyof typeof Justification];
                    }
                    break;
                case "w:tblInd":
                    const w = Xml.getAttribute(child, "w:w");
                    if (w !== undefined) {
                        style.identation = Metrics.convertTwipsToPixels(parseInt(w, 10));
                    }
                    break;
                case "w:cellSpacing":
                    const spacing = Xml.getAttribute(child, "w:w");
                    if (spacing !== undefined) {
                        style.cellSpacing = Metrics.convertTwipsToPixels(parseInt(spacing, 10));
                    }
                    break;
                case "w:tblW":
                case "w:tblStyle":
                case "w:tblLook":
                    // Ignore
                    break;
                default:
                    console.log(`Don't know how to parse ${child.nodeName} during Table Style reading.`);
                    break;
            }
        });
        return style;
    }
}