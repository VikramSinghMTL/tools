// The shape of the calendar JSON that the editor holds.

export interface Activity {
	title: string;
	type: string;
	time?: string;
	link?: string;
	due?: string;
}

export interface WeekData {
	week: string;
	[column: string]: Activity[] | string | undefined;
}

export interface TypeData {
	name: string;
	color: string;
}

export interface CalendarData {
	types: TypeData[];
	columns: string[];
	weeks: WeekData[];
}

/** The activities in one week's column (none when the cell is empty). */
export const activitiesIn = (week: WeekData, column: string): Activity[] => {
	const cell = week[column];
	return Array.isArray(cell) ? cell : [];
};

/** A React key for an activity, unique within its cell. */
export const activityKey = (activity: Activity) =>
	`${activity.type}|${activity.title}|${activity.due ?? ""}|${activity.time ?? ""}`;
