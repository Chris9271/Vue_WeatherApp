<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from "echarts/core";
import DailyWeather from "./DailyWeather.vue";
import { useAppStore } from "@/stores/appStore";
import { useDisplay } from "vuetify";

const appStore = useAppStore();
const { width, xs, sm, md, mdAndUp, lg, lgAndUp } = useDisplay();

// 預設城市(抓使用者所在地)
const defaultCity = ref({
  lat: "",
  lon: "",
});

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
  timezone: "",
});

// 有多個相同城市名稱時，存放選擇的城市列表(下拉選單顯示)
const inputDropdownList = ref([]);

// 存放城市未來天氣資料陣列
const futureCityWeatherList = ref([]);

// 輸入欄位下拉選單狀態
const menuStatus = ref(false);

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
  menuStatus.value = false;

  inputFieldCity.value = {
    cityName: cityArr[index].name,
    stateCode: cityArr[index]?.state || "",
    countryCode: cityArr[index]?.country || "",
  };

  getCityWithStateCountry();
};

// 取得城市經緯度(非多個相同城市)
const getCityLatLon = async () => {
  menuStatus.value = true;

  try {
    const result = await axios.get("/api/weather", {
      params: {
        action: "cityGeo",
        q: inputFieldCity.value.cityName,
        limit: "10",
      },
    });

    const { data } = result.data;

    // 過濾出符合使用者輸入或預設城市名稱的資料
    cityArr = data.filter((city) =>
      city.name.includes(inputFieldCity.value.cityName)
    );

    // // 有些城市名稱會有重複，API會回傳多筆資料，要顯示下拉選單讓使用者選擇
    if (cityArr.length > 1) {
      inputDropdownList.value = cityArr.map(
        (city) => `${city.name} ${city?.state || ""} ${city?.country || ""}`
      );
    } else {
      // 取得並設定程式經緯度、國碼、城市名稱
      const { lat, lon, country, state, name } = data[0];
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
    }
  } catch (err) {
    console.error(err);
  }
};

// 取得多城市state/country代碼的經緯度
const getCityWithStateCountry = async () => {
  let cityStateCountryString = `${inputFieldCity?.value?.cityName},${inputFieldCity?.value?.stateCode},${inputFieldCity?.value?.countryCode}`;

  try {
    const result = await axios.get("/api/weather", {
      params: {
        action: "multiCityGeo",
        q: cityStateCountryString,
        limit: "5",
      },
    });

    const { data } = result.data;

    // 取得並設定程式經緯度、國碼、城市名稱
    const { lat, lon, country, state, name } = data[0];
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

    const result = await axios.get("/api/weather", {
      params: {
        action: "cityWeather",
        lat: cityDetail.value.lat || defaultCity.value.lat,
        lon: cityDetail.value.lon || defaultCity.value.lon,
      },
    });

    appStore.closeLoader();

    const { data } = result.data;

    currentTimeDt = data.dt;

    // UNIX時間戳是從1970/1/1起的秒數，需要乘以1000轉成毫秒
    // 透過toLocaleDateString取得當地日期格式
    cityDetail.value = {
      ...cityDetail.value,

      lat: data.coord.lat,
      lon: data.coord.lom,
      countryCode: data.sys.country,
      cityName: data.name,
      stateCode: data.state || "",
      date: new Date(data.dt * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      weatherIcon: data.weather[0].icon,
      temperature: data.main.temp,
      timezone: data.timezone,
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
  try {
    const result = await axios.get("/api/weather", {
      params: {
        action: "hourlyWeather",
        lat: cityDetail.value.lat || defaultCity.value.lat,
        lon: cityDetail.value.lon || defaultCity.value.lon,
      },
    });

    const { data } = result.data;

    // 過濾出當前時間之後的每小時天氣資料，並只取前面十筆
    const hourlyWeatherAfterNow = data.list
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
  } catch (err) {
    console.error(err);
  }
};

// 取得未來天氣(氣溫)資料
const getFutureWeather = async () => {
  try {
    const result = await axios.get("/api/weather", {
      params: {
        action: "futureWeather",
        lat: cityDetail.value.lat || defaultCity.value.lat,
        lon: cityDetail.value.lon || defaultCity.value.lon,
        cnt: "9",
      },
    });

    const { data } = result.data;

    futureCityWeatherList.value = data.list;
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
const convertTemp = (minTemp, maxTemp) => {
  if (cityDetail.value.unit == "°C") {
    return (
      (minTemp - 273.15).toFixed(0) +
      " / " +
      (maxTemp - 273.15).toFixed(0) +
      " °C"
    );
  } else {
    return minTemp + " / " + maxTemp + " °F";
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

// 抓geolocation相關事件處理(含成功與失敗)
const getGeoLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 0, // 不使用 cache
      timeout: 5000,
    });
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
};

const success = (position) => {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  defaultCity.value = {
    lat: latitude,
    lon: longitude,
  };

  // 取得城市天氣資料
  getCityWeather();

  // 取得當日每小時天氣資料
  getHourlyWeather();

  // 取得未來天氣資料
  getFutureWeather();
};

const error = (err) => {
  console.warn(`ERROR(${err.code}): ${err.message}`);
};

// 儲存圖表的變數
var myChart;

// 視窗大小改變時，調整圖表大小
window.addEventListener("resize", () => {
  if (myChart) {
    myChart.resize();
  }
});

onMounted(() => {
  getGeoLocation();
});
</script>

<template>
  <v-app>
    <v-main>
      <!-- 背景圖片 -->
      <div class="position-absolute w-100 h-100 cityBackground">
        <img :src="cityPictureUrl" class="position-absolute w-100 h-100" />
      </div>
      <v-container
        class="d-flex"
        :class="lgAndUp ? 'flex-row ga-3' : 'flex-column ga-4'"
      >
        <!-- 輸入 -->
        <v-sheet
          class="d-flex flex-column align-center ga-3 leftSheet"
          :class="lgAndUp ? 'w-66' : 'w-100'"
        >
          <div
            class="d-flex flex-row align-center ga-3"
            :class="xs ? 'w-100' : 'w-75'"
          >
            <!-- 使用者輸入＆選擇區塊 -->
            <v-combobox
              v-model="inputFieldCity.cityName"
              placeholder="Enter a City"
              variant="underlined"
              @keyup.enter="getCityLatLon"
              :items="inputDropdownList"
              :hide-no-data="inputDropdownList.length == 0"
              :menu="menuStatus || inputDropdownList.length > 0"
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

            <v-btn variant="tonal" @click="getCityLatLon" v-show="!xs"
              >Search</v-btn
            >

            <!-- 切換攝氏跟華氏 -->
            <v-switch
              label="°C / °F"
              :modelValue="cityDetail.unit"
              :hide-details="true"
              class="px-3 switchBtn bg-transparent"
              :color="'#FFFFFF'"
              @click="switchTempUnit"
              inset
              v-if="!lgAndUp"
            ></v-switch>
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
            <div id="lineChart" v-show="lgAndUp"></div>
          </div>
        </v-sheet>

        <!-- 切換單位、天氣細節 -->
        <v-sheet
          class="d-flex flex-column rightSheet"
          :class="lgAndUp ? 'w-33' : 'w-100 text-white bg-transparent'"
        >
          <!-- 切換攝氏跟華氏 -->
          <v-switch
            label="°C / °F"
            :modelValue="cityDetail.unit"
            :hide-details="true"
            class="px-3 switchBtn"
            :color="'#FFFFFF'"
            @click="switchTempUnit"
            inset
            v-if="lgAndUp"
          ></v-switch>

          <!-- 天氣細節 -->
          <div
            class="d-flex flex-column justify-space-between pa-3 h-100 weatherDetails"
            :class="
              xs
                ? 'w-100 bg-transparent mx-auto my-0 ga-4'
                : !lgAndUp
                ? 'w-75 bg-transparent mx-auto my-0 ga-4'
                : 'w-100 ga-3'
            "
          >
            <!-- 當天日出、日落、體感溫、濕度 -->
            <div class="d-flex flex-column todayDetail">
              <h3>Weather Details</h3>

              <v-row no-gutters :class="lgAndUp ? '' : 'text-center'">
                <v-col :cols="lgAndUp ? 'v-col-12' : 'v-col-6'">
                  <p class="d-flex flex-row align-center">
                    <span>High</span>
                    <span>：</span>
                    <span>{{
                      temperature(futureCityWeatherList[0]?.temp?.max)
                    }}</span>
                  </p>
                </v-col>
                <v-col :class="lgAndUp ? 'v-col-12' : 'v-col-6'">
                  <p class="d-flex flex-row align-center">
                    <span>Low</span>
                    <span>：</span>
                    <span>{{
                      temperature(futureCityWeatherList[0]?.temp?.min)
                    }}</span>
                  </p>
                </v-col>
              </v-row>

              <v-row no-gutters :class="lgAndUp ? '' : 'text-center'">
                <v-col :class="lgAndUp ? 'v-col-12' : 'v-col-6'">
                  <p class="d-flex flex-row align-center">
                    <span>Sunrise</span>
                    <span>：</span>
                    <span>{{
                      futureCityWeatherList[0]?.sunrise
                        ? new Date(
                            futureCityWeatherList[0]?.sunrise * 1000 +
                              cityDetail?.timezone * 1000
                          ).toLocaleTimeString("en-us", {
                            timeZone: "UTC",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : ""
                    }}</span>
                  </p>
                </v-col>
                <v-col :class="lgAndUp ? 'v-col-12' : 'v-col-6'">
                  <p class="d-flex flex-row align-center">
                    <span>Sunset</span>
                    <span>：</span>
                    <span>{{
                      futureCityWeatherList[0]?.sunset
                        ? new Date(
                            futureCityWeatherList[0]?.sunset * 1000 +
                              cityDetail?.timezone * 1000
                          ).toLocaleTimeString("en-us", {
                            timeZone: "UTC",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : ""
                    }}</span>
                  </p>
                </v-col>
              </v-row>

              <v-row no-gutters :class="lgAndUp ? '' : 'text-center'">
                <v-col :class="lgAndUp ? 'v-col-12' : 'v-col-6'">
                  <p class="d-flex flex-row align-center">
                    <span>Humidity</span>
                    <span>：</span>
                    <span>{{
                      futureCityWeatherList[0]?.humidity
                        ? futureCityWeatherList[0]?.humidity + " %"
                        : ""
                    }}</span>
                  </p>
                </v-col>

                <v-col :class="lgAndUp ? 'v-col-12' : 'v-col-6'">
                  <p class="d-flex flex-row align-center">
                    <span>Feels like</span>
                    <span>：</span>
                    <span>{{
                      temperature(futureCityWeatherList[0]?.feels_like?.day)
                    }}</span>
                  </p>
                </v-col>
              </v-row>
            </div>

            <!-- 顯示未來幾日天氣預報 -->

            <!-- 星期,日期 天氣icon、高低溫 -->
            <v-list
              class="pa-0"
              :class="lgAndUp ? '' : 'text-white bg-transparent'"
            >
              <h3>8-Day Forecast</h3>
              <template
                v-for="(weather, index) in futureCityWeatherList.slice(1, 8)"
              >
                <DailyWeather
                  :weatherData="weather"
                  :convertTemp="convertTemp"
                  :timeZone="cityDetail.timezone"
                  :class="lgAndUp ? '' : 'text-center'"
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
      height: 46px;

      span:not(:nth-child(2)) {
        flex: 1;
      }
    }
  }

  .v-list {
    background-color: #cfcfcf;
  }
}

.bg-transparent {
  background: transparent !important;
}
</style>
