import { VirtualFlow } from "../utils/virtual-flow";
import { IPainter } from "../painting/i-painter";
import { Size } from "../utils/geometry/size";

export abstract class MathObject {

    public abstract getSize(): Size;

    public abstract performLayout(flow: VirtualFlow, xPadding: number): number;

    public abstract render(painter: IPainter): void;
}

export class MathObjectList extends MathObject {
    private _list: MathObject[] = [];

    public add(obj: MathObject): void {
        this._list.push(obj);
    } 

    public unshift(obj: MathObject): void {
        this._list.unshift(obj);
    }

    public get(index: number): MathObject {
        return this._list[index];
    }

    public get length(): number {
        return this._list.length;
    }

    public forEach(func: (obj: MathObject) => any): any {
        return this._list.forEach(func);
    }

    public getSize(): Size {
        let size = new Size(0, 0);
        this._list.forEach(obj => {
            size = size.addHorizontal(obj.getSize());
        });
        return size;
    }

    public performLayout(flow: VirtualFlow, xPadding: number): number {
        let padding = xPadding;
        this._list.forEach(obj => padding = obj.performLayout(flow, padding));
        return padding;
    }
    
    public render(painter: IPainter): void {
        this._list.forEach(obj => obj.render(painter));
    }
}
