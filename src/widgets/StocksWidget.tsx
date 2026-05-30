import { useState, useEffect } from "react"
import { truncate } from "../../utils/strings"

interface StockQuote {
	ticker:			string
	name:			string
	price:			string
	change:			string
	changePercent:	string
}

interface StockAnalysis{
	ticker:			string
	name:			string
	insight:		string
	headlines:		{ title: string; url: string }[]
}

export default function StocksWidget() {
	const [stocks, setStocks]					= useState<StockQuote[]>([]);
	const [loading, setLoading]					= useState(true);
	const [error, setError]						= useState<string | null>(null);

	const [selectedTicker, setSelectedTicker]	= useState<string | null>(null);
	const [analysis, setAnalysis]				= useState<StockAnalysis | null>(null);
	const [analysisLoading, setAnalysisLoading]	= useState(false);

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

	async function handleTickerClick(ticker: string) {
		if (selectedTicker === ticker) {
			setSelectedTicker(null);
			setAnalysis(null);
			return;
		}
		setSelectedTicker(ticker);
		setAnalysis(null);
		setAnalysisLoading(true);

		try {
			const response	= await fetch(`/api/stock-analysis/${ticker}`);
			const data		= await response.json();

			if (data.error) return;
			setAnalysis(data);
		} catch (error) {
			console.error("Failed to fetch analysis");
		} finally {
			setAnalysisLoading(false);
		}
	}

	if (loading)		return <p>Loading stocks...</p>;
	if (error)			return <p>{error}</p>;
	if (!stocks.length)	return null;

	return (
		<div>
			{stocks.map((stock) => {
				const isPositive	= parseFloat(stock.change) >= 0;

				return (
					<div key={stock.ticker}>
						<div onClick={() => handleTickerClick(stock.ticker)} style={{ cursor: "pointer" }}>
							<div>
								<span>{stock.ticker}</span>
								<span>{stock.name}</span>
							</div>
							<span>${stock.price}</span>
							<span>{isPositive ? "+" : ""}{stock.change} ({stock.changePercent}%)</span>
						</div>
						{selectedTicker === stock.ticker && (
							<div>
								{analysisLoading && <p>Analyzing...</p>}
								{analysis && (
									<div>
										<p>{analysis.insight}</p>
										{analysis?.headlines.map((h) => (
											<a key={h.url} href={h.url} target="_blank" rel="norefferer">
												{truncate(h.title, 10)}
											</a>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
