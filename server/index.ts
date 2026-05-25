import express	from "express"
import os		from "os"
import "dotenv/config"

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const start = os.cpus()

    setTimeout(() => {
      const end = os.cpus()
      let idleDiff = 0
      let totalDiff = 0

      for (let i = 0; i < start.length; i++) {
        const startTimes = start[i].times
        const endTimes = end[i].times

        const startTotal = Object.values(startTimes).reduce((a, b) => a + b, 0)
        const endTotal = Object.values(endTimes).reduce((a, b) => a + b, 0)

        idleDiff += endTimes.idle - startTimes.idle
        totalDiff += endTotal - startTotal
      }

      const usage = Math.round((1 - idleDiff / totalDiff) * 100)
      resolve(usage)
    }, 500)
  })
}

const app	= express();
const PORT	= 3000;

/**
 * Weather Section
 */
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

/**
 * Stocks Section
 */
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

/**
 * News Section
 */
const newsCache: Record<string, { data: unknown; timestamp: number }> = {};

app.get("/api/news", async (req, res) => {
	const apiKey	= process.env.NEWSORG_API_KEY;
	const category	= req.query.category || "technology";
	const now		= Date.now();

	if (newsCache[category as string] && now - newsCache[category as string].timestamp < CACHE_TTL) {
		res.json(newsCache[category as string].data);
		return;
	}

	try {
		const response = await fetch(
			`https://newsapi.org/v2/top-headlines?country=us&category=${category}&pagesize=5&apiKey=${apiKey}`
		);
		const data	= await response.json();

		if (data.status !== "ok") {
			res.status(500).json({ error: "Failed to fetch news" });
			return;
		}

		const articles = data.articles.map((article: any) => ({
				title:	article.title,
				source:	article.source.name,
				url:	article.url,
			})
		)

		newsCache[category as string] = { data: articles, timestamp: now };
		res.json(articles);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch news" });
	}
})

/**
 * System Health Section
 */
app.get("/api/system", async (req, res) => {
	const totalMem		= os.totalmem();
	const freeMem		= os.freemem();
	const usedMem		= totalMem - freeMem;
	const memPercent	= Math.round((usedMem/totalMem) * 100);

	const cpus			= os.cpus();
	const cpuUsage		= await getCpuUsage();
	const uptime		= os.uptime();

	res.json({
		memory: {
			total:		Math.round(totalMem / 1024 / 1024 / 1024),
			used:		Math.round(usedMem/ 1024 / 1024 / 1024),
			percent:	memPercent,
		},
		cpu: {
			mode:	cpus[0].model,
			cores:	cpus.length,
			speed:	cpus[0].speed,
			usage:	cpuUsage,
		},
    	uptime: Math.round(uptime / 3600)
	})
})

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});