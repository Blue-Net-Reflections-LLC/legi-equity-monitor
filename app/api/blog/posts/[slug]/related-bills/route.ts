import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Bill } from '@/app/types';

interface RelatedBill extends Bill {
  overall_bias_score: number | null;
  overall_positive_impact_score: number | null;
  membership_confidence: number;
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Get the blog post's cluster_id
    const [blogPost] = await db`
      SELECT cluster_id
      FROM blog_posts
      WHERE slug = ${slug}
      AND status = 'published'
      AND published_at <= NOW()
    `;

    if (!blogPost?.cluster_id) {
      return NextResponse.json({ bills: [] });
    }

    // Get bills from the cluster with their analysis results
    const bills = await db`
      SELECT 
        b.bill_id::text as bill_id,
        b.bill_number,
        b.title,
        st.state_abbr,
        p.progress_desc as status_desc,
        bar.overall_bias_score,
        bar.overall_positive_impact_score,
        bh.history_date as latest_action_date,
        cb.membership_confidence
      FROM cluster_bills cb
      JOIN ls_bill b ON cb.bill_id = b.bill_id
      JOIN ls_state st ON b.state_id = st.state_id
      LEFT JOIN ls_progress p ON b.status_id = p.progress_event_id
      LEFT JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id
      LEFT JOIN LATERAL (
        SELECT history_date
        FROM ls_bill_history
        WHERE bill_id = b.bill_id
        ORDER BY history_step DESC
        LIMIT 1
      ) bh ON true
      WHERE cb.cluster_id = ${blogPost.cluster_id}
      ORDER BY 
        GREATEST(COALESCE(bar.overall_bias_score, 0), COALESCE(bar.overall_positive_impact_score, 0)) DESC,
        cb.membership_confidence DESC,
        bh.history_date DESC NULLS LAST
      LIMIT 100
    ` as RelatedBill[];

    return NextResponse.json({ bills });
  } catch (error) {
    console.error('Error fetching related bills:', error);
    return NextResponse.json({ error: 'Failed to fetch related bills' }, { status: 500 });
  }
} 