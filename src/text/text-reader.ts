import { Xml } from "../utils/xml";
import { Style } from "./style";
import { TextRun } from "./text-run";
import { RunStyle } from "./run-style";
import { ParStyle } from "../paragraph/par-style";
import { NamedStyles } from "./named-styles";

export class TextReader {
    public static readTextRun(runNode: ChildNode, parStyle: ParStyle | undefined, namedStyles: NamedStyles | undefined): TextRun {
        const run = new TextRun([], new Style());
        const presentationNode = Xml.getFirstChildOfName(runNode, "w:rPr");
        if (presentationNode !== undefined && presentationNode.hasChildNodes()) {
            run.style.runStyle = RunStyle.fromPresentationNode(presentationNode);
        }
        if (parStyle !== undefined) {
            run.style.parStyle = parStyle;
        }
        run.texts = TextReader._getTexts(runNode);
        run.style.applyNamedStyles(namedStyles);
        return run;
    }

    private static _getTexts(runNode: ChildNode): string[] {
        const texts: string[] = [];
        if (runNode.hasChildNodes()) {
            runNode.childNodes.forEach((node) => {
                switch(node.nodeName) {
                    case "w:t":
                        const content = node.textContent;
                        if (content !== null) {
                            texts.push(content);
                        }
                        break;
                    case "w:br":
                    case "w:cr":
                        texts.push("\n");
                        break;
                    case "w:tab":
                        texts.push("\t");
                        break;
                    default:
                        // Ignore all other nodes
                        break;
                }
            });
        }
        return texts;
    }
}