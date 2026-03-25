'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import {
  Brain, Send, Sparkles, TrendingUp, AlertTriangle, Lightbulb,
  CheckCircle2, XCircle, Eye, BarChart3, Users, MapPin, Receipt,
  MessageSquarePlus, Loader2
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
}

interface Insight {
  id: string;
  type: string;
  title: string;
  summary: string;
  severity: string;
  status: string;
  actionable: boolean;
  createdAt: string;
}

interface QuickStats {
  revenue: number;
  overdueInvoices: number;
  activeCampaigns: number;
  newEnquiries: number;
  pendingCreatives: number;
  occupancyRate: number;
  totalAssets: number;
}

const SUGGESTED_QUESTIONS = [
  'What is our current revenue and collection rate?',
  'Which assets have the lowest occupancy?',
  'How is our enquiry pipeline performing?',
  'Compare this month vs last month revenue',
  'Are there any anomalies or risks I should know about?',
  'Who are our top clients by spend?',
  'How many campaigns are currently active?',
  'What is our asset occupancy breakdown by city?',
];

export default function AiAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/ai-agent/insights?limit=10').then(({ data }) => setInsights(data.data || [])).catch(() => {});
    api.get('/ai-agent/quick-stats').then(({ data }) => setQuickStats(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || sending) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setSending(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/ai-agent/chat', { message: msg, history });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.data.message,
        toolsUsed: data.data.toolsUsed,
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setSending(false);
    }
  };

  const updateInsight = async (id: string, status: string) => {
    try {
      await api.patch(`/ai-agent/insights/${id}`, { status });
      setInsights(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch {}
  };

  const severityIcon = (s: string) => {
    switch (s) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-green-500" />;
      default: return <Sparkles className="h-4 w-4 text-blue-500" />;
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      case 'opportunity': return 'success';
      default: return 'secondary';
    }
  };

  const typeIcon = (t: string) => {
    switch (t) {
      case 'revenue': return <Receipt className="h-4 w-4" />;
      case 'asset': case 'occupancy': return <MapPin className="h-4 w-4" />;
      case 'enquiry': return <MessageSquarePlus className="h-4 w-4" />;
      case 'campaign': return <BarChart3 className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Operations Agent</h1>
            <p className="text-sm text-muted-foreground">Ask questions, get insights, make strategic decisions</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {quickStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Revenue', value: INR.format(quickStats.revenue), icon: Receipt, color: 'text-green-600' },
            { label: 'Occupancy', value: `${quickStats.occupancyRate}%`, icon: MapPin, color: 'text-blue-600' },
            { label: 'Active Campaigns', value: quickStats.activeCampaigns, icon: BarChart3, color: 'text-purple-600' },
            { label: 'New Enquiries', value: quickStats.newEnquiries, icon: MessageSquarePlus, color: 'text-amber-600' },
            { label: 'Overdue Invoices', value: quickStats.overdueInvoices, icon: AlertTriangle, color: 'text-red-600' },
            { label: 'Pending Creatives', value: quickStats.pendingCreatives, icon: Eye, color: 'text-orange-600' },
            { label: 'Total Assets', value: quickStats.totalAssets, icon: MapPin, color: 'text-indigo-600' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-3 flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-sm font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chat">
            <Brain className="h-4 w-4 mr-1" />Chat
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Sparkles className="h-4 w-4 mr-1" />Insights
            {insights.filter(i => i.status === 'NEW').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {insights.filter(i => i.status === 'NEW').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <Card className="h-[600px] flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900 flex items-center justify-center mb-4">
                    <Brain className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">AI Operations Agent</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    I can analyze your business data, provide financial insights, track asset performance,
                    and help with strategic decisions. Ask me anything!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg">
                    {SUGGESTED_QUESTIONS.slice(0, 6).map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        className="text-xs text-left h-auto py-2 px-3 whitespace-normal"
                        onClick={() => sendMessage(q)}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'assistant' && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] ${msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2'
                        : 'bg-muted rounded-2xl rounded-tl-sm px-4 py-3'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-hr:my-3 prose-blockquote:my-2 ai-markdown">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                        )}
                        {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {[...new Set(msg.toolsUsed)].map(t => (
                              <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                                {t.replace('query_', '').replace('get_', '')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {sending && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing data...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="border-t p-4">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about revenue, assets, campaigns, clients..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No AI insights generated yet.</p>
                <p className="text-xs mt-1">Insights are generated daily at 6:00 AM, or you can ask the AI agent directly.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <Card key={insight.id} className={insight.status === 'NEW' ? 'border-l-4 border-l-violet-500' : 'opacity-75'}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">{severityIcon(insight.severity)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <Badge variant={severityColor(insight.severity) as any} className="text-[10px]">
                              {insight.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {typeIcon(insight.type)}
                              <span className="ml-1">{insight.type}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.summary}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(insight.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {insight.status === 'NEW' && (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateInsight(insight.id, 'ACTED')}
                            title="Mark as acted upon"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />Act
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateInsight(insight.id, 'DISMISSED')}
                            title="Dismiss"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {insight.status !== 'NEW' && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {insight.status}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
