// Utilities
import { defineStore } from "pinia";
import { ref } from "vue";
import { delayFunc } from "@/utils/delay";

export const useAppStore = defineStore("useAppStore", () => {
  // loader控制
  const showLoader = ref(true);

  const openLoader = () => {
    showLoader.value = true;
  };

  const closeLoader = () => {
    showLoader.value = false;
  };

  // request/response api用
  const asyncCloseLoader = () => {
    // 延遲 0.5秒關閉loader
    delayFunc(500, closeLoader);
  };

  return {
    showLoader,
    openLoader,
    closeLoader,
    asyncCloseLoader,
  };
});
