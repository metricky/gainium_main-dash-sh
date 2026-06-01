// This file must be imported first in App.tsx to ensure the bot registry
// is initialized before any components that use bot stores are loaded
import { ensureBotRegistryBootstrapped } from './features/bots/registry/index';

// Bootstrap the registry immediately when this module is imported
ensureBotRegistryBootstrapped();

// Export for explicit calls if needed
export { ensureBotRegistryBootstrapped };
