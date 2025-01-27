'use client';

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
import type { TooltipItem } from 'chart.js';

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
      text: 'Overall',
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

interface ChartData {
  name: string;
  positive: number;
  bias: number;
  neutral: number;
}

interface SubgroupData {
  category: string;
  subgroup: string;
  positive: number;
  bias: number;
  neutral: number;
}

export function OverallChart({ data }: { data: ChartData[] }) {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Positive',
        data: data.map(d => d.positive),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Bias',
        data: data.map(d => d.bias),
        backgroundColor: '#ef4444',
      },
      {
        label: 'Neutral',
        data: data.map(d => d.neutral),
        backgroundColor: '#9ca3af',
      },
    ],
  };

  return (
    <div className="h-[250px] w-full">
      <Bar options={chartOptions} data={chartData} />
    </div>
  );
}

export function CategoryChart({ data }: { data: ChartData[] }) {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Positive',
        data: data.map(d => d.positive),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Bias',
        data: data.map(d => d.bias),
        backgroundColor: '#ef4444',
      },
      {
        label: 'Neutral',
        data: data.map(d => d.neutral),
        backgroundColor: '#9ca3af',
      },
    ],
  };

  const categoryOptions = {
    ...chartOptions,
    indexAxis: 'y' as const,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Category Breakdown',
      },
    },
    scales: {
      x: {
        stacked: true,
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
        stacked: true,
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

  return (
    <div className="h-[250px] w-full">
      <Bar options={categoryOptions} data={chartData} />
    </div>
  );
}

export function SubgroupChart({ data }: { data: SubgroupData[] }) {
  // Group data by category
  const categories = Array.from(new Set(data.map(d => d.category)));
  const subgroups = Array.from(new Set(data.map(d => d.subgroup)));

  const chartData = {
    labels: categories,
    datasets: subgroups.map(subgroup => ({
      label: subgroup,
      data: categories.map(category => {
        const item = data.find(d => d.category === category && d.subgroup === subgroup);
        return item ? Math.max(item.positive, item.bias, item.neutral) : 0;
      }),
      backgroundColor: '#22c55e',
    }))
  };

  const subgroupOptions = {
    ...chartOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        stacked: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const item = data.find(
              d => d.category === categories[context.dataIndex] && 
                   d.subgroup === context.dataset.label
            );
            if (!item) return '';
            return [
              `${context.dataset.label}:`,
              `Positive: ${item.positive.toFixed(2)}`,
              `Bias: ${item.bias.toFixed(2)}`,
              `Neutral: ${item.neutral.toFixed(2)}`
            ];
          }
        }
      }
    }
  };

  return (
    <div className="h-[400px] w-full">
      <Bar options={subgroupOptions} data={chartData} />
    </div>
  );
} 