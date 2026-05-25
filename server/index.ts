import express from "express"
import "dotenv/config"

const app	= express();
const PORT	= 3000;

// Weather API call
app.get("/api/weather", async (req, res) => {
	const city		= req.query.city || "Los Angeles";
	const apiKey	= process.env.OPENWEATHER_API_KEY;

	try {
		const response = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`
		);
		const data = await response.json()
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch weather data via API" });
	}
})

const stockCache: Record<string, { data:unknown; timestamp: number }> = {};
const CACHE_TTL = 60*60*1000; // 1 hour in milliseconds

// Stocks API call
app.get("/api/stocks", async (req, res) => {
	const tickers	= ["AAPL", "NVDA", "SPY"];
	const apiKey	= process.env.ALPHAVANTAGE_API_KEY;
	const now		= Date.now();

	try {
		const results = [];
		for (const ticker of tickers) {
			const cached = stockCache[ticker];
			if (cached && now - cached.timestamp < CACHE_TTL) {
				results.push(cached.data);
				continue
			}

			const response = await fetch(
				`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`
			);

			const data = await response.json();
			console.log("Alpha Vantage response:", JSON.stringify(data));

			if (data["Information"]) {
				res.status(429).json({ error: "Rate limit hit, try again in a moment" });
				return;
			}

			const quote		= data["Global Quote"];
			const result	= {
				ticker,
				price: parseFloat(quote["05. price"]).toFixed(2),
				change: parseFloat(quote["09. change"]).toFixed(2),
				changePercent: quote["10. change percent"].replace("%", "").trim(),
			}

			stockCache[ticker] = { data: result, timestamp: now };
			results.push(result);

			await new Promise(resolve => setTimeout(resolve, 1200));
		}

		res.json(results);
	} catch(error) {
		console.error("Stock fetch error:", error);
		res.status(500).json({ error: "Failed to fetch stock data" });
	}
})

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});