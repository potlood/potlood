import { ChartSpace } from "./chart-space.js";
import { ChartSeries } from "./chart-series.js";
import { ChartValue } from "./chart-value.js";
import { ChartAxisCrossMode } from "./chart-axis.js";

export abstract class BaseChart {
    public series: ChartSeries[] = [];
    public space: ChartSpace;
    private _rangeMin: number | undefined;
    private _rangeMax: number | undefined;

    constructor(space: ChartSpace) {
        this.space = space;
    }

    public getCounts(): {numCats: number, numValues: number, numSeries: number} {
        return {
            numCats: this.series[0].categories.length,
            numValues: this.series[0].values.length,
            numSeries: this.series.length
        };
    }

    public getValue(catIndex: number, seriesIndex: number): ChartValue {
        return this.series[seriesIndex].values[catIndex];
    }

    public getValueRange(): { max: number, min: number } {
        if (this._rangeMax !== undefined && this._rangeMin !== undefined) {
            return { min: this._rangeMin, max: this._rangeMax };
        }
        let max = Number.MIN_VALUE;
        let min = Number.MAX_VALUE;
        this.series.forEach(series => {
            series.values.forEach(val => {
                const num = val.numeric;
                if (num !== undefined) {
                    max = Math.max(max, num);
                    min = Math.min(min, num);
                }
            });
        });
        const valueAxis = this.space.plotArea.valueAxis;
        if (valueAxis !== undefined && valueAxis.crossMode === ChartAxisCrossMode.AutoZero) {
            min = 0;
        }
        this._rangeMin = min;
        this._rangeMax = max;
        return { max: max, min: min};
    }

    public setValueRange(min: number, max: number): void {
        this._rangeMin = min,
        this._rangeMax = max;
    }

    public getColor(seriesIndex: number): string {
        return this.series[seriesIndex].color;
    }
}