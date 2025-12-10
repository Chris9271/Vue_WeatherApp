<script setup>
import { useAppStore } from "@/stores/appStore";

const appStore = useAppStore();
</script>

<template>
  <div class="loader_outer" v-show="appStore.showLoader">
    <div class="loader">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$loaderBgColor: rgba(0, 0, 0, 0.5);

.loader {
  width: 100%;
  height: 100%;
  position: fixed;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: $loaderBgColor;
  opacity: 1;
  z-index: 8000;
  top: 0;
  left: 0;
  > span {
    display: inline-block;
    width: 8px;
    height: 20px;
    background-color: #ffffff;

    &:nth-child(1) {
      animation: grow 1s ease-in-out infinite;
    }
    &:nth-child(2) {
      animation: grow 1s ease-in-out 0.15s infinite;
    }
    &:nth-child(3) {
      animation: grow 1s ease-in-out 0.3s infinite;
    }
  }
}

@keyframes grow {
  0%,
  100% {
    -webkit-transform: scaleY(1);
    -ms-transform: scaleY(1);
    -o-transform: scaleY(1);
    transform: scaleY(1);
  }

  50% {
    -webkit-transform: scaleY(1.8);
    -ms-transform: scaleY(1.8);
    -o-transform: scaleY(1.8);
    transform: scaleY(1.8);
  }
}
</style>
