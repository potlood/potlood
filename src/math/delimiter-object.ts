import { MathObject } from "./math-object";
import { VirtualFlow } from "../utils/virtual-flow";
import { IPainter } from "../painting/i-painter";
import { DelimiterStyle } from "./delimiter-style";
import { Size } from "../utils/geometry/size";
import { CharacterObject } from "./character-object";
import { Style } from "../text/style";

export class DelimiterObject extends MathObject {
    private _begin: MathObject | undefined;
    private _end: MathObject | undefined;
    private _elem: MathObject | undefined;

    constructor(elem: MathObject | undefined, delimiterStyle: DelimiterStyle, style: Style) {
        super();
        this._elem = elem;
        this._begin = new CharacterObject(delimiterStyle.beginChar, style);
        this._end = new CharacterObject(delimiterStyle.endChar, style);
    }

    public getSize(): Size {
        let size = this._elem?.getSize() || new Size(0, 0);
        size.addHorizontal(this._begin?.getSize() || new Size(0, 0));
        size.addHorizontal(this._end?.getSize() || new Size(0, 0));
        return size;
    }
    
    public performLayout(flow: VirtualFlow, xPadding: number): number {
        let padding = xPadding;
        padding = this._begin?.performLayout(flow, padding) || padding;
        padding = this._elem?.performLayout(flow, padding) || padding;
        padding = this._end?.performLayout(flow, padding) || padding;
        return padding;
    }
    
    public render(painter: IPainter): void {
        this._begin?.render(painter);
        this._elem?.render(painter);
        this._end?.render(painter);
    }
}
