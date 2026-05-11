import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Home,
  Users,
  BookOpen,
  MessageSquare,
  Bell,
  User,
  Search,
  Send,
  Paperclip,
  X,
  FileText,
  Download,
  Check,
  CheckCheck,
} from "lucide-react";
import NotificationBadge from "@/components/NotificationBadge";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMessages } from "@/hooks/useMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
import { usePresence } from "@/hooks/usePresence";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { MessagesSkeleton } from "@/components/MessagesSkeleton";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(searchParams.get("user") || undefined);
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    conversations,
    messages,
    isLoading,
    sendMessage,
    markConversationAsRead,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
    searchResults,
    isSearching,
  } = useMessages(selectedUserId, searchQuery);
  const { unreadCount } = useNotifications();
  const { isUserOnline, isUserTyping, updateTypingStatus } = usePresence("messages-presence");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const selectedConversation = conversations.find((c) => c.user_id === selectedUserId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (selectedUserId && messages.length > 0) {
      const unreadMessages = messages.filter((msg) => msg.receiver_id === user?.id && !msg.is_read);
      if (unreadMessages.length > 0) {
        markConversationAsRead.mutate(selectedUserId);
      }
    }
  }, [selectedUserId, messages.length]);

  const handleSendMessage = () => {
    if ((!messageText.trim() && !selectedFile) || !selectedUserId) return;

    // Stop typing indicator
    updateTypingStatus(false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    sendMessage.mutate(
      {
        receiverId: selectedUserId,
        content: messageText || (selectedFile ? "Sent an attachment" : ""),
        file: selectedFile || undefined,
      },
      {
        onSuccess: () => {
          setMessageText("");
          setSelectedFile(null);
        },
      },
    );
  };

  const handleTyping = () => {
    // Start typing indicator
    updateTypingStatus(true);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Stop typing after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not supported. Please upload images, PDFs, or documents.");
      return;
    }

    setSelectedFile(file);
  };

  // Cache for signed URLs to avoid regenerating them
  const signedUrlCache = useRef<Map<string, string>>(new Map());

  const getSignedUrl = useCallback(async (objectPath: string): Promise<string> => {
    // Check if it's already a full URL (legacy data)
    if (objectPath.startsWith("http")) {
      return objectPath;
    }

    // Check cache first
    if (signedUrlCache.current.has(objectPath)) {
      return signedUrlCache.current.get(objectPath)!;
    }

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage.from("message-attachments").createSignedUrl(objectPath, 60 * 60);

    if (error || !data?.signedUrl) {
      console.error("Failed to get signed URL:", error);
      return objectPath;
    }

    signedUrlCache.current.set(objectPath, data.signedUrl);
    return data.signedUrl;
  }, []);

  // State to store resolved attachment URLs
  const [attachmentUrls, setAttachmentUrls] = useState<Map<string, string>>(new Map());

  // Resolve attachment URLs when messages change
  useEffect(() => {
    const resolveUrls = async () => {
      const newUrls = new Map<string, string>();
      for (const msg of messages) {
        if (msg.attachment_url && !attachmentUrls.has(msg.id)) {
          const url = await getSignedUrl(msg.attachment_url);
          newUrls.set(msg.id, url);
        }
      }
      if (newUrls.size > 0) {
        setAttachmentUrls((prev) => new Map([...prev, ...newUrls]));
      }
    };
    resolveUrls();
  }, [messages, getSignedUrl]);

  const renderAttachment = (message: any) => {
    if (!message.attachment_url) return null;

    const resolvedUrl = attachmentUrls.get(message.id) || message.attachment_url;
    const isImage = message.attachment_type?.startsWith("image/");
    const isPdf = message.attachment_type === "application/pdf";

    return (
      <div className="mt-2">
        {isImage ? (
          <img
            src={resolvedUrl}
            alt="Attachment"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(resolvedUrl, "_blank")}
          />
        ) : (
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm">{isPdf ? "PDF Document" : "Document"}</span>
            <Download className="h-4 w-4 ml-auto" />
          </a>
        )}
      </div>
    );
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OfflineBanner />
      {/* Header */}
      <AppHeader currentPage="messages" />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-4 md:py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Contacts - Show as full width on mobile */}
          <div className={`col-span-1 lg:col-span-3 ${selectedUserId ? "hidden lg:block" : ""}`}>
            <Card className="p-0">
              <div className="p-4 border-b space-y-3">
                <h2 className="font-semibold text-lg">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(e.target.value.length >= 2);
                    }}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchResults(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[calc(600px-105px)]">
                {showSearchResults && searchQuery.length >= 2 ? (
                  // Search Results
                  <div className="p-2">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Searching...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-8 text-center">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-sm">No messages found</p>
                        <p className="text-muted-foreground text-xs mt-2">Try a different search term</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground px-3 py-2">
                          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                        </p>
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => {
                              setSelectedUserId(result.other_user_id);
                              setShowSearchResults(false);
                              setSearchQuery("");
                            }}
                            className="flex items-start gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                          >
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={result.other_user_avatar || ""} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-sm text-foreground truncate">
                                  {result.other_user_name}
                                </h3>
                                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                  {formatMessageTime(result.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{result.content}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-sm">No conversations yet</p>
                    <p className="text-muted-foreground text-xs mt-2">Start chatting with your friends!</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.user_id}
                        onClick={() => setSelectedUserId(conversation.user_id)}
                        className={`flex items-start gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors ${
                          selectedUserId === conversation.user_id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            <AvatarImage src={conversation.avatar_url || ""} />
                            <AvatarFallback>
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          {isUserOnline(conversation.user_id) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                          {conversation.unread_count > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                              {conversation.unread_count}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm text-foreground truncate">{conversation.full_name}</h3>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatMessageTime(conversation.last_message_time)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{conversation.last_message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* Center - Chat Area */}
          <ErrorBoundary fallbackMessage="Unable to load messages">
            {isLoading && selectedUserId ? (
              <MessagesSkeleton />
            ) : (
              <div className={`col-span-1 lg:col-span-6 ${!selectedUserId ? "hidden lg:block" : ""}`}>
                <Card className="flex flex-col h-[calc(100vh-200px)] lg:h-[600px]">
                  {!selectedUserId ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Your Messages</h3>
                      <p className="text-muted-foreground text-center max-w-sm">
                        Select a conversation from the sidebar to view messages or start a new conversation with your
                        friends
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b bg-white flex items-center gap-3">
                        <button
                          onClick={() => setSelectedUserId(undefined)}
                          className="lg:hidden p-2 hover:bg-accent rounded-lg"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <Link to={`/user/${selectedUserId}`} className="flex-1">
                          <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={selectedConversation?.avatar_url || ""} />
                                <AvatarFallback>
                                  <User className="h-6 w-6" />
                                </AvatarFallback>
                              </Avatar>
                              {isUserOnline(selectedUserId) && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {selectedConversation?.full_name || "Unknown User"}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {isUserOnline(selectedUserId) ? "Online" : "Click to view profile"}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>

                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4">
                        {isUserTyping(selectedUserId) && (
                          <div className="mb-4 flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={selectedConversation?.avatar_url || ""} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-accent px-4 py-2 rounded-2xl rounded-bl-sm">
                              <div className="flex gap-1">
                                <span
                                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                />
                                <span
                                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                />
                                <span
                                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {messages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {hasMoreMessages && (
                              <div className="flex justify-center mb-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadMoreMessages()}
                                  disabled={isLoadingMore}
                                >
                                  {isLoadingMore ? "Loading..." : "Load older messages"}
                                </Button>
                              </div>
                            )}
                            {messages.map((message, index) => {
                              const isSent = message.sender_id === user?.id;
                              const showDate =
                                index === 0 ||
                                new Date(message.created_at).toDateString() !==
                                  new Date(messages[index - 1].created_at).toDateString();

                              return (
                                <div key={message.id}>
                                  {showDate && (
                                    <div className="flex items-center justify-center my-4">
                                      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                        {format(new Date(message.created_at), "MMMM d, yyyy")}
                                      </div>
                                    </div>
                                  )}
                                  <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                                    <div className="flex items-end gap-2 max-w-[70%]">
                                      {!isSent && (
                                        <Avatar className="w-8 h-8 flex-shrink-0 mb-6">
                                          <AvatarImage src={message.sender?.avatar_url || ""} />
                                          <AvatarFallback>
                                            <User className="h-4 w-4" />
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      <div className={isSent ? "items-end" : "items-start"}>
                                        {!isSent && (
                                          <p className="text-xs font-semibold text-foreground mb-1 px-1">
                                            {message.sender?.full_name}
                                          </p>
                                        )}
                                        <div
                                          className={`p-3 rounded-2xl ${
                                            isSent
                                              ? "bg-primary text-primary-foreground rounded-br-sm"
                                              : "bg-accent text-foreground rounded-bl-sm"
                                          }`}
                                        >
                                          <p className="text-sm break-words">{message.content}</p>
                                          {renderAttachment(message)}
                                        </div>
                                        <div
                                          className={`flex items-center gap-1 mt-1 px-1 ${isSent ? "justify-end" : "justify-start"}`}
                                        >
                                          <p className="text-xs text-muted-foreground">
                                            {format(new Date(message.created_at), "h:mm a")}
                                          </p>
                                          {isSent && (
                                            <TooltipProvider>
                                              <Tooltip delayDuration={200}>
                                                <TooltipTrigger asChild>
                                                  <span className="ml-1 cursor-help">
                                                    {message.is_read ? (
                                                      <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                                    ) : (
                                                      <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                                    )}
                                                  </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="text-xs">{message.is_read ? "Read" : "Delivered"}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </ScrollArea>

                      {/* Message Input */}
                      <div className="border-t bg-white">
                        {selectedFile && (
                          <div className="p-3 border-b bg-accent/50">
                            <div className="flex items-center gap-2">
                              {selectedFile.type.startsWith("image/") ? (
                                <img
                                  src={URL.createObjectURL(selectedFile)}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-accent rounded flex items-center justify-center">
                                  <FileText className="h-8 w-8" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <Button size="icon" variant="ghost" onClick={() => setSelectedFile(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="p-4 flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            onChange={handleFileSelect}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={sendMessage.isPending}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Input
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => {
                              setMessageText(e.target.value);
                              handleTyping();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="flex-1"
                            disabled={sendMessage.isPending}
                            maxLength={2000}
                          />
                          <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={(!messageText.trim() && !selectedFile) || sendMessage.isPending}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="px-4 pb-2 text-xs text-muted-foreground">
                          {messageText.length}/2000 characters {selectedFile && `• ${selectedFile.name}`}
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            )}
          </ErrorBoundary>

          {/* Right Sidebar - Campus News - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3">
            <Card className="p-4 mb-4">
              <h3 className="font-semibold text-sm mb-4">Campus News</h3>
              <div className="space-y-3">
                <div className="text-xs">
                  <p className="text-muted-foreground">12 days ago</p>
                  <p className="font-medium text-foreground">Appoint new VC</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground">15 days ago</p>
                  <p className="font-medium text-foreground">Appoint new Department Head of CSE</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground">15 days ago</p>
                  <p className="font-medium text-foreground">5 days Micro-scientist Courses</p>
                </div>
              </div>
            </Card>

            {/* Advertisement */}
            <Card className="p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-100 to-amber-200 p-6 text-center">
                <div className="mb-4">
                  <BookOpen className="h-16 w-16 mx-auto text-amber-800" />
                </div>
                <h4 className="font-bold text-xl text-amber-900 mb-2">MINDSET</h4>
                <p className="text-sm text-amber-800 mb-4">Nijgram</p>
                <p className="text-xs text-amber-700 mb-4">Old Books | Best Value | New Readers</p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Explore</Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-100 py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg font-semibold text-primary">
              SkillShare<span className="text-sm align-top">Campus</span>
            </span>
          </div>
          <p className="text-sm text-foreground/80">© 2025 SkillShareCampus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Messages;
