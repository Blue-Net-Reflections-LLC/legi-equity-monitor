'use client';

import { env } from '@huggingface/transformers';
import { store } from '@/app/lib/redux/store';
import { setStatus, setError } from '@/app/lib/redux/features/embedding/embeddingSlice';

// Configure transformers.js to use local models
env.localModelPath = '/models';
env.allowLocalModels = true;

// Device detection
const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  // Only return true for Android - iOS will be blocked
  return isAndroid();
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

class EmbeddingService {
  private static instance: EmbeddingService | null = null;
  private static worker: Worker | null = null;
  private static loadPromise: Promise<void> | null = null;
  private static isInitializing: boolean = false;
  private static hasInitialized: boolean = false;

  private isMobile: boolean = false;
  private isInitialized: boolean = false;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (EmbeddingService.instance) {
      return EmbeddingService.instance;
    }

    if (typeof window !== 'undefined') {
      this.isMobile = isMobileDevice();
      // console.log('[EmbeddingService] Device detection:', {
      //   isMobile: this.isMobile,
      //   userAgent: navigator.userAgent,
      //   screenWidth: window.innerWidth
      // });
    }

    EmbeddingService.instance = this;
  }

  private cleanup() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    if (EmbeddingService.worker) {
      EmbeddingService.worker.onmessage = null;
      EmbeddingService.worker.onerror = null;
      EmbeddingService.worker.onmessageerror = null;
      EmbeddingService.worker.terminate();
      EmbeddingService.worker = null;
    }

    this.isInitialized = false;
    EmbeddingService.isInitializing = false;
    EmbeddingService.hasInitialized = false;
    this.pendingRequests.clear();
    EmbeddingService.loadPromise = null;
    store.dispatch(setStatus({ status: 'idle' }));
  }

  async load(): Promise<void> {
    // Skip if already initialized
    if (EmbeddingService.hasInitialized) {
      // console.log('[EmbeddingService] Already initialized, skipping...');
      store.dispatch(setStatus({ status: 'ready', message: 'Model loaded successfully' }));
      return;
    }

    // Return existing promise if initialization is in progress
    if (EmbeddingService.loadPromise) {
      return EmbeddingService.loadPromise;
    }

    store.dispatch(setStatus({ status: 'initializing', message: 'Starting initialization...' }));

    // Create new promise and store it statically
    EmbeddingService.loadPromise = new Promise(async (resolve, reject) => {
      try {
        await this.initializeWorker();
        EmbeddingService.hasInitialized = true;
        store.dispatch(setStatus({ status: 'ready', message: 'Model loaded successfully' }));
        resolve();
      } catch (error) {
        // console.error('[EmbeddingService] Failed to initialize:', error);
        EmbeddingService.loadPromise = null;
        EmbeddingService.hasInitialized = false;
        store.dispatch(setError(error instanceof Error ? error.message : 'Unknown error occurred'));
        reject(error);
      }
    });

    return EmbeddingService.loadPromise;
  }

  private async initializeWorker() {
    // Synchronous checks first
    if (EmbeddingService.isInitializing) {
      // console.log('[EmbeddingService] Initialization already in progress');
      return;
    }

    if (this.isInitialized && EmbeddingService.worker) {
      // console.log('[EmbeddingService] Worker already initialized');
      return;
    }

    // Set flags before any async operations
    EmbeddingService.isInitializing = true;
    this.cleanup(); // Clean up any existing state

    try {
      // console.log('[EmbeddingService] Creating worker...');
      store.dispatch(setStatus({ status: 'initializing', message: 'Creating worker...' }));
      
      EmbeddingService.worker = new Worker(new URL('../workers/embedding.worker.ts', import.meta.url), {
        type: 'module'
      });

      await new Promise<void>((resolve, reject) => {
        if (!EmbeddingService.worker) {
          EmbeddingService.isInitializing = false;
          reject(new Error('Worker creation failed'));
          return;
        }

        let pollCount = 0;
        const maxPolls = 60; // 30 seconds total (500ms * 60)

        EmbeddingService.worker.onmessage = (event) => {
          const { type, payload, status, message, id } = event.data;
          // console.log('[EmbeddingService] Received worker message:', event.data);

          if (type === 'EMBEDDINGS_RESULT') {
            const request = this.pendingRequests.get(id);
            if (request) {
              request.resolve(payload);
              this.pendingRequests.delete(id);
            }
            return;
          }

          switch (status) {
            case 'initiate':
              store.dispatch(setStatus({ status: 'initializing', message: 'Starting initialization...' }));
              break;
            case 'progress':
              store.dispatch(setStatus({ status: 'initializing', message }));
              break;
            case 'ready':
              this.isInitialized = true;
              EmbeddingService.isInitializing = false;
              store.dispatch(setStatus({ status: 'ready', message: 'Model loaded successfully' }));
              if (this.pollInterval) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
              }
              resolve();
              break;
            case 'error':
              EmbeddingService.isInitializing = false;
              store.dispatch(setError(message));
              this.cleanup();
              reject(new Error(message));
              break;
          }
        };

        EmbeddingService.worker.onerror = (event: ErrorEvent) => {
          EmbeddingService.isInitializing = false;
          store.dispatch(setError(event.message || 'Worker error occurred'));
          this.cleanup();
          reject(event);
        };

        EmbeddingService.worker.onmessageerror = () => {
          EmbeddingService.isInitializing = false;
          store.dispatch(setError('Worker message error occurred'));
          this.cleanup();
          reject(new Error('Worker message error occurred'));
        };

        // Start polling for initialization status
        this.pollInterval = setInterval(() => {
          if (pollCount >= maxPolls) {
            store.dispatch(setError('Worker initialization timed out'));
            this.cleanup();
            reject(new Error('Worker initialization timed out'));
            return;
          }

          if (!this.isInitialized && EmbeddingService.worker) {
            // console.log(`[EmbeddingService] Polling initialization status (${pollCount + 1}/${maxPolls})...`);
            EmbeddingService.worker.postMessage({ type: 'CHECK_STATUS', id: `poll-${pollCount}` });
            pollCount++;
          }
        }, 500); // Poll every 500ms

        // Start initialization
        EmbeddingService.worker.postMessage({ type: 'INITIALIZE', id: 'init' });
      });

      // console.log('[EmbeddingService] Worker initialized successfully');
    } catch (error) {
      EmbeddingService.isInitializing = false;
      // console.error('[EmbeddingService] Error initializing worker:', error);
      store.dispatch(setError(error instanceof Error ? error.message : 'Unknown error occurred'));
      this.cleanup();
      throw error;
    }
  }

  private sendWorkerMessage(type: string, payload?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!EmbeddingService.worker || !this.isInitialized) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = Math.random().toString(36).substring(7);
      // console.log('[EmbeddingService] Sending message:', { type, payload, id });
      this.pendingRequests.set(id, { resolve, reject });
      EmbeddingService.worker.postMessage({ type, payload, id });
    });
  }

  async generateEmbedding(text: string): Promise<number[][]> {
    return this.generateEmbeddings([text]);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      await this.load(); // Ensure worker is initialized
      return await this.sendWorkerMessage('GENERATE_EMBEDDINGS', { texts }) as number[][];
    } catch (error) {
      console.error('[EmbeddingService] Error generating embeddings:', error);
      return texts.map(() => []);
    }
  }

  getInitializationStatus(): string {
    return store.getState().embedding.status;
  }

  dispose() {
    this.cleanup();
  }
}

export const embeddingService = new EmbeddingService();
export const generateEmbeddings = (texts: string[]): Promise<number[][]> => {
  return embeddingService.generateEmbeddings(texts);
} 