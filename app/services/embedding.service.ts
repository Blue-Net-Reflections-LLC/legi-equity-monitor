'use client';

import { pipeline, env, FeatureExtractionPipeline, AutoTokenizer, AutoModel } from '@huggingface/transformers';

// Configure transformers.js to use local models
env.localModelPath = '/models';
env.allowLocalModels = true;

const embeddingModel = "Xenova/all-MiniLM-L6-v2";

interface TokenizerType {
  (texts: string[], options: {
    return_tensors: string;
    padding: boolean;
    truncation: boolean;
  }): Promise<{
    input_ids: unknown;
    attention_mask: unknown;
  }>;
}

interface ModelType {
  forward(input: {
    input_ids: unknown;
    attention_mask: unknown;
  }): Promise<{
    last_hidden_state: {
      mean(dim: number): {
        tolist(): number[][];
      };
    };
  }>;
}

class EmbeddingService {
  private static pipeline: FeatureExtractionPipeline | null = null;
  private static tokenizer: TokenizerType | null = null;
  private static model: ModelType | null = null;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Don't do anything in constructor - defer to load() method
  }

  async load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        if (!EmbeddingService.pipeline) {
          // Load components sequentially
          EmbeddingService.pipeline = await pipeline(
            'feature-extraction',
            embeddingModel,
            {
              revision: 'main',
              device: 'auto',
              dtype: 'fp32',
            }
          );
          EmbeddingService.tokenizer = await AutoTokenizer.from_pretrained(embeddingModel);
          EmbeddingService.model = await AutoModel.from_pretrained(embeddingModel);
        }
      })();
    }
    return this.loadPromise;
  }

  async generateEmbedding(text: string): Promise<number[][]> {
    await this.load();
    
    if (!EmbeddingService.pipeline) {
      throw new Error('Pipeline not initialized');
    }
    const embeddings = await EmbeddingService.pipeline(text, {
      pooling: 'mean',
      normalize: true,
      quantize: false,
    });
    const embeddingsArray = embeddings.tolist();
    return embeddingsArray;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    await this.load();

    if (!EmbeddingService.tokenizer || !EmbeddingService.model) {
      throw new Error('Tokenizer or model not initialized');
    }

    const inputs = await EmbeddingService.tokenizer(texts, {
      return_tensors: "pt",
      padding: true,
      truncation: true,
    });

    const { input_ids, attention_mask } = inputs;
    const outputs = await EmbeddingService.model.forward({
      input_ids,
      attention_mask,
    });
    
    return outputs.last_hidden_state.mean(1).tolist();
  }

  dispose() {
    EmbeddingService.pipeline = null;
    EmbeddingService.tokenizer = null;
    EmbeddingService.model = null;
    this.loadPromise = null;
  }
}

export const embeddingService = new EmbeddingService();
export const generateEmbeddings = (texts: string[]): Promise<number[][]> => {
  return embeddingService.generateEmbeddings(texts);
} 