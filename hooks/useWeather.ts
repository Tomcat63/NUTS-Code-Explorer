
import { useState, useEffect } from 'react';

export interface WeatherData {
    temp: number;
    windSpeed: number;
    description: string;
    icon: string;
}

export const useWeather = (regionName: string | null, enabled: boolean) => {
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!regionName || !enabled) {
            setData(null);
            return;
        }

        const cleanName = regionName
            .replace(/, Stadt$/i, '')
            .replace(/, Lk\.$/i, '')
            .replace(/Regierungsbezirk /i, '')
            .replace(/Landkreis /i, '')
            .trim();

        let isMounted = true;
        const fetchWeather = async () => {
            setLoading(true);
            try {
                // Using Open-Meteo (free, no API key needed)
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=de`);
                const geoData = await geoRes.json();

                if (!geoData.results || geoData.results.length === 0) {
                    if (isMounted) setData(null);
                    return;
                }

                const { latitude, longitude } = geoData.results[0];
                const weatherRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code`
                );
                const weatherData = await weatherRes.json();

                if (isMounted && weatherData.current) {
                    const code = weatherData.current.weather_code;
                    setData({
                        temp: Math.round(weatherData.current.temperature_2m),
                        windSpeed: Math.round(weatherData.current.wind_speed_10m),
                        description: getWeatherDescription(code),
                        icon: getWeatherIcon(code),
                    });
                }
            } catch (e) {
                if (isMounted) setData(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchWeather();
        return () => { isMounted = false; };
    }, [regionName, enabled]);

    return { data, loading };
};

function getWeatherDescription(code: number): string {
    if (code === 0) return 'Klar';
    if (code <= 3) return 'Bewölkt';
    if (code <= 49) return 'Nebel';
    if (code <= 69) return 'Regen';
    if (code <= 79) return 'Schnee';
    if (code <= 99) return 'Gewitter';
    return 'Unbekannt';
}

function getWeatherIcon(code: number): string {
    if (code === 0) return '☀️';
    if (code <= 3) return '☁️';
    if (code <= 49) return '🌫️';
    if (code <= 69) return '🌧️';
    if (code <= 79) return '❄️';
    if (code <= 99) return '⛈️';
    return '🌡️';
}
