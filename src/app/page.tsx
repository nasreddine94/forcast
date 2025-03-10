'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CITIES, WeatherData, DailyForecast } from '@/types/weather';
import { fetchWeatherData, celsiusToFahrenheit, formatTime, formatDate } from '@/utils/weather';
import CityManager from '@/components/CityManager';

export default function Home() {
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showCityManager, setShowCityManager] = useState(false);

  useEffect(() => {
    const fetchAllCitiesWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data: { [key: string]: WeatherData } = {};

        await Promise.all(
          CITIES.map(async (city) => {
            try {
              const cityWeather = await fetchWeatherData(city);
              data[city.id] = cityWeather;
            } catch (error) {
              console.error(`Error fetching weather for ${city.name}:`, error);
            }
          })
        );

        setWeatherData(data);
      } catch (error) {
        setError('Failed to fetch weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllCitiesWeather();
    const interval = setInterval(fetchAllCitiesWeather, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []); // Remove CITIES from dependency array

  const getWeatherBackground = (condition: string) => {
    const conditions: { [key: string]: string } = {
      Clear: 'https://source.unsplash.com/1600x900/?sunny,clear-sky',
      Clouds: 'https://source.unsplash.com/1600x900/?cloudy,clouds',
      Rain: 'https://source.unsplash.com/1600x900/?rain,rainy',
      Snow: 'https://source.unsplash.com/1600x900/?snow,winter',
      Thunderstorm: 'https://source.unsplash.com/1600x900/?thunderstorm',
      Drizzle: 'https://source.unsplash.com/1600x900/?drizzle,light-rain',
      Mist: 'https://source.unsplash.com/1600x900/?mist,fog'
    };
    return conditions[condition] || 'https://source.unsplash.com/1600x900/?weather';
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 transition-colors duration-200 ${isDark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Weather Forecast</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCityManager(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Manage Cities
            </button>
            <button
              onClick={() => setIsFahrenheit(!isFahrenheit)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isFahrenheit ? '°C' : '°F'}
            </button>
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CITIES.map((city) => {
            const data = weatherData[city.id];
            if (!data) return null;

            const temp = isFahrenheit ? celsiusToFahrenheit(data.temperature) : data.temperature;
            const feelsLike = isFahrenheit ? celsiusToFahrenheit(data.feelsLike) : data.feelsLike;

            return (
              <div
                key={city.id}
                className="relative overflow-hidden rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                style={{
                  backgroundImage: `url(${getWeatherBackground(data.condition)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
                <div className="relative p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{city.name}</h2>
                      <p className="text-sm opacity-90">{city.country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold">{temp}°{isFahrenheit ? 'F' : 'C'}</p>
                      <p className="text-sm opacity-90">Feels like {feelsLike}°</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm opacity-75">Condition</p>
                      <p className="font-semibold">{data.condition}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-75">Humidity</p>
                      <p className="font-semibold">{data.humidity}%</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-75">Wind Speed</p>
                      <p className="font-semibold">{data.windSpeed} km/h</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-75">Sunrise/Sunset</p>
                      <p className="font-semibold">
                        {formatTime(data.sunrise)} / {formatTime(data.sunset)}
                      </p>
                    </div>
                  </div>

                  {data.daily && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <h3 className="text-lg font-semibold mb-2">7-Day Forecast</h3>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {data.daily.map((day: DailyForecast, index: number) => (
                          <div key={index} className="flex flex-col items-center min-w-[4rem]">
                            <p className="text-sm">{formatDate(day.date)}</p>
                            <Image
                              src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                              alt={day.condition}
                              width={32}
                              height={32}
                              className="w-8 h-8"
                            />
                            <p className="text-sm font-semibold">
                              {isFahrenheit ? celsiusToFahrenheit(day.temperature.max) : day.temperature.max}°
                            </p>
                            <p className="text-xs opacity-75">
                              {isFahrenheit ? celsiusToFahrenheit(day.temperature.min) : day.temperature.min}°
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCityManager && <CityManager onClose={() => setShowCityManager(false)} />}
    </div>
  );
}
