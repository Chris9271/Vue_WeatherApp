import axios from "axios";

export default async function handler(req, res) {
  try {
    const API_KEY = process.env.WEATHER_API_KEY;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Missing query parameter: q" });
    }

    const response = await axios.get(
      "https://api.openweathermap.org/geo/1.0/direct",
      {
        params: {
          q,
          limit: "10",
          appid: API_KEY,
        },
      }
    );
    return res.status(200).json(response.data);
  } catch (err) {
    console.error("Weather API Error:", err);
    return res.status(500).json({ error: "Failed to fetch weather data" });
  }
}
