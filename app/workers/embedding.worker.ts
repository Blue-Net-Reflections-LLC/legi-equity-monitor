import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to use local models
env.localModelPath = '/models';
env.allowLocalModels = true;

self.addEventListener('message', async (event) => {
  const { type } = event.data;

  if (type === 'load') {
    try {
      // Load the model to ensure it's cached
      await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          revision: 'main',
          device: 'auto',
          dtype: 'fp32',
        }
      );
      self.postMessage({ type: 'loaded' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      self.postMessage({ type: 'error', error: message });
    }
  }
}); 