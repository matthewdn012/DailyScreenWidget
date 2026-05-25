import ClockWidget from "./widgets/ClockWidget"
import NewsWidget from "./widgets/NewsWidget";
import StocksWidget from "./widgets/StocksWidget";
import SystemWidget from "./widgets/SystemWidget";
import WeatherWidget from "./widgets/WeatherWidget";

export default function App() {
	return (
		<>
			<ClockWidget />
			<WeatherWidget />
			<StocksWidget />
			<NewsWidget />
			<SystemWidget />
		</>
	);
}