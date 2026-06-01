/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from '../../../../lib/loggerInstance';
import type {
  AIBotConfiguration,
  BotCreationFormData,
} from '../types/AIBotTypes';
import {
  BOT_CREATION_SYSTEM_PROMPT,
  validateBotConfiguration,
} from '../types/BotConfigSchema';

export class AIBotService {
  private static instance: AIBotService;
  private socket: any = null;
  private isConnected = false;

  private constructor() {
    this.initializeWebSocket();
  }

  public static getInstance(): AIBotService {
    if (!AIBotService.instance) {
      AIBotService.instance = new AIBotService();
    }
    return AIBotService.instance;
  }

  private initializeWebSocket(): void {
    // Use existing WebSocket connection from window
    if (typeof window !== 'undefined' && (window as any).socket) {
      this.socket = (window as any).socket;
      this.isConnected = this.socket.connected;

      // Listen for connection events
      this.socket.on('connect', () => {
        this.isConnected = true;
        logger.info('[AIBotService] WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        logger.info('[AIBotService] WebSocket disconnected');
      });
    }
  }

  public async generateBotConfiguration(
    userMessage: string,
    userId: string,
    userToken: string,
    suggestBestValues: boolean = true
  ): Promise<AIBotConfiguration> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Create concise prompt
      const prompt = `${BOT_CREATION_SYSTEM_PROMPT}

USER REQUEST: ${userMessage}
MISSING INFO HANDLING: ${suggestBestValues ? 'Auto-suggest values' : 'Ask user for details'}

Respond with JSON only.`;

      // Generate unique request ID for tracking
      // const requestId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Set up response listener using the correct chat events
      const responseHandler = (messages: any[]) => {
        logger.info('[AIBotService] Received chat messages:', messages);

        // Check if this is a response to our request
        // The AI might not include the request ID in the response, so we'll use a different approach
        if (messages && messages.length > 0) {
          // Get the most recent message from the AI
          const latestMessage = messages[messages.length - 1];

          if (
            latestMessage &&
            latestMessage.type === 'in' &&
            latestMessage.message
          ) {
            logger.info('[AIBotService] Found AI response:', latestMessage);

            // Clean up all listeners
            this.socket.off('chat msg out', responseHandler);
            this.socket.off('chat error', errorHandler);
            this.socket.off('chat msg out', debugHandler);
            clearTimeout(timeoutId);

            try {
              // Parse AI response from the message content
              const parsedConfig = this.parseAIResponse(latestMessage.message);
              logger.info('[AIBotService] Parsed configuration:', parsedConfig);
              resolve(parsedConfig);
            } catch (error) {
              console.error('[AIBotService] Failed to parse response:', error);
              // If parsing fails, try to provide a fallback response
              const fallbackConfig = this.createFallbackConfiguration(
                latestMessage.message
              );
              logger.info(
                '[AIBotService] Using fallback configuration:',
                fallbackConfig
              );
              resolve(fallbackConfig);
            }
          }
        }
      };

      // Set up error handler
      const errorHandler = (error: any) => {
        this.socket.off('chat msg out', responseHandler);
        this.socket.off('chat error', errorHandler);
        this.socket.off('chat msg out', debugHandler);
        clearTimeout(timeoutId);

        // Handle quota exceeded specifically
        if (error.reason === 'Message quota exceeded') {
          logger.info(
            '[AIBotService] Quota exceeded, using fallback configuration'
          );
          // Generate a fallback configuration based on the user request
          const fallbackConfig = this.createQuotaFallbackConfiguration(
            'Bot creation request',
            suggestBestValues
          );
          resolve(fallbackConfig);
        } else {
          reject(
            new Error(
              `AI request failed: ${error.reason || error.message || 'Unknown error'}`
            )
          );
        }
      };

      // Add comprehensive debugging for all chat events
      const debugHandler = (data: any) => {
        logger.info('[AIBotService] DEBUG - All chat events:', data);
      };

      // Listen for responses using the correct events
      this.socket.on('chat msg out', responseHandler);
      this.socket.on('chat error', errorHandler);

      // Add debug listeners for all possible events
      this.socket.on('chat msg out', debugHandler);
      this.socket.onAny((eventName: string, ...args: any[]) => {
        if (eventName.includes('chat') || eventName.includes('msg')) {
          logger.info(`[AIBotService] DEBUG - Event: ${eventName}`, { args });
        }
      });

      // Send request using the correct chat event
      // Simplified message without request ID for now
      const fullMessage = `${prompt}`;

      // Check message length (typical limit is around 4000-5000 characters)
      if (fullMessage.length > 4000) {
        console.warn(
          '[AIBotService] Message length:',
          fullMessage.length,
          'characters - may be too long'
        );
      }

      const chatMessage = {
        userId,
        userToken,
        message: fullMessage,
        currentUrl: window.location.href,
        spoilers: [],
        model: 'anthropic/claude-sonnet-4', // Use best available model
      };

      logger.info('[AIBotService] Sending chat message', {
        length: fullMessage.length,
        message: chatMessage,
      });
      this.socket.emit('chat msg in', chatMessage);

      // Set timeout for request with better error message
      const timeoutId = setTimeout(() => {
        this.socket.off('chat msg out', responseHandler);
        this.socket.off('chat error', errorHandler);
        this.socket.off('chat msg out', debugHandler);
        this.socket.offAny();
        reject(
          new Error(
            'Request timed out after 45 seconds. The AI service may be busy. Please try again with a simpler request or check your connection.'
          )
        );
      }, 45000); // Increased to 45 second timeout
    });
  }

  private parseAIResponse(aiResponse: string): AIBotConfiguration {
    try {
      // Clean up response - remove any markdown formatting and request ID
      let cleanResponse = aiResponse.trim();

      // Remove request ID if present
      cleanResponse = cleanResponse
        .replace(/Request ID: bot_\d+_[a-zA-Z0-9]+/g, '')
        .trim();

      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse
          .replace(/```json\n?/, '')
          .replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse
          .replace(/```\n?/, '')
          .replace(/\n?```$/, '');
      }

      // Try to extract JSON from the response if it's mixed with other text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      // Parse JSON
      const parsed = JSON.parse(cleanResponse);

      // Validate required structure
      if (!parsed.explanation || !parsed.confidence || !parsed.settings) {
        throw new Error('Invalid AI response structure');
      }

      // Validate bot configuration
      const validation = validateBotConfiguration(parsed.settings);
      if (!validation.isValid) {
        console.warn(
          '[AIBotService] Configuration validation warnings:',
          validation.errors
        );
        // Don't reject, but log warnings - AI might have good reasons
      }

      // Ensure arrays exist
      parsed.missingInfo = parsed.missingInfo || [];
      parsed.suggestions = parsed.suggestions || [];

      return {
        explanation: parsed.explanation,
        confidence: parsed.confidence,
        settings: parsed.settings as BotCreationFormData,
        missingInfo: parsed.missingInfo,
        suggestions: parsed.suggestions,
      };
    } catch (error) {
      console.error('[AIBotService] Failed to parse AI response:', error);
      console.error('[AIBotService] Raw response:', aiResponse);

      // Return fallback configuration
      return this.createFallbackConfiguration(aiResponse);
    }
  }

  private createFallbackConfiguration(
    originalMessage: string
  ): AIBotConfiguration {
    return {
      explanation: `I encountered an issue processing your request: "${originalMessage}". Here's a conservative DCA bot configuration as a starting point.`,
      confidence: 'low',
      settings: {
        name: 'AI Generated Bot',
        pair: 'BTCUSDT',
        pairs: ['BTCUSDT'],
        exchange: 'binance',
        exchangeUUID: '',
        strategy: 'long',
        type: 'dca',
        enabled: false,
        baseOrderSize: '100',
        orderSize: '200',
        orderFixedIn: 'quote',
        profitCurrency: 'quote',
        step: '2.5',
        ordersCount: 5,
        stepScale: '1.0',
        volumeScale: '1.0',
        minimumDeviation: '0.1',
        useDca: true,
        dcaCondition: '',
        scaleDcaType: '',
        maxNumberOfOpenDeals: '1',
        useSmartOrders: true,
        activeOrdersCount: 3,
        startCondition: 'asap',
        useTp: true,
        tpPerc: '2.5',
        useSl: false,
        slPerc: '-10.0',
        useMultiTp: false,
        trailingTp: false,
        trailingTpPerc: '1.0',
        multiTp: [],
        trailingSl: false,
        moveSL: false,
        moveSLTrigger: '0',
        moveSLValue: '0',
        startOrderType: 'market',
        useLimitPrice: false,
        limitTimeout: '300',
        useLimitTimeout: false,
        hodlDay: '',
        hodlAt: '',
        hodlHourly: false,
        hodlNextBuy: 0,
        futures: false,
        coinm: false,
        leverage: 1,
        marginType: 'isolated',
        useMulti: false,
        maxDealsPerPair: '1',
        useCooldown: false,
        closeByTimer: false,
        closeByTimerValue: 0,
      },
      missingInfo: [
        {
          field: 'pair',
          question: 'Which trading pair would you like to use?',
          type: 'select',
          options: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOGEUSDT'],
          required: true,
        },
        {
          field: 'baseOrderSize',
          question: 'What should be your initial order size in USDT?',
          type: 'number',
          required: true,
        },
      ],
      suggestions: [
        'Please provide more specific details about your trading strategy',
        'Consider starting with paper trading to test the configuration',
        'Review the risk management settings before going live',
      ],
    };
  }

  private createQuotaFallbackConfiguration(
    userRequest: string,
    suggestBestValues: boolean
  ): AIBotConfiguration {
    // Analyze user request for key terms to create appropriate configuration
    const request = userRequest.toLowerCase();

    // Determine strategy based on request
    let strategy: 'long' | 'short' | 'both' = 'long';
    if (request.includes('short') || request.includes('sell'))
      strategy = 'short';
    if (request.includes('both') || request.includes('bidirectional'))
      strategy = 'both';

    // Determine bot type
    let type: 'dca' | 'grid' | 'combo' = 'dca';
    if (request.includes('grid')) type = 'grid';
    if (request.includes('combo')) type = 'combo';

    // Determine risk level
    let riskLevel = 'conservative';
    if (request.includes('aggressive') || request.includes('high risk'))
      riskLevel = 'aggressive';
    if (request.includes('moderate') || request.includes('medium'))
      riskLevel = 'moderate';

    // Determine pair
    let pair = 'BTCUSDT';
    if (request.includes('eth') || request.includes('ethereum'))
      pair = 'ETHUSDT';
    if (request.includes('ada') || request.includes('cardano'))
      pair = 'ADAUSDT';
    if (request.includes('doge') || request.includes('dogecoin'))
      pair = 'DOGEUSDT';

    // Set parameters based on risk level
    let baseOrderSize = '100';
    let orderSize = '200';
    let step = '2.5';
    let ordersCount = 5;
    let tpPerc = '3.0';

    if (riskLevel === 'aggressive') {
      baseOrderSize = '200';
      orderSize = '400';
      step = '5.0';
      ordersCount = 8;
      tpPerc = '5.0';
    } else if (riskLevel === 'moderate') {
      baseOrderSize = '150';
      orderSize = '300';
      step = '3.5';
      ordersCount = 6;
      tpPerc = '4.0';
    }

    // Long-term adjustments
    if (request.includes('long-term') || request.includes('accumulating')) {
      step = '5.0';
      ordersCount = 10;
      tpPerc = '8.0';
    }

    return {
      explanation: `🤖 AI quota exceeded. Generated ${riskLevel} ${type.toUpperCase()} bot for ${pair} based on your request analysis. This configuration uses rule-based logic instead of AI.`,
      confidence: 'medium',
      settings: {
        // Required properties for BotCreationFormData
        enabled: true,
        minimumDeviation: '1.0',
        activeOrdersCount: 1,

        name: `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} ${pair} ${type.toUpperCase()}`,
        pair,
        pairs: [pair],
        exchange: 'binance',
        exchangeUUID: '',
        strategy,
        type,
        baseOrderSize,
        orderSize,
        orderFixedIn: 'quote',
        profitCurrency: 'quote',
        step,
        ordersCount,
        stepScale: '1.0',
        volumeScale: riskLevel === 'aggressive' ? '1.5' : '1.0',
        useDca: true,
        useTp: true,
        tpPerc,
        useSl: false,
        slPerc: '-10.0',
        useMultiTp: false,
        trailingTp: false,
        trailingTpPerc: '1.0',
        multiTp: [],
        trailingSl: false,
        moveSL: false,
        moveSLTrigger: '0',
        moveSLValue: '0',
        maxNumberOfOpenDeals: '1',
        useSmartOrders: true,
        startCondition: 'asap',
        startOrderType: 'market',
        useLimitPrice: false,
        limitTimeout: '300',
        useLimitTimeout: false,
        hodlDay: '',
        hodlAt: '',
        hodlHourly: false,
        hodlNextBuy: 0,
        futures: false,
        coinm: false,
        leverage: 1,
        marginType: 'isolated',
        useMulti: false,
        maxDealsPerPair: '1',
        useCooldown: false,
        closeByTimer: false,
        closeByTimerValue: 0,
      },
      missingInfo: suggestBestValues
        ? []
        : [
            {
              field: 'budget',
              question: 'What is your total budget for this bot?',
              type: 'number',
              required: true,
            },
            {
              field: 'riskTolerance',
              question: 'What is your risk tolerance (low/medium/high)?',
              type: 'select',
              required: false,
            },
          ],
      suggestions: [
        '⚠️ AI quota exceeded - using intelligent rule-based configuration',
        'Configuration generated from request analysis',
        'Please review all settings carefully',
        'Consider starting with paper trading',
        `Estimated capital needed: $${(parseInt(baseOrderSize) + ordersCount * parseInt(orderSize)).toLocaleString()}`,
        'Try again later when AI quota resets (usually daily)',
      ],
    };
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  public getConnectionStatus(): string {
    if (!this.socket) return 'No WebSocket available';
    if (this.isConnected) return 'Connected';
    return 'Disconnected';
  }
}
