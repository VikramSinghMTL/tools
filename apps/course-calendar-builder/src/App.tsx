import type React from "react";
import { useCallback, useState } from "react";
import { activitiesIn, type CalendarData, type WeekData } from "./calendar";
import Divider from "./Divider";
import JsonEditor from "./JsonEditor";
import Preview from "./Preview";

const App: React.FC = () => {
	const [jsonData, setJsonData] = useState<string>(`{
		"types": [],
		"columns": [],
		"weeks": []
	}`);

	const [editorWidth, setEditorWidth] = useState<number>(33);

	// Stable, so the divider doesn't re-register its listeners on every render.
	const handleDrag = useCallback((deltaX: number) => {
		setEditorWidth((prevWidth) =>
			Math.min(
				80,
				Math.max(20, prevWidth + (deltaX / window.innerWidth) * 100),
			),
		);
	}, []);

	// Function to handle JSON import
	const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result;
				if (result) setJsonData(result.toString());
			};
			reader.readAsText(file);
		}

		// Reset the input value to allow the same file to be uploaded again
		event.target.value = "";
	};

	// Function to export the current JSON data
	const exportJSON = () => {
		const blob = new Blob([jsonData], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "calendar-config.json";
		link.click();
		URL.revokeObjectURL(url);
	};

	// Function to generate exportable HTML from JSON data
	const exportHTML = () => {
		const calendarHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Course Calendar</title>
<link rel="stylesheet" href="calendar.css">
</head>
<body>
<div id="calendar">${generateCalendarHTML()}</div>
</body>
</html>
    `;
		const blob = new Blob([calendarHTML], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "calendar.html";
		link.click();
		URL.revokeObjectURL(url);
	};

	// Function to generate exportable CSS for the calendar
	const exportCSS = () => {
		const calendarCSS = generateCalendarCSS();
		const blob = new Blob([calendarCSS], { type: "text/css" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "calendar.css";
		link.click();
		URL.revokeObjectURL(url);
	};

	// Helper function to generate CSS based on activity types
	const generateCalendarCSS = () => {
		try {
			const data = JSON.parse(jsonData);
			const typeStyles = data.types
				.map(
					(type: { name: string; color: string }) => `
      .vik-${type.name} {
        background-color: ${type.color};
        color: white;
        padding: 8px;
        border-radius: 5px;
        font-weight: bold;
      }
    `,
				)
				.join("");

			return `
/* Calendar Styles */
.table-auto {
  width: 100%;
  border-collapse: collapse;
  margin: 0; /* Zero margin for full-width display */
}

thead {
  background-color: #414559;
  color: white;
  position: sticky;
  top: 0;
  z-index: 1;
}

th, td {
  border: 1px solid #dddddd;
  padding: 8px;
  font-family: monospace;
  font-size: 0.8rem;
}

.vik-cancelled, .vik-async {
  color: #666;
  font-weight: bold;
  background-image: repeating-linear-gradient(
    135deg,
    #eee,
    #eee 5px,
    transparent 5px,
    transparent 10px
  );
}

.vik-item {
  color: #fff;
  padding: 8px;
  border-radius: 5px;
  font-weight: bold;
}

/* Activity types styling */
${typeStyles}
    `;
		} catch (error) {
			console.error("Invalid JSON format for CSS generation", error);
			return "/* Error generating CSS */";
		}
	};

	// Helper function to generate calendar HTML content from JSON data
	const generateCalendarHTML = () => {
		try {
			const data: CalendarData = JSON.parse(jsonData);
			const columns = data.columns
				.map((column: string) => `<th>${column}</th>`)
				.join("");
			const weeks = data.weeks
				.map(
					(week: WeekData) => `
        <tr>
          <td class="p-1">${week.week}</td>
          ${data.columns
						.map(
							(col: string) => `
            <td>
              <ul>
                ${activitiesIn(week, col)
									.map(
										(activity) => `
                  <li class="vik-item vik-${activity.type}">
                    ${activity.title} ${
											activity.due
												? `<span class="due">${activity.due}</span>`
												: ""
										}
                  </li>
                `,
									)
									.join("")}
              </ul>
            </td>
          `,
						)
						.join("")}
        </tr>
      `,
				)
				.join("");

			return `
        <table class="table-auto">
          <thead>
            <tr>
              <th>Week</th>${columns}
            </tr>
          </thead>
          <tbody>${weeks}</tbody>
        </table>
      `;
		} catch (error) {
			console.error("Invalid JSON format", error);
			return "<p>Error loading calendar data</p>";
		}
	};

	return (
		<div className="flex flex-col h-screen overflow-hidden">
			<div className="flex flex-1 overflow-hidden">
				<div className="overflow-hidden" style={{ width: `${editorWidth}%` }}>
					<JsonEditor jsonData={jsonData} setJsonData={setJsonData} />
				</div>
				<Divider onDrag={handleDrag} />
				<div
					className="overflow-y-auto"
					style={{
						width: `${100 - editorWidth}%`,
					}}
				>
					<Preview jsonData={jsonData} />
				</div>
			</div>

			{/* Bottom Toolbar */}
			<div className="flex justify-between p-4 bg-gray-200 border-t border-gray-300">
				{/* Export HTML Button */}
				<button
					type="button"
					onClick={exportHTML}
					className="p-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 mr-2"
				>
					Export HTML
				</button>

				{/* Export CSS Button */}
				<button
					type="button"
					onClick={exportCSS}
					className="p-2 bg-green-500 text-white rounded-sm hover:bg-green-600"
				>
					Export CSS
				</button>

				{/* Import JSON Button */}
				<label className="p-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600 cursor-pointer">
					Import JSON
					<input
						type="file"
						accept=".json"
						onChange={importJSON}
						style={{ display: "none" }}
					/>
				</label>

				{/* Export JSON Button */}
				<button
					type="button"
					onClick={exportJSON}
					className="p-2 bg-green-500 text-white rounded-sm hover:bg-green-600 ml-2"
				>
					Export JSON
				</button>
			</div>
		</div>
	);
};

export default App;
