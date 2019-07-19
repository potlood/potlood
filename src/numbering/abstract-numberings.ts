import { Part } from "../package/part.js";
import { Numbering } from "./numbering.js";
import { Xml } from "../xml.js";
import { NamedStyles } from "../text/named-styles.js";

export class AbstractNumberings {

    private doc: Document;
    private _numberings: Numbering[] = [];

    constructor(part: Part) {
        this.doc = part.document;
    }

    public parseContent(styles: NamedStyles | undefined): void {
        if (this._numberings.length === 0) {
            const root = Xml.getFirstChildOfName(this.doc, "w:numbering");
            if (root !== undefined) {
                const abstractNumberings: Numbering[] = [];
                Xml.getChildrenOfName(root, "w:abstractNum").forEach(node => {
                    const abstractNumId = Xml.getAttribute(node, "w:abstractNumId");
                    if (abstractNumId !== undefined) {
                        const numbering = Numbering.fromAbstractNumNode(styles, node);
                        abstractNumberings[parseInt(abstractNumId)] = numbering;
                    }
                });
                Xml.getChildrenOfName(root, "w:num").forEach(numNode => {
                    const numId = Xml.getAttribute(numNode, "w:numId");
                    const abstractNumId = Xml.getNumberValueFromNode(numNode, "w:abstractNumId");
                    if (numId !== undefined && abstractNumId !== undefined) {
                        this._numberings[parseInt(numId)] = abstractNumberings[abstractNumId];
                    }
                });
            }
        }
    }

    public getNumberingById(numId: number): Numbering {
        return this._numberings[numId];
    }
}