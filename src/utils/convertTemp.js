// 高低溫顯示轉換(攝氏華氏)
export const convertTemp = (minTemp, maxTemp, unit) => {
  if (unit == "°C") {
    return (
      (minTemp - 273.15).toFixed(0) +
      " / " +
      (maxTemp - 273.15).toFixed(0) +
      " °C"
    );
  } else {
    return minTemp + " / " + maxTemp + " °F";
  }
};

// 單一溫度轉換計算(攝氏華氏)
export const displayTemp = (temp, unit) => {
  if (!temp) return "";
  if (unit == "°C") {
    return (temp - 273.15).toFixed(0) + " °C";
  } else {
    return temp + " °F";
  }
};
