import { IPainter, IRectangle } from "./i-painter.js";
import { Justification } from "../text/par-style.js";
import { Picture } from "../drawing/picture.js";

export class CanvasPainter implements IPainter {
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;
    private _lastText: string = "";
    private _lastX = 0;
    private _lastY = 0;
    private _invisible: HTMLDivElement;

    constructor(content: HTMLElement) {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('id', 'canvas');
        canvas.setAttribute('width', content.clientWidth.toString());
        canvas.setAttribute('height', '500');
        content.appendChild(canvas);
        this._canvas = canvas;
        this._context = canvas.getContext('2d')!;
        this._invisible = document.createElement("div");
        this._invisible.style.visibility = "hidden";
        content.appendChild(this._invisible);
    }
    
    public paintText(x: number, y: number, _width: number, _fitWidth: boolean, text: string, color: string, _justification: Justification, fontFamily: string, fontSize: number, bold: boolean, italic: boolean): void {
        this._context.fillStyle = `#${color}`;
        const italicText = (italic) ? "italic ": "";
        const boldText = (bold) ? "bold ": "";
        const font = italicText + boldText + Math.round(fontSize) + 'px ' + fontFamily;
        this._context.font = font;
        this._context.fillText(text, x, y);
    }
    
    public measureLastText(): IRectangle {
        const metrics = this._context.measureText(this._lastText);
        return {
            x: this._lastX,
            y: this._lastY,
            width: metrics.width,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        }
    }

    public paintLine(x1: number, y1: number, x2: number, y2: number, color: string, thickness: number): void {
        this._context.lineWidth = thickness;
        this._context.strokeStyle = `#${color}`;
        this._context.beginPath();
        this._context.moveTo(x1, y1);
        this._context.lineTo(x2, y2);
        this._context.stroke();
    }

    public paintPicture(x: number, y: number, _width: number, _height: number, pic: Picture): void {
        pic.getImageUrl().then(url => {
            const img = document.createElement("img");
            img.src = url;
            this._invisible.appendChild(img);
            this._context.drawImage(img, x, y);
        })
    }

    public clear(): void {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    public ensureHeight(height: number): void {
        this._canvas.height = height;
    }
}