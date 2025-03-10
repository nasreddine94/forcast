export interface City {
  id: number;
  name: string;
  country: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  feelsLike: number;
  sunrise: number;
  sunset: number;
  daily?: DailyForecast[];
}

export interface DailyForecast {
  date: number;
  temperature: {
    min: number;
    max: number;
  };
  condition: string;
  icon: string;
}

export const DEFAULT_CITIES: City[] = [
  {
    id: 1,
    name: 'Algiers',
    country: 'DZ',
    coordinates: { lat: 36.7538, lon: 3.0588 }
  },
  {
    id: 2,
    name: 'London',
    country: 'GB',
    coordinates: { lat: 51.5074, lon: -0.1278 }
  },
  {
    id: 3,
    name: 'Tokyo',
    country: 'JP',
    coordinates: { lat: 35.6762, lon: 139.6503 }
  },
  {
    id: 4,
    name: 'Sydney',
    country: 'AU',
    coordinates: { lat: -33.8688, lon: 151.2093 }
  },
  {
    id: 5,
    name: 'Dubai',
    country: 'AE',
    coordinates: { lat: 25.2048, lon: 55.2708 }
  },
  {
    id: 6,
    name: 'Paris',
    country: 'FR',
    coordinates: { lat: 48.8566, lon: 2.3522 }
  }
];

// Create a mutable array for user-selected cities
export let CITIES: City[] = [...DEFAULT_CITIES];

// Function to update user's city preferences
export const updateCities = (newCities: City[]) => {
  CITIES = newCities;
};

// Function to reset cities to default
export const resetCities = () => {
  CITIES = [...DEFAULT_CITIES];
};


export const API_KEY = '4c1cdff5a52a3d4ec1313da75bf24138';