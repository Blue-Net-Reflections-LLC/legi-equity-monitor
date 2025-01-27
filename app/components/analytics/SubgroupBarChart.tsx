'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SubgroupScore {
  subgroup_code: string;
  bias_score: number;
  positive_impact_score: number;
  evidence: string;
}

interface BillWithSubgroups {
  bill_id: number;
  bill_number: string;
  subgroups: SubgroupScore[];
}

interface CategoryData {
  category: string;
  bills: BillWithSubgroups[];
}

export interface SubgroupBarChartProps {
  data: CategoryData[];
}

// Map category codes to their subgroups
const categorySubgroups: Record<string, string[]> = {
  race: ['BH', 'AP', 'LX', 'WH', 'IN'],
  religion: ['MU', 'CH', 'JW', 'HI', 'BD', 'SK', 'AT'],
  gender: ['ML', 'FM', 'TG', 'NB', 'GQ'],
  age: ['CY', 'AD', 'OA'],
  nationality: ['IM', 'NC', 'FN'],
  sexual_orientation: ['LQ', 'HT', 'BI', 'PS', 'AS'],
  disability: ['PD', 'MH', 'DD'],
  veterans: ['VT', 'DV', 'RM']
};

// Map subgroup codes to readable names
const subgroupNames: Record<string, string> = {
  // Race
  BH: 'Black/African American',
  AP: 'Asian/Pacific Islander',
  LX: 'Latinx',
  WH: 'White',
  IN: 'Indigenous/Native American',
  // Religion
  MU: 'Muslim',
  CH: 'Christian',
  JW: 'Jewish',
  HI: 'Hindu',
  BD: 'Buddhist',
  SK: 'Sikh',
  AT: 'Atheist/Agnostic',
  // Gender
  ML: 'Male',
  FM: 'Female',
  TG: 'Transgender',
  NB: 'Nonbinary',
  GQ: 'Genderqueer',
  // Age
  CY: 'Children and Youth',
  AD: 'Adults',
  OA: 'Older Adults (Seniors)',
  // Nationality
  IM: 'Immigrant Communities',
  NC: 'Naturalized Citizens',
  FN: 'Foreign Nationals',
  // Sexual Orientation
  LQ: 'LGBTQ+',
  HT: 'Heterosexual',
  BI: 'Bisexual',
  PS: 'Pansexual',
  AS: 'Asexual',
  // Disability
  PD: 'Physical Disabilities',
  MH: 'Mental Health Challenges',
  DD: 'Developmental Disabilities',
  // Veterans
  VT: 'Veterans (General)',
  DV: 'Disabled Veterans',
  RM: 'Retired Military Personnel'
};

export const SubgroupBarChart = ({ data }: SubgroupBarChartProps) => {
  const categorySubgroupCounts = data.reduce((acc, categoryData) => {
    // Skip if category is not recognized
    const categoryKey = categoryData.category.toLowerCase();
    if (!categorySubgroups[categoryKey]) {
      console.warn(`Unrecognized category: ${categoryData.category}`);
      return acc;
    }

    const subgroupCounts: Record<string, { positive: number; bias: number; neutral: number }> = {};
    
    // Initialize all possible subgroups for this category
    categorySubgroups[categoryKey].forEach(code => {
      subgroupCounts[code] = { positive: 0, bias: 0, neutral: 0 };
    });
    
    // Process each bill's subgroups
    categoryData.bills.forEach(bill => {
      bill.subgroups.forEach(subgroup => {
        // Skip if subgroup code is not recognized for this category
        if (!subgroupCounts[subgroup.subgroup_code]) {
          console.warn(`Unrecognized subgroup code: ${subgroup.subgroup_code} for category: ${categoryData.category}`);
          return;
        }

        const biasScore = Math.abs(subgroup.bias_score);
        const positiveScore = Math.abs(subgroup.positive_impact_score);

        // Mark as neutral if scores are equal OR both below 0.6
        if (biasScore === positiveScore || (biasScore < 0.6 && positiveScore < 0.6)) {
          subgroupCounts[subgroup.subgroup_code].neutral++;
        } else if (biasScore > positiveScore) {
          subgroupCounts[subgroup.subgroup_code].bias++;
        } else {
          subgroupCounts[subgroup.subgroup_code].positive++;
        }
      });
    });

    // Only include subgroups that have counts
    const filteredCounts = Object.entries(subgroupCounts)
      .filter(([, counts]) => counts.positive > 0 || counts.bias > 0 || counts.neutral > 0)
      .reduce((obj, [code, counts]) => {
        obj[code] = counts;
        return obj;
      }, {} as Record<string, { positive: number; bias: number; neutral: number }>);

    if (Object.keys(filteredCounts).length > 0) {
      acc[categoryData.category] = filteredCounts;
    }
    return acc;
  }, {} as Record<string, Record<string, { positive: number; bias: number; neutral: number }>>);

  // Create a chart for each category
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Object.entries(categorySubgroupCounts).map(([category, subgroups]) => {
        const categoryName = category.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        const labels = Object.keys(subgroups).map(code => subgroupNames[code] || code);
        const positiveData = Object.values(subgroups).map(counts => counts.positive);
        const biasData = Object.values(subgroups).map(counts => counts.bias);
        const neutralData = Object.values(subgroups).map(counts => counts.neutral);

        const chartData = {
          labels,
          datasets: [
            {
              label: 'Positive',
              data: positiveData,
              backgroundColor: 'rgb(34, 197, 94)', // green-500
              barPercentage: 0.8,
              categoryPercentage: 0.9
            },
            {
              label: 'Bias',
              data: biasData,
              backgroundColor: 'rgb(239, 68, 68)', // red-500
              barPercentage: 0.8,
              categoryPercentage: 0.9
            },
            {
              label: 'Neutral',
              data: neutralData,
              backgroundColor: '#9ca3af', // gray-400
              barPercentage: 0.8,
              categoryPercentage: 0.9
            },
          ],
        };

        const options = {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y' as const,
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
                stepSize: 1,
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
                drawBorder: true,
                color: 'rgba(156, 163, 175, 0.1)',
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
          plugins: {
            title: {
              display: true,
              text: categoryName,
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
            tooltip: {
              callbacks: {
                label: (context: TooltipItem<'bar'>) => {
                  return `${context.dataset.label}: ${context.parsed.x} bills`;
                },
              },
            },
          },
        };

        return (
          <div key={category} className="rounded-lg">
            <div className="h-[200px]">
              <Bar data={chartData} options={options} />
            </div>
          </div>
        );
      })}
    </div>
  );
}; 