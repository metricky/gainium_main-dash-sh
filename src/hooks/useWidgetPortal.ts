import { useUIStore } from '@/stores/uiStore';
import { useMemo } from 'react';

/**
 * Hook that provides the correct rendering strategy for widget modals/dialogs.
 * Uses a hybrid approach:
 * - Normal mode: Use portals (good for small widgets)
 * - Fullscreen/Native fullscreen: Use direct rendering with z-50 (avoids portal issues)
 *
 * @param widgetId - The ID of the widget using this portal
 * @returns An object with rendering strategy and appropriate classes
 */
export function useWidgetPortal(widgetId: string) {
  const fullscreenWidget = useUIStore((s) => s.fullscreenWidget);
  const isNativeFullscreen = useUIStore((s) => s.isNativeFullscreen);

  const isFullscreen = fullscreenWidget.widgetId === widgetId;
  const isInAnyFullscreenMode = isFullscreen || isNativeFullscreen;

  return useMemo(() => {
    /**
     * HYBRID PORTAL STRATEGY:
     * - Normal mode: Use portals to document.body (good for small widgets)
     * - Fullscreen modes: Don't use portals, render directly (avoids z-index issues)
     */
    const getPortalTarget = () => {
      if (isInAnyFullscreenMode) {
        // When in any fullscreen mode, portal to the fullscreen element or body
        const fullscreenElement =
          document.fullscreenElement ||
          (document as Document & { webkitFullscreenElement?: Element })
            .webkitFullscreenElement ||
          (document as Document & { msFullscreenElement?: Element })
            .msFullscreenElement;
        return fullscreenElement || document.body;
      }

      // For normal mode, use document.body for portals
      return document.body;
    };

    /**
     * HYBRID Z-INDEX STRATEGY:
     * - Normal mode: Use high z-index for portals
     * - Fullscreen modes: Use z-50 for direct rendering
     */
    const getZIndexClass = () => {
      if (isInAnyFullscreenMode) {
        // In fullscreen modes, use simple z-50 approach
        return 'z-50';
      }

      // In normal mode, use higher z-index for portals
      return 'z-[1000]';
    };

    /**
     * RENDERING STRATEGY:
     * Returns whether to use portals or direct rendering
     */
    const shouldUsePortal = () => {
      // Use portals in normal mode, direct rendering in fullscreen modes
      return !isInAnyFullscreenMode;
    };

    return {
      portalTarget: getPortalTarget(),
      zIndexClass: getZIndexClass(),
      shouldUsePortal: shouldUsePortal(),
      isInFullscreen: isFullscreen,
      isInNativeFullscreen: isNativeFullscreen,
    };
  }, [isInAnyFullscreenMode, isFullscreen, isNativeFullscreen]);
}
