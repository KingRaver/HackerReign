// lib/tools/handlers/weather.ts - OpenWeatherMap integration
type FunctionArguments = Record<string, any>;

interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
  name: string;
}

export default async function get_weather(args: FunctionArguments) {
  const { city } = args as { city: string };

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY is not configured in environment variables');
  }

  try {
    // OpenWeatherMap Current Weather API
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          city,
          error: `City "${city}" not found`,
          timestamp: new Date().toISOString()
        };
      }
      throw new Error(`OpenWeather API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OpenWeatherResponse;

    return {
      city: data.name,
      temperature: `${Math.round(data.main.temp)}°C`,
      feels_like: `${Math.round(data.main.feels_like)}°C`,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: `${data.main.humidity}%`,
      wind_speed: `${data.wind.speed} m/s`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Weather Tool] Error fetching weather data:', error);
    throw error;
  }
}