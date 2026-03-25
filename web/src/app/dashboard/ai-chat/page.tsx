'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import { Bot, User, Send, RotateCcw, FileText, Check, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatOption {
  id: string;
  label: string;
  icon?: string;
}

interface StepOptions {
  question: string;
  key: string;
  type: 'single' | 'multi' | 'text';
  options?: ChatOption[];
  placeholder?: string;
}

const STAGE_LABELS = ['Brand Info', 'Locations', 'Budget & Timeline', 'Asset Matching', 'Proposal'];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [currentOptions, setCurrentOptions] = useState<StepOptions | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentOptions]);

  const toggleOption = (id: string) => {
    if (!currentOptions) return;
    if (currentOptions.type === 'single') {
      setSelectedOptions([id]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const submitSelections = async () => {
    if (!currentOptions) return;
    if (currentOptions.type !== 'text' && selectedOptions.length === 0) return;

    setLoading(true);
    const key = currentOptions.key;
    const value = currentOptions.type === 'multi' ? selectedOptions : selectedOptions[0];

    // Build display text
    const selectedLabels = currentOptions.options
      ?.filter((o) => selectedOptions.includes(o.id))
      .map((o) => o.label)
      .join(', ') || '';
    const displayText = input ? `${selectedLabels}${selectedLabels ? ' — ' : ''}${input}` : selectedLabels;

    setMessages((prev) => [...prev, { role: 'user', content: displayText || input, timestamp: new Date().toISOString() }]);

    const prevOptions = currentOptions;
    setCurrentOptions(null);
    setSelectedOptions([]);
    setShowTextInput(false);

    try {
      const { data } = await api.post('/chat/message', {
        sessionId,
        message: input || displayText || 'selected',
        selections: { [key]: value },
      });

      setSessionId(data.data.sessionId);
      setStage(data.data.stage);
      setIsComplete(data.data.isComplete || false);
      if (data.data.proposalId) setProposalId(data.data.proposalId);
      if (data.data.options) setCurrentOptions(data.data.options);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.data.message, timestamp: new Date().toISOString() },
      ]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Something went wrong';
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}`, timestamp: new Date().toISOString() }]);
      setCurrentOptions(prevOptions);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  const submitText = async () => {
    if (!currentOptions || !input.trim()) return;
    setLoading(true);
    const key = currentOptions.key;

    setMessages((prev) => [...prev, { role: 'user', content: input, timestamp: new Date().toISOString() }]);
    const prevOptions = currentOptions;
    setCurrentOptions(null);
    setShowTextInput(false);

    try {
      const { data } = await api.post('/chat/message', {
        sessionId,
        message: input,
        selections: { [key]: input },
      });

      setSessionId(data.data.sessionId);
      setStage(data.data.stage);
      setIsComplete(data.data.isComplete || false);
      if (data.data.proposalId) setProposalId(data.data.proposalId);
      if (data.data.options) setCurrentOptions(data.data.options);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.data.message, timestamp: new Date().toISOString() },
      ]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Something went wrong';
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}`, timestamp: new Date().toISOString() }]);
      setCurrentOptions(prevOptions);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  const startChat = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/chat/message', {
        sessionId: null,
        message: 'Start planning',
      });

      setSessionId(data.data.sessionId);
      setStage(data.data.stage);
      if (data.data.options) setCurrentOptions(data.data.options);

      setMessages([
        { role: 'assistant', content: data.data.message, timestamp: new Date().toISOString() },
      ]);
    } catch (err: any) {
      setMessages([{ role: 'assistant', content: `⚠️ ${err.response?.data?.error || 'Failed to start chat'}`, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSessionId(null);
    setStage(1);
    setIsComplete(false);
    setProposalId(null);
    setCurrentOptions(null);
    setSelectedOptions([]);
    setShowTextInput(false);
    setInput('');
  };

  const sendFreeText = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: msg, timestamp: new Date().toISOString() }]);

    try {
      const { data } = await api.post('/chat/message', {
        sessionId,
        message: msg,
      });

      setSessionId(data.data.sessionId);
      setStage(data.data.stage);
      setIsComplete(data.data.isComplete || false);
      if (data.data.proposalId) setProposalId(data.data.proposalId);
      if (data.data.options) setCurrentOptions(data.data.options);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.data.message, timestamp: new Date().toISOString() },
      ]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${err.response?.data?.error || 'Error'}`, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Campaign Planner</h1>
        <Button variant="outline" onClick={resetChat}><RotateCcw className="mr-2 h-4 w-4" />New Chat</Button>
      </div>

      {/* Stage Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            {STAGE_LABELS.map((label, i) => (
              <div key={label} className={`flex items-center ${i < stage ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-1.5 ${
                  i + 1 < stage ? 'bg-green-500 text-white'
                  : i + 1 === stage ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-muted'
                }`}>
                  {i + 1 < stage ? '✓' : i + 1}
                </div>
                <span className="text-xs hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
          <Progress value={isComplete ? 100 : ((stage - 1) / 5) * 100} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {isComplete ? 'Campaign planning complete!' : `Stage ${stage} of 5: ${STAGE_LABELS[stage - 1]}`}
          </p>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="flex flex-col" style={{ height: '560px' }}>
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Bot className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-xl font-semibold">AI Campaign Planner</p>
              <p className="text-sm mt-2 text-center max-w-md">
                Plan your OOH billboard campaign in 5 simple steps. Just pick options and I'll build your proposal!
              </p>
              <Button className="mt-6" size="lg" onClick={startChat} disabled={loading}>
                {loading ? 'Starting...' : '🚀 Start Planning'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Option Chips */}
              {currentOptions && !loading && currentOptions.type !== 'text' && currentOptions.options && (
                <div className="ml-11 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {currentOptions.options.map((opt) => {
                      const isSelected = selectedOptions.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleOption(opt.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary'
                              : 'border-border bg-card hover:border-primary/50 hover:bg-accent'
                          }`}
                        >
                          {opt.icon && <span>{opt.icon}</span>}
                          <span>{opt.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add custom text toggle */}
                  {!showTextInput && (
                    <button
                      onClick={() => setShowTextInput(true)}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <MessageSquare className="h-3 w-3" /> Add a note (optional)
                    </button>
                  )}

                  {showTextInput && (
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Add a note or custom text..."
                      className="text-sm"
                    />
                  )}

                  <Button
                    onClick={submitSelections}
                    disabled={selectedOptions.length === 0 || loading}
                    className="w-full sm:w-auto"
                  >
                    Continue →
                  </Button>
                </div>
              )}

              {/* Text Input Step */}
              {currentOptions && !loading && currentOptions.type === 'text' && (
                <div className="ml-11 space-y-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitText()}
                    placeholder={currentOptions.placeholder || 'Type your answer...'}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button onClick={submitText} disabled={!input.trim() || loading} className="w-full sm:w-auto">
                      Continue →
                    </Button>
                    {currentOptions.question.includes('optional') && (
                      <Button variant="ghost" onClick={() => { setInput('N/A'); setTimeout(submitText, 100); }}>
                        Skip
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Bottom Bar */}
        <div className="p-4 border-t">
          {isComplete ? (
            <div className="text-center space-y-3">
              <Badge className="bg-green-500 text-white text-sm px-3 py-1">Campaign Planning Complete!</Badge>
              <div className="flex gap-2 justify-center">
                <Link href="/dashboard/proposals">
                  <Button size="sm"><FileText className="mr-2 h-4 w-4" />View Proposals</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={resetChat}>
                  <RotateCcw className="mr-2 h-4 w-4" />Plan Another
                </Button>
              </div>
            </div>
          ) : messages.length > 0 && !currentOptions ? (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendFreeText()}
                placeholder="Type a message..."
                disabled={loading}
              />
              <Button onClick={sendFreeText} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
