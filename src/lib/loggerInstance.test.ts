/**
 * Logger Auto-Categorization Test Examples
 *
 * Run these in the browser console to test the auto-categorization feature
 */

import logger from './loggerInstance';

// Test 1: Auto-categorization from message
console.log('=== Test 1: Auto-categorization ===');
logger.debug('[OrderDrawings] Render complete');
logger.info('[TradingView] Widget initialized');
logger.warn('[API] Slow response detected');
logger.error('[CoinChart] Failed to load data');

// Test 2: No category (should default to "general")
console.log('\n=== Test 2: Default category ===');
logger.debug('Generic debug message');
logger.info('Generic info message');

// Test 3: Backward compatibility with category methods
console.log('\n=== Test 3: Legacy category methods ===');
logger.debugCategory('ManualBacktesting', 'Trade executed');
logger.infoCategory('ApiClient', 'Request completed');

// Test 4: Mixed categories
console.log('\n=== Test 4: Multiple categories ===');
logger.debug('[Auth] User logged in');
logger.debug('[Auth] Token refreshed');
logger.debug('[Dashboard] Page loaded');
logger.debug('[Dashboard] Widget rendered');
logger.debug('[API] GET /bot');
logger.debug('[API] POST /deals');

// Test 5: Category extraction with data
console.log('\n=== Test 5: With additional data ===');
logger.debug('[CoinChart] Candles loaded', { count: 100, symbol: 'BTC/USDT' });
logger.info('[TradingView] Resolution changed', { from: '1h', to: '4h' });

// Test 6: Edge cases
console.log('\n=== Test 6: Edge cases ===');
logger.debug('[Category with spaces] This should work');
logger.debug('[] Empty brackets'); // Should use "general"
logger.debug('[No closing bracket should use general');
logger.debug('Not [starting] with bracket'); // Should use "general"

// Check results in Logger Drawer
console.log('\n✅ Test complete! Open Logger Drawer to see categorized logs.');
console.log(
  'Expected categories: OrderDrawings, TradingView, API, CoinChart, general, ManualBacktesting, ApiClient, Auth, Dashboard'
);

export {};
