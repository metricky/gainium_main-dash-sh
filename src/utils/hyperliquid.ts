import { ethers, Wallet } from 'ethers';
import * as hl from '@nktkas/hyperliquid';
import { ExchangeEnum } from '@/types/exchange.types';

/** Hex address type matching the Hyperliquid SDK's expectation */
type Hex = `0x${string}`;

/**
 * Generate a new agent wallet (private key)
 * This wallet will be used to sign trades on behalf of the main wallet
 */
export const generateAgentWallet = (): {
  address: string;
  privateKey: string;
} => {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

/**
 * Complete Hyperliquid setup flow:
 * 1. Generate agent wallet
 * 2. Approve agent using the Hyperliquid SDK
 * 3. Optionally approve builder fee
 *
 * @param signer - The ethers Signer from the main wallet
 * @param useApproveBuilderFees - Whether to approve builder fees
 * @returns The agent wallet credentials and status
 */
export const completeHyperliquidSetup = async (
  signer: ethers.Signer,
  useApproveBuilderFees = false
): Promise<{
  success: boolean;
  agentAddress?: string;
  agentPrivateKey?: string;
  error?: string;
  details?: string;
}> => {
  const maxFeeRate = '0.07%';
  try {
    // Step 1: Generate agent wallet
    const agent = generateAgentWallet();
    const isTestnet =
      import.meta.env['VITE_HYPERLIQUID_ENV'] === 'demo';

    // Step 2: Create Hyperliquid exchange client with the main wallet
    const transport = new hl.HttpTransport({ isTestnet });

    const exchClient = new hl.ExchangeClient({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wallet: signer as any, // The SDK supports ethers signers
      transport,
      isTestnet,
    });

    // Step 3: Approve the agent
    try {
      await exchClient.approveAgent({
        agentAddress: agent.address as Hex,
        agentName: `GainiumTrading valid_until ${
          +new Date() + 90 * 24 * 60 * 60 * 1000
        }`,
      });
    } catch (agentError: unknown) {
      const err = agentError as { response?: { response?: unknown } };
      return {
        success: false,
        error: 'Failed to approve agent',
        details:
          err?.response?.response?.toString() || `${agentError}`,
      };
    }

    // Step 4: Approve builder fee (if requested)
    if (useApproveBuilderFees) {
      const apiEndpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      const builderAddress = await fetch(`${apiEndpoint}broker-codes`)
        .then((res) => res.json())
        .then(
          (data: { exchange: ExchangeEnum; code: string }[]) =>
            data.find((bc) => bc.exchange === ExchangeEnum.hyperliquid)
              ?.code
        )
        .catch(() => undefined);
      if (builderAddress) {
        try {
          await exchClient.approveBuilderFee({
            maxFeeRate,
            builder: builderAddress as Hex,
          });
        } catch (builderError: unknown) {
          const err = builderError as { response?: { response?: unknown } };
          return {
            success: false,
            error: 'Failed to approve builder fee',
            details:
              err?.response?.response?.toString() || `${builderError}`,
          };
        }
      }
    }

    return {
      success: true,
      agentAddress: agent.address,
      agentPrivateKey: agent.privateKey,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
