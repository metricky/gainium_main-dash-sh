import React, { useState } from 'react';
import { LiveUpdateWidget, type SubscriptionType } from './LiveUpdateWidget';
import logger from '../../../lib/loggerInstance';

/**
 * Test component for LiveUpdateWidget functionality
 * This component provides controls to test various LiveUpdateWidget features
 */
export const LiveUpdateWidgetTest: React.FC = () => {
  const [testBotId, setTestBotId] = useState('test-bot-1');
  const [debounceMs, setDebounceMs] = useState(100);
  const [batchSize, setBatchSize] = useState(1);
  const [batchTimeoutMs, setBatchTimeoutMs] = useState(1000);
  const [subscriptionTypes, setSubscriptionTypes] = useState<
    SubscriptionType[]
  >(['stats']);

  const handleSubscriptionTypeChange = (type: string, checked: boolean) => {
    setSubscriptionTypes((prev) =>
      checked
        ? [...prev, type as SubscriptionType]
        : prev.filter((t) => t !== type)
    );
  };

  return (
    <div className="p-lg space-y-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">LiveUpdateWidget Test</h1>

      {/* Configuration Panel */}
      <div className="bg-card p-md rounded-lg border space-y-md">
        <h2 className="text-lg font-semibold">Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-sm font-medium mb-1">Bot ID</label>
            <input
              type="text"
              value={testBotId}
              onChange={(e) => setTestBotId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter bot ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Debounce (ms)
            </label>
            <input
              type="number"
              value={debounceMs}
              onChange={(e) => setDebounceMs(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded"
              min="0"
              max="5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Batch Size</label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded"
              min="1"
              max="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Batch Timeout (ms)
            </label>
            <input
              type="number"
              value={batchTimeoutMs}
              onChange={(e) => setBatchTimeoutMs(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded"
              min="100"
              max="10000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Subscription Types
          </label>
          <div className="flex flex-wrap gap-md">
            {['stats', 'orders', 'deals', 'balance', 'messages'].map((type) => (
              <label key={type} className="flex items-center space-x-xs">
                <input
                  type="checkbox"
                  checked={subscriptionTypes.includes(type as SubscriptionType)}
                  onChange={(e) =>
                    handleSubscriptionTypeChange(type, e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Live Update Widget Test */}
      <div className="bg-card p-md rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Live Update Widget</h2>

        <LiveUpdateWidget
          botId={testBotId}
          debounceMs={debounceMs}
          batchSize={batchSize}
          batchTimeoutMs={batchTimeoutMs}
          subscriptionTypes={subscriptionTypes}
          onDataUpdate={(data) => {
            logger.info('[Test] Data update received:', data);
          }}
          onError={(error) => {
            console.error('[Test] Error received:', error);
          }}
        >
          {({
            metrics,
            /* isSubscribed, */
            lastUpdate,
            updateCount,
            pendingDataUpdate,
            isConnected,
            connectionError,
            reconnect,
          }) => (
            <div className="space-y-md">
              {/* Status Indicators */}
              <div className="flex flex-wrap gap-md text-sm">
                <div
                  className={`px-2 py-1 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </div>
                {/* <div
                  className={`px-2 py-1 rounded ${isSubscribed ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                >
                  {isSubscribed ? '📡 Subscribed' : '🚫 Not Subscribed'}
                </div> */}
                <div className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                  Updates: {updateCount}
                </div>
                {lastUpdate > 0 && (
                  <div className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                    Last: {new Date(lastUpdate).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Connection Error */}
              {connectionError && (
                <div className="p-sm bg-red-50 border border-red-200 rounded">
                  <div className="text-red-800 text-sm font-medium">
                    Connection Error
                  </div>
                  <div className="text-red-600 text-xs mt-1">
                    {connectionError}
                  </div>
                  <button
                    onClick={reconnect}
                    className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Retry Connection
                  </button>
                </div>
              )}

              {/* Metrics Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <h3 className="font-medium">Bot Stats</h3>
                  {metrics.stats ? (
                    <pre className="text-xs bg-gray-50 p-xs rounded overflow-auto max-h-32">
                      {JSON.stringify(metrics.stats, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      No stats available
                    </div>
                  )}
                </div>

                <div className="space-y-xs">
                  <h3 className="font-medium">
                    Orders ({metrics.orders?.length || 0})
                  </h3>
                  {metrics.orders?.length ? (
                    <pre className="text-xs bg-gray-50 p-xs rounded overflow-auto max-h-32">
                      {JSON.stringify(metrics.orders.slice(0, 3), null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500 text-sm">No orders</div>
                  )}
                </div>
              </div>

              {/* Pending Update Indicator */}
              {pendingDataUpdate && (
                <div className="p-xs bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-yellow-800 text-sm">
                    ⏳ Pending update in batch...
                  </div>
                </div>
              )}
            </div>
          )}
        </LiveUpdateWidget>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-md rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Testing Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Change the Bot ID to test different bot subscriptions</li>
          <li>• Adjust debounce settings to see performance impact</li>
          <li>• Modify batch settings to test update batching</li>
          <li>• Toggle subscription types to test selective subscriptions</li>
          <li>• Check browser console for detailed logging</li>
          <li>• Test connection recovery by disconnecting/reconnecting</li>
        </ul>
      </div>
    </div>
  );
};
