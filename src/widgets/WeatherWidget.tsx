import { useState, useEffect } from "react"

interface WeatherData {
	name: string
	main: {
		temp: number
		feels_like: number
		humidity: number
	}
	weather: {
		description: string
	} []
	wind: {
		speed: number
	}
}

export default function WeatherWidget() {
	const [weather, setWeather]	= useState<WeatherData | null>(null);
	const [loading, setLoading]	= useState(true);
	const [error, setError]		= useState<string | null>(null);

	useEffect(() => {
		async function fetchWeather() {
			try {
				const response	= await fetch("/api/weather");
				const data		= await response.json();
				if (!data.main) {
					setError("Weather data unavailable")
					return
				}
				setWeather(data);
			} catch (error) {
				setError("Failed to fetch weather");
			} finally {
				setLoading(false);
			}
		}
		fetchWeather()
	}, []);

	if (loading)	return <p>Loading weather...</p>;
	if (error)		return <p>{error}</p>;
	if (!weather)	return null;

	return (
		<div>
			<p>{weather.name}</p>
			<p>{Math.round(weather.main.temp)}°F</p>
			<p>{weather.weather[0].description}</p>
			<p>Feels like {Math.round(weather.main.feels_like)}°F</p>
			<p>Humidity {weather.main.humidity}%</p>
			<p>Wind {Math.round(weather.wind.speed)} mph</p>
		</div>
	);
}