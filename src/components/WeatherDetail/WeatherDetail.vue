<script setup>
import { useDisplay } from "vuetify";
import { useWeatherStore } from "@/stores/weatherStore";
import { displayTemp } from "@/utils/convertTemp";
import DailyWeather from "@/components/WeatherDetail/DailyWeather.vue";

const weatherStore = useWeatherStore();
const { xs, lgAndUp } = useDisplay();
</script>

<template>
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
        <v-col :class="lgAndUp ? 'v-col-12' : 'v-col-6'">
          <p class="d-flex flex-row align-center">
            <span>Low</span>
            <span>：</span>
            <span>{{
              displayTemp(
                weatherStore.futureCityWeatherList[0]?.temp?.min,
                weatherStore.cityDetail.unit
              )
            }}</span>
          </p>
        </v-col>
        <v-col :cols="lgAndUp ? 'v-col-12' : 'v-col-6'">
          <p class="d-flex flex-row align-center">
            <span>High</span>
            <span>：</span>
            <span>{{
              displayTemp(
                weatherStore?.futureCityWeatherList[0]?.temp?.max,
                weatherStore.cityDetail.unit
              )
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
              weatherStore.futureCityWeatherList[0]?.sunrise
                ? new Date(
                    weatherStore.futureCityWeatherList[0]?.sunrise * 1000 +
                      weatherStore.cityDetail?.timezone * 1000
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
              weatherStore.futureCityWeatherList[0]?.sunset
                ? new Date(
                    weatherStore.futureCityWeatherList[0]?.sunset * 1000 +
                      weatherStore.cityDetail?.timezone * 1000
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
              weatherStore.futureCityWeatherList[0]?.humidity
                ? weatherStore.futureCityWeatherList[0]?.humidity + " %"
                : ""
            }}</span>
          </p>
        </v-col>

        <v-col :class="lgAndUp ? 'v-col-12' : 'v-col-6'">
          <p class="d-flex flex-row align-center">
            <span>Feels like</span>
            <span>：</span>
            <span>{{
              displayTemp(
                weatherStore.futureCityWeatherList[0]?.feels_like?.day,
                weatherStore.cityDetail.unit
              )
            }}</span>
          </p>
        </v-col>
      </v-row>
    </div>

    <!-- 顯示未來幾日天氣預報 -->
    <!-- 星期,日期 天氣icon、高低溫 -->
    <v-list class="pa-0" :class="lgAndUp ? '' : 'text-white bg-transparent'">
      <h3>8-Day Forecast</h3>
      <template
        v-for="(weather, index) in weatherStore.futureCityWeatherList.slice(
          1,
          8
        )"
      >
        <DailyWeather
          :weatherData="weather"
          :timezone="weatherStore.cityDetail.timezone"
          :class="lgAndUp ? '' : 'text-center'"
          :tempUnit="weatherStore.cityDetail.unit"
        />
      </template>
    </v-list>
  </div>
</template>

<style lang="scss" scoped>
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
</style>
