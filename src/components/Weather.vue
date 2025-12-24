<script setup>
import { onMounted } from "vue";
import { useWeatherStore } from "@/stores/weatherStore";
import { useDisplay } from "vuetify";
import { getGeoLocation } from "@/composable/useGeoLocation";
import WeatherSearch from "@/components/WeatherSearch/WeatherSearch.vue";
import WeatherCurrent from "@/components/WeatherCurrent/WeatherCurrent.vue";
import WeatherDetail from "@/components/WeatherDetail/WeatherDetail.vue";

const weatherStore = useWeatherStore();

const { xs, lgAndUp } = useDisplay();

// 城市背景圖片網址
const cityPictureUrl =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

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
        class="d-flex h-100"
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
            <WeatherSearch />
          </div>

          <!-- 顯示城市、天氣、溫度 -->
          <WeatherCurrent />
        </v-sheet>

        <!-- 切換單位、天氣細節 -->
        <v-sheet
          class="d-flex flex-column rightSheet"
          :class="lgAndUp ? 'w-33' : 'w-100 text-white bg-transparent'"
        >
          <!-- 切換攝氏跟華氏 -->
          <v-switch
            label="°C / °F"
            :modelValue="weatherStore.cityDetail.unit"
            :hide-details="true"
            class="px-3 switchBtn"
            :color="'#FFFFFF'"
            @click="weatherStore.switchTempUnit"
            inset
            v-if="lgAndUp"
          ></v-switch>

          <!-- 天氣細節 -->
          <WeatherDetail />
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

.bg-transparent {
  background: transparent !important;
}
</style>
