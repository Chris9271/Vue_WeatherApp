<script setup>
import * as echarts from "echarts/core";
import { watch, onMounted, onUnmounted } from "vue";
import { useWeatherStore } from "@/stores/weatherStore";

const weatherStore = useWeatherStore();

const props = defineProps({
  isShow: {
    type: Boolean,
    required: true,
  },
});

// 儲存圖表的變數
var myChart;

// 設定當日天氣圖表(時間/溫度)
let tempChartData = {};

/**
 * 計算 ECharts yAxis（固定 5 個刻度 + 永遠不切資料）
 * @param rawMin 原始資料最小值
 * @param rawMax 原始資料最大值
 */
function caculateYAxis(rawMin, rawMax) {
  const buffer = 2; // 你可以微調（建議 1~3）
  const desiredSplits = 5; // 固定五個刻度

  // Step 1：先粗略拉寬範圍
  let min = rawMin - buffer;
  let max = rawMax + buffer;

  // console.log("min", min);
  // console.log("max", max);

  // 避免 min == max（差 1 度會常發生）
  if (min === max) max = min + 1;

  // Step 2：計算 interval（並使用整數）
  const interval = Math.ceil((max - min) / (desiredSplits - 1));

  // Step 3：重新計算 max（關鍵：確保一定 >= 原始 rawMax）
  const finalMax = min + interval * (desiredSplits - 1);

  // console.log("finalMax", finalMax);
  // console.log("interval", interval);
  return {
    min,
    max: finalMax,
    interval,
  };
}

const setupChartData = () => {
  // 計算圖表 y 軸最大最小值
  const chartMin = Number(
    Math.min(
      ...weatherStore.hourlyData.map((hourData) =>
        weatherStore.cityDetail.unit === "°C"
          ? hourData.main.temp - 273.15
          : hourData.main.temp
      )
    ).toFixed(0)
  );

  const chartMax = Number(
    Math.max(
      ...weatherStore.hourlyData.map((hourData) =>
        weatherStore.cityDetail.unit === "°C"
          ? hourData.main.temp - 273.15
          : hourData.main.temp
      )
    ).toFixed(0)
  );

  const chartTempData = caculateYAxis(chartMin, chartMax);

  tempChartData = {
    color: ["#ffffff"],
    grid: {
      left: 24, // ✅ 同時把繪圖區往右推
      right: 24, // 右側保留 padding，避免貼邊
      top: 24,
      bottom: 24,
      containLabel: true, // ✅ 讓 label 也被包含在 grid 內計算
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: weatherStore.hourlyData.map((hourData) =>
        new Date(hourData.dt * 1000).toLocaleTimeString("en-us", {
          hour: "2-digit",
          hour12: false,
        })
      ),
      axisLabel: {
        color: "White",
      },
      axisLine: {
        lineStyle: {
          color: "White",
        },
      },
    },
    yAxis: {
      axisLabel: {
        color: "White",
        padding: [0, 5, 0, 0],
      },
      type: "value",
      splitLine: {
        show: false,
      },
      min: chartTempData.min,
      max: chartTempData.max,
      interval: chartTempData.interval,
    },
    series: [
      {
        data: weatherStore.hourlyData.map((hourData) =>
          (weatherStore.cityDetail.unit === "°C"
            ? hourData.main.temp - 273.15
            : hourData.main.temp
          ).toFixed(0)
        ),
        type: "line",
        smooth: true,
        showSymbol: false,
        areaStyle: {},
      },
    ],
  };

  if (props.isShow) {
    myChart = echarts.init(document.getElementById("lineChart"), null);
    myChart.setOption(tempChartData);
  }
};

const handleResize = () => {
  if (myChart && props.isShow) {
    myChart.resize();
  }
};

// 當螢幕寬度為lg以上 或者 每小時天氣資料有變化時，會重新設定圖表
watch(
  () => [weatherStore.hourlyData, props.isShow],
  () => {
    setupChartData();
  }
);

// 視窗大小改變時，調整圖表大小
onMounted(() => {
  window.addEventListener("resize", () => {
    handleResize();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  myChart?.dispose();
});
</script>

<template>
  <div id="lineChart"></div>
</template>

<style lang="scss" scoped>
#lineChart {
  width: 100%;
  height: 350px;
}
</style>
