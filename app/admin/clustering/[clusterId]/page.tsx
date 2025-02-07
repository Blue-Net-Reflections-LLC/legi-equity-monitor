'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/lib/redux/store';
import { fetchClusterDetail, fetchClusterAnalysis, fetchClusterBills, resetClusterDetail } from '@/app/lib/redux/features/clustering/clusterDetailSlice';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';

function formatPolicyImpacts(impacts: any) {
  if (!impacts) return null;
  try {
    const parsed = typeof impacts === 'string' ? JSON.parse(impacts) : impacts;
    return (
      <div className="space-y-4">
        {Object.entries(parsed).map(([key, value]: [string, any]) => (
          <div key={key} className="space-y-2">
            <h4 className="font-medium">{key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</h4>
            {Array.isArray(value) ? (
              <ul className="list-disc list-inside space-y-1">
                {value.map((item, i) => (
                  <li key={i} className="text-sm">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">{value}</p>
            )}
          </div>
        ))}
      </div>
    );
  } catch (e) {
    return <p className="text-sm text-muted-foreground">Unable to parse policy impacts</p>;
  }
}

function formatRiskAssessment(risks: any) {
  if (!risks) return null;
  try {
    const parsed = typeof risks === 'string' ? JSON.parse(risks) : risks;
    return (
      <div className="space-y-4">
        {Object.entries(parsed).map(([key, value]: [string, any]) => (
          <div key={key} className="space-y-2">
            <h4 className="font-medium">{key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</h4>
            <p className="text-sm">{value}</p>
          </div>
        ))}
      </div>
    );
  } catch (e) {
    return <p className="text-sm text-muted-foreground">Unable to parse risk assessment</p>;
  }
}

export default function ClusterDetailPage() {
  const { clusterId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { cluster, analysis, bills, loading, error } = useSelector(
    (state: RootState) => state.clusterDetail
  );

  useEffect(() => {
    if (clusterId) {
      // Reset state when clusterId changes
      dispatch(resetClusterDetail());
      
      // Fetch all data in parallel
      Promise.all([
        dispatch(fetchClusterDetail(clusterId as string)),
        dispatch(fetchClusterAnalysis(clusterId as string)),
        dispatch(fetchClusterBills(clusterId as string))
      ]).catch(console.error);
    }

    // Cleanup on unmount
    return () => {
      dispatch(resetClusterDetail());
    };
  }, [clusterId, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!cluster) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clusters
          </Button>
          <h1 className="text-2xl font-bold">
            {cluster.cluster_name || `Cluster ${clusterId}`}
          </h1>
        </div>
        <Badge variant={analysis?.status === 'completed' ? 'success' : 'secondary'}>
          {analysis?.status || 'No Analysis'}
        </Badge>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Column - Metadata */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cluster Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Bills</p>
                <p className="text-lg font-medium">{cluster.bill_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">States</p>
                <p className="text-lg font-medium">{cluster.state_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date Range</p>
                <p className="text-lg font-medium">
                  {format(new Date(cluster.min_date), 'MMM d, yyyy')} -{' '}
                  {format(new Date(cluster.max_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {format(new Date(cluster.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>

          {cluster.cluster_description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{cluster.cluster_description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Columns - Analysis */}
        <div className="md:col-span-3 space-y-6">
          {analysis?.status === 'completed' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.executive_summary}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Future Outlook</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.future_outlook}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Policy Impacts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formatPolicyImpacts(analysis.policy_impacts)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formatRiskAssessment(analysis.risk_assessment)}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  No analysis available for this cluster
                </p>
                <Button>Generate Analysis</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bills in Cluster</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills?.map((bill) => (
                  <TableRow key={bill.bill_id}>
                    <TableCell>{bill.bill_number}</TableCell>
                    <TableCell>{bill.state_abbr}</TableCell>
                    <TableCell className="max-w-md truncate">{bill.title}</TableCell>
                    <TableCell>{(bill.membership_confidence * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 