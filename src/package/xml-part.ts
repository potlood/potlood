export class XmlPart {
    private doc: Document;

    constructor(doc: Document) {
        this.doc = doc;
    }

    public get document(): Document {
        return this.doc;
    }
}