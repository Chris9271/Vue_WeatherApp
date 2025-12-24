<script setup>
import { useDisplay } from "vuetify";
import { useWeatherStore } from "@/stores/weatherStore";
import { displayTemp } from "@/utils/convertTemp";
import HourlyTempChart from "./HourlyTempChart.vue";

const weatherStore = useWeatherStore();
const { xs, lgAndUp } = useDisplay();
</script>

<template>
  <!-- 顯示城市、天氣、溫度 -->
  <div
    class="d-flex flex-column justify-space-between align-center w-100 h-100"
  >
    <div class="d-flex flex-column">
      <h2 class="cityName" v-show="weatherStore.cityDetail.cityName">
        {{
          weatherStore.cityDetail?.cityName +
          ", " +
          weatherStore.cityDetail?.countryCode
        }}
      </h2>
      <div class="d-flex flex-column align-center">
        <img
          :src="`https://openweathermap.org/img/wn/${weatherStore.cityDetail.weatherIcon}@2x.png`"
        />
        <h3 class="tempDegree">
          {{
            displayTemp(
              weatherStore.cityDetail?.temperature,
              weatherStore.cityDetail.unit
            )
          }}
        </h3>
      </div>
    </div>
    <div :class="!xs && !lgAndUp ? 'd-flex flex-column w-75 mx-auto' : 'w-100'">
      <h3 v-show="!xs && !lgAndUp">Hourly Forecast</h3>
      <HourlyTempChart v-show="!xs" :isShow="!xs" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
</style>
