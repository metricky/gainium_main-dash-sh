import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Info,
  Settings,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import type {
  AIBotConfiguration,
  MissingInfoRequest,
} from './types/AIBotTypes';

interface BotSettingsPreviewProps {
  config: AIBotConfiguration;
  onApprove: (config: AIBotConfiguration) => void;
  onReject: () => void;
  onRequestMissingInfo: (requests: MissingInfoRequest[]) => void;
  className?: string;
}

const BotSettingsPreview: React.FC<BotSettingsPreviewProps> = ({
  config,
  onApprove,
  onReject,
  onRequestMissingInfo,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMissingInfo, setShowMissingInfo] = useState(
    config.missingInfo.length > 0
  );

  // Calculate estimated capital requirement
  const estimatedCapital = React.useMemo(() => {
    const baseOrder = parseFloat(config.settings.baseOrderSize) || 0;
    const safetyOrder = parseFloat(config.settings.orderSize) || 0;
    const maxOrders = config.settings.ordersCount || 0;
    const volumeScale = parseFloat(config.settings.volumeScale) || 1;
    const maxDeals = parseInt(config.settings.maxNumberOfOpenDeals) || 1;

    let total = baseOrder;
    let currentOrderSize = safetyOrder;

    for (let i = 0; i < maxOrders; i++) {
      total += currentOrderSize;
      currentOrderSize *= volumeScale;
    }

    return total * maxDeals;
  }, [config.settings]);

  // Get confidence color and icon
  const getConfidenceDisplay = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return {
          color: 'border-green-200 text-green-700 bg-green-50',
          icon: <CheckCircle className="w-3 h-3" />,
          text: 'High Confidence',
        };
      case 'medium':
        return {
          color: 'border-yellow-200 text-yellow-700 bg-yellow-50',
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Medium Confidence',
        };
      case 'low':
        return {
          color: 'border-red-200 text-red-700 bg-red-50',
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Low Confidence',
        };
      default:
        return {
          color: 'border-gray-200 text-gray-700 bg-gray-50',
          icon: <Info className="w-3 h-3" />,
          text: 'Unknown',
        };
    }
  };

  const confidenceDisplay = getConfidenceDisplay(config.confidence);

  // Render key settings overview
  const renderKeySettings = () => (
    <div className="grid grid-cols-2 gap-sm text-sm">
      <div className="flex items-center gap-xs">
        <TrendingUp className="w-4 h-4 text-primary" />
        <div>
          <div className="text-muted-foreground text-xs">Strategy</div>
          <div className="font-medium capitalize">
            {config.settings.strategy} {config.settings.type.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-xs">
        <DollarSign className="w-4 h-4 text-green-600" />
        <div>
          <div className="text-muted-foreground text-xs">Pair</div>
          <div className="font-medium">{config.settings.pair}</div>
        </div>
      </div>

      <div className="flex items-center gap-xs">
        <Target className="w-4 h-4 text-blue-600" />
        <div>
          <div className="text-muted-foreground text-xs">Take Profit</div>
          <div className="font-medium">
            {config.settings.useTp ? `${config.settings.tpPerc}%` : 'Disabled'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-xs">
        <Shield className="w-4 h-4 text-red-600" />
        <div>
          <div className="text-muted-foreground text-xs">Stop Loss</div>
          <div className="font-medium">
            {config.settings.useSl ? `${config.settings.slPerc}%` : 'Disabled'}
          </div>
        </div>
      </div>
    </div>
  );

  // Render detailed settings
  const renderDetailedSettings = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-md pt-4 border-t max-h-96 overflow-y-auto custom-scrollbar"
    >
      {/* Order Configuration */}
      <div>
        <h4 className="font-medium text-sm mb-2 flex items-center gap-xs">
          <DollarSign className="w-4 h-4" />
          Order Configuration
        </h4>
        <div className="grid grid-cols-2 gap-sm text-sm">
          <div>
            <span className="text-muted-foreground">Base Order:</span>
            <span className="ml-2 font-medium">
              ${config.settings.baseOrderSize}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Safety Order:</span>
            <span className="ml-2 font-medium">
              ${config.settings.orderSize}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Max Orders:</span>
            <span className="ml-2 font-medium">
              {config.settings.ordersCount}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Price Step:</span>
            <span className="ml-2 font-medium">{config.settings.step}%</span>
          </div>
        </div>
      </div>

      {/* Capital Requirement */}
      <div className="p-sm bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-xs mb-1">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-800 text-sm">
            Estimated Capital Requirement
          </span>
        </div>
        <div className="text-blue-700 text-sm">
          Approximately{' '}
          <span className="font-bold">${estimatedCapital.toFixed(2)}</span> per
          deal
          {parseInt(config.settings.maxNumberOfOpenDeals) > 1 && (
            <span> (max {config.settings.maxNumberOfOpenDeals} deals)</span>
          )}
        </div>
      </div>

      {/* Risk Management */}
      <div>
        <h4 className="font-medium text-sm mb-2 flex items-center gap-xs">
          <Shield className="w-4 h-4" />
          Risk Management
        </h4>
        <div className="space-y-xs text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Take Profit:</span>
            <span
              className={`font-medium ${config.settings.useTp ? 'text-green-600' : 'text-red-600'}`}
            >
              {config.settings.useTp
                ? `${config.settings.tpPerc}%`
                : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Stop Loss:</span>
            <span
              className={`font-medium ${config.settings.useSl ? 'text-red-600' : 'text-muted-foreground'}`}
            >
              {config.settings.useSl
                ? `${config.settings.slPerc}%`
                : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">DCA Enabled:</span>
            <span
              className={`font-medium ${config.settings.useDca ? 'text-green-600' : 'text-muted-foreground'}`}
            >
              {config.settings.useDca ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {config.suggestions.length > 0 && (
        <div className="p-sm bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-xs mb-2">
            <Info className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-800 text-sm">
              AI Suggestions
            </span>
          </div>
          <ul className="text-amber-700 text-sm space-y-1">
            {config.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-xs">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );

  // Render missing information requests
  const renderMissingInfo = () => {
    if (config.missingInfo.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-sm bg-yellow-50 border border-yellow-200 rounded-lg"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-xs">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800 text-sm">
              Missing Information
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowMissingInfo(!showMissingInfo)}
            className="h-6 w-6 p-0 text-yellow-600 hover:bg-yellow-100"
          >
            {showMissingInfo ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showMissingInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-xs"
            >
              <ul className="text-yellow-700 text-sm space-y-1">
                {config.missingInfo.map((info, index) => (
                  <li key={index} className="flex items-start gap-xs">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>{info.question}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-xs pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRequestMissingInfo(config.missingInfo)}
                  className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Provide Information
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <Card className={`border-2 border-primary/20 ${className}`}>
      <CardContent className="p-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-xs">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-base">Generated Configuration</h3>
          </div>
          <Badge className={`text-xs ${confidenceDisplay.color}`}>
            {confidenceDisplay.icon}
            <span className="ml-1">{confidenceDisplay.text}</span>
          </Badge>
        </div>

        {/* AI Explanation */}
        <div className="mb-4 p-sm bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {config.explanation}
          </p>
        </div>

        {/* Key Settings */}
        {renderKeySettings()}

        {/* Missing Information */}
        {config.missingInfo.length > 0 && (
          <div className="mt-4">{renderMissingInfo()}</div>
        )}

        {/* Expand/Collapse Button */}
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-center text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show Details
              </>
            )}
          </Button>
        </div>

        {/* Detailed Settings */}
        <AnimatePresence>
          {isExpanded && renderDetailedSettings()}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-xs mt-4 pt-4 border-t">
          <Button
            onClick={() => onApprove(config)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Configuration
          </Button>
          <Button variant="outline" onClick={onReject} className="px-4">
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BotSettingsPreview;
