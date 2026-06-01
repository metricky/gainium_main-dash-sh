// In-app AI chat core stub.
import React from 'react';

interface ChatCoreProps {
  showHeader?: boolean;
  showBackdrop?: boolean;
  enableFullscreen?: boolean;
  closeOnBackdropClick?: boolean;
  containerClassName?: string;
  /** Optional React content rendered inside the message scroll
   *  viewport, just before the auto-scroll anchor. Cloud uses this to
   *  inline the Max onboarding walkthrough's pickers as part of the
   *  conversation flow. Sh ignores it (stub renders null). */
  afterMessagesContent?: React.ReactNode;
  /** Right-side header buttons. Cloud uses this to inject an Undock
   *  action into the docked chat header. */
  headerActions?: React.ReactNode;
  /** Suppress ChatCore's default fullscreen + close header buttons.
   *  Cloud's detached overlay sets this because its custom
   *  `headerContent` already includes those controls. */
  hideDefaultControls?: boolean;
}

const ChatCore: React.FC<ChatCoreProps> = () => null;

export default ChatCore;
