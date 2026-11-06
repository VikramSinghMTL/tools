import React, { useRef } from 'react';

interface DividerProps {
	onDrag: (deltaX: number) => void;
}

const Divider: React.FC<DividerProps> = ({ onDrag }) => {
	const isDragging = useRef(false);

	const handleMouseDown = () => {
		isDragging.current = true;
	};

	const handleMouseUp = () => {
		isDragging.current = false;
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (isDragging.current) {
			onDrag(e.movementX);
		}
	};

	React.useEffect(() => {
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, []);

	return (
		<div
			className="w-2 bg-gray-400 cursor-col-resize hover:bg-gray-600"
			onMouseDown={handleMouseDown}
			style={{ cursor: 'col-resize' }}
		/>
	);
};

export default Divider;
