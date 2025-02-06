'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '../../context/AdminContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreVertical, FileText, RefreshCw } from 'lucide-react'

interface ClusterActionsProps {
  cluster: {
    cluster_id: string
    status: string
  }
}

export function ClusterActions({ cluster }: ClusterActionsProps) {
  const router = useRouter()
  const { loading, setLoading, setError } = useAdmin()
  const [isOpen, setIsOpen] = useState(false)

  const handleCreateBlogPost = async () => {
    try {
      const response = await fetch(`/admin/api/clustering/${cluster.cluster_id}/blog`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to create blog post')

      const { blogPostId } = await response.json()
      router.push(`/admin/blog/${blogPostId}`)
    } catch (error) {
      console.error('Error creating blog post:', error)
      setError(error instanceof Error ? error.message : 'Failed to create blog post')
    }
  }

  const handleReanalyze = async () => {
    setLoading('cluster-analysis', true)
    try {
      await fetch(`/admin/api/clustering/${cluster.cluster_id}/analyze`, {
        method: 'POST'
      })
      // Refresh data
      router.refresh()
    } catch (error) {
      console.error('Error triggering reanalysis:', error)
      setError(error instanceof Error ? error.message : 'Failed to trigger reanalysis')
    } finally {
      setLoading('cluster-analysis', false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0"
          disabled={loading['cluster-actions']}
        >
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleCreateBlogPost}
          disabled={cluster.status !== 'completed'}
        >
          <FileText className="mr-2 h-4 w-4" />
          Create Blog Post
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleReanalyze}
          disabled={cluster.status === 'processing'}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reanalyze
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 