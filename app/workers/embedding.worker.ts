import { env, AutoTokenizer, AutoModel } from '@huggingface/transformers';

console.log('[Worker] Starting embedding worker...');

// Configure transformers.js to use local models
env.localModelPath = '/models';
env.allowLocalModels = true;

const embeddingModel = "Xenova/all-MiniLM-L6-v2";

// Use the Singleton pattern to enable lazy construction of the model
class ModelSingleton {
  static tokenizer: any = null;
  static model: any = null;
  static isInitializing: boolean = false;
  static initializationProgress: string = '';
  static initializationError: string | null = null;

  static getStatus() {
    if (this.tokenizer && this.model) {
      return { status: 'ready' };
    }
    if (this.initializationError) {
      return { status: 'error', message: this.initializationError };
    }
    if (this.isInitializing) {
      return { status: 'progress', message: this.initializationProgress || 'Initializing...' };
    }
    return { status: 'not_started' };
  }

  static async getInstance(progress_callback: ((progress: any) => void) | null = null) {
    if (this.isInitializing) {
      console.log('[Worker] Initialization already in progress');
      return null;
    }

    try {
      this.isInitializing = true;
      this.initializationError = null;

      if (!this.tokenizer || !this.model) {
        if (progress_callback) {
          progress_callback({ status: 'initiate' });
        }

        this.initializationProgress = 'Loading tokenizer...';
        console.log('[Worker] Loading tokenizer...');
        if (progress_callback) {
          progress_callback({ status: 'progress', message: this.initializationProgress });
        }

        try {
          this.tokenizer = await AutoTokenizer.from_pretrained(embeddingModel);
          console.log('[Worker] Tokenizer loaded successfully');
        } catch (error) {
          this.initializationError = `Error loading tokenizer: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('[Worker] Error loading tokenizer:', error);
          throw error;
        }

        this.initializationProgress = 'Loading model...';
        console.log('[Worker] Loading model...');
        if (progress_callback) {
          progress_callback({ status: 'progress', message: this.initializationProgress });
        }

        try {
          this.model = await AutoModel.from_pretrained(embeddingModel, {
            revision: 'main',
            dtype: 'fp32'
          });
          console.log('[Worker] Model loaded successfully');
        } catch (error) {
          this.initializationError = `Error loading model: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('[Worker] Error loading model:', error);
          throw error;
        }

        console.log('[Worker] Model initialization complete');
        if (progress_callback) {
          progress_callback({ status: 'ready' });
        }
      }

      return { tokenizer: this.tokenizer, model: this.model };
    } catch (error) {
      console.error('[Worker] Error in getInstance:', error);
      if (progress_callback) {
        progress_callback({ 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }
}

async function generateEmbeddings(texts: string[]) {
  try {
    const instance = await ModelSingleton.getInstance();
    if (!instance) {
      throw new Error('Model initialization in progress');
    }
    
    const { tokenizer, model } = instance;
    
    const inputs = await tokenizer(texts, {
      return_tensors: "pt",
      padding: true,
      truncation: true,
    });

    const { input_ids, attention_mask } = inputs;
    const outputs = await model.forward({
      input_ids,
      attention_mask,
    });
    
    return outputs.last_hidden_state.mean(1).tolist();
  } catch (error) {
    console.error('[Worker] Error generating embeddings:', error);
    throw error;
  }
}

// Handle messages from the main thread
self.onmessage = async (event) => {
  const { type, payload, id } = event.data;
  console.log('[Worker] Received message:', { type, payload, id });
  
  try {
    switch (type) {
      case 'GENERATE_EMBEDDINGS':
        console.log('[Worker] Generating embeddings...');
        const embeddings = await generateEmbeddings(payload.texts);
        console.log('[Worker] Embeddings generated successfully');
        self.postMessage({ type: 'EMBEDDINGS_RESULT', payload: embeddings, id });
        break;

      case 'INITIALIZE':
        console.log('[Worker] Handling initialize request...');
        await ModelSingleton.getInstance((progress) => {
          self.postMessage({ ...progress, id });
        });
        console.log('[Worker] Initialization complete');
        break;

      case 'CHECK_STATUS':
        const status = ModelSingleton.getStatus();
        self.postMessage({ ...status, id });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error('[Worker] Error handling message:', error);
    self.postMessage({ 
      type: 'ERROR', 
      payload: error instanceof Error ? error.message : 'Unknown error occurred', 
      id 
    });
  }
}; 