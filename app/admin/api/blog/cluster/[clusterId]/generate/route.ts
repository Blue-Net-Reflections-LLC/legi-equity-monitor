import { auth } from '@/app/(auth)/auth';
import { ADMIN_ROLES } from '@/app/constants/user-roles';
import { BLOG_GENERATION_SYSTEM_PROMPT } from '@/app/lib/prompts/blog-generation-prompt';
import OpenAI from 'openai';
import { marked } from 'marked';
import db from '@/lib/db';
import { NextResponse } from 'next/server';

// Force dynamic and increase timeout
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

// Helper to send SSE messages
type SSEData = {
  progress?: number;
  message?: string;
  thought?: string;
  blogPostId?: string;
  type?: 'progress' | 'complete' | 'error' | 'thinking';
};

function sendSSEMessage(
  controller: ReadableStreamDefaultController,
  data: SSEData,
  type: 'progress' | 'complete' | 'error' | 'thinking' = 'progress'
) {
  controller.enqueue(
    `data: ${JSON.stringify({ ...data, type })}\n\n`
  );
}

// Configure OpenAI client for this specific endpoint
const openai = new OpenAI({
  apiKey: process.env.BLOGGING_OPENAI_API_KEY,
  baseURL: process.env.BLOGGING_OPENAI_API_URL,
});

const apiBaseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/api`;

export async function GET(
  _request: Request,
  { params }: { params: { clusterId: string } }
) {
  const session = await auth();

  // Check authentication
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Check admin role
  if (!session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Check if APP_URL is configured
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return new NextResponse('Server configuration error', { status: 500 });
  }

  // Check if LLM configuration is available
  if (!process.env.BLOGGING_OPENAI_API_KEY || !process.env.BLOGGING_OPENAI_API_URL || !process.env.BLOGGING_OPENAI_MODEL_NAME) {
    return new NextResponse('LLM configuration error', { status: 500 });
  }

  // Setup SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Get cluster data
        sendSSEMessage(controller, {
          progress: 10,
          message: 'Fetching cluster data...'
        });

        const clusterResponse = await fetch(`${apiBaseUrl}/clustering/${params.clusterId}`, {
          headers: {
            cookie: _request.headers.get('cookie') || ''
          }
        });
        if (!clusterResponse.ok) {
          throw new Error('Failed to fetch cluster data');
        }
        const cluster = await clusterResponse.json();

        // Get cluster analysis
        sendSSEMessage(controller, {
          progress: 20,
          message: 'Fetching cluster analysis...'
        });

        const analysisResponse = await fetch(`${apiBaseUrl}/clustering/${params.clusterId}/analysis`, {
          headers: {
            cookie: _request.headers.get('cookie') || ''
          }
        });
        if (!analysisResponse.ok) {
          throw new Error('Failed to fetch cluster analysis');
        }
        const analysis = await analysisResponse.json();

        if (!analysis || analysis.status !== 'completed') {
          throw new Error('Cluster analysis not found or incomplete');
        }

        // Get cluster bills
        sendSSEMessage(controller, {
          progress: 30,
          message: 'Fetching cluster bills...'
        });

        const billsResponse = await fetch(`${apiBaseUrl}/clustering/${params.clusterId}/bills`, {
          headers: {
            cookie: _request.headers.get('cookie') || ''
          }
        });
        if (!billsResponse.ok) {
          throw new Error('Failed to fetch cluster bills');
        }
        const bills = await billsResponse.json();

        // Sample bills if more than 70
        const MAX_BILLS = 100;
        interface Bill {
          membership_confidence: number;
          bill_id: number;
          bill_number: string;
          title: string;
          state_abbr: string;
          state_name: string;
        }
        const sampledBills = bills.length > MAX_BILLS 
          ? bills
              .sort(() => 0.5 - Math.random()) // Shuffle array
              .slice(0, MAX_BILLS)
              .sort((a: Bill, b: Bill) => b.membership_confidence - a.membership_confidence) // Sort by confidence
          : bills;

        // Get next version number
        const [{ max_version }] = await db`
          SELECT COALESCE(MAX(version), 0) as max_version 
          FROM blog_generation_responses 
          WHERE cluster_id = ${params.clusterId}::uuid
        `;
        const nextVersion = (max_version || 0) + 1;

        // Prepare generation
        sendSSEMessage(controller, {
          progress: 40,
          message: 'Preparing generation...'
        });

        // Call OpenAI API
        sendSSEMessage(controller, {
          progress: 50,
          message: 'Generating blog post content...'
        });

        const thinkingTags = process.env.BLOGGING_OPENAI_API_THINKING_TAG?.split(',') || [];
        const thinkStartTag = thinkingTags[0];
        const thinkEndTag = thinkingTags[1];

        const completion = await openai.chat.completions.create({
          model: process.env.BLOGGING_OPENAI_MODEL_NAME!,
          messages: [
            { 
              role: 'system', 
              content: BLOG_GENERATION_SYSTEM_PROMPT 
            },
            { 
              role: 'user', 
              content: JSON.stringify({
                cluster,
                analysis,
                sampledBills
              }, null, 2)
            }
          ],
          ...(process.env.BLOGGING_OPENAI_API_SUPPORTS_JSON_MODE === 'true' && {
            response_format: { type: "json_object" }
          }),
          stream: true,
          max_tokens: 8000
        });


        let generatedContent;
        let accumulatedContent = '';
        let currentThought = '';
        let isThinking = false;

        for await (const chunk of completion as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
          const content = chunk.choices[0]?.delta?.content || '';
          accumulatedContent += content;

          if (thinkingTags.length === 2) {
            if (content.includes(thinkStartTag)) {
              isThinking = true;
              currentThought = '';
              continue;
            }

            if (content.includes(thinkEndTag)) {
              isThinking = false;
              if (currentThought) {
                sendSSEMessage(
                  controller,
                  {
                    type: 'thinking',
                    thought: currentThought.trim()
                  },
                  'thinking'
                );
              }
              currentThought = '';
              continue;
            }

            if (isThinking) {
              currentThought += content;
              // Send each character immediately for smoother streaming
              sendSSEMessage(
                controller,
                {
                  type: 'thinking',
                  thought: content
                },
                'thinking'
              );
            }
          }
        }

        try {
          const jsonStr = thinkingTags.length === 2 
            ? accumulatedContent.substring(accumulatedContent.lastIndexOf(thinkEndTag) + thinkEndTag.length).trim()
            : accumulatedContent.trim();
          console.log('jsonStr', jsonStr);
          generatedContent = JSON.parse(jsonStr);
        } catch (error) {
          console.error('Failed to parse generated content:', error);
          throw new Error('Generated content is not valid JSON');
        }

        // Save generation response
        sendSSEMessage(controller, {
          progress: 70,
          message: 'Saving generation response...'
        });

        await db`
          INSERT INTO blog_generation_responses (
            cluster_id,
            version,
            model_name,
            prompt,
            generated_content,
            hero_image_prompt,
            main_image_prompt,
            thumbnail_image_prompt
          ) VALUES (
            ${params.clusterId}::uuid,
            ${nextVersion},
            ${process.env.BLOGGING_OPENAI_MODEL_NAME!},
            ${BLOG_GENERATION_SYSTEM_PROMPT},
            ${generatedContent},
            ${generatedContent.metadata.hero_image_prompt},
            ${generatedContent.metadata.main_image_prompt},
            ${generatedContent.metadata.thumbnail_image_prompt}
          )
        `;

        // Create blog post
        sendSSEMessage(controller, {
          progress: 90,
          message: 'Creating blog post...'
        });

        const blogPostResponse = await fetch(`${apiBaseUrl}/blog/post`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: _request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            cluster_id: params.clusterId,
            analysis_id: analysis.analysis_id,
            ...generatedContent,
            content: marked(generatedContent.content)
          })
        });

        if (!blogPostResponse.ok) {
          throw new Error('Failed to create blog post');
        }

        const blogPost = await blogPostResponse.json();

        // Complete
        sendSSEMessage(controller, {
          type: 'complete',
          progress: 100,
          message: 'Generation complete!',
          blogPostId: blogPost.post.post_id
        },
        'complete');

      } catch (error) {
        console.error('Generation error:', error);
        sendSSEMessage(
          controller,
          {
            message: error instanceof Error ? error.message : 'An error occurred during generation'
          },
          'error'
        );
      } finally {
        // controller.close();  DO NOT CHANGE THIS LINE
      }
    }
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 