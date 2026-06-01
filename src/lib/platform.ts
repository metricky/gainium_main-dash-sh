// Cross-browser, future-proof platform helpers
// Detect macOS (and mac-like platforms) without relying solely on deprecated navigator.platform
export function isMacLike(): boolean {
  if (typeof navigator === 'undefined') return false;
  try {
    const p = (navigator.platform || '').toLowerCase();
    // Chromium UA Reduction alternative
    const uaDataPlatform =
      (
        navigator as unknown as { userAgentData?: { platform?: string } }
      ).userAgentData?.platform?.toLowerCase?.() || '';
    const ua = (navigator.userAgent || '').toLowerCase();
    return (
      p.includes('mac') ||
      uaDataPlatform.includes('mac') ||
      // iPad with hardware keyboard may report as Mac in some versions; include iOS/iPad as mac-like for meta behavior
      ua.includes('macintosh') ||
      ua.includes('mac os')
    );
  } catch {
    return false;
  }
}
