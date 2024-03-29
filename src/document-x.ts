import { XmlPart } from "./package/xml-part";
import { Xml } from "./utils/xml";
import { Paragraph } from "./paragraph/paragraph";
import { NamedStyles } from "./text/named-styles";
import { Section } from "./section";
import { AbstractNumberings } from "./numbering/abstract-numberings";
import { Table } from "./table/table";
import { Relationships } from "./package/relationships";
import { Package } from "./package/package";
import { ILayoutable } from "./utils/i-layoutable";
import { VirtualFlow } from "./utils/virtual-flow";
import { TableReader } from "./table/table-reader";
import { ParagraphReader } from "./paragraph/paragraph-reader";
import { CoreProperties } from "./fields/core-properties";

export class DocumentX implements ILayoutable {
    private part: XmlPart;
    private pars: (Paragraph | Table)[] = [];
    private _section: Section | undefined;
    private _styles: NamedStyles | undefined;
    private _numberings: AbstractNumberings | undefined;
    private _rels: Relationships | undefined;
    private _coreProperties: CoreProperties | undefined;

    public pack: Package;

    constructor(pack: Package, part: XmlPart) {
        this.pack = pack;
        this.part = part;
    }

    public parseContent(): void {
        if (this.pars.length === 0) {
            const doc = Xml.getFirstChildOfName(this.part.document, "w:document");
            if (doc !== undefined) {
                const body = Xml.getFirstChildOfName(doc, "w:body");
                if (body !== undefined) {
                    body.childNodes.forEach(node => {
                        switch(node.nodeName) {
                            case "w:p":
                                this.pars.push(ParagraphReader.readParagraph(this, node));
                                break;
                            case "w:tbl":
                                this.pars.push(TableReader.readTable(this, node));
                                break;
                            case "w:sectPr":
                                this._section = new Section(this, node);
                                break;
                            case "w:sdt":
                                const sdtPars = ParagraphReader.readStructuredDocumentTag(this, node);
                                this.pars.push(...sdtPars);
                                break;
                            default:
                                console.log(`Don't know how to parse ${node.nodeName} during Document reading.`);
                                break;
                        }
                    });
                }
            }
        }
    }

    public performLayout(flow: VirtualFlow): void {
        this.parseContent();
        this.pars.forEach(par => {
            par.performLayout(flow);
        })
    }

    public get relationships(): Relationships | undefined {
        return this._rels;
    }

    public get styles(): NamedStyles | undefined {
        return this._styles;
    }

    public get numberings(): AbstractNumberings | undefined {
        return this._numberings;
    }

    public get coreProperties(): CoreProperties | undefined {
        return this._coreProperties;
    }

    public setRelationships(relationships: Relationships): void {
        this._rels = relationships;
    }

    public setNamedStyles(styles: NamedStyles): void {
        this._styles = styles;
    }

    public setNumberings(numberings: AbstractNumberings): void {
        this._numberings = numberings;
    }

    public setCoreProperties(coreProperties: CoreProperties): void {
        this._coreProperties = coreProperties;
    }

    public get paragraphs(): (Paragraph | Table)[] {
        return this.pars;
    }

    public get section(): Section | undefined {
        return this._section;
    }
}