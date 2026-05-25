import { useState, useEffect } from "react"

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

interface Article {
	title:	string
	source:	string
	url:	string
}

const CATEGORIES = ["technology", "business", "sports", "health", "politics"];

export default function NewsWidget() {
	const [articles, setArticles]					= useState<Article[]>([]);
	const [loading, setLoading]						= useState(true);
	const [error, setError]							= useState<string | null>(null);
	const [selectedCategory, setSelectedCategory]	= useState("technology");

	useEffect(() => {
		async function fetchNews() {
			setLoading(true);
			setError(null);

			try {
				const response	= await fetch (`/api/news?category=${selectedCategory}`);
				const data		= await response.json();

				if (data.error) {
					setError(data.error);
					return;
				}

				setArticles(data);
			} catch (error) {
				setError("Failed to fetch news");
			} finally {
				setLoading(false);
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

			{!loading && !error && articles.map((article) => (
				<div key={article.url}>
					<p>{article.source}</p>
					<a href={article.url} target="_blank" rel="noreferrer">
						{truncate(stripSource(article.title), 80)}
					</a>
				</div>
			))}
		</div>
	);
}
