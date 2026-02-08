import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader2, BarChart3, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalyticsData {
  totalFalls: number;
  emergencies: number;
  falseAlarms: number;
  lastWeekFalls: number;
  avgFallsPerWeek: number;
  mostRecentFall: Date | null;
}

export default function AnalysisChat() {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchAnalytics();
    
    // Add welcome message
    setMessages([{
      id: '1',
      type: 'assistant',
      content: `Welcome to the SafeFall AI Analysis Assistant. I can help you understand your fall detection data and provide insights. Try asking:\n\n• "How many falls occurred this week?"\n• "Show my emergency trends"\n• "What's my fall detection summary?"\n• "Why was my last fall marked as emergency?"`,
      timestamp: new Date(),
    }]);
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAnalytics = async () => {
    if (!user?.id) return;
    const { data } = await analyticsApi.get();
    if (!data) return;
    setAnalytics({
      totalFalls: data.totalFalls,
      emergencies: data.emergencies,
      falseAlarms: data.falseAlarms,
      lastWeekFalls: data.lastWeekFalls,
      avgFallsPerWeek: data.avgFallsPerWeek,
      mostRecentFall: data.mostRecentFall ? new Date(data.mostRecentFall) : null,
    });
  };

  const generateResponse = (query: string): string => {
    if (!analytics) return "I'm still loading your data. Please try again in a moment.";

    const lowerQuery = query.toLowerCase();

    // Weekly falls
    if (lowerQuery.includes('week') && (lowerQuery.includes('fall') || lowerQuery.includes('how many'))) {
      return `📊 **This Week's Falls**\n\nYou had **${analytics.lastWeekFalls} fall events** in the past 7 days.\n\n• Emergencies: ${analytics.emergencies}\n• False alarms: ${analytics.falseAlarms}\n\nYour average is ${analytics.avgFallsPerWeek} falls per week.`;
    }

    // Summary
    if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('stats')) {
      return `📈 **Your Fall Detection Summary**\n\n• **Total Falls Detected:** ${analytics.totalFalls}\n• **Emergencies:** ${analytics.emergencies}\n• **False Alarms:** ${analytics.falseAlarms}\n• **Last Week:** ${analytics.lastWeekFalls} falls\n• **Weekly Average:** ${analytics.avgFallsPerWeek} falls\n${analytics.mostRecentFall ? `\n• **Most Recent:** ${analytics.mostRecentFall.toLocaleString()}` : ''}`;
    }

    // Emergency trends
    if (lowerQuery.includes('trend') || lowerQuery.includes('pattern')) {
      const emergencyRate = analytics.totalFalls > 0 
        ? Math.round((analytics.emergencies / analytics.totalFalls) * 100) 
        : 0;
      return `📉 **Emergency Trends**\n\n• Emergency rate: **${emergencyRate}%** of detected falls\n• Total emergencies: ${analytics.emergencies}\n• False alarm rate: ${100 - emergencyRate}%\n\n${emergencyRate > 50 
        ? '⚠️ Your emergency rate is high. Consider reviewing your fall detection sensitivity.' 
        : '✅ Your false alarm rate is healthy, indicating good detection accuracy.'}`;
    }

    // Why emergency
    if (lowerQuery.includes('why') && lowerQuery.includes('emergency')) {
      return `🔍 **Emergency Classification Criteria**\n\nA fall is marked as an **emergency** when:\n\n1. The 30-second countdown completes without response\n2. You press "Emergency - Need Help!" during the countdown\n3. Rapid acceleration changes detected (> threshold)\n4. Extended immobility after fall detection\n\n${analytics.emergencies > 0 
        ? `You've had ${analytics.emergencies} emergency-classified events.` 
        : 'You haven\'t had any emergency-classified falls yet.'}`;
    }

    // Last fall
    if (lowerQuery.includes('last') && lowerQuery.includes('fall')) {
      if (!analytics.mostRecentFall) {
        return "📋 You don't have any recorded fall events yet.";
      }
      return `📋 **Most Recent Fall**\n\nYour last fall was detected on:\n**${analytics.mostRecentFall.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**\nat ${analytics.mostRecentFall.toLocaleTimeString()}\n\nCheck your Fall History for complete details.`;
    }

    // Help
    if (lowerQuery.includes('help') || lowerQuery.includes('what can you')) {
      return `🤖 **SafeFall AI Analysis Assistant**\n\nI analyze your fall detection data to provide insights. I can help with:\n\n• **Weekly Reports:** "How many falls this week?"\n• **Summaries:** "Show my fall summary"\n• **Trends:** "What are my emergency trends?"\n• **Explanations:** "Why was a fall marked as emergency?"\n• **Recent Events:** "When was my last fall?"\n\nNote: I'm an analytics assistant, not a general chatbot. My responses are based on your recorded data.`;
    }

    // Default response
    return `I understand you're asking about "${query}". As an analytics assistant, I focus on your fall detection data insights.\n\n**Try asking:**\n• "Show my fall summary"\n• "How many falls this week?"\n• "What are my emergency trends?"\n\nFor other questions, please contact your healthcare provider.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const response = generateResponse(input.trim());
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setLoading(false);
  };

  const quickQuestions = [
    { icon: BarChart3, text: "Show my fall summary" },
    { icon: TrendingUp, text: "What are my emergency trends?" },
    { icon: AlertTriangle, text: "Why was my fall marked as emergency?" },
    { icon: Activity, text: "How many falls this week?" },
  ];

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="page-title">Analysis Chat</h1>
          <p className="page-subtitle">Get insights and analytics from your fall detection data</p>
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {quickQuestions.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setInput(q.text)}
                className="glass-card flex items-center gap-3 p-3 text-left text-sm transition-all hover:border-primary/50"
              >
                <q.icon className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">{q.text}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Chat Messages */}
        <div className="glass-card flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'mb-4 flex',
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className={line.startsWith('•') || line.startsWith('**') ? 'mt-1' : ''}>
                          {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                        </p>
                      ))}
                    </div>
                    <p className={cn(
                      'mt-1 text-xs',
                      message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-border/50 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your fall detection data..."
                  className="glass-input flex-1"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="btn-gradient flex items-center gap-2 px-4 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
