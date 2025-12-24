import { defineStore } from "pinia";
import { useAppStore } from "@/stores/appStore";
import axios from "axios";

export const useWeatherStore = defineStore("useWeatherStore", () => {
  const appStore = useAppStore();

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
    timezone: 0,
  });

  // 存放城市未來天氣資料陣列
  const futureCityWeatherList = ref([]);

  // 有多個相同城市名稱時，存放選擇的城市列表(下拉選單顯示)
  const inputDropdownList = ref([]);

  const hourlyData = ref(null);

  // 當前時間(dt)
  let currentTimeDt = null;

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
      hourlyData.value = data.list
        .filter((hourData) => hourData.dt >= currentTimeDt)
        .slice(0, 10);
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

  return {
    defaultCity,
    inputFieldCity,
    inputDropdownList,
    cityDetail,
    futureCityWeatherList,
    hourlyData,
    getCityWeather,
    getHourlyWeather,
    getFutureWeather,
    switchTempUnit,
  };
});
