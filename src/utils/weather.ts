import { City, WeatherData, DailyForecast } from '@/types/weather';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

export const fetchWeatherData = async (city: City): Promise<WeatherData> => {
  if (!API_KEY) {
    throw new Error('OpenWeather API key is not configured');
  }

  try {
    const [currentWeather, forecast] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${city.coordinates.lat}&lon=${city.coordinates.lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?lat=${city.coordinates.lat}&lon=${city.coordinates.lon}&appid=${API_KEY}&units=metric`)
    ]);

    if (!currentWeather.ok || !forecast.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await currentWeather.json();
    const forecastData = await forecast.json();

    return {
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].main,
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
      icon: weatherData.weather[0].icon,
      feelsLike: Math.round(weatherData.main.feels_like),
      sunrise: weatherData.sys.sunrise,
      sunset: weatherData.sys.sunset,
      daily: processForecastData(forecastData.list).map((day: any): DailyForecast => {
        // Add additional validation to prevent errors when mapping
        if (!day || !day.weather || !day.weather.main || !day.weather.icon) {
          console.warn('Skipping invalid day in daily forecast mapping:', day);
          return {
            date: day?.dt || 0,
            temperature: {
              min: 0,
              max: 0
            },
            condition: 'Unknown',
            icon: '01d' // Default icon
          };
        }
        
        return {
          date: day.dt,
          temperature: {
            min: Math.round(day.temp_min),
            max: Math.round(day.temp_max)
          },
          condition: day.weather.main,
          icon: day.weather.icon
        };
      })
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

export const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9/5) + 32);
};

export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return Math.round((fahrenheit - 32) * 5/9);
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

interface WeatherApiResponse {
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
  };
  dt: number;
}

interface ForecastItem {
  dt: number;
  main: {
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    main: string;
    icon: string;
  }>;
}

const processForecastData = (forecastList: ForecastItem[]): Array<{
  dt: number;
  temp_min: number;
  temp_max: number;
  weather: {
    main: string;
    icon: string;
  };
}> => {
  if (!Array.isArray(forecastList)) {
    console.error('Invalid forecast list:', forecastList);
    return [];
  }
  
  const dailyData: { [key: string]: {
    dt: number;
    temp_min: number;
    temp_max: number;
    weather: {
      main: string;
      icon: string;
    };
  }} = {};

  forecastList.forEach((item: ForecastItem) => {
    try {
      if (!item) {
        console.warn('Skipping null or undefined forecast item');
        return;
      }
      
      if (!item.dt) {
        console.warn('Skipping forecast item without timestamp:', item);
        return;
      }
      
      const mainData = item.main;
      const tempMin = mainData.temp_min;
      const tempMax = mainData.temp_max;
      
      if (typeof tempMin === 'undefined' || typeof tempMax === 'undefined') {
        console.warn('Skipping forecast item with missing temperature data:', item);
        return;
      }
      
      const weatherArray = item.weather;
      const weatherData = weatherArray[0];
      
      if (!weatherData || !weatherData.main || !weatherData.icon) {
        console.warn('Skipping forecast item with missing weather data:', item);
        return;
      }
      
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          dt: item.dt,
          temp_min: tempMin,
          temp_max: tempMax,
          weather: weatherData
        };
      } else {
        dailyData[date].temp_min = Math.min(dailyData[date].temp_min, tempMin);
        dailyData[date].temp_max = Math.max(dailyData[date].temp_max, tempMax);
      }
    } catch (error) {
      console.error('Error processing forecast item:', error, item);
    }
  });

  return Object.values(dailyData).slice(0, 7);
};
