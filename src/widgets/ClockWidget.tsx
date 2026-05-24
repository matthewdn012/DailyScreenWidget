import { useState, useEffect } from "react"

function addLeadingZero(n: number): string {
	return String(n).padStart(2, "0");
}

export default function ClockWidget() {
	const [now, setNow] = useState(new Date());
	const [use24Hour, setUse24Hour] = useState(false);


	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(id);
	}, []);

	const hours		= now.getHours();
	const ampm		= hours >= 12 ? "PM" : "AM";
	const h			= hours % 12 || 12;
	const time		= use24Hour
		? `${addLeadingZero(hours)}:${addLeadingZero(now.getMinutes())}`
		: `${addLeadingZero(h)}:${addLeadingZero(now.getMinutes())} ${ampm}`;

	const days		= ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	const months	= ["January","February","March","April","May","June","July","August","September","October","November","December"];
	const dateStr	= `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

	return (
		<div>
			<p>{time}</p>
			<p>{dateStr}</p>
			<button onClick={() => setUse24Hour(!use24Hour)}>
				{use24Hour ? "Switch to 12h" : "Switch to 24h"}
			</button>
		</div>
	);
}
