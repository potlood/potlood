import { ChartAxis } from "./chart-axis";
import { ChartStyle } from "./chart-style";
import { Box } from "../utils/geometry/box";
import { ChartSpace } from "./chart-space";

export class ChartPlotArea {
    public space: ChartSpace;
    public style = new ChartStyle();
    public valueAxis: ChartAxis | undefined;
    public categoryAxis: ChartAxis | undefined;
    public bounds: Box = new Box(0, 0, 0, 0);

    constructor(space: ChartSpace) {
        this.space = space;
    }

    public determineRange(): void {
        if (this.valueAxis !== undefined && this.space.chart.series[0].hasNumericValues) {
            const valueRange = this.space.chart.getValueRange();
            valueRange.max = Math.ceil(1.2 * valueRange.max);
            this.space.chart.setValueRange(valueRange.min, valueRange.max);
        }
    }
}