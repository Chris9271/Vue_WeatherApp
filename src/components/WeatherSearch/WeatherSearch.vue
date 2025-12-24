<script setup>
import { ref } from "vue";
import { useDisplay } from "vuetify";
import { useWeatherStore } from "@/stores/weatherStore";
import axios from "axios";

const weatherStore = useWeatherStore();
const { xs, lgAndUp } = useDisplay();

// 輸入欄位下拉選單狀態
const menuStatus = ref(false);

// 存放多城市資料陣列(原始資料)
let cityArr = [];

// 多城市下拉選單中選擇其中一個，並設定state/country代碼(透過下拉選單索引值)
const handleSelectedOption = (index) => {
  menuStatus.value = false;

  weatherStore.inputFieldCity = {
    cityName: cityArr[index].name,
    stateCode: cityArr[index]?.state || "",
    countryCode: cityArr[index]?.country || "",
  };

  getCityWithStateCountry();
};

// 取得並設定城市經緯度、國碼、名稱
const updateCityDetail = (data) => {
  const { lat, lon, country, state, name } = data[0];
  weatherStore.cityDetail = {
    ...weatherStore.cityDetail,
    lat,
    lon,
    countryCode: country,
    cityName: name,
    stateCode: state || "",
  };

  // 取得城市天氣資料
  weatherStore.getCityWeather();

  // 取得當日每小時天氣資料
  weatherStore.getHourlyWeather();

  // 取得未來天氣資料
  weatherStore.getFutureWeather();
};

// 取得城市經緯度(非多個相同城市)
const getCityLatLon = async () => {
  menuStatus.value = true;

  try {
    const result = await axios.get("/api/weather", {
      params: {
        action: "cityGeo",
        q: weatherStore.inputFieldCity.cityName,
        limit: "10",
      },
    });

    const { data } = result.data;

    // 過濾出符合使用者輸入或預設城市名稱的資料
    cityArr = data.filter((city) =>
      city.name.includes(weatherStore.inputFieldCity.cityName)
    );

    // 有些城市名稱會有重複，API會回傳多筆資料，要顯示下拉選單讓使用者選擇
    if (cityArr.length > 1) {
      weatherStore.inputDropdownList = cityArr.map(
        (city) => `${city.name} ${city?.state || ""} ${city?.country || ""}`
      );
    } else {
      updateCityDetail(data);
    }
  } catch (err) {
    console.error(err);
  }
};

// 取得多城市state/country代碼的經緯度
const getCityWithStateCountry = async () => {
  let cityStateCountryString = `${weatherStore?.inputFieldCity?.cityName},${weatherStore?.inputFieldCity?.stateCode},${weatherStore?.inputFieldCity?.countryCode}`;

  try {
    const result = await axios.get("/api/weather", {
      params: {
        action: "multiCityGeo",
        q: cityStateCountryString,
        limit: "5",
      },
    });

    const { data } = result.data;

    updateCityDetail(data);
  } catch (err) {
    console.error(err);
    return;
  }
};
</script>

<template>
  <div class="d-flex flex-row align-center ga-3 w-100">
    <!-- 使用者輸入＆選擇區塊 -->
    <v-combobox
      v-model="weatherStore.inputFieldCity.cityName"
      placeholder="Enter a City"
      variant="underlined"
      @keyup.enter="getCityLatLon"
      :items="weatherStore.inputDropdownList"
      :hide-no-data="weatherStore.inputDropdownList.length == 0"
      :menu="menuStatus || weatherStore.inputDropdownList.length > 0"
      autoComplete="off"
    >
      <template #item="{ props, index, item }">
        <v-list-item v-bind="props" @click.stop="handleSelectedOption(index)">
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

    <v-btn variant="tonal" @click="getCityLatLon" v-show="!xs">Search</v-btn>

    <!-- 切換攝氏跟華氏 -->
    <v-switch
      label="°C / °F"
      :modelValue="weatherStore.cityDetail.unit"
      :hide-details="true"
      class="px-3 switchBtn bg-transparent"
      :color="'#FFFFFF'"
      @click="weatherStore.switchTempUnit"
      inset
      v-if="!lgAndUp"
    ></v-switch>
  </div>
</template>

<style lang="scss" scoped></style>
