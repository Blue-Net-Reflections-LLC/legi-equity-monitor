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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SubgroupData {
  subgroup: string;
  subgroupName: string;
  positive: number;
  bias: number;
}

interface SubgroupChartProps {
  category: string;
  data: SubgroupData[];
}

export function SubgroupPieChart({ category, data }: SubgroupChartProps) {
  const chartData = {
    labels: data.map(d => d.subgroupName),
    datasets: [
      {
        label: 'Positive Impact',
        data: data.map(d => d.positive),
        backgroundColor: 'rgb(34, 197, 94)',
        borderColor: 'rgb(21, 128, 61)',
        borderWidth: 1,
      },
      {
        label: 'Bias',
        data: data.map(d => d.bias),
        backgroundColor: 'rgb(239, 68, 68)',
        borderColor: 'rgb(153, 27, 27)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: false,
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: category.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' '),
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label;
            const value = context.parsed.x;
            return `${label}: ${value} bills`;
          },
        },
      },
    },
  };

  return (
    <div className="h-[300px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
} 