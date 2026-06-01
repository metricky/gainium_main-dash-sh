/**
 * Play a notification sound
 * @param soundFile - Name of the sound file (e.g., 'ping', 'cash-register', 'new-notification', 'buy', 'sell')
 * @param extension - File extension (defaults to 'mp3', but can be 'm4a' for buy/sell sounds)
 */
export const playNotificationSound = (
  soundFile: string,
  extension: string = 'mp3'
): void => {
  try {
    const audio = new Audio(`/sounds/${soundFile}.${extension}`);
    audio.volume = 0.5; // Set volume to 50% to avoid being too loud
    audio.play().catch((error) => {
      // Silently fail if autoplay is blocked or sound file doesn't exist
      console.debug(`[Sound] Failed to play ${soundFile}:`, error);
    });
  } catch (error) {
    // Silently fail on any errors
    console.debug(`[Sound] Error creating audio for ${soundFile}:`, error);
  }
};
