import { ShapeBounds } from "./shape-bounds.js";
import { Picture } from "./picture.js";
import { Xml } from "../xml.js";
import { WordDocument } from "../word-document.js";

export class DrawingRun {
    public bounds: ShapeBounds;
    public picture: Picture | undefined;

    public static fromDrawingNode(drawingNode: ChildNode, doc: WordDocument): DrawingRun {
        let bounds = new ShapeBounds();
        const child = drawingNode.childNodes[0];
        if (child.nodeName === "wp:anchor") {
            bounds = ShapeBounds.fromAnchorNode(child);
        }
        const drawing = new DrawingRun(bounds);
        const graphic = Xml.getFirstChildOfName(child, "a:graphic");
        if (graphic !== undefined) {
            const graphicData = Xml.getFirstChildOfName(graphic, "a:graphicData");
            if (graphicData !== undefined) {
                const picNode = Xml.getFirstChildOfName(graphicData, "pic:pic");
                if (picNode !== undefined) {
                    drawing.picture = Picture.fromPicNode(picNode, doc);
                }
            }
        }
        return drawing;
    }

    constructor(bounds: ShapeBounds) {
        this.bounds = bounds;
    }

    public getHeight(_width: number): number {
        return this.bounds.boundSizeY;
    }
}