"use client"

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowUpDown,
  ArrowDownUp,
  Server,
  Activity,
  Code,
  Download,
  RefreshCw
} from "lucide-react"

interface LogDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  logId: string
  logType: 'webhook' | 'job'
}

interface WebhookLog {
  id: string
  providerId: string
  tenantId: string
  direction: 'INBOUND' | 'OUTBOUND'
  requestUrl: string
  requestMethod: string
  requestHeaders: Record<string, string>
  requestBody: any
  responseStatus?: number
  responseHeaders?: Record<string, string>
  responseBody?: any
  duration?: number
  error?: string
  jobId?: string
  createdAt: Date
  provider?: {
    id: string
    name: string
    displayName: string
    provider: string
  }
}

interface JobLog {
  id: string
  serviceType: string
  providerId: string
  tenantId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  input: string
  output?: string
  error?: string
  startedAt?: Date
  completedAt?: Date
  attempts: number
  userId?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export function LogDetailsModal({ isOpen, onClose, logId, logType }: LogDetailsModalProps) {
  const [log, setLog] = useState<WebhookLog | JobLog | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogDetails = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = logType === 'webhook' 
        ? `/api/webhooks/ai-callbacks/logs/${logId}`
        : `/api/super-admin/ai-jobs/${logId}`

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setLog(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch log details')
    } finally {
      setLoading(false)
    }
  }, [logType, logId])

  useEffect(() => {
    if (isOpen && logId) {
      fetchLogDetails()
    }
  }, [isOpen, logId, fetchLogDetails])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case '200':
      case '201':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'cancelled':
      case '400':
      case '401':
      case '403':
      case '404':
      case '500':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      'completed': { variant: 'default', label: 'Completed' },
      'failed': { variant: 'destructive', label: 'Failed' },
      'cancelled': { variant: 'secondary', label: 'Cancelled' },
      'pending': { variant: 'outline', label: 'Pending' },
      'processing': { variant: 'outline', label: 'Processing' },
      '200': { variant: 'default', label: 'Success' },
      '201': { variant: 'default', label: 'Created' },
      '400': { variant: 'destructive', label: 'Bad Request' },
      '401': { variant: 'destructive', label: 'Unauthorized' },
      '403': { variant: 'destructive', label: 'Forbidden' },
      '404': { variant: 'destructive', label: 'Not Found' },
      '500': { variant: 'destructive', label: 'Server Error' }
    }

    const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(2)}s`
  }

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>
              {logType === 'webhook' ? 'Webhook Log Details' : 'Job Details'}
            </span>
            {log && (
              <div className="flex items-center space-x-2">
                {getStatusIcon(logType === 'webhook' ? String((log as WebhookLog).responseStatus) : (log as JobLog).status)}
                {getStatusBadge(logType === 'webhook' ? String((log as WebhookLog).responseStatus) : (log as JobLog).status)}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Detailed information about this {logType === 'webhook' ? 'webhook request' : 'job execution'}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {log && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">ID</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{log.id}</code>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Created At</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              {logType === 'webhook' && (log as WebhookLog).duration && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {formatDuration((log as WebhookLog).duration)}
                    </div>
                  </CardContent>
                </Card>
              )}

              {logType === 'job' && (log as JobLog).attempts && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {(log as JobLog).attempts}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Detailed Information */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {logType === 'webhook' && (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Provider</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            {(log as WebhookLog).provider?.displayName || 'Unknown'}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Direction</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-2">
                            {(log as WebhookLog).direction === 'INBOUND' ? (
                              <ArrowDownUp className="h-4 w-4 text-blue-500" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-sm">{(log as WebhookLog).direction}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Method</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="outline">{(log as WebhookLog).requestMethod}</Badge>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">URL</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                            {(log as WebhookLog).requestUrl}
                          </code>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {logType === 'job' && (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Service Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="outline">{(log as JobLog).serviceType}</Badge>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Started At</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            {(log as JobLog).startedAt 
                              ? new Date((log as JobLog).startedAt!).toLocaleString()
                              : 'Not started'
                            }
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Completed At</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            {(log as JobLog).completedAt 
                              ? new Date((log as JobLog).completedAt!).toLocaleString()
                              : 'Not completed'
                            }
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">User ID</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            {(log as JobLog).userId || 'System'}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="request" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Request Headers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <pre className="text-xs bg-muted p-4 rounded">
                        {formatJson(logType === 'webhook' ? (log as WebhookLog).requestHeaders : {})}
                      </pre>
                    </ScrollArea>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => copyToClipboard(formatJson(logType === 'webhook' ? (log as WebhookLog).requestHeaders : {}))}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Request Body</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <pre className="text-xs bg-muted p-4 rounded">
                        {formatJson(logType === 'webhook' ? (log as WebhookLog).requestBody : (log as JobLog).input)}
                      </pre>
                    </ScrollArea>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => copyToClipboard(formatJson(logType === 'webhook' ? (log as WebhookLog).requestBody : (log as JobLog).input))}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="response" className="space-y-4">
                {logType === 'webhook' && (log as WebhookLog).responseStatus && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Response Headers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-32">
                          <pre className="text-xs bg-muted p-4 rounded">
                            {formatJson((log as WebhookLog).responseHeaders || {})}
                          </pre>
                        </ScrollArea>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => copyToClipboard(formatJson((log as WebhookLog).responseHeaders || {}))}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Response Body</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <pre className="text-xs bg-muted p-4 rounded">
                            {formatJson((log as WebhookLog).responseBody || {})}
                          </pre>
                        </ScrollArea>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => copyToClipboard(formatJson((log as WebhookLog).responseBody || {}))}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}

                {logType === 'job' && (log as JobLog).output && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <pre className="text-xs bg-muted p-4 rounded">
                          {formatJson((log as JobLog).output)}
                        </pre>
                      </ScrollArea>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => copyToClipboard(formatJson((log as JobLog).output))}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {logType === 'job' && (log as JobLog).error && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        <pre className="text-xs bg-red-50 p-4 rounded text-red-800">
                          {(log as JobLog).error}
                        </pre>
                      </ScrollArea>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => copyToClipboard((log as JobLog).error || '')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-6">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
