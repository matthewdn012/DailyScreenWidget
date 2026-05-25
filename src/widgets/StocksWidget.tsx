import { useState, useEffect } from "react"

interface StockQuote {
	ticker:			string
	price:			string
	change:			string
	changePercent:	string
}

export default function StocksWidget() {
	const [stocks, setStocks]	= useState<StockQuote[]>([]);
	const [loading, setLoading]	= useState(true);
	const [error, setError]		= useState<string | null>(null);

	useEffect(() => {
		async function fetchStocks() {
			try {
				const response	= await fetch("/api/stocks");
				const data		= await response.json();

				if (data.error) {
					setError(data.error);
					return;
				}

				setStocks(data);
			} catch (error) {
				setError("Failed to fetch stocks");
			} finally {
				setLoading(false);
			}
		}

		fetchStocks();
	}, []);

	if (loading)		return <p>Loading stocks...</p>;
	if (error)			return <p>{error}</p>;
	if (!stocks.length)	return null;

	return (
		<div>
			{stocks.map((stock) => {
				const isPositive	= parseFloat(stock.change) >= 0;

				return (
					<div key={stock.ticker}>
						<span>{stock.ticker}</span>
						<span>${stock.price}</span>
						<span>{isPositive ? "+" : ""}{stock.change} ({stock.changePercent}%)</span>
					</div>
				);
			})}
		</div>
	);
}
