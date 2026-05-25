import ClockWidget from "./widgets/ClockWidget"
import StocksWidget from "./widgets/StocksWidget";
import WeatherWidget from "./widgets/WeatherWidget";

export default function App() {
	return (
		<>
			<ClockWidget />
			<WeatherWidget />
			<StocksWidget />
		</>
	);
}