import { type KeyboardEvent, useEffect, useRef } from "react";

interface DividerProps {
	onDrag: (deltaX: number) => void;
}

// How far one arrow-key press moves the divider, in pixels.
const KEYBOARD_STEP = 24;

// A vertical splitter: drag it with the mouse, or focus it and use the arrow keys.
const Divider = ({ onDrag }: DividerProps) => {
	const isDragging = useRef(false);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging.current) onDrag(e.movementX);
		};
		const handleMouseUp = () => {
			isDragging.current = false;
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [onDrag]);

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "ArrowLeft") onDrag(-KEYBOARD_STEP);
		else if (e.key === "ArrowRight") onDrag(KEYBOARD_STEP);
		else return;
		e.preventDefault();
	};

	return (
		<button
			type="button"
			aria-label="Resize editor"
			className="w-2 cursor-col-resize bg-gray-400 hover:bg-gray-600 focus-visible:bg-gray-600"
			onMouseDown={() => {
				isDragging.current = true;
			}}
			onKeyDown={handleKeyDown}
		/>
	);
};

export default Divider;
