import { useState, useEffect } from "react"

interface SystemData {
	memory: {
		total:		number
		used:		number
		percent:	number
	}
	cpu: {
		model:		string
		cores:		number
		speed:		number
		usage:		number
	}
	uptime: number
}

export default function SystemWidget() {
	const [system, setSystem]	= useState<SystemData | null>(null);
	const [error, setError]		= useState<string | null>(null);

	useEffect(() => {
		async function fetchSystem() {
			try {
				const response	= await fetch("/api/system");
				const data		= await response.json();

				if (data.error) {
					setError(data.error);
					return;
				}

				setSystem(data);
			} catch (error) {
				setError("Failed to fetch system data");
			}
		}

		fetchSystem();
		const id = setInterval(fetchSystem, 5000);
		return () => clearInterval(id);
	}, []);

	if (error)		return <p>{error}</p>;
	if (!system)	return <p>Loading system...</p>

	return (
		<div>
			<div>
				<span>CPU </span>
				<span>{system.cpu.usage}% </span>
				<span>{system.cpu.cores} cores @ {system.cpu.speed} MHz</span>
			</div>
			<div>
				<span>Memory </span>
				<span>{system.memory.percent}% </span>
				<span>{system.memory.used}GB / {system.memory.total}GB</span>
			</div>
			<div>
				<span>Uptime </span>
				<span>{system.uptime}h</span>
			</div>
		</div>
	);
}
