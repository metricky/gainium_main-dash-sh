import { useState } from 'react';

import { cn } from '@/lib/utils';

interface BotttsAvatarProps {
  seed: string;
  alt?: string;
  className?: string;
  fallbackInitial?: string;
  fallbackClassName?: string;
}

// Soft pastel set; dicebear picks one deterministically from the seed.
const BG_COLORS = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';

function bottsUrl(seed: string) {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundType=solid&backgroundColor=${BG_COLORS}`;
}

export function BotttsAvatar({
  seed,
  alt = 'avatar',
  className,
  fallbackInitial,
  fallbackClassName,
}: BotttsAvatarProps) {
  const [errored, setErrored] = useState(false);

  if (errored && fallbackInitial) {
    return (
      <span
        className={cn(
          'w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold',
          fallbackClassName,
        )}
      >
        {fallbackInitial}
      </span>
    );
  }

  return (
    <img
      src={bottsUrl(seed)}
      alt={alt}
      className={cn('w-full h-full object-cover', className)}
      onError={() => setErrored(true)}
    />
  );
}
