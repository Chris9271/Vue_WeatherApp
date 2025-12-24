<script setup>
import { convertTemp } from "@/utils/convertTemp";

defineProps({
  weatherData: {
    type: Object,
    required: true,
  },

  timezone: {
    type: Number,
    required: true,
  },

  tempUnit: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="d-flex flex-row align-center ga-3 dailyDetails">
    <span class="flex-sm-1-1 flex-1-1-0">
      <!-- 先取得UTC時間再加時差 -->
      {{
        new Date(weatherData.dt * 1000 + timezone * 1000).toLocaleDateString(
          "en-US",
          {
            weekday: "short",
            month: "short",
            day: "numeric",
            timezone: "UTC",
          }
        )
      }}
    </span>
    <span class="flex-sm-1-1 flex-1-1-0">
      <img
        :src="`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`"
        width="50"
      />
    </span>
    <span class="flex-sm-1-1 flex-1-1-0">{{
      convertTemp(weatherData.temp.min, weatherData.temp.max, tempUnit)
    }}</span>
  </div>
</template>

<style lang="scss" scoped></style>
