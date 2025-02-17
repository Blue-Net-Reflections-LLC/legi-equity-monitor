'use client';

import { env, AutoTokenizer, AutoModel } from '@huggingface/transformers';

// Configure transformers.js to use local models
env.localModelPath = '/models';
env.allowLocalModels = true;

const embeddingModel = "Xenova/all-MiniLM-L6-v2";

// Add device detection function
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for mobile user agent patterns
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobile = mobileRegex.test(navigator.userAgent);
  
  // Additional check for screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobile || isSmallScreen;
}

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
  private static tokenizer: TokenizerType | null = null;
  private static model: ModelType | null = null;
  private loadPromise: Promise<void> | null = null;
  private isMobile: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMobile = isMobileDevice();
      console.log('[EmbeddingService] Device detection:', {
        isMobile: this.isMobile,
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth
      });
    }
  }

  async load(): Promise<void> {
    // Skip loading on mobile devices
    if (this.isMobile) {
      console.log('[EmbeddingService] Skipping model loading on mobile device');
      return;
    }

    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        if (!EmbeddingService.tokenizer || !EmbeddingService.model) {
          EmbeddingService.tokenizer = await AutoTokenizer.from_pretrained(embeddingModel);
          EmbeddingService.model = await AutoModel.from_pretrained(embeddingModel, {
            revision: 'main',
            dtype: this.isMobile ? 'int8' : 'fp32'
          });
        }
      })();
    }
    return this.loadPromise;
  }

  async generateEmbedding(text: string): Promise<number[][]> {
    return this.generateEmbeddings([text]);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Disable embeddings on mobile devices
    if (this.isMobile) {
      console.log('[EmbeddingService] Skipping embedding generation on mobile device');
      // Return empty embeddings array matching the input length
      return texts.map(() => []);
    }

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
    EmbeddingService.tokenizer = null;
    EmbeddingService.model = null;
    this.loadPromise = null;
  }
}

export const embeddingService = new EmbeddingService();
export const generateEmbeddings = (texts: string[]): Promise<number[][]> => {
  return embeddingService.generateEmbeddings(texts);
} 