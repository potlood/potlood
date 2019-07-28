import { Xml } from "../xml.js";

export enum TableBorderType {
    none = "none",
    single = "single",
    dashDotStroked = "dashDotStroked",
    dashed = "dashed",
    dashSmallGap = "dashSmallGap",
    dotDash = "dotDash",
    dotDotDash = "dotDotDash",
    dotted = "dotted",
    double = "double",
    doubleWave = "doubleWave",
    inset = "inset",
    nil = "nil",
    outset = "outset",
    thick = "thick",
    thickThinLargeGap = "thickThinLargeGap",
    thickThinMediumGap = "thickThinMediumGap",
    thickThinSmallGap = "thickThinSmallGap",
    thinThickLargeGap = "thinThickLargeGap",
    thinThickMediumGap = "thinThickMediumGap",
    thinThickSmallGap = "thinThickSmallGap",
    thinThickThinLargeGap = "thinThickThinLargeGap",
    thinThickThinMediumGap = "thinThickThinMediumGap",
    thinThickThinSmallGap = "thinThickThinSmallGap",
    threeDEmboss = "threeDEmboss",
    threeDEngrave = "threeDEngrave",
    triple = "triple",
    wave = "wave"
}

export class TableBorder {
    public type: TableBorderType;
    public size: number;
    public spacing: number;
    public color: string;

    public static fromBorderNode(borderNode: ChildNode): TableBorder {
        const border = new TableBorder();
        const val = Xml.getAttribute(borderNode, "w:val");
        if (val !== undefined) {
            border.type = TableBorderType[val as keyof typeof TableBorderType];
        }
        const sz = Xml.getAttribute(borderNode, "w:sz");
        if (sz !== undefined) {
            border.size = parseInt(sz, 10);
        }
        const space = Xml.getAttribute(borderNode, "w:space");
        if (space !== undefined) {
            border.spacing = parseInt(space, 10);
        }
        const color = Xml.getAttribute(borderNode, "w:color");
        if (color !== undefined) {
            border.color = color;
        }
        return border;
    }

    constructor() {
        this.type = TableBorderType.none;
        this.size = 0;
        this.spacing = 0;
        this.color = "000000";
    }
}
