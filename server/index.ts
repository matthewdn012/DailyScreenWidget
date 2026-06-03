import express		from "express"
import os			from "os"
import Anthropic	from "@anthropic-ai/sdk"
import "dotenv/config"
import { stripSource } from "../utils/strings"

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

app.use(express.json());

/********************************************************************************************
 * Weather Section
 ********************************************************************************************/
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
});
/********************************************************************************************/


/********************************************************************************************
 * Stocks Section
 ********************************************************************************************/
const stockCache: Record<string, { data:unknown; timestamp: number }> = {};
const CACHE_TTL = 24*60*60*1000; // 1 hour in milliseconds

// Stocks API call
app.get("/api/stocks", async (req, res) => {
	const tickers		= ["AAPL", "NVDA", "SPY"];
	const polygonApiKey	= process.env.POLYGON_API_KEY;
	const now			= Date.now();

	try {
		const results = await Promise.all(
			tickers.map(async (ticker) => {
				const cached	= stockCache[ticker];
				if (cached && now - cached.timestamp < CACHE_TTL)
				{
					return cached.data;
				}

				const [quoteRes, nameRes] = await Promise.all ([
					fetch(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apiKey=${polygonApiKey}`),
					fetch(`https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${polygonApiKey}`)
				]);

				const quoteData		= await quoteRes.json();
				const nameData		= await nameRes.json();

				if (quoteData.status === "ERROR") {
					throw new Error(quoteData.error);
				}

				const quote			= quoteData.results?.[0];
				const name			= nameData.results?.name || Symbol;

				const change		= (quote.c - quote.o).toFixed(2);
				const changePercent	= (((quote.c - quote.o) / quote.o) * 100).toFixed(2);

				const result = {
					ticker:			ticker,
					name,
					price:			quote.c.toFixed(2),
					change,
					changePercent,
				}
				stockCache[ticker] = { data: result, timestamp: now };
				return result;
			})
		);
		res.json(results);
	} catch(error) {
		console.error("Stock fetch error:", error);
		res.status(500).json({ error: "Failed to fetch stock data" });
	}
});

/********************************************************************************************
 * Stock Analysis Section
 ********************************************************************************************/
app.get("/api/stock-analysis/:ticker", async (req, res) => {
	const ticker		= req.params.ticker.toUpperCase();
	const polygonApiKey	= process.env.POLYGON_API_KEY;
	const newsKey		= process.env.NEWSORG_API_KEY;

	try {
		const cached	= stockCache[ticker];
		const stockData	= cached ? cached.data as any : null;

		if (!stockData) {
			res.status(404).json({ error: "Stock data not found, load stocks first" });
			return;
		}

		const newsResponse	= await fetch(
			`https://newsapi.org/v2/everything?q=${encodeURIComponent(stockData.name)}&sortBy=publishedAt&pageSize=3&apiKey=${newsKey}`
		);
		const newsData		= await newsResponse.json();

		const headlines		= newsData.articles
								?.slice(0,3)
								.map((a: any) => stripSource(a.title))
								.join("\n") || "No recent headlines found";

		const message		= await anthropic.messages.create({
			model:		"claude-sonnet-4-5",
			max_tokens:	1024,
			system:		`You are a concise financial analyst. Given a stock's price movement and related news headlines, provide 1 concise sentence insight explaining what might be driving the price change. Be direct and specific. Never use markdown.`,
			messages:	[
						{
							role:		"user",
							content:	`Stock:	${stockData.name} (${ticker})
										Price:	$${stockData.price}
										Change:	${stockData.change} (${stockData.changePercent}%)
										Recent headlines:
										${headlines}`,
						}
			]
		});

		const content	= message.content[0];
		if (content.type !== "text") {
			res.status(500).json({ "error": "Unexpected response from Claude API" });
			return;
		}

		res.json({
			ticker,
			name:		stockData.name,
			insight:	content.text,
			headlines:	newsData.articles?.slice(0,3).map((a: any) => ({
				title:	stripSource(a.title),
				url:	a.url,
			})),
		});
	} catch (error) {
		console.error("Stock analysis error:", error);
		res.status(500).json({ error: "Failed to generate stock analysis" });
	}
});
/********************************************************************************************/


/********************************************************************************************
 * News Section
 ********************************************************************************************/
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
});
/********************************************************************************************/



/********************************************************************************************
 * System Health Section
 ********************************************************************************************/
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

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post("/api/sentiment", async (req, res) => {
	const { headlines }	= req.body;

	if (!headlines || !Array.isArray(headlines)) {
		res.status(400).json({ error: "Headlines array is required" });
		return;
	}

	try {
		const message	= await anthropic.messages.create({
			model:		"claude-sonnet-4-5",
			max_tokens:	1024,
			system: `You are a financial and political news sentiment analyzer.
			Your job is to score news headlines on a scale from -100 to 100 based on their likely impact on markets, society, and public perception.
			-100 is extremely negative, 0 is completely neutral, 100 is extremely positive.
			You must respond with ONLY a valid JSON array, no markdown, no explanation, no backticks.
			Each object in the array must have exactly two fields: "index" (number) and "score" (number).`,
			messages:	[
				{
					role:		"user",
					content:	headlines.map((h: string, i: number) => `${i}. ${h}`).join("\n"),
				},
				{
					role:		"assistant",
					content:	"[",
				}
			]
		})

		const content	= message.content[0];
		if (content.type !== "text") {
			res.status(500).json({ error: "Unexpected response from Claude"});
			return;
		}

		const sentiments	= JSON.parse("[" + content.text);
		res.json(sentiments);
	} catch (error) {
		console.error("Sentiment error:", error);
		res.status(500).json({ error: "Failed to analyze sentiment" });
	}
});
/********************************************************************************************/

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});