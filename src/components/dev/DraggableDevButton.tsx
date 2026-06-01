import { useDevToolsStore } from '@/stores/useDevToolsStore';
import { Bug } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export const DraggableDevButton: React.FC = () => {
  const { isOpen, toggleDrawer, buttonPosition, setButtonPosition } =
    useDevToolsStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle mouse down - start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag on left click
    if (e.button !== 0) return;

    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y,
    });
    e.preventDefault();
  };

  // Handle mouse move - update position
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Check if moved more than 5px
      const movement = Math.sqrt(
        Math.pow(newX - buttonPosition.x, 2) +
          Math.pow(newY - buttonPosition.y, 2)
      );

      if (movement > 5) {
        setHasMoved(true);
      }

      // Keep button within viewport bounds
      const buttonSize = 48; // 12 * 4 (w-12 h-12)
      const maxX = window.innerWidth - buttonSize;
      const maxY = window.innerHeight - buttonSize;

      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));

      setButtonPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // Only trigger click if we didn't drag
      if (!hasMoved) {
        toggleDrawer();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    dragStart,
    buttonPosition,
    setButtonPosition,
    toggleDrawer,
    hasMoved,
  ]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      className={`fixed z-9999 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors border border-border ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${isOpen ? 'bg-accent' : 'bg-background hover:bg-accent'}`}
      style={{
        left: `${buttonPosition.x}px`,
        top: `${buttonPosition.y}px`,
        touchAction: 'none',
      }}
      title="Dev Tools (Draggable)"
    >
      <Bug className="h-5 w-5" />
    </button>
  );
};
