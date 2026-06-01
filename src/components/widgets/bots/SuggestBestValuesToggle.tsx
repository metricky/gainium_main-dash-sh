import { motion } from 'framer-motion';
import { Info, Settings, Sparkles } from 'lucide-react';
import React from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface SuggestBestValuesToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  description?: string;
  className?: string;
}

const SuggestBestValuesToggle: React.FC<SuggestBestValuesToggleProps> = ({
  enabled,
  onToggle,
  description = 'When enabled, AI will suggest optimal values for missing information instead of asking you to provide them.',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={className}
    >
      <Card className="border border-border shadow-lg">
        <CardContent className="p-md">
          <div className="flex items-start gap-sm">
            {/* Toggle Switch */}
            <div className="shrink-0 mt-1">
              <motion.button
                onClick={() => onToggle(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  enabled ? 'bg-primary' : 'bg-gray-200'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-xs mb-2">
                <Sparkles
                  className={`w-4 h-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <h4 className="font-medium text-sm">Suggest Best Values</h4>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    enabled
                      ? 'border-green-200 text-green-700 bg-green-50'
                      : 'border-gray-200 text-gray-600 bg-gray-50'
                  }`}
                >
                  {enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                {description}
              </p>

              {/* Feature explanation */}
              <div
                className={`p-sm rounded-lg border transition-all duration-200 ${
                  enabled
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/30 border-border'
                }`}
              >
                <div className="flex items-start gap-xs">
                  <Info
                    className={`w-3 h-3 mt-0.5 shrink-0 ${
                      enabled ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="text-xs">
                    {enabled ? (
                      <div className="space-y-1">
                        <p className="font-medium text-primary">
                          AI will automatically:
                        </p>
                        <ul className="text-muted-foreground space-y-0.5 ml-2">
                          <li>
                            • Suggest optimal order sizes based on market
                            conditions
                          </li>
                          <li>
                            • Recommend appropriate risk management settings
                          </li>
                          <li>• Choose suitable trading pairs and exchanges</li>
                          <li>
                            • Provide conservative defaults for unknown
                            parameters
                          </li>
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">
                          AI will ask you to specify:
                        </p>
                        <ul className="text-muted-foreground space-y-0.5 ml-2">
                          <li>• Required trading parameters</li>
                          <li>• Risk tolerance preferences</li>
                          <li>• Capital allocation amounts</li>
                          <li>• Specific trading pair choices</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick toggle buttons */}
              <div className="flex gap-xs mt-3">
                <Button
                  size="sm"
                  variant={enabled ? 'default' : 'outline'}
                  onClick={() => onToggle(true)}
                  className="flex-1 h-8 text-xs"
                  disabled={enabled}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Auto-Suggest
                </Button>
                <Button
                  size="sm"
                  variant={!enabled ? 'default' : 'outline'}
                  onClick={() => onToggle(false)}
                  className="flex-1 h-8 text-xs"
                  disabled={!enabled}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Ask Me
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SuggestBestValuesToggle;
