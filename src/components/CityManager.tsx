'use client';

import { useState, useEffect } from 'react';
import { City, DEFAULT_CITIES, CITIES, updateCities, resetCities } from '@/types/weather';

interface SearchResult extends City {
  displayName?: string;
}

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const GEO_API_URL = 'https://api.openweathermap.org/geo/1.0';

interface CityManagerProps {
  onClose: () => void;
}

export default function CityManager({ onClose }: CityManagerProps) {
  const [selectedCities, setSelectedCities] = useState<City[]>(CITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCityToReplace, setSelectedCityToReplace] = useState<City | null>(null);

  const handleCityToggle = (city: City) => {
    setSelectedCities(prev => {
      const cityExists = prev.some(c => c.id === city.id);
      if (cityExists) {
        return prev.filter(c => c.id !== city.id);
      } else {
        return [...prev, city];
      }
    });
  };

  const searchCities = async (query: string) => {
    if (!query.trim() || !API_KEY) return;

    setLoading(true);
    try {
      let endpoint = '';
      if (/^\d+$/.test(query)) { // Check if query is a zip code
        endpoint = `${GEO_API_URL}/zip?zip=${query}&appid=${API_KEY}`;
      } else {
        endpoint = `${GEO_API_URL}/direct?q=${query}&limit=5&appid=${API_KEY}`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      const results = Array.isArray(data) ? data : [data];
      const formattedResults: SearchResult[] = results.map((item: any) => ({
        id: Math.random() * 1000000, // Generate temporary ID
        name: item.name,
        country: item.country,
        coordinates: {
          lat: item.lat,
          lon: item.lon
        },
        displayName: `${item.name}, ${item.state || ''} ${item.country}`
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        searchCities(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleCityReplace = (newCity: City) => {
    if (selectedCityToReplace) {
      const updatedCities = selectedCities.map(city =>
        city.id === selectedCityToReplace.id ? { id: city.id, name: newCity.name, country: newCity.country, coordinates: newCity.coordinates } : city
      );
      setSelectedCities(updatedCities);
      updateCities(updatedCities); // Update global CITIES array immediately
      setSelectedCityToReplace(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSave = () => {
    if (selectedCities.length === 0) {
      alert('Please select at least one city');
      return;
    }
    updateCities(selectedCities);
    onClose();
  };

  const handleReset = () => {
    resetCities();
    setSelectedCities(DEFAULT_CITIES);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Manage Cities</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search city by name or zip code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {loading && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
          )}
          {searchResults.length > 0 && (
            <div className="mt-2 border rounded-lg overflow-hidden dark:border-gray-600">
              {searchResults.map((city) => (
                <div
                  key={city.id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                  onClick={() => handleCityReplace(city)}
                >
                  <span className="text-gray-700 dark:text-gray-200">{city.displayName}</span>
                  {selectedCityToReplace && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Will replace {selectedCityToReplace.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2 mb-6">
          {selectedCities.map(city => (
            <label
              key={city.id}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              <button
                onClick={() => setSelectedCityToReplace(city)}
                className={`px-3 py-1 rounded ${selectedCityToReplace?.id === city.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              >
                Replace
              </button>
              <span className="text-gray-700 dark:text-gray-200">
                {city.name}, {city.country}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Reset to Default
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}