import { useGraphQL } from './useGraphQL'
import { GraphQlQuery } from '@/lib/api'

export interface AiModelInfo {
  modelId: string
  name: string
  creditsPerMillionInput: number
  creditsPerMillionOutput: number
  isDefault?: boolean
}

export interface AiModelsData {
  models: AiModelInfo[]
  helpModel: AiModelInfo | null
  chargeHelpMode: boolean
}

export function useAiModels() {
  return useGraphQL<AiModelsData>(
    'getAvailableAiModels',
    GraphQlQuery.getAvailableAiModels(),
  )
}
