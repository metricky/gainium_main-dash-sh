import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExchangeDialog } from '../components/exchanges';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { usePaperContext } from '../hooks/usePaperContext';
import { setDemoModeExitOverride } from '../lib/demoMode';
import { logger } from '../lib/loggerInstance';
import { useUIStore } from '../stores/uiStore';
import type { ExchangeInUser } from '../types/exchange.types';

const clearDemoModeParam = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (!url.searchParams.has('mode')) {
    return;
  }

  url.searchParams.delete('mode');
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', nextUrl);
};

const AddExchange: React.FC = () => {
  const navigate = useNavigate();
  const tradingMode = useUIStore((s) => s.tradingMode);
  const setTradingModeValue = useUIStore((s) => s.setTradingModeValue);
  const { setPaperContext } = usePaperContext();
  const [showDialog, setShowDialog] = useState(false);
  const [initialMode] = useState(tradingMode);
  const [hasExitedDemo, setHasExitedDemo] = useState(false);
  const [selectedTradingMode, setSelectedTradingMode] = useState<
    'paper' | 'live'
  >(tradingMode === 'live' ? 'live' : 'paper');
  const lastPersistedModeRef = useRef<'demo' | 'paper' | 'live'>(tradingMode);
  const [shouldReturnToDemoOnClose, setShouldReturnToDemoOnClose] = useState(
    initialMode === 'demo'
  );
  const suppressCloseNavigationRef = useRef(false);

  const applyTradingModeSelection = useCallback(
    (mode: 'paper' | 'live') => {
      logger.info('[demo-dismiss] applyTradingModeSelection invoked', {
        mode,
        currentTradingMode: tradingMode,
        lastPersisted: lastPersistedModeRef.current,
      });
      setSelectedTradingMode((prev) => (prev === mode ? prev : mode));

      if (tradingMode !== mode) {
        logger.info(
          '[demo-dismiss] setTradingModeValue from applyTradingModeSelection',
          {
            nextMode: mode,
          }
        );
        setTradingModeValue(mode);
      }

      if (lastPersistedModeRef.current !== mode) {
        logger.info(
          '[demo-dismiss] syncing paperContext from applyTradingModeSelection',
          {
            paperContext: mode === 'paper',
          }
        );
        setPaperContext(mode === 'paper');
        lastPersistedModeRef.current = mode;
      }
    },
    [setPaperContext, setTradingModeValue, tradingMode]
  );

  // When component mounts, check if we're in demo mode and switch to paper immediately
  useEffect(() => {
    if (initialMode === 'demo' && !hasExitedDemo) {
      logger.info(
        '[demo-dismiss] auto-switching from demo to paper for AddExchange entry'
      );
      clearDemoModeParam();
      setTradingModeValue('paper');
      setPaperContext(true);
      lastPersistedModeRef.current = 'paper';
      setDemoModeExitOverride(true);
      setHasExitedDemo(true);
      setSelectedTradingMode('paper');
      setShouldReturnToDemoOnClose(true);
    }

    // Show the exchange dialog after a brief delay to ensure mode is set
    const timer = setTimeout(() => {
      setShowDialog(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [hasExitedDemo, initialMode, setPaperContext, setTradingModeValue]);

  const handleSuccess = (_exchange: ExchangeInUser) => {
    logger.info('[demo-dismiss] handleSuccess keeping current mode', {
      tradingMode,
      selectedTradingMode,
    });
    setShouldReturnToDemoOnClose(false);
    suppressCloseNavigationRef.current = true;
    applyTradingModeSelection(selectedTradingMode);
    setShowDialog(false);
    navigate('/portfolio', { replace: true });
  };

  const handleReturnToDemo = () => {
    logger.info('[demo-dismiss] handleReturnToDemo invoked');
    setTradingModeValue('demo');
    setDemoModeExitOverride(false);
    setShouldReturnToDemoOnClose(true);
    setShowDialog(false);
    navigate('/?mode=demo', { replace: true });
  };

  const handleClose = () => {
    logger.info('[demo-dismiss] handleClose invoked', {
      initialMode,
      shouldReturnToDemoOnClose,
      suppressCloseNavigation: suppressCloseNavigationRef.current,
    });
    if (suppressCloseNavigationRef.current) {
      suppressCloseNavigationRef.current = false;
      return;
    }

    // If user closes without adding
    if (initialMode === 'demo' && shouldReturnToDemoOnClose) {
      // Return to demo mode if they came from demo
      logger.info('[demo-dismiss] dialog close returning to demo');
      setTradingModeValue('demo');
      setDemoModeExitOverride(false);
      navigate('/?mode=demo', { replace: true });
      return;
    }

    // Otherwise just go back to dashboard
    logger.info('[demo-dismiss] dialog close staying in current mode');
    setShowDialog(false);
    navigate('/', { replace: true });
  };

  return (
    <MainLayout pageTitle="Add Exchange" activePage="/add-exchange">
      <div className="flex items-center justify-center min-h-[60vh] p-md">
        <div className="max-w-md w-full space-y-lg text-center">
          <div className="space-y-xs">
            <h1 className="text-3xl font-bold">Add Your Exchange</h1>
            <p className="text-muted-foreground">
              Connect your exchange to start trading with real funds, or return
              to demo mode to continue exploring.
            </p>
          </div>

          <div className="flex flex-col gap-sm">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setShowDialog(true)}
            >
              Add Exchange
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={handleReturnToDemo}
            >
              Return to Demo
            </Button>
          </div>
        </div>
      </div>

      <ExchangeDialog
        open={showDialog}
        onClose={handleClose}
        mode="add"
        onSuccess={handleSuccess}
        onModeChange={applyTradingModeSelection}
        initialTradingMode={selectedTradingMode}
      />
    </MainLayout>
  );
};

export default AddExchange;
