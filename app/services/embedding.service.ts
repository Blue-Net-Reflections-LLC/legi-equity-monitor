'use client';

import { pipeline, env, FeatureExtractionPipeline } from '@huggingface/transformers';

// Configure transformers.js to use local models
env.localModelPath = '/models';
env.allowLocalModels = true;

class EmbeddingService {
  private static pipeline: FeatureExtractionPipeline | null = null;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Don't do anything in constructor - defer to load() method
  }

  async load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        if (!EmbeddingService.pipeline) {
          EmbeddingService.pipeline = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2',
            {
              revision: 'main',
              device: 'auto',
              dtype: 'fp32',
            }
          );
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

  dispose() {
    EmbeddingService.pipeline = null;
    this.loadPromise = null;
  }
}

export const embeddingService = new EmbeddingService(); 