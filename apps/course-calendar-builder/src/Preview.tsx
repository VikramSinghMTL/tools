import type React from "react";
import { useEffect, useState } from "react";
import {
	activitiesIn,
	activityKey,
	type CalendarData,
	type TypeData,
} from "./calendar";

interface PreviewProps {
	jsonData: string;
}

// Helper function to get color based on activity type
const getActivityColor = (types: TypeData[], activityType: string) => {
	const type = types.find((t) => t.name === activityType);
	return type ? type.color : "#DDDDDD"; // Default to gray if type is not found
};

const Preview: React.FC<PreviewProps> = ({ jsonData }) => {
	const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
	const [isError, setIsError] = useState<boolean>(false);

	useEffect(() => {
		if (jsonData.trim() === "") return; // Skip parsing if jsonData is empty

		try {
			const data = JSON.parse(jsonData);
			setCalendarData(data);
			setIsError(false);
		} catch (error) {
			console.error("Invalid JSON format:", error);
			setIsError(true);
		}
	}, [jsonData]);

	return (
		<div>
			{isError ? (
				<p className="text-red-500">Invalid JSON format. Please correct it.</p>
			) : calendarData?.weeks ? (
				<table className="table-auto w-full border-gray-300 rounded-md font-mono text-sm">
					<thead className="sticky top-0 bg-gray-700 text-white z-10">
						<tr>
							<th className="p-1">Week</th>
							{/* Minimal padding for week column */}
							{calendarData.columns.map((column) => (
								<th key={column} className="p-2">
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{calendarData.weeks.map((weekData) => (
							<tr key={weekData.week}>
								{/* Week Column with Reduced Padding */}
								<td
									className="border p-1 bg-gray-100 font-bold"
									style={{
										writingMode: "vertical-lr",
										textOrientation: "sideways-right",
										transform: "rotate(180deg)",
										fontSize: "1rem",
										textAlign: "center",
									}}
								>
									{weekData.week}
								</td>

								{/* Dynamic Columns */}
								{calendarData.columns.map((column) => (
									<td
										key={column}
										className="border p-4"
										style={{
											backgroundImage: weekData[column]
												? undefined
												: `repeating-linear-gradient(
                        135deg,
                        #eee,
                        #eee 5px,
                        transparent 5px,
                        transparent 10px
                      )`,
										}}
									>
										<ul>
											{activitiesIn(weekData, column).map((activity) => (
												<li
													key={activityKey(activity)}
													style={{
														backgroundColor: getActivityColor(
															calendarData.types,
															activity.type,
														),
													}}
													className="text-xs mb-1 p-2 rounded-sm text-white hover:shadow-md hover:transform hover:-translate-y-0.5 transition-transform flex justify-between items-center"
												>
													<a
														href={activity.link || "#"}
														className="w-full flex justify-between items-center"
														target="_blank"
														rel="noopener noreferrer"
													>
														{/* Title */}
														<span>{activity.title}</span>

														{/* Due Date */}
														{activity.due && (
															<span className="text-xs text-white font-bold mx-2">
																DUE {activity.due}
															</span>
														)}

														{/* Time */}
														{activity.time && (
															<span className="ml-2">({activity.time})</span>
														)}
													</a>
												</li>
											))}
										</ul>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			) : (
				<p className="text-red-500">No data available.</p>
			)}
		</div>
	);
};

export default Preview;
