import { Xml } from "../utils/xml.js";
import { BarChart } from "./bar-chart.js";
import { Part } from "../package/part.js";

export class ChartSpace {
    private _promises: Promise<void>[] = [];
    private _barChart: BarChart | undefined = undefined;

    public static fromPart(promise: Promise<Part>): ChartSpace {
        const space = new ChartSpace();
        space._promises.push(
            new Promise<void>((resolve, reject) => {
                promise.then(part => {
                    ChartSpace.fromDocument(part.document);
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            })
        );
        return space;
    }

    public static fromDocument(doc: XMLDocument, space?: ChartSpace): ChartSpace {
        const chartSpaceNode = doc.getRootNode().firstChild;
        if (chartSpaceNode !== null) {
            return ChartSpace.fromNode(chartSpaceNode, space);
        } else {
            console.log('Failed to find chart');
            return new ChartSpace();
        }
    }

    public static fromNode(chartSpaceNode: Node, space?: ChartSpace): ChartSpace {
        if (space === undefined) {
            space = new ChartSpace();
        }
        const chartNode = Xml.getFirstChildOfName(chartSpaceNode, "c:chart");
        if (chartNode !== undefined) {
            const plotAreaNode = Xml.getFirstChildOfName(chartNode, "c:plotArea");
            if (plotAreaNode !== undefined) {
                const barChartNode = Xml.getFirstChildOfName(plotAreaNode, "c:barChart");
                if (barChartNode !== undefined) {
                    space._barChart = BarChart.fromNode(barChartNode);
                }
            }
        }
        return space;
    }

    public async ensureLoaded(): Promise<void> {
        await Promise.all(this._promises);
    }

    public get barChart(): BarChart | undefined {
        return this._barChart;
    }
}