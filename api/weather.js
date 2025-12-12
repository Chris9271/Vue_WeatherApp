import axios from "axios";

export default async function handler(req, res) {
  const API_KEY = process.env.VITE_WEATHER_API_KEY;
  const { q, action, lat, lon, cnt, limit } = req.query;

  try {
    switch (action) {
      case "cityGeo":
        if (!q) {
          return res.status(400).json({ error: "Missing query parameter: q" });
        }

        return await getCityGeo(q, res, API_KEY, limit);

      case "multiCityGeo":
        return await getMultiCityGeo(q, res, API_KEY, limit);

      case "cityWeather":
        return await getCityWeather(res, API_KEY, lat, lon);

      case "hourlyWeather":
        return await getHourlyWeather(res, API_KEY, lat, lon);

      case "futureWeather":
        return await getFutureWeather(res, API_KEY, lat, lon, cnt);

      default:
        return res.status(400).json({ error: "Invalid action parameter" });
    }
  } catch (err) {
    console.error("Weather API Error:", err);
    return res.status(500).json({ error: "Failed to fetch weather data" });
  }
}

async function getCityGeo(q, res, API_KEY, limit) {
  const cityGeoRes = await axios.get(
    "https://api.openweathermap.org/geo/1.0/direct",
    {
      params: {
        q,
        limit,
        appid: API_KEY,
      },
    }
  );
  return res.status(200).json({ type: "cityGeo", data: cityGeoRes.data });
}

async function getMultiCityGeo(q, res, API_KEY, limit) {
  const multiCityGeoRes = await axios.get(
    "https://api.openweathermap.org/geo/1.0/direct",
    {
      params: {
        q,
        limit,
        appid: API_KEY,
      },
    }
  );
  return res
    .status(200)
    .json({ type: "multiCityGeoRes", data: multiCityGeoRes.data });
}

async function getCityWeather(res, API_KEY, lat, lon) {
  const cityWeatherRes = await axios.get(
    "https://api.openweathermap.org/data/2.5/weather",
    {
      params: {
        lat,
        lon,
        appid: API_KEY,
      },
    }
  );
  return res
    .status(200)
    .json({ type: "cityWeather", data: cityWeatherRes.data });
}

async function getHourlyWeather(res, API_KEY, lat, lon) {
  const hourlyWeatherRes = await axios.get(
    "https://pro.openweathermap.org/data/2.5/forecast/hourly",
    {
      params: {
        lat,
        lon,
        appid: API_KEY,
      },
    }
  );
  return res
    .status(200)
    .json({ type: "hourlyWeather", data: hourlyWeatherRes.data });
}

async function getFutureWeather(res, API_KEY, lat, lon, cnt) {
  const futureWeatherRes = await axios.get(
    "https://api.openweathermap.org/data/2.5/forecast/daily",
    {
      params: {
        lat,
        lon,
        cnt,
        appid: API_KEY,
      },
    }
  );
  return res
    .status(200)
    .json({ type: "futureWeather", data: futureWeatherRes.data });
}
