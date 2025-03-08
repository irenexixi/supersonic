import { CHART_SECONDARY_COLOR, CLS_PREFIX, THEME_COLOR_LIST } from '../../../common/constants';
import {
  formatByDecimalPlaces,
  getFormattedValue,
  getMinMaxDate,
  groupByColumn,
  normalizeTrendData,
} from '../../../utils/utils';
import type { ECharts } from 'echarts';
import * as echarts from 'echarts';
import React, { useContext, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { ColumnType } from '../../../common/type';
import NoPermissionChart from '../NoPermissionChart';
import classNames from 'classnames';
import { isArray } from 'lodash';
import { useExportByEcharts } from '../../../hooks';
import { ChartItemContext } from '../../ChatItem';

type Props = {
  model?: string;
  dateColumnName: string;
  categoryColumnName: string;
  metricField: ColumnType;
  resultList: any[];
  triggerResize?: boolean;
  onApplyAuth?: (model: string) => void;
  chartType?: string;
};

const MetricTrendChart: React.FC<Props> = ({
  model,
  dateColumnName,
  categoryColumnName,
  metricField,
  resultList,
  triggerResize,
  onApplyAuth,
  chartType,
}) => {
  const chartRef = useRef<any>();
  const instanceRef = useRef<ECharts>();

  const renderChart = () => {
    let instanceObj: any;
    if (!instanceRef.current) {
      instanceObj = echarts.init(chartRef.current);
      instanceRef.current = instanceObj;
    } else {
      instanceObj = instanceRef.current;
      instanceObj.clear();
    }

    const valueColumnName = metricField.bizName;
    const dataSource = resultList.map((item: any) => {
      return {
        ...item,
        [dateColumnName]: Array.isArray(item[dateColumnName])
          ? moment(item[dateColumnName].join('')).format('MM-DD')
          : item[dateColumnName],
      };
    });

    const groupDataValue = groupByColumn(dataSource, categoryColumnName);
    const [startDate, endDate] = getMinMaxDate(dataSource, dateColumnName);
    const groupData = Object.keys(groupDataValue).reduce((result: any, key) => {
      result[key] =
        startDate &&
        endDate &&
        (dateColumnName.includes('date') || dateColumnName.includes('month'))
          ? normalizeTrendData(
              groupDataValue[key],
              dateColumnName,
              valueColumnName,
              startDate,
              endDate,
              dateColumnName.includes('month') ? 'months' : 'days'
            )
          : groupDataValue[key];
      return result;
    }, {});

    const sortedGroupKeys = Object.keys(groupData).sort((a, b) => {
      return (
        groupData[b][groupData[b].length - 1][valueColumnName] -
        groupData[a][groupData[a].length - 1][valueColumnName]
      );
    });

    const xData = groupData[sortedGroupKeys[0]]?.map((item: any) => {
      const date = isArray(item[dateColumnName])
        ? item[dateColumnName].join('-')
        : `${item[dateColumnName]}`;
      return date.length === 10 ? moment(date).format('MM-DD') : date;
    });

    instanceObj.setOption({
      legend: categoryColumnName && {
        left: 0,
        top: 0,
        icon: 'rect',
        itemWidth: 15,
        itemHeight: 5,
        type: 'scroll',
      },
      xAxis: {
        type: 'category',
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: CHART_SECONDARY_COLOR,
          },
        },
        axisLine: {
          lineStyle: {
            color: CHART_SECONDARY_COLOR,
          },
        },
        axisLabel: {
          showMaxLabel: true,
          color: '#999',
        },
        data: xData,
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            opacity: 0.3,
          },
        },
        axisLabel: {
          formatter: function (value: any) {
            return value === 0
              ? 0
              : metricField.dataFormatType === 'percent'
              ? `${formatByDecimalPlaces(value, metricField.dataFormat?.decimalPlaces || 2)}%`
              : getFormattedValue(value);
          },
        },
      },
      tooltip: {
        trigger: 'axis',
        position: function (point, params, dom, rect, size) {
          const tooltipWidth = size.contentSize[0];
          const viewportWidth = window.innerWidth;
          let x = point[0];
          // 水平方向判断
          if (point[0]+46 - tooltipWidth < 0) {
              // 左边超出视口，尝试放右边
              const rightPos = point[0]+46 + tooltipWidth;
              if (rightPos > viewportWidth) {
                  // 右边也超出视口，试着贴着右边视口的
                  x = point[0]+46 - tooltipWidth;
              } else {
                  x = point[0] + 10;
              }
          } else if (point[0]+46 + tooltipWidth > viewportWidth) {
              // 右边超出视口，尝试放左边
              const leftPos = point[0]+46 - tooltipWidth;
              if (leftPos < 0) {
                  // 左边也超出视口，试着贴着左边视口的
                  x = 46;
              } else {
                  x = point[0] - tooltipWidth - 10;
              }
          }
          return [x, point[1]];
        },
        formatter: function (params: any[]) {
          const param = params[0];
          const valueLabels = params
            .sort((a, b) => b.value - a.value)
            .map(
              (item: any) =>
                `<div style="margin-top: 3px;">${
                  item.marker
                } <span style="display: inline-block; width: 70px; margin-right: 12px;">${
                  item.seriesName
                }</span><span style="display: inline-block; width: 90px; text-align: right; font-weight: 500;">${
                  item.value === ''
                    ? '-'
                    : metricField.dataFormatType === 'percent' ||
                      metricField.dataFormatType === 'decimal'
                    ? `${formatByDecimalPlaces(
                        item.value,
                        metricField.dataFormat?.decimalPlaces || 2
                      )}${metricField.dataFormatType === 'percent' ? '%' : ''}`
                    : getFormattedValue(item.value)
                }</span></div>`
            )
            .join('');
          return `${param.name}<br />${valueLabels}`;
        },
      },
      grid: {
        left: '1%',
        right: '4%',
        bottom: '3%',
        top: categoryColumnName ? 45 : 20,
        containLabel: true,
      },
      series: sortedGroupKeys.slice(0, 20).map((category, index) => {
        const data = groupData[category];
        return {
          type: chartType,
          name: categoryColumnName ? category : metricField.name,
          symbol: 'circle',
          showSymbol: data.length === 1,
          smooth: true,
          data: data.map((item: any) => {
            const value = item[valueColumnName];
            return (metricField.dataFormatType === 'percent' ||
              metricField.dataFormatType === 'decimal') &&
              metricField.dataFormat?.needMultiply100
              ? value * 100
              : value;
          }),
          color: THEME_COLOR_LIST[index],
        };
      }),
    });
    instanceObj.resize();
  };

  const { downloadChartAsImage } = useExportByEcharts({
    instanceRef,
    question: metricField.name,
  });

  const { register } = useContext(ChartItemContext);

  register('downloadChartAsImage', downloadChartAsImage);

  useEffect(() => {
    if (metricField.authorized) {
      renderChart();
    }
  }, [resultList, metricField, chartType]);

  useEffect(() => {
    if (triggerResize && instanceRef.current) {
      instanceRef.current.resize();
    }
  }, [triggerResize]);

  const prefixCls = `${CLS_PREFIX}-metric-trend`;

  const flowTrendChartClass = classNames(`${prefixCls}-flow-trend-chart`, {
    [`${prefixCls}-flow-trend-chart-single`]: !categoryColumnName,
  });

  return (
    <div>
      {!metricField.authorized ? (
        <NoPermissionChart model={model || ''} onApplyAuth={onApplyAuth} />
      ) : (
        <div className={flowTrendChartClass} ref={chartRef} />
      )}
    </div>
  );
};

export default MetricTrendChart;
