import { NamedStyles } from "./named-styles.js";
import { ParStyle, Justification } from "./par-style.js";
import { RunStyle, UnderlineMode } from "./run-style.js";
import { Xml } from "../xml.js";

export class Style {
    private _basedOn: Style | undefined;
    private _basedOnId: string | undefined;

    public runStyle: RunStyle | undefined;
    public parStyle: ParStyle | undefined;

    public static fromStyleNode(styleNode: ChildNode): Style {
        const style = new Style();
        style._basedOnId = Xml.getStringValueFromNode(styleNode, "w:basedOn");
        const parNode = Xml.getFirstChildOfName(styleNode, "w:pPr");
        if (parNode !== undefined) {
            style.parStyle = ParStyle.fromParPresentationNode(parNode);
        }
        const runNode = Xml.getFirstChildOfName(styleNode, "w:rPr");
        if (runNode !== undefined) {
            style.runStyle = RunStyle.fromPresentationNode(runNode);
        }
        return style;
    }

    public applyNamedStyles(namedStyles: NamedStyles | undefined): void {
        if (this._basedOnId !== undefined && namedStyles !== undefined) {
            const baseStyle = namedStyles.getNamedStyle(this._basedOnId);
            if (baseStyle !== undefined) {
                this._basedOn = baseStyle;
            }
        }
        if (this.runStyle !== undefined) {
            this.runStyle.applyNamedStyles(namedStyles);
        }
        if (this.parStyle !== undefined) {
            this.parStyle.applyNamedStyles(namedStyles);
        }
    }

    public get italic(): boolean {
        return this.getValue(false, undefined, (runStyle) => runStyle._italic);
    }

    public get bold(): boolean {
        return this.getValue(false, undefined, (runStyle) => runStyle._bold);
    }

    public get underlineMode(): UnderlineMode {
        return this.getValue(UnderlineMode.none, undefined, (runStyle) => runStyle._underlineMode);
    }

    public get strike(): boolean {
        return this.getValue(false, undefined, (runStyle) => runStyle._strike);
    }

    public get doubleStrike(): boolean {
        return this.getValue(false, undefined, (runStyle) => runStyle._dstrike);
    }

    public get fontFamily(): string {
        return this.getValue("Arial", undefined, (runStyle) => runStyle._fontFamily);
    }

    public get fontSize(): number {
        return this.getValue(12, undefined, (runStyle) => runStyle._fontSize);
    }

    public get spacing(): number {
        return this.getValue(0, (parStyle) => parStyle._spacing, (runStyle) => runStyle._spacing);
    }

    public get hanging(): number {
        return this.getValue(0, (parStyle) => parStyle._hanging, undefined);
    }

    public get identation(): number {
        return this.getValue(0, (parStyle) => parStyle._identation, undefined);
    }

    public get caps(): boolean {
        return this.getValue(false, undefined, (runStyle) => runStyle._caps);
    }

    public get smallCaps(): boolean {
        return this.getValue(false, undefined, (runStyle) => runStyle._smallCaps);
    }

    public get color(): string {
        return this.getValue("000000", undefined, (runStyle) => runStyle._color);
    }

    public get justification(): Justification {
        return this.getValue(Justification.left, (parStyle) => parStyle._justification, undefined);
    }

    public get font(): string {
        return this.fontSize.toString() + " px "+ this.fontFamily;
    }

    public toString(): string {
        const base = (this._basedOnId !== undefined) ? `base=${this._basedOnId}` : "";
        const just = `jc=${this.justification.toString()}`;
        const ind = `ind=${this.identation.toString()}`;
        const i = `i=${this.italic}`;
        const b = `b=${this.bold.toString()}`;
        const u = `u=${this.underlineMode.toString()}`;
        const strike = `strike=${this.strike.toString()}`;
        const font = `font=${this.fontFamily.toString()}`;
        const size = `size=${this.fontSize.toString()}`;
        const dstrike = `dstrike=${this.doubleStrike.toString()}`;
        const spacing = `spacing=${this.spacing.toString()}`;
        const color = `color=${this.color.toString()}`;
        const caps = `caps=${this.caps.toString()}`;
        const smallcaps = `smallcaps=${this.smallCaps.toString()}`;
        return `Style: ${base} ${just} ${ind} ${i} ${b} ${u} ${strike} ${font} ${size} ${dstrike} ${spacing} ${color} ${caps} ${smallcaps}`;
    }

    private getValue<T>(initial: T, parCb?: (parStyle: ParStyle) => T | undefined, runCb?: (runStyle: RunStyle) => T | undefined): T {
        let val = this.getRecursive(parCb, runCb);
        // If still not defined, assign the initial value.
        if (val === undefined) {
            val = initial;
        }
        return val;
    }

    private getRecursive<T>(parCb?: (parStyle: ParStyle) => T | undefined, runCb?: (runStyle: RunStyle) => T | undefined): T | undefined {
        let val: T | undefined = undefined;
        // First look at local RUN presentation.
        if (this.runStyle !== undefined) {
            if (runCb !== undefined) {
                const localRun = runCb(this.runStyle);
                if (localRun !== undefined) {
                    val = localRun;
                }
            }
            if (val === undefined && this.runStyle._basedOn !== undefined) {
                // Secondly look at the base styles of the RUN style.
                val = this.runStyle._basedOn.getRecursive<T>(parCb, runCb);
            }
    }
        // Thirdly look at local PARAGRAPH presentation.
        if (val === undefined) {
            if (this.parStyle !== undefined) {
                if (parCb !== undefined) {
                    const localPar = parCb(this.parStyle);
                    if (localPar !== undefined) {
                        val = localPar;
                    }
                }
                if (val === undefined && this.parStyle._numStyle !== undefined) {
                    // Fourthly look at the base styles of the PARAGRAPH style.
                    const numStyle = this.parStyle._numStyle.style;
                    if (numStyle !== undefined) {
                        val = this.parStyle._numStyle.style.getRecursive<T>(parCb, runCb);
                    }
                }
                if (val === undefined && this.parStyle._basedOn !== undefined) {
                    // Fifthly look at the base styles of the PARAGRAPH style.
                    val = this.parStyle._basedOn.getRecursive<T>(parCb, runCb);
                }
            }
        }
        // Sixthly look at the Style where this style is based upon.
        if (val === undefined) {
            const basedOn = this._basedOn;
            if (basedOn !== undefined) {
                val = basedOn.getRecursive<T>(parCb, runCb);
            }
        }
        return val;
    }
}