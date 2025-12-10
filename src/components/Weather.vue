<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from "echarts/core";
import DailyWeather from "./DailyWeather.vue";
import { useAppStore } from "@/stores/appStore";

const appStore = useAppStore();

// 預設城市(之後改抓使用者所在地?)
const defaultCity = ref("Taipei");

// 使用者輸入城市
const inputFieldCity = ref({
  cityName: null,
  stateCode: "",
  countryCode: "",
});

// 城市經緯度、國碼、城市名稱、日期
const cityDetail = ref({
  lat: "",
  lon: "",
  countryCode: "",
  stateCode: "",
  cityName: "",
  date: null,
  temperature: null,
  unit: "°C",
});

// 有多個相同城市名稱時，存放選擇的城市列表(下拉選單顯示)
const inputDropdownList = ref([]);

// 存放城市未來天氣資料陣列
const futureCityWeatherList = ref([]);

// 城市背景圖片網址
const cityPictureUrl =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

// 存放多城市資料陣列(原始資料)
let cityArr = [];

// 當前時間(dt)
let currentTimeDt = null;

// 設定當日天氣圖表(時間/溫度)
let tempChartData = {};

// 多城市下拉選單中選擇其中一個，並設定state/country代碼(透過下拉選單索引值)
const handleSelectedOption = (index) => {
  inputFieldCity.value = {
    cityName: cityArr[index].name,
    stateCode: cityArr[index]?.state || "",
    countryCode: cityArr[index]?.country || "",
  };

  // console.log(inputFieldCity.value);

  getCityWithStateCountry();
};

// 取得城市經緯度(非多個相同城市)
const getCityLatLon = async () => {
  try {
    // const result =
    //   await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${
    //     inputFieldCity.value.cityName || defaultCity.value
    //   }&limit=10&appid=${import.meta.env.VITE_WEATHER_API_KEY}
    // `);
    // const result = await axios.get("/api/weather", {
    //   params: {
    //     q: inputFieldCity.value.cityName || defaultCity.value,
    //   },
    // });

    const result = await axios.get("/api/weather", {
      params: {
        q: inputFieldCity.value.cityName || defaultCity.value,
      },
    });

    console.log(result.data);

    // 過濾出符合使用者輸入或預設城市名稱的資料
    // cityArr = result.data.filter(
    //   (city) =>
    //     city.name.includes(inputFieldCity.value.cityName) ||
    //     city.name === defaultCity.value
    // );

    // // 有些城市名稱會有重複，API會回傳多筆資料，要顯示下拉選單讓使用者選擇
    // if (cityArr.length > 1) {
    //   inputDropdownList.value = cityArr.map(
    //     (city) => `${city.name} ${city?.state || ""} ${city?.country || ""}`
    //   );
    // } else {
    //   // 取得並設定程式經緯度、國碼、城市名稱
    //   const { lat, lon, country, state, name } = result.data[0];
    //   cityDetail.value = {
    //     ...cityDetail.value,
    //     lat,
    //     lon,
    //     countryCode: country,
    //     cityName: name,
    //     stateCode: state || "",
    //   };

    //   // 取得城市天氣資料
    //   getCityWeather();

    //   // 取得當日每小時天氣資料
    //   getHourlyWeather();

    //   // 取得未來天氣資料
    //   getFutureWeather();
    // }
  } catch (err) {
    console.error(err);
  }
};

// 取得多城市state/country代碼的經緯度
const getCityWithStateCountry = async () => {
  let cityStateCountryString = `${inputFieldCity?.value?.cityName},${inputFieldCity?.value?.stateCode},${inputFieldCity?.value?.countryCode}`;
  try {
    const result =
      await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${cityStateCountryString}&limit=5&appid=${
        import.meta.env.VITE_WEATHER_API_KEY
      }
    `);

    // 取得並設定程式經緯度、國碼、城市名稱
    const { lat, lon, country, state, name } = result?.data[0];
    cityDetail.value = {
      ...cityDetail.value,
      lat,
      lon,
      countryCode: country,
      cityName: name,
      stateCode: state || "",
    };

    // 取得城市天氣資料
    getCityWeather();

    // 取得當日每小時天氣資料
    getHourlyWeather();

    // 取得未來天氣資料
    getFutureWeather();
  } catch (err) {
    console.error(err);
    return;
  }
};

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

// 取得城市天氣資料
const getCityWeather = async () => {
  try {
    appStore.openLoader();
    const result =
      await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${
        cityDetail.value.lat
      }&lon=${cityDetail.value.lon}&appid=${
        import.meta.env.VITE_WEATHER_API_KEY
      }
    `);

    appStore.closeLoader();

    currentTimeDt = result.data.dt;

    // UNIX時間戳是從1970/1/1起的秒數，需要乘以1000轉成毫秒
    // 透過toLocaleDateString取得當地日期格式
    cityDetail.value = {
      ...cityDetail.value,
      date: new Date(result.data.dt * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      weatherIcon: result.data.weather[0].icon,
      temperature: result.data.main.temp,
    };
  } catch (err) {
    console.error(err);
  } finally {
    inputDropdownList.value = [];

    inputFieldCity.value = {
      cityName: null,
      stateCode: "",
      countryCode: "",
    };
  }
};

// 取得當日每小時天氣資料
const getHourlyWeather = async () => {
  // console.log(cityDetail.value);
  try {
    const result =
      await axios.get(`https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${
        cityDetail.value.lat
      }&lon=${cityDetail.value.lon}&appid=${
        import.meta.env.VITE_WEATHER_API_KEY
      }
    `);

    // 過濾出當前時間之後的每小時天氣資料，並只取前面十筆
    const hourlyWeatherAfterNow = result.data.list
      .filter((hourData) => hourData.dt >= currentTimeDt)
      .slice(0, 10);

    // 計算圖表 y 軸最大最小值
    const chartMin = Number(
      Math.min(
        ...hourlyWeatherAfterNow.map((hourData) =>
          cityDetail.value.unit === "°C"
            ? hourData.main.temp - 273.15
            : hourData.main.temp
        )
      ).toFixed(0)
    );

    const chartMax = Number(
      Math.max(
        ...hourlyWeatherAfterNow.map((hourData) =>
          cityDetail.value.unit === "°C"
            ? hourData.main.temp - 273.15
            : hourData.main.temp
        )
      ).toFixed(0)
    );

    const chartTempData = caculateYAxis(chartMin, chartMax);
    // console.log(chartTempData);

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
        data: hourlyWeatherAfterNow.map((hourData) =>
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
          data: hourlyWeatherAfterNow.map((hourData) =>
            (cityDetail.value.unit === "°C"
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

    myChart = echarts.init(document.getElementById("lineChart"), null);

    myChart.setOption(tempChartData);

    // console.log(tempChartData);
  } catch (err) {
    console.error(err);
  }
};

// 取得未來天氣(氣溫)資料
const getFutureWeather = async () => {
  try {
    const result =
      await axios.get(`https://api.openweathermap.org/data/2.5/forecast/daily?lat=${
        cityDetail.value.lat
      }&lon=${cityDetail.value.lon}&cnt=8&appid=${
        import.meta.env.VITE_WEATHER_API_KEY
      }
    `);

    futureCityWeatherList.value = result.data.list.slice(1, 8);
  } catch (err) {
    console.error(err);
  }
};

// 切換溫度計算單位
const switchTempUnit = () => {
  if (cityDetail.value.unit == "°C") {
    cityDetail.value.unit = "°F";
  } else {
    cityDetail.value.unit = "°C";
  }

  getHourlyWeather();
};

// 高低溫顯示轉換(攝氏華氏)
const convertTemp = (maxTemp, minTemp) => {
  if (cityDetail.value.unit == "°C") {
    return (
      (maxTemp - 273.15).toFixed(0) +
      " / " +
      (minTemp - 273.15).toFixed(0) +
      " °C"
    );
  } else {
    return maxTemp + " / " + minTemp + " °F";
  }
};

// 單一溫度轉換計算(攝氏華氏)
const temperature = (temp) => {
  if (!temp) return "";
  if (cityDetail.value.unit == "°C") {
    return (temp - 273.15).toFixed(0) + " °C";
  } else {
    return temp + " °F";
  }
};

var myChart;

// 視窗大小改變時，調整圖表大小
window.addEventListener("resize", () => {
  if (myChart) {
    myChart.resize();
  }
});

onMounted(() => {
  getCityLatLon();
});
</script>

<template>
  <v-app>
    <v-main>
      <!-- 背景圖片 -->
      <div class="position-absolute w-100 h-100 cityBackground">
        <img :src="cityPictureUrl" class="position-absolute w-100 h-100" />
      </div>
      <v-container class="d-flex flex-row ga-3">
        <!-- 輸入、切換單位 -->
        <v-sheet class="d-flex flex-column align-center ga-3 w-66 leftSheet">
          <div class="d-flex flex-row align-center ga-3 w-75">
            <!-- 使用者輸入＆選擇區塊 -->
            <v-combobox
              v-model="inputFieldCity.cityName"
              placeholder="Enter a City"
              variant="underlined"
              @keyup.enter="getCityLatLon"
              :items="inputDropdownList"
              :hide-no-data="inputDropdownList.length == 0"
              autoComplete="off"
            >
              <template #item="{ props, index, item }">
                <v-list-item
                  v-bind="props"
                  @click.stop="handleSelectedOption(index)"
                >
                  <template #append>
                    <img
                      :src="`https://openweathermap.org/images/flags/${cityArr[
                        index
                      ]?.country.toLowerCase()}.png`"
                    />
                  </template>
                  <template #title>{{ item.title }}</template>
                </v-list-item>
              </template>
            </v-combobox>

            <v-btn variant="tonal" @click="getCityLatLon">Search</v-btn>
          </div>

          <!-- 顯示城市、天氣、溫度 -->
          <div
            class="d-flex flex-column justify-space-between align-center w-100 h-100"
          >
            <div class="d-flex flex-column">
              <h2 class="cityName" v-show="cityDetail.cityName">
                {{ cityDetail?.cityName + ", " + cityDetail?.countryCode }}
              </h2>
              <div class="d-flex flex-column align-center">
                <img
                  :src="`https://openweathermap.org/img/wn/${cityDetail.weatherIcon}@2x.png`"
                />
                <h3 class="tempDegree">
                  {{ temperature(cityDetail?.temperature) }}
                </h3>
              </div>
            </div>
            <div id="lineChart"></div>
          </div>
        </v-sheet>

        <v-sheet class="d-flex flex-column w-33 rightSheet">
          <!-- 切換攝氏跟華氏 -->
          <v-switch
            :label="cityDetail.unit == '°C' ? 'Switch to °F' : 'Switch to °C'"
            :modelValue="cityDetail.unit"
            :hide-details="true"
            class="px-3 switchBtn"
            :color="'#FFFFFF'"
            @click="switchTempUnit"
            inset
          ></v-switch>

          <!-- 天氣細節 -->
          <div
            class="d-flex flex-column justify-space-between ga-3 pa-3 h-100 weatherDetails"
          >
            <!-- 當天日出、日落、體感溫、濕度 -->
            <div class="d-flex flex-column ga-3 todayDetail">
              <h3>Weather Details</h3>
              <p class="d-flex flex-row align-center">
                <span>High</span>
                <span>：</span>
                <span>{{
                  temperature(futureCityWeatherList[0]?.temp?.max)
                }}</span>
              </p>
              <p class="d-flex flex-row align-center">
                <span>Low</span>
                <span>：</span>
                <span>{{
                  temperature(futureCityWeatherList[0]?.temp?.min)
                }}</span>
              </p>
              <p class="d-flex flex-row align-center">
                <span>Sunrise</span>
                <span>：</span>
                <span>{{
                  futureCityWeatherList[0]?.sunrise
                    ? new Date(
                        futureCityWeatherList[0]?.sunrise * 1000
                      ).toLocaleTimeString("en-us", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : ""
                }}</span>
              </p>
              <p class="d-flex flex-row align-center">
                <span>Sunset</span>
                <span>：</span>
                <span>{{
                  futureCityWeatherList[0]?.sunset
                    ? new Date(
                        futureCityWeatherList[0]?.sunset * 1000
                      ).toLocaleTimeString("en-us", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : ""
                }}</span>
              </p>
              <p class="d-flex flex-row align-center">
                <span>Humidity</span>
                <span>：</span>
                <span>{{
                  futureCityWeatherList[0]?.humidity
                    ? futureCityWeatherList[0]?.humidity + " %"
                    : ""
                }}</span>
              </p>
              <p class="d-flex flex-row align-center">
                <span>Feels like</span>
                <span>：</span>
                <span>{{
                  temperature(futureCityWeatherList[0]?.feels_like?.day)
                }}</span>
              </p>
            </div>

            <!-- 顯示未來幾日天氣預報 -->

            <!-- 星期,日期 天氣icon、高低溫 -->
            <v-list class="pa-0">
              <h3>8-Day Forecast</h3>
              <template v-for="(weather, index) in futureCityWeatherList">
                <DailyWeather
                  :weatherData="weather"
                  :convertTemp="convertTemp"
                />
              </template>
            </v-list>
          </div>
        </v-sheet>
      </v-container>
    </v-main>
  </v-app>
</template>

<style lang="scss" scoped>
* {
  font-family: "Roboto", sans-serif;
}

div.cityBackground::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 黑色 50% 透明度 */
  z-index: 1;
}

.leftSheet {
  background-color: transparent;
  color: white;
  z-index: 2;
}

.rightSheet {
  z-index: 2;
  border-radius: 4px;
  overflow: hidden;

  .switchBtn {
    background-color: #333333;
  }
}

h2.cityName {
  font-weight: 700;
  font-size: 48px;
}

h3.tempDegree {
  font-size: 36px;
}

#lineChart {
  width: 100%;
  height: 350px;
}

.weatherDetails {
  background-color: #cfcfcf;

  .todayDetail {
    p {
      height: 35px;

      span:not(:nth-child(2)) {
        flex: 1;
      }
    }
  }

  .v-list {
    background-color: #cfcfcf;
  }
}
</style>
