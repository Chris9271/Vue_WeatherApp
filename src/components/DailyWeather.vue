<script setup>
defineProps({
  weatherData: {
    type: Object,
    required: true,
  },

  timeZone: {
    type: Number,
    required: true,
  },

  convertTemp: {
    type: Function,
    required: true,
  },
});
</script>

<template>
  <div class="d-flex flex-row align-center ga-3 dailyDetails">
    <span>
      <!-- 先取得UTC時間再加時差 -->
      {{
        new Date(weatherData.dt * 1000 + timeZone * 1000).toLocaleDateString(
          "en-US",
          {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }
        )
      }}
    </span>
    <span>{{ convertTemp(weatherData.temp.max, weatherData.temp.min) }}</span>
    <span>
      <img
        :src="`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`"
        width="50"
      />
    </span>
  </div>
</template>

<style lang="scss" scoped>
div.dailyDetails {
  span:nth-child(1) {
    flex: 1;
  }
  span:nth-child(2) {
    flex: 1;
    text-align: center;
  }
}
</style>
