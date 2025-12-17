/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: "system",
  },
  display: {
    mobileBreakpoint: "md", // 設置斷點
    thresholds: {
      // 設置斷點閾值
      xs: 0,
      sm: 568,
      md: 768,
      lg: 1280,
      xl: 1440,
      xxl: 1600,
    },
  },
});
