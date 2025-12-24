import { useWeatherStore } from "@/stores/weatherStore";

const weatherStore = useWeatherStore();

// 抓geolocation相關事件處理(含成功與失敗)
export const getGeoLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      geoLocationSuccess,
      geoLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 0, // 不使用 cache
        timeout: 5000,
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
};

const geoLocationSuccess = (position) => {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  weatherStore.defaultCity = {
    lat: latitude,
    lon: longitude,
  };

  // 取得城市天氣資料
  weatherStore.getCityWeather();

  // 取得當日每小時天氣資料
  weatherStore.getHourlyWeather();

  // 取得未來天氣資料
  weatherStore.getFutureWeather();
};

const geoLocationError = (err) => {
  console.warn(`ERROR(${err.code}): ${err.message}`);
};
