import Visualization from 'zeppelin-vis'
import ColumnselectorTransformation from 'zeppelin-tabledata/columnselector'

import Highcharts from 'highcharts/highcharts'
require('highcharts/modules/heatmap')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);


export default class HeatmapChart extends Visualization {
    constructor(targetEl, config) {
        super(targetEl, config)

        this.columnSelectorProps = [
            { name: 'xAxis', },
            { name: 'yAxis', },
            { name: 'colorAxis', },
        ]

        this.transformation = new ColumnselectorTransformation(
            config, this.columnSelectorProps)
    }

    /**
     * @param tableData {Object} includes cols and rows. For example,
     *                           `{columns: Array[2], rows: Array[11], comment: ""}`
     *
     * Each column includes `aggr`, `index`, `name` fields.
     *  For example, `{ aggr: "sum", index: 0, name: "age"}`
     *
     * Each row is an array including values.
     *  For example, `["19", "4"]`
     */
    render(tableData) {
        const conf = this.config

        /** heatmap can be rendered when all 3 axises are defined */
        if (!conf.xAxis || !conf.yAxis || !conf.colorAxis) {
            return
        }

        const rows = tableData.rows

        const xAxisIndex = conf.xAxis.index
        const yAxisIndex = conf.yAxis.index
        const colorAxisIndex = conf.colorAxis.index

        const { xAxisCategories, yAxisCategories, } =
            extractCategories(xAxisIndex, yAxisIndex, rows)
        const data = createDataStructure(
            xAxisIndex, xAxisCategories, yAxisIndex, yAxisCategories, colorAxisIndex, rows)

        const chartOption = createHighchartOption(xAxisCategories, yAxisCategories, data);
        Highcharts.chart(this.targetEl[0].id, chartOption);
    }

    getTransformation() {
        return this.transformation
    }
}

/**
 * Highcharts Heatmap requires categories.
 * Thus, this function creates x and y categories while iterating Zeppelin tabledata.rows
 *
 * @return {Object} which including
 * - `xAxisCategories` {Array}
 * - `yAxisCategories` {Array}
 *
 * See also: http://jsfiddle.net/gh/get/jquery/3.1.1/highslide-software/highcharts.com/tree/master/samples/highcharts/demo/heatmap/
 */
export function extractCategories(xAxisIdx, yAxisIdx, rows) {
    const xAxisCategories = {};
    const yAxisCategories = {};

    for(let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const xAxisCategory = row[xAxisIdx]
        if (!xAxisCategories[xAxisCategories]) {
            xAxisCategories[xAxisCategory] = true;
        }

        const yAxisCategory = row[yAxisIdx]
        if (!yAxisCategories[yAxisCategories]) {
            yAxisCategories[yAxisCategory] = true;
        }
    }

    return {
        xAxisCategories: Object.keys(xAxisCategories),
        yAxisCategories: Object.keys(yAxisCategories),
    }
}

/**
 * creates heatmap data structure by converting Zeppelin tabledata.rows
 * using x and y axises categories
 *
 * @param xAxisIndex {number}
 * @param xAxisCategories {Array}
 * @param yAxisIndex {number}
 * @param yAxisCategories {Array}
 * @param colorAxisIndex {number}
 * @param rows {Array<Array>}
 * @return {Array<Array<number>>}
 * See also: http://jsfiddle.net/gh/get/jquery/3.1.1/highslide-software/highcharts.com/tree/master/samples/highcharts/demo/heatmap/
 */
export function createDataStructure(xAxisIndex, xAxisCategories,
                                    yAxisIndex, yAxisCategories,
                                    colorAxisIndex, rows) {
    const data = []
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const xAxisValue = row[xAxisIndex]
        const xAxisValueIndex = xAxisCategories.indexOf(xAxisValue);

        const yAxisValue = row[yAxisIndex]
        const yAxisValueIndex = yAxisCategories.indexOf(yAxisValue);

        let colorAxisValue = parseFloat(row[colorAxisIndex]);

        const heatmapRow = [xAxisValueIndex, yAxisValueIndex, colorAxisValue];
        data.push(heatmapRow);
    }

    return data
}

export function createHighchartOption(xAxisCategories, yAxisCategories, data) {
    return {
        chart: {
            type: 'heatmap',
            marginTop: 40,
            marginBottom: 80,
            plotBorderWidth: 1
        },

        title: { text: '' },
        xAxis: { categories: xAxisCategories, },
        yAxis: { categories: yAxisCategories, title: null, },

        colorAxis: {
            min: 0,
            minColor: '#FFFFFF',
            maxColor: Highcharts.getOptions().colors[0]
        },

        legend: {
            align: 'right',
            layout: 'vertical',
            margin: 0,
            verticalAlign: 'top',
            y: 25,
            symbolHeight: 280,
        },

        tooltip: {
            formatter: function () {
                return '<b>' + this.series.xAxis.categories[this.point.x] + '</b> / <b>' +
                    this.point.value + '</b> / <b>' + this.series.yAxis.categories[this.point.y] + '</b>';
            }
        },

        series: [{
            name: '',
            borderWidth: 1,
            data: data,
            dataLabels: {
                enabled: true,
                color: '#000000'
            }
        }]
    }
}
