import logger from '@/lib/loggerInstance';
import {
  type ButtonPosition,
  useFloatingButtonsStore,
} from '@/stores/floatingButtonsStore';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface DraggableFloatingButtonProps {
  children: React.ReactNode;
  buttonId: string;
  className?: string;
}

/**
 * Wrapper component that makes floating buttons draggable with position persistence
 * Usage:
 * <DraggableFloatingButton buttonId="chat-button">
 *   <YourButton />
 * </DraggableFloatingButton>
 */
export const DraggableFloatingButton: React.FC<
  DraggableFloatingButtonProps
> = ({ children, buttonId, className = '' }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { getPosition, setPosition } = useFloatingButtonsStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // Initialize with getPosition which always returns a ButtonPosition (never undefined)
  const [position, setLocalPosition] = useState<ButtonPosition>(() =>
    getPosition(buttonId)
  );

  // Update position when store changes
  useEffect(() => {
    const storedPosition = getPosition(buttonId);
    if (storedPosition) {
      setLocalPosition(storedPosition);
    }
  }, [buttonId, getPosition]);

  // Constrain position within viewport bounds
  const constrainPosition = useCallback((x: number, y: number) => {
    if (!buttonRef.current) return { x, y };

    const rect = buttonRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag on left mouse button
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });

      logger.debug('[DraggableFloatingButton] Drag started', {
        buttonId,
        position,
      });
    },
    [buttonId, position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const constrainedPos = constrainPosition(newX, newY);

      setLocalPosition(constrainedPos);
    },
    [isDragging, dragStart, constrainPosition]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    setPosition(buttonId, position);
    logger.debug('[DraggableFloatingButton] Drag ended, position saved', {
      buttonId,
      position,
    });
  }, [isDragging, buttonId, position, setPosition]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });

      logger.debug('[DraggableFloatingButton] Touch drag started', {
        buttonId,
        position,
      });
    },
    [buttonId, position]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;

      e.preventDefault();
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      const constrainedPos = constrainPosition(newX, newY);

      setLocalPosition(constrainedPos);
    },
    [isDragging, dragStart, constrainPosition]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    setPosition(buttonId, position);
    logger.debug('[DraggableFloatingButton] Touch drag ended, position saved', {
      buttonId,
      position,
    });
  }, [isDragging, buttonId, position, setPosition]);

  // Set up mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Set up touch event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
    return undefined;
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // Handle window resize - reposition if outside bounds
  useEffect(() => {
    const handleResize = () => {
      const constrainedPos = constrainPosition(position.x, position.y);
      if (constrainedPos.x !== position.x || constrainedPos.y !== position.y) {
        setLocalPosition(constrainedPos);
        setPosition(buttonId, constrainedPos);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [buttonId, position, constrainPosition, setPosition]);

  return (
    <div
      ref={buttonRef}
      className={`fixed z-50 ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {children}
    </div>
  );
};
