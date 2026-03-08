import { useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useChatSession, useChatMessages, useSendMessage } from '@/hooks/useChatbot';
import { useAuth } from '@/contexts/AuthContext';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { user } = useAuth();
  const { data: session } = useChatSession();
  const { data: messages = [] } = useChatMessages(session?.id);
  const sendMessage = useSendMessage();

  const handleSend = async () => {
    if (!input.trim() || !session) return;
    const msg = input;
    setInput('');
    await sendMessage.mutateAsync({ sessionId: session.id, content: msg });
  };

  if (!user) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[480px] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <span className="font-semibold">Support Chat</span>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Hi! How can we help you today?
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.sender_type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t flex gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={sendMessage.isPending || !session}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sendMessage.isPending || !input.trim()}
            >
              {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
