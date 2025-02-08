'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GenerateBlogPostProps {
  clusterId: string;
  isDisabled?: boolean;
}

type GenerationStatus = {
  step: 'idle' | 'confirming' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
};

export function GenerateBlogPost({ clusterId, isDisabled }: GenerateBlogPostProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GenerationStatus>({
    step: 'idle',
    progress: 0,
    message: ''
  });

  const startGeneration = async () => {
    setStatus({ step: 'generating', progress: 0, message: 'Starting generation...' });

    try {
      // Setup SSE connection
      const eventSource = new EventSource(`/admin/api/blog/cluster/${clusterId}/generate`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setStatus({
            step: 'generating',
            progress: data.progress,
            message: data.message
          });
        } else if (data.type === 'complete') {
          eventSource.close();
          setStatus({
            step: 'complete',
            progress: 100,
            message: 'Generation complete!'
          });
          
          // Redirect to the blog post edit page
          router.push(`/admin/blog/${data.blogPostId}`);
        } else if (data.type === 'error') {
          eventSource.close();
          setStatus({
            step: 'error',
            progress: 0,
            message: data.message
          });
          toast.error(data.message);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setStatus({
          step: 'error',
          progress: 0,
          message: 'Connection lost. Please try again.'
        });
        toast.error('Connection lost. Please try again.');
      };
    } catch (error) {
      setStatus({
        step: 'error',
        progress: 0,
        message: 'Failed to start generation'
      });
      toast.error('Failed to start generation');
    }
  };

  const closeDialog = () => {
    if (status.step !== 'generating') {
      setStatus({ step: 'idle', progress: 0, message: '' });
    }
  };

  return (
    <>
      <Button
        onClick={() => setStatus({ step: 'confirming', progress: 0, message: '' })}
        disabled={isDisabled || status.step === 'generating'}
      >
        <FileText className="w-4 h-4 mr-2" />
        Compose Blog Post
      </Button>

      <Dialog open={status.step !== 'idle'} onOpenChange={closeDialog}>
        <DialogContent className="dark:bg-zinc-950 bg-white border-border dark:text-neutral-50 text-neutral-950">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-foreground">
              {status.step === 'confirming' ? 'Generate Blog Post' : 'Generating Blog Post'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {status.step === 'confirming' 
                ? 'This will generate a blog post based on the cluster analysis. Continue?'
                : status.message
              }
            </DialogDescription>
          </DialogHeader>

          {status.step === 'generating' && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Progress 
                  value={status.progress} 
                  className="h-2 bg-secondary"
                />
                <p className="text-sm text-muted-foreground text-center">
                  {status.progress}%
                </p>
              </div>
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {status.step === 'confirming' && (
              <>
                <Button
                  variant="secondary"
                  onClick={closeDialog}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={startGeneration}
                  className="w-full sm:w-auto"
                >
                  Generate
                </Button>
              </>
            )}
            {status.step === 'error' && (
              <Button
                variant="secondary"
                onClick={closeDialog}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 