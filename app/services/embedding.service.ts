'use client';

import { pipeline, env, FeatureExtractionPipeline } from '@huggingface/transformers';

// Configure transformers.js to use local models
env.localModelPath = '/models';
env.allowLocalModels = true;

class EmbeddingService {
  private worker: Worker | null = null;
  private pipeline: FeatureExtractionPipeline | null = null;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Don't do anything in constructor - defer to load() method
  }

  private async initializeWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worker = new Worker(new URL('../workers/embedding.worker.ts', import.meta.url));
      
      const handleMessage = async (event: MessageEvent) => {
        const { type, error } = event.data;
        
        if (type === 'loaded') {
          try {
            this.pipeline = await pipeline(
              'feature-extraction',
              'Xenova/all-MiniLM-L6-v2',
              {
                revision: 'main',
                device: 'auto',
                dtype: 'fp32',
              }
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        } else if (type === 'error') {
          reject(new Error(error));
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage({ type: 'load' });
    });
  }

  async load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.initializeWorker();
    }
    return this.loadPromise;
  }

  async generateEmbedding(text: string): Promise<number[][]> {
    await this.load();
    if (!this.pipeline) {
      throw new Error('Pipeline not initialized');
    }

    const embeddings = await this.pipeline(text, {
      pooling: 'mean',
      normalize: true,
    });

    return embeddings.tolist();
  }

  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pipeline = null;
    this.loadPromise = null;
  }
}

export const embeddingService = new EmbeddingService(); 