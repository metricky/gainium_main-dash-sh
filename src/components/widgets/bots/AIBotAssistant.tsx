import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  CheckCircle,
  MessageSquare,
  Settings,
  Sparkles,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import WidgetWrapper from '../WidgetWrapper';
import BotSettingsPreview from './BotSettingsPreview';
import MissingInfoRequest from './MissingInfoRequest';
import { AIBotService } from './services/AIBotService';
import SuggestBestValuesToggle from './SuggestBestValuesToggle';
import type {
  AIBotAssistantProps,
  AIBotConfiguration,
  AIBotMessage,
  MissingInfoRequest as MissingInfoType,
} from './types/AIBotTypes';

const AIBotAssistant: React.FC<AIBotAssistantProps> = ({
  widgetId = 'ai-bot-assistant',
  isEditable = false,
  onCollapse,
  onTabMove,
  menuActions,
  data: _data,
  settings: _settings,
  onConfigurationGenerated,
  onFormPopulate,
}) => {
  // Hooks
  const { user, tokens } = useAuthStore();
  const aiService = AIBotService.getInstance();

  // State management
  const [messages, setMessages] = useState<AIBotMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestBestValues, setSuggestBestValues] = useState(true);
  const [currentConfig, setCurrentConfig] = useState<AIBotConfiguration | null>(
    null
  );
  const [, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>('Checking...');
  const [showMissingInfoRequest, setShowMissingInfoRequest] = useState(false);
  const [pendingMissingInfo, setPendingMissingInfo] = useState<
    MissingInfoType[]
  >([]);
  const [showSettingsToggle, setShowSettingsToggle] = useState(false);

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check WebSocket connection status
  useEffect(() => {
    const checkConnection = () => {
      setConnectionStatus(aiService.getConnectionStatus());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [aiService]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Conversation starters specific to bot creation
  const conversationStarters = [
    {
      title: 'Conservative DCA Bot',
      message:
        'Create a conservative DCA bot for BTC/USDT with 2% take profit and 5% stop loss',
      icon: '🛡️',
    },
    {
      title: 'Aggressive Grid Bot',
      message:
        'Set up an aggressive grid trading bot for ETH/USDT with high frequency trades',
      icon: '⚡',
    },
    {
      title: 'Long-term Investment',
      message:
        'Create a long-term DCA bot for accumulating Bitcoin with weekly purchases',
      icon: '📈',
    },
    {
      title: 'Scalping Strategy',
      message:
        'Build a scalping bot for quick profits on DOGE/USDT with tight spreads',
      icon: '🎯',
    },
  ];

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isGenerating || !user?.id || !tokens?.accessToken)
        return;

      const userMessage: AIBotMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText('');
      setIsGenerating(true);
      setError(null);

      try {
        // Generate bot configuration using AI service
        const config = await aiService.generateBotConfiguration(
          text,
          user.id,
          tokens.accessToken,
          suggestBestValues
        );

        // Create AI response message
        const aiMessage: AIBotMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: config.explanation,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setCurrentConfig(config);

        // Notify parent component if callback provided
        if (onConfigurationGenerated) {
          onConfigurationGenerated(config.settings);
        }
      } catch (error) {
        console.error(
          '[AIBotAssistant] Failed to generate configuration:',
          error
        );

        // Create user-friendly error message
        let errorContent =
          'I apologize, but I encountered an issue while processing your request. ';

        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorContent +=
              'The request took too long to process. Please try again with a simpler request or check your connection.';
          } else if (error.message.includes('WebSocket')) {
            errorContent +=
              'There seems to be a connection issue. Please refresh the page and try again.';
          } else {
            errorContent +=
              'Please try rephrasing your request or try again in a moment.';
          }
        } else {
          errorContent += 'Please try again in a moment.';
        }

        const errorMessage: AIBotMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: errorContent,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsGenerating(false);
      }
    },
    [
      isGenerating,
      user,
      tokens,
      suggestBestValues,
      aiService,
      onConfigurationGenerated,
    ]
  );

  // Handle conversation starter clicks
  const handleStarterClick = useCallback(
    (message: string) => {
      handleSendMessage(message);
    },
    [handleSendMessage]
  );

  // Handle input submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(inputText);
    },
    [inputText, handleSendMessage]
  );

  // Handle configuration approval
  const handleConfigApproval = useCallback(
    (config: AIBotConfiguration) => {
      if (onFormPopulate) {
        onFormPopulate(config.settings);
      }

      // Add success message
      const successMessage: AIBotMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content:
          '✅ Configuration applied successfully! The bot settings have been populated in the creation form.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, successMessage]);
      setCurrentConfig(null);
    },
    [onFormPopulate]
  );

  // Handle configuration rejection
  const handleConfigRejection = useCallback(() => {
    const rejectionMessage: AIBotMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content:
        "Configuration rejected. Please describe your requirements differently, and I'll generate a new configuration for you.",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, rejectionMessage]);
    setCurrentConfig(null);
  }, []);

  // Handle missing information request
  const handleMissingInfoRequest = useCallback(
    (requests: MissingInfoType[]) => {
      setPendingMissingInfo(requests);
      setShowMissingInfoRequest(true);
    },
    []
  );

  // Handle missing information submission
  const handleMissingInfoSubmission = useCallback(
    async (responses: Record<string, string>) => {
      if (!user?.id || !tokens?.accessToken || !currentConfig) return;

      setShowMissingInfoRequest(false);
      setIsGenerating(true);

      try {
        // Create a refined request with the provided information
        const refinedRequest = `Please refine the previous bot configuration with this additional information: ${Object.entries(
          responses
        )
          .map(([field, value]) => `${field}: ${value}`)
          .join(
            ', '
          )}. Use the same strategy but incorporate these specific details.`;

        // Generate refined configuration
        const refinedConfig = await aiService.generateBotConfiguration(
          refinedRequest,
          user.id,
          tokens.accessToken,
          suggestBestValues
        );

        // Create AI response message
        const aiMessage: AIBotMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Thank you for the additional information! I've refined the configuration: ${refinedConfig.explanation}`,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setCurrentConfig(refinedConfig);
      } catch (error) {
        console.error(
          '[AIBotAssistant] Failed to refine configuration:',
          error
        );

        const errorMessage: AIBotMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `I encountered an error while refining the configuration: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsGenerating(false);
        setPendingMissingInfo([]);
      }
    },
    [user, tokens, currentConfig, aiService, suggestBestValues]
  );

  // Handle missing information cancellation
  const handleMissingInfoCancellation = useCallback(() => {
    setShowMissingInfoRequest(false);
    setPendingMissingInfo([]);

    const cancelMessage: AIBotMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content:
        'No problem! You can ask me to create a different bot configuration, or I can proceed with the current settings using default values.',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, cancelMessage]);
  }, []);

  // Render conversation starters
  const renderConversationStarters = () => (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6 overflow-y-auto custom-scrollbar">
      <div className="text-center mb-6 shrink-0">
        <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-semibold mb-2">AI Bot Assistant</h3>
        <p className="text-muted-foreground text-sm">
          Describe the trading bot you want to create, and I'll help configure
          it for you
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm w-full max-w-md max-h-80 overflow-y-auto custom-scrollbar">
        {conversationStarters.map((starter, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              className="h-auto p-md text-left flex flex-col items-start gap-xs hover:bg-primary/10 hover:border-primary/30 transition-all group whitespace-normal"
              onClick={() => handleStarterClick(starter.message)}
            >
              <div className="flex items-center gap-xs w-full">
                <span className="text-lg">{starter.icon}</span>
                <span className="font-medium text-sm">{starter.title}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left leading-relaxed">
                {starter.message}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Render chat messages
  const renderMessages = () => (
    <div className="h-full overflow-y-auto custom-scrollbar p-md space-y-md pb-2">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}
          >
            {index === 0 || messages[index - 1].type !== message.type ? (
              <div
                className={`text-sm font-semibold mb-1 flex items-center gap-1 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <Sparkles className="h-4 w-4" />
                )}
                {message.type === 'user' ? 'You' : 'AI Assistant'}
              </div>
            ) : null}

            <Card
              className={
                message.type === 'user' ? 'bg-primary text-white' : 'bg-muted'
              }
            >
              <CardContent className="p-sm">
                <div className="text-sm break-words">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.type === 'user'
                      ? 'text-white/70'
                      : 'text-muted-foreground'
                  } text-right`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ))}

      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <Card className="bg-muted">
            <CardContent className="p-sm">
              <div className="flex items-center gap-xs text-sm text-muted-foreground">
                <div className="animate-pulse">●●●</div>
                AI is thinking...
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scroll anchor for auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  );

  // Configuration preview functionality removed to avoid unused function warnings
  /*
  const _renderConfigurationPreview = () => {
    if (!currentConfig) return null;

    return (
      <div className="border-t border-b p-md bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-xs">
            <Settings className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Generated Configuration</span>
            <Badge
              variant="outline"
              className={`text-xs ${
                currentConfig.confidence === 'high'
                  ? 'border-green-200 text-green-700'
                  : currentConfig.confidence === 'medium'
                  ? 'border-yellow-200 text-yellow-700'
                  : 'border-red-200 text-red-700'
              }`}
            >
              {currentConfig.confidence} confidence
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-sm text-xs">
          <div>
            <span className="text-muted-foreground">Pair:</span>
            <span className="ml-2 font-medium">{currentConfig.settings.pair}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Strategy:</span>
            <span className="ml-2 font-medium capitalize">{currentConfig.settings.strategy}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Base Order:</span>
            <span className="ml-2 font-medium">${currentConfig.settings.baseOrderSize}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Take Profit:</span>
            <span className="ml-2 font-medium">{currentConfig.settings.tpPerc}%</span>
          </div>
        </div>

        {currentConfig.missingInfo.length > 0 && (
          <div className="mt-3 p-xs bg-yellow-50 border border-yellow-200 rounded text-xs">
            <div className="font-medium text-yellow-800 mb-1">Missing Information:</div>
            <ul className="text-yellow-700 space-y-1">
              {currentConfig.missingInfo.map((info, index) => (
                <li key={index}>• {info.question}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-xs mt-3">
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
            onClick={() => {
              if (onFormPopulate) {
                onFormPopulate(currentConfig.settings);
              }
            }}
          >
            Apply to Form
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentConfig(null)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  };
  */

  // Render input area
  const renderInput = () => (
    <div className="border-t p-md">
      <form onSubmit={handleSubmit} className="flex gap-xs">
        <div className="flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe the bot you want to create..."
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            disabled={isGenerating}
          />

          {/* Settings toggle and status */}
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center gap-xs">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettingsToggle(!showSettingsToggle)}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
              <Badge
                variant="outline"
                className={`text-xs ${
                  suggestBestValues
                    ? 'border-green-200 text-green-700'
                    : 'border-blue-200 text-blue-700'
                }`}
              >
                <Sparkles className="w-2 h-2 mr-1" />
                {suggestBestValues ? 'Auto-Suggest' : 'Ask Me'}
              </Badge>
            </div>
            <div className="flex items-center gap-xs">
              <Badge
                variant="outline"
                className={`text-xs ${
                  connectionStatus === 'Connected'
                    ? 'border-green-200 text-green-700'
                    : 'border-red-200 text-red-700'
                }`}
              >
                {connectionStatus === 'Connected' ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {connectionStatus}
              </Badge>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className="px-4 bg-primary hover:bg-primary/90 text-white"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );

  return (
    <WidgetWrapper
      metadata={{
        id: widgetId,
        type: 'ai-bot-assistant',
        title: 'AI Bot Assistant',
        hasOptions: true,
        value: {
          primary: 'AI Powered',
          secondary: `${messages.length} messages`,
        },
      }}
      isEditable={isEditable}
      {...(onCollapse && { onCollapse })}
      {...(onTabMove && { onTabMove })}
      {...(menuActions && { menuActions })}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Settings Toggle */}
        {showSettingsToggle && (
          <div className="shrink-0 p-md pb-0">
            <SuggestBestValuesToggle
              enabled={suggestBestValues}
              onToggle={(enabled) => {
                setSuggestBestValues(enabled);
                setShowSettingsToggle(false);
              }}
            />
          </div>
        )}

        {/* Missing Information Request */}
        {showMissingInfoRequest && pendingMissingInfo.length > 0 && (
          <div className="shrink-0 p-md pb-0">
            <MissingInfoRequest
              requests={pendingMissingInfo}
              onSubmit={handleMissingInfoSubmission}
              onCancel={handleMissingInfoCancellation}
            />
          </div>
        )}

        {/* Configuration Preview */}
        {currentConfig && !showMissingInfoRequest && (
          <div className="shrink-0 p-md pb-0">
            <BotSettingsPreview
              config={currentConfig}
              onApprove={handleConfigApproval}
              onReject={handleConfigRejection}
              onRequestMissingInfo={handleMissingInfoRequest}
            />
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 min-h-0">
          {messages.length === 0
            ? renderConversationStarters()
            : renderMessages()}
        </div>

        {/* Input Area */}
        <div className="shrink-0">{renderInput()}</div>
      </div>
    </WidgetWrapper>
  );
};

export default AIBotAssistant;
