import { useState } from 'react';
import {
  MessageSquare,
  Loader2,
  Store,
  Truck,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useConversations,
  useUnreadMessageCount,
  Conversation,
  formatMessageTime,
} from '@/hooks/useMessaging';
import { ChatWindow } from './ChatWindow';

export function ConversationList() {
  const { data: conversations = [], isLoading } = useConversations();
  const { data: totalUnread = 0 } = useUnreadMessageCount();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.order?.order_number?.toLowerCase().includes(searchLower) ||
      conv.participant?.name?.toLowerCase().includes(searchLower) ||
      conv.participant?.full_name?.toLowerCase().includes(searchLower) ||
      conv.last_message?.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getParticipantName = (conv: Conversation) => {
    return (
      conv.participant?.full_name ||
      conv.participant?.name ||
      (conv.participant_type === 'restaurant' ? 'Restaurant' : 'Driver')
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnread}
              </Badge>
            )}
          </CardTitle>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground px-4">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
              </p>
              <p className="text-xs mt-1">
                {!searchQuery && 'Start a chat with a restaurant or driver from your order'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => {
                const participantName = getParticipantName(conversation);
                const hasUnread = (conversation.unread_count || 0) > 0;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                      hasUnread ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10">
                          {conversation.participant_type === 'restaurant' ? (
                            <Store className="h-5 w-5 text-primary" />
                          ) : (
                            <Truck className="h-5 w-5 text-primary" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={`font-medium truncate ${
                                hasUnread ? 'text-foreground' : 'text-foreground/80'
                              }`}
                            >
                              {participantName}
                            </p>
                            {conversation.order && (
                              <p className="text-xs text-muted-foreground">
                                Order #{conversation.order.order_number}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {conversation.last_message_at && (
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(conversation.last_message_at)}
                              </span>
                            )}
                            {hasUnread && (
                              <Badge
                                variant="destructive"
                                className="h-5 min-w-[20px] flex items-center justify-center p-0 text-xs"
                              >
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {conversation.last_message && (
                          <p
                            className={`text-sm mt-1 line-clamp-1 ${
                              hasUnread
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {conversation.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Chat Window */}
      {selectedConversation && (
        <ChatWindow
          conversation={selectedConversation}
          isOpen={!!selectedConversation}
          onOpenChange={(open) => !open && setSelectedConversation(null)}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </Card>
  );
}

export default ConversationList;
