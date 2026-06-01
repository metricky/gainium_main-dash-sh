import PoopSvg from '@/components/common/PoopSvg';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import logger from '@/lib/loggerInstance';
import { useGlobalSearchStore } from '@/stores/globalSearchStore';
import { Search } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const PREFIX = '[404-NotFound]';

interface Phrase {
  left: string;
  right: string;
}

const PHRASES: Phrase[] = [
  { left: 'Oh', right: "we couldn't find that page" },
  { left: "We tried and tried but couldn't find", right: '' },
  { left: 'Whoops!', right: "that page doesn't exist" },
  { left: "You've stepped in", right: '...and also a 404' },
  { left: 'This page smells like', right: 'something went very wrong' },
  { left: 'The bots searched everywhere for', right: 'and found nothing' },
  { left: 'Well, this is', right: '...awkward' },
  { left: 'Your page took one look at', right: 'and ran away' },
  { left: 'Congrats, you found', right: 'but not the page you wanted' },
  { left: 'Even the algorithm agrees, this is', right: 'pure nonsense' },
];

const SUB_COPIES: string[] = [
  "The page you were looking for stepped on something nasty and disappeared. It's gone. We're sorry.",
  "Whatever you were looking for took one whiff of this URL and bolted. Can't blame it.",
  "This page doesn't exist. It never did. The universe is chaos. Want to go home?",
  'Our bots searched every dark corner of the database. Zero results. Just emptiness and despair.',
  '404 means we have absolutely no idea what you were looking for. And honestly? Neither do you.',
  'We checked under the sofa cushions, behind the dashboard widgets, even inside the unrealised P&L. Nothing.',
  'That URL led here. Here is nowhere. Nowhere smells like this.',
  'Something went wrong, but in a very funny way. The engineers have been notified and are pretending to look busy.',
];

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const toggleSearch = useGlobalSearchStore((s) => s.toggleSearch);

  const phrase = useMemo<Phrase>(() => {
    const idx = Math.floor(Math.random() * PHRASES.length);
    return PHRASES[idx];
  }, []);

  const subCopy = useMemo<string>(() => {
    const idx = Math.floor(Math.random() * SUB_COPIES.length);
    return SUB_COPIES[idx];
  }, []);

  useEffect(() => {
    logger.warn(`${PREFIX} User hit 404 page at: ${window.location.pathname}`);
  }, []);

  return (
    <MainLayout pageTitle="Page Not Found" activePage="">
      <div className="h-full flex flex-col items-center justify-center relative overflow-hidden px-8 py-16">
        {/* Giant 404 watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none tracking-tighter text-foreground"
            // eslint-disable-next-line spacing/no-hardcoded-font-size
            style={{ fontSize: 'clamp(8rem, 42vw, 34rem)', opacity: 0.09 }}
          >
            404
          </span>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-7xl">
          {/* ── Phrase row: left text | poop | right text ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-6 sm:gap-10">
            {/* Left text */}
            <div className="flex-1 flex sm:justify-end justify-center sm:pr-4">
              {phrase.left ? (
                <p className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight sm:text-right text-center">
                  {phrase.left}
                </p>
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>

            {/* Poop SVG */}
            <div
              className="flex-none flex items-center justify-center"
              style={{ paddingTop: 40 }}
            >
              <PoopSvg size={260} />
            </div>

            {/* Right text */}
            <div className="flex-1 flex sm:justify-start justify-center sm:pl-4">
              {phrase.right ? (
                <p className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight sm:text-left text-center">
                  {phrase.right}
                </p>
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-border rounded-full" />

          {/* Sub-copy */}
          <p className="text-muted-foreground text-base md:text-lg max-w-md text-center leading-relaxed">
            {subCopy}
          </p>

          {/* Actions */}
          <div className="flex gap-4 flex-wrap justify-center">
            <Button variant="outline" size="lg" onClick={toggleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button size="lg" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
