import { IPainter, IRectangle } from "./i-painter.js";
import { Justification } from "../text/par-style.js";
import { Picture } from "../drawing/picture.js";

export class SvgPainter implements IPainter {
    private static readonly svgNS = 'http://www.w3.org/2000/svg';
    private _svg: SVGElement;
    private _lastText: SVGTextElement | undefined;

    constructor(content: HTMLElement) {
        const svg = document.createElementNS(SvgPainter.svgNS, 'svg');
        svg.setAttribute('id', 'svg');
        svg.setAttribute('width', content.clientWidth.toString());
        svg.setAttribute('height', '500');
        content.appendChild(svg);
        this._svg = svg;
    }

    public get svg(): SVGElement {
        return this._svg;
    }

    public paintText(x: number, y: number, width: number, fitWidth: boolean, text: string, color: string, justification: Justification, fontFamily: string, fontSize: number, bold: boolean, italic: boolean) {
        const newText = document.createElementNS(SvgPainter.svgNS, 'text');
        this._setFont(newText, fontFamily, fontSize, bold, italic);
        this._setColor(newText, color);
        this._setHorizontalAlignment(newText, x, width, justification, fitWidth);
        this._setVerticalAlignment(newText, y, fontSize);
        const textNode = document.createTextNode(text);
        newText.appendChild(textNode);
        this._svg.appendChild(newText);
        this._lastText = newText;
    }
    
    public measureLastText(): IRectangle {
        let rect: IRectangle;
        if (this._lastText !== undefined) {
            const box = this._lastText.getBBox();
            rect = {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
            };
        } else {
            rect = {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
        }
        return rect;
    }

    public paintLine(x1: number, y1: number, x2: number, y2: number, color: string, thickness: number): void {
        const line = document.createElementNS(SvgPainter.svgNS, "line");
        line.setAttribute("x1", x1.toString());
        line.setAttribute("y1", y1.toString());
        line.setAttribute("x2", x2.toString());
        line.setAttribute("y2", y2.toString());
        line.setAttribute("stroke", `#${color}`);
        line.setAttribute("stroke-width", thickness.toString());
        this._svg.appendChild(line);
    }

    public paintPicture(x: number, y: number, width: number, height: number, pic: Picture): void {
      if (pic !== undefined) {
        const rect = document.createElementNS(SvgPainter.svgNS, "image");
        rect.setAttribute("x", `${x}`);
        rect.setAttribute("y", `${y}`);
        rect.setAttribute("width", `${width}`);
        rect.setAttribute("height", `${height}`);
        this.svg.appendChild(rect);
        pic.getImageUrl().then(url => {
          rect.setAttribute("xlink:href", `${url}`);
          rect.setAttribute("href", `${url}`);
        }).catch(error => {
          console.log(`ERROR during rendering: ${error}`);
        })
      }      
    }

    private _setFont(textNode: Element, fontFamily: string, fontSize: number, bold: boolean, italic: boolean): void {
        textNode.setAttribute('font-family', fontFamily);
        textNode.setAttribute('font-size', fontSize.toString());
        if (bold) {
          textNode.setAttribute('font-weight', 'bold');
        }
        if (italic) {
          textNode.setAttribute('font-style', 'italic');
        }
      }
    
      private _setColor(textNode: Element, color: string) {
        textNode.setAttribute('fill', `#${color}`);
      }
    
      private _setHorizontalAlignment(textNode: Element, x: number, width: number, justification: Justification, fitWidth: boolean): void {
        switch(justification) {
          case Justification.both:
            textNode.setAttribute('x', x.toString());
            if (fitWidth) {
              textNode.setAttribute('textLength', width.toString());
              textNode.setAttribute('lengthAdjust', 'spacing');
            }
            break;
          case Justification.right:
            const right = x + width;
            textNode.setAttribute('x', right.toString());
            textNode.setAttribute('text-anchor', "end");
            break;
          case Justification.center:
            const center = x + width / 2;
            textNode.setAttribute('x', center.toString());
            textNode.setAttribute('text-anchor', "middle");
            break;
          case Justification.left:
          default:
            textNode.setAttribute('x', x.toString());
            textNode.setAttribute('text-anchor', "start");
            break;
        }
      }
    
      private _setVerticalAlignment(textNode: Element, y: number, fontSize: number): void {
        textNode.setAttribute('y', (y + fontSize / 2).toString());
        textNode.setAttribute('alignment-baseline', 'top');
      }
    
    
}