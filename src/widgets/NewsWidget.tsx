import { useState, useEffect } from "react"

interface Article {
	title:	string
	source:	string
	url:	string
}

interface SentimentResult {
	index:	number
	score:	number
}

const CATEGORIES = ["technology", "business", "sports", "health", "politics"];

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text
	return text.slice(0, maxLength) + "..."
}

function stripSource(title: string): string {
  const parts = title.split(" - ")
  if (parts.length <= 1) return title
  parts.pop()
  return parts.join(" - ")
}

function getScoreColor(score: number): string {
	if (score >= 60) return "#4ade80";
	if (score >= 20) return "#86efac";
	if (score > -20) return "#9ca3af";
	if (score > -60) return "#f87171";
	if (score >-100) return "#ef4444";
	else return "error";
}

export default function NewsWidget() {
	const [articles, setArticles]					= useState<Article[]>([]);
	const [loading, setLoading]						= useState(true);
	const [error, setError]							= useState<string | null>(null);
	const [selectedCategory, setSelectedCategory]	= useState("technology");

	const [sentiments, setSentiments]				= useState<Record<number, number>>({});
	const [sentimentLoading, setSentimentLoading]	= useState(false);

	useEffect(() => {
		async function fetchNews() {
			setLoading(true);
			setError(null);
			setSentiments({});

			try {
				const response	= await fetch (`/api/news?category=${selectedCategory}`);
				const data		= await response.json();

				if (data.error) {
					setError(data.error);
					return;
				}

				setArticles(data);
				fetchSentiment(data);
			} catch (error) {
				setError("Failed to fetch news");
			} finally {
				setLoading(false);
			}
		}

		async function fetchSentiment(articles: Article[]) {
			setSentimentLoading(true);

			try {
				const headlines	= articles.map((a) => stripSource(a.title));
				const response	= await fetch("/api/sentiment", {
					method:		"POST",
					headers:	{ "Content-Type": "application/json" },
					body:		JSON.stringify({ headlines }),
				})
				const data: SentimentResult[] = await response.json();

				const scoreMap: Record<number, number> = {};
				data.forEach((result) => {
					scoreMap[result.index] = result.score
				});
				setSentiments(scoreMap);
			} catch (error) {
				console.error("Failed to fetch sentiment");
			} finally {
				setSentimentLoading(false);
			}
		}

		fetchNews();
	}, [selectedCategory])

	return (
		<div>
			<div>
				{CATEGORIES.map((category) => (
					<button
						key={category}
						onClick={() =>setSelectedCategory(category)}
					>
						{category}
					</button>
				))}
			</div>

			{loading && <p>Loading news...</p>}
			{error && <p>{error}</p>}

			{!loading && !error && articles.map((article, index) => (
				<div key={article.url}>
					<p>{article.source}</p>
					{sentiments[index] !== undefined && (
						<span style={{ color: getScoreColor(sentiments[index]) }}>
							{sentiments[index] > 0 ? "+" : ""}{sentiments[index]}
						</span>
					)}
					{sentimentLoading && sentiments[index] === undefined && (
						<span>...</span>
					)}
					<a href={article.url} target="_blank" rel="noreferrer">
						{truncate(stripSource(article.title), 80)}
					</a>
				</div>
			))}
		</div>
	);
}
