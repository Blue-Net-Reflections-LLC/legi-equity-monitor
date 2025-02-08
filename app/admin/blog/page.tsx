'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PlusCircle, Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppDispatch, useAppSelector } from '@/app/lib/redux/hooks';
import { fetchBlogPosts, setFilters, setPagination } from '@/app/lib/redux/features/blog/blogSlice';

export default function AdminBlogPage() {
  const dispatch = useAppDispatch();
  const { posts, loading, filters, pagination, total } = useAppSelector((state) => state.blog);
  const [sort, setSort] = useState({ field: 'created_at', direction: 'desc' });

  useEffect(() => {
    dispatch(fetchBlogPosts({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      status: filters.status,
      search: filters.search,
      sort: sort.field,
      order: sort.direction
    }));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, filters.status, filters.search, sort]);

  const handleStatusChange = async (postId: string | undefined, newStatus: string) => {
    if (!postId) return;
    try {
      const response = await fetch(`/admin/api/blog/post/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update post status');
      
      // Refresh the posts list
      dispatch(fetchBlogPosts({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        status: filters.status,
        search: filters.search,
        sort: sort.field,
        order: sort.direction
      }));
    } catch (error) {
      console.error('Error updating post status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'review':
        return 'secondary';
      case 'archived':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Link href="/admin/blog/create">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search posts..."
              value={filters.search}
              onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>
        <Select 
          value={filters.status} 
          onValueChange={(value) => dispatch(setFilters({ status: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('title')}
              >
                Title <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('author')}
              >
                Author <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                Created <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('published_at')}
              >
                Published <ArrowUpDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.post_id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{post.author}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(post.status)}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell>{post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell>
                  {post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/admin/blog/${post.post_id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  {post.status !== 'published' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(post.post_id, 'published')}
                    >
                      Publish
                    </Button>
                  )}
                  {post.status === 'published' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(post.post_id, 'archived')}
                    >
                      Unpublish
                    </Button>
                  )}
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} of {total} entries
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(setPagination({ pageIndex: pagination.pageIndex - 1 }))}
            disabled={pagination.pageIndex === 0 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(setPagination({ pageIndex: pagination.pageIndex + 1 }))}
            disabled={pagination.pageIndex >= Math.ceil(total / pagination.pageSize) - 1 || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 