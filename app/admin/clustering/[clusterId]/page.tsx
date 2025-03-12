'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/lib/redux/store';
import { fetchClusterDetail, fetchClusterAnalysis, fetchClusterBills, resetClusterDetail } from '@/app/lib/redux/features/clustering/clusterDetailSlice';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Loader2, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { ClusterBill } from '../types';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { GenerateBlogPost } from './components/GenerateBlogPost';
import { BillLink } from "@/app/components/ui/seo-links";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Impact Distribution',
      color: 'rgba(156, 163, 175, 0.8)',
      font: {
        size: 16,
      },
      padding: {
        bottom: 16,
      },
    },
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        color: 'rgba(156, 163, 175, 0.8)'
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'rgba(156, 163, 175, 0.1)',
        drawBorder: true,
        borderColor: 'rgba(156, 163, 175, 0.2)'
      },
      ticks: {
        color: 'rgba(156, 163, 175, 0.8)'
      },
      border: {
        color: 'rgba(156, 163, 175, 0.2)'
      }
    },
    y: {
      grid: {
        display: true,
        color: 'rgba(156, 163, 175, 0.1)',
        drawBorder: true,
        borderColor: 'rgba(156, 163, 175, 0.2)'
      },
      ticks: {
        color: 'rgba(156, 163, 175, 0.8)'
      },
      border: {
        color: 'rgba(156, 163, 175, 0.2)'
      }
    },
  },
};

interface PolicyImpact {
  [key: string]: string | string[];
}

interface RiskAssessment {
  [key: string]: string;
}

function formatPolicyImpacts(impacts: PolicyImpact | null) {
  if (!impacts) return null;
  try {
    const parsed = typeof impacts === 'string' ? JSON.parse(impacts) as PolicyImpact : impacts;
    return (
      <div className="space-y-4">
        {Object.entries(parsed).map(([key, value]) => (
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
  } catch {
    return <p className="text-sm text-muted-foreground">Unable to parse policy impacts</p>;
  }
}

function formatRiskAssessment(risks: RiskAssessment | null) {
  if (!risks) return null;
  try {
    const parsed = typeof risks === 'string' ? JSON.parse(risks) as RiskAssessment : risks;
    return (
      <div className="space-y-4">
        {Object.entries(parsed).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <h4 className="font-medium">{key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</h4>
            <p className="text-sm">{value}</p>
          </div>
        ))}
      </div>
    );
  } catch {
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

  const [sortConfig, setSortConfig] = useState<{
    key: keyof ClusterBill | 'impact_category';
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedBills = [...(bills || [])].sort((a, b) => {
    if (!sortConfig) return 0;
    
    if (sortConfig.key === 'impact_category') {
      const getImpactValue = (bill: ClusterBill) => {
        if (!bill.overall_bias_score || !bill.overall_positive_impact_score) return 0;
        if (bill.overall_bias_score === bill.overall_positive_impact_score) return 1; // Neutral
        return Math.abs(bill.overall_bias_score) > Math.abs(bill.overall_positive_impact_score) ? 2 : 3; // Bias: 2, Positive: 3
      };
      
      const aValue = getImpactValue(a);
      const bValue = getImpactValue(b);
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (sortConfig.key === 'membership_confidence') {
      return sortConfig.direction === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
    
    return sortConfig.direction === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const handleSort = (key: keyof ClusterBill | 'impact_category') => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

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

  // Add impact stats calculation
  const impactStats = bills?.reduce((acc, bill) => {
    if (bill.overall_bias_score === null || bill.overall_positive_impact_score === null) {
      acc.noAnalysis++;
    } else if (bill.overall_bias_score === bill.overall_positive_impact_score) {
      acc.neutral++;
    } else if (Math.abs(bill.overall_bias_score) > Math.abs(bill.overall_positive_impact_score)) {
      acc.bias++;
    } else {
      acc.positive++;
    }
    return acc;
  }, { positive: 0, neutral: 0, bias: 0, noAnalysis: 0 });

  const chartData = [
    { name: 'Positive', value: impactStats?.positive || 0, color: '#22C55E' },
    { name: 'Neutral', value: impactStats?.neutral || 0, color: '#94A3B8' },
    { name: 'Bias', value: impactStats?.bias || 0, color: '#EF4444' },
  ].filter(item => item.value > 0);

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
    <div className="dark:text-neutral-50 text-neutral-950 fcontainer mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {cluster.cluster_name || `Cluster ${clusterId}`}
        </h1>
        <div className="flex items-center gap-4">
          <GenerateBlogPost 
            clusterId={clusterId as string} 
            isDisabled={!analysis || analysis.status !== 'completed'} 
          />
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clusters
          </Button>
        </div>
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
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  <Badge variant={analysis?.status === 'completed' ? 'success' : 'secondary'}>
                    {analysis?.status || 'No Analysis'}
                  </Badge>
                </div>
              </div>
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
              {chartData.length > 0 && (
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Impact Distribution</p>
                  <div className="h-[200px] w-full">
                    <Bar 
                      options={chartOptions} 
                      data={{
                        labels: ['Impact Distribution'],
                        datasets: [
                          {
                            label: 'Positive',
                            data: [impactStats?.positive || 0],
                            backgroundColor: '#22c55e',
                          },
                          {
                            label: 'Neutral',
                            data: [impactStats?.neutral || 0],
                            backgroundColor: '#9ca3af',
                          },
                          {
                            label: 'Bias',
                            data: [impactStats?.bias || 0],
                            backgroundColor: '#ef4444',
                          },
                        ],
                      }} 
                    />
                  </div>
                </div>
              )}
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
                  <TableHead onClick={() => handleSort('bill_number')} className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    Bill Number <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('state_abbr')} className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    State <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('title')} className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    Title <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('impact_category')} className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    Categories <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead className="text-right">Impact Scores</TableHead>
                  <TableHead onClick={() => handleSort('membership_confidence')} className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    Confidence <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBills.map((bill) => (
                  <TableRow key={bill.bill_id}>
                    <TableCell>
                      <BillLink 
                        stateCode={bill.state_abbr.toLowerCase()}
                        billId={bill.bill_id.toString()}
                        billNumber={bill.bill_number}
                        title={bill.title}
                        target="_blank"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {bill.bill_number}
                      </BillLink>
                    </TableCell>
                    <TableCell>{bill.state_abbr}</TableCell>
                    <TableCell className="max-w-md truncate">{bill.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2 items-center">
                        {bill.overall_bias_score !== null && bill.overall_positive_impact_score !== null && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            bill.overall_bias_score === bill.overall_positive_impact_score
                              ? 'bg-gray-400 text-white dark:bg-gray-400 dark:text-white'
                              : Math.abs(bill.overall_bias_score) > Math.abs(bill.overall_positive_impact_score)
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {bill.overall_bias_score === bill.overall_positive_impact_score
                              ? 'Neutral'
                              : Math.abs(bill.overall_bias_score) > Math.abs(bill.overall_positive_impact_score)
                                ? 'Bias'
                                : 'Positive'
                            }
                          </span>
                        )}
                        {bill.categories && bill.categories.length > 0 && (
                          <>
                            <svg 
                              className="w-4 h-4 text-zinc-400 dark:text-zinc-500" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M14 5l7 7-7 7M3 12h18"
                              />
                            </svg>
                            {bill.categories.map((cat) => (
                              <span 
                                key={cat.category}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  cat.bias_score === cat.positive_impact_score
                                    ? 'bg-gray-400 text-white dark:bg-gray-400 dark:text-white'
                                    : Math.abs(cat.bias_score) > Math.abs(cat.positive_impact_score)
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}
                              >
                                {cat.category.split('_')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                  .join(' ')}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {bill.overall_bias_score !== null && bill.overall_positive_impact_score !== null ? (
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="text-red-600 dark:text-red-400">Bias: </span>
                            <span>{Number(bill.overall_bias_score).toFixed(2)}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-green-600 dark:text-green-400">Positive: </span>
                            <span>{Number(bill.overall_positive_impact_score).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No scores</span>
                      )}
                    </TableCell>
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