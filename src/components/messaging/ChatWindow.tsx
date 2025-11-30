import { useState, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Loader2,
  MessageSquare,
  Phone,
  MoreVertical,
  Image as ImageIcon,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  useRealtimeMessages,
  useCloseConversation,
  Message,
  Conversation,
  formatMessageTime,
} from '@/hooks/useMessaging';

interface ChatWindowProps {
  conversation: Conversation;
  onClose?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatWindow({
  conversation,
  onClose,
  isOpen,
  onOpenChange,
}: ChatWindowProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();
  const closeConversation = useCloseConversation();
  const { isConnected } = useRealtimeMessages(conversation.id);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (isOpen && conversation.id) {
      markAsRead.mutate(conversation.id);
    }
  }, [isOpen, conversation.id, messages.length]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    sendMessage.mutate({
      conversationId: conversation.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const participantName =
    conversation.participant?.full_name ||
    conversation.participant?.name ||
    (conversation.participant_type === 'restaurant' ? 'Restaurant' : 'Driver');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(participantName)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-base font-semibold text-left">
                {participantName}
              </SheetTitle>
              <div className="flex items-center gap-2">
                {conversation.order && (
                  <Badge variant="outline" className="text-xs">
                    Order #{conversation.order.order_number}
                  </Badge>
                )}
                {isConnected && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Phone className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    closeConversation.mutate(conversation.id);
                    onClose?.();
                  }}
                >
                  Close conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showAvatar =
                  !isOwn &&
                  (index === 0 ||
                    messages[index - 1]?.sender_id !== message.sender_id);

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    {!isOwn && showAvatar ? (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.sender?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(
                            message.sender?.full_name || participantName
                          )}
                        </AvatarFallback>
                      </Avatar>
                    ) : !isOwn ? (
                      <div className="w-8 flex-shrink-0" />
                    ) : null}

                    <div
                      className={`max-w-[75%] ${
                        isOwn ? 'items-end' : 'items-start'
                      }`}
                    >
                      {message.message_type === 'system' ? (
                        <div className="text-center text-xs text-muted-foreground py-2 px-4 bg-muted/50 rounded-full">
                          {message.content}
                        </div>
                      ) : (
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs ${
                              isOwn
                                ? 'text-primary-foreground/70 justify-end'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span>{formatMessageTime(message.created_at)}</span>
                            {isOwn && (
                              message.is_read ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
              className="h-10 w-10 flex-shrink-0"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Inline chat button that can be placed anywhere
 */
interface ChatButtonProps {
  conversation: Conversation;
  unreadCount?: number;
}

export function ChatButton({ conversation, unreadCount = 0 }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Chat
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
      <ChatWindow
        conversation={conversation}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

export default ChatWindow;
