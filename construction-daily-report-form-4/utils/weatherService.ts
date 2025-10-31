import { WeatherReport } from '../types';

// Mock weather service. In a real application, this would call a weather API.
export const getWeatherDataForDate = async (date: string, address: string): Promise<Partial<WeatherReport>> => {
  console.log(`Fetching weather for ${date} at ${address}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

  // Generate some plausible, pseudo-random weather data based on the date
  const d = new Date(date + 'T12:00:00Z'); // Use noon UTC to avoid timezone issues
  const dayOfYear = (d.valueOf() - new Date(d.getFullYear(), 0, 0).valueOf()) / (1000 * 60 * 60 * 24);
  const tempVariation = Math.sin((dayOfYear - 90) / 365 * 2 * Math.PI); // Seasonal variation (peak in summer)

  const baseLow = 5; // Base low temp in C
  const baseHigh = 15; // Base high temp in C

  const lowTemp = Math.round(baseLow + tempVariation * 10 + Math.random() * 4 - 2);
  const highTemp = lowTemp + Math.round(10 + Math.random() * 5);
  const avgTemp = Math.round((lowTemp + highTemp) / 2);
  
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Overcast', 'Light Rain', 'Windy'];
  const windSpeed = Math.round(5 + Math.random() * 20);

  return {
    lowTemp: lowTemp.toString(),
    highTemp: highTemp.toString(),
    avgTemp: avgTemp.toString(),
    morning: conditions[Math.floor(Math.random() * conditions.length)],
    afternoon: conditions[Math.floor(Math.random() * conditions.length)],
    evening: 'Clear',
    avgWind: windSpeed.toString(),
    maxWind: (windSpeed + Math.round(Math.random() * 10)).toString(),
    gustWind: (windSpeed + Math.round(Math.random() * 15)).toString(),
    comments: 'Typical conditions for this time of year.'
  };
};
