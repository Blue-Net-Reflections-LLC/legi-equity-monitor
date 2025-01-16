'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { useCallback, useEffect, useState } from 'react';

const RACE_CODES = {
  AI: 'American Indian/Alaska Native',
  AP: 'Asian/Pacific Islander',
  BH: 'Black/African American',
  WH: 'White'
} as const;

const SEVERITIES = ['mild', 'medium', 'high', 'urgent'] as const;
const IMPACT_TYPES = ['POSITIVE', 'NEGATIVE'] as const;

interface FilterOptions {
  committees: string[];
  categories: string[];
}

export default function RightSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for filter options
  const [options, setOptions] = useState<FilterOptions>({
    committees: [],
    categories: []
  });

  const [error, setError] = useState<string | null>(null);
  
  // Initialize state from URL parameters
  const [filters, setFilters] = useState({
    race_code: searchParams.get('race_code') || '',
    impact_type: searchParams.get('impact_type') || '',
    severity: searchParams.get('severity') || '',
    committee: searchParams.get('committee') || '',
    category: searchParams.get('category') || '',
  });

  // Fetch filter options
  useEffect(() => {
    async function fetchOptions() {
      try {
        setError(null);
        const response = await fetch('/api/filters');
        if (!response.ok) {
          throw new Error('Failed to fetch filter options');
        }
        const data = await response.json();
        console.log('Received filter options:', data);
        
        if (!data.committees || !Array.isArray(data.committees)) {
          throw new Error('Invalid committee data received');
        }
        
        setOptions({
          committees: data.committees,
          categories: data.categories || []
        });
      } catch (error) {
        console.error('Error fetching filter options:', error);
        setError(error instanceof Error ? error.message : 'Failed to load filter options');
      }
    }
    fetchOptions();
  }, []);

  // Update URL when filters change
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    
    // Only add non-empty filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    // Preserve the current page if it exists
    const currentPage = searchParams.get('page');
    if (currentPage) {
      params.set('page', currentPage);
    }
    
    router.push(`/?${params.toString()}`);
  }, [filters, router, searchParams]);

  // Handle input changes
  const handleChange = (field: keyof typeof filters) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilters(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="w-80 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          {/* Racial Impact Filter */}
          <div>
            <h3 className="font-medium mb-2">Racial Impact</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Group</label>
                <select 
                  className="w-full border rounded-md p-2"
                  value={filters.race_code}
                  onChange={handleChange('race_code')}
                >
                  <option value="">All Groups</option>
                  {Object.entries(RACE_CODES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Impact Type</label>
                <select 
                  className="w-full border rounded-md p-2"
                  value={filters.impact_type}
                  onChange={handleChange('impact_type')}
                >
                  <option value="">Any Impact</option>
                  {IMPACT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Severity</label>
                <select 
                  className="w-full border rounded-md p-2"
                  value={filters.severity}
                  onChange={handleChange('severity')}
                >
                  <option value="">Any Severity</option>
                  {SEVERITIES.map(severity => (
                    <option key={severity} value={severity}>{severity}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Committee Filter */}
          <div>
            <h3 className="font-medium mb-2">
              Committee {options.committees.length > 0 && `(${options.committees.length})`}
            </h3>
            <select 
              className="w-full border rounded-md p-2"
              value={filters.committee}
              onChange={handleChange('committee')}
            >
              <option value="">All Committees</option>
              {options.committees.map(committee => (
                <option key={committee} value={committee}>{committee}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <h3 className="font-medium mb-2">
              Categories {options.categories.length > 0 && `(${options.categories.length})`}
            </h3>
            <select 
              className="w-full border rounded-md p-2"
              value={filters.category}
              onChange={handleChange('category')}
            >
              <option value="">All Categories</option>
              {options.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Apply Filters Button */}
          <button 
            onClick={applyFilters}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>

          {/* Clear Filters Button (only show if filters are active) */}
          {Object.values(filters).some(Boolean) && (
            <button 
              onClick={() => {
                setFilters({
                  race_code: '',
                  impact_type: '',
                  severity: '',
                  committee: '',
                  category: '',
                });
                router.push('/');
              }}
              className="w-full mt-2 bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 