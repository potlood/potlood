import { MathObject } from "./math-object.js";
import { IPainter } from "../painting/i-painter.js";
import { VirtualFlow } from "../utils/virtual-flow.js";
import { FractionStyle } from "./fraction-style.js";

export class FractionObject extends MathObject {
    private _numerator: MathObject | undefined;
    private _denumerator: MathObject | undefined;
    public style: FractionStyle;

    constructor(numerator: MathObject | undefined, denumerator: MathObject | undefined, style: FractionStyle) {
        super();
        this._numerator = numerator;
        this._denumerator = denumerator;
        this.style = style;
    }

    public performLayout(flow: VirtualFlow): void {
        this._numerator?.performLayout(flow);
        this._denumerator?.performLayout(flow);
    }
    
    public render(painter: IPainter): void {
        this._numerator?.render(painter);
        this._denumerator?.render(painter);
    }   
}