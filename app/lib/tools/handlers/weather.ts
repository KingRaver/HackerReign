// lib/tools/handlers/weather.ts - Fixed without OpenAI import
type FunctionArguments = Record<string, any>;

export default async function get_weather(args: FunctionArguments) {
  const { city } = args as { city: string };
  
  // Mock API - replace with real OpenWeatherMap key in .env
  const mockData: Record<string, { temp: number; condition: string }> = {
    'New York': { temp: 22, condition: 'Sunny' },
    'London': { temp: 15, condition: 'Cloudy' },
    'Katerini': { temp: 18, condition: 'Partly cloudy' } // Your location!
  };
  
  const result = mockData[city] || { temp: NaN, condition: 'Unknown' };
  
  return {
    city,
    temperature: `${result.temp}°C`,
    condition: result.condition,
    timestamp: new Date().toISOString()
  };
}