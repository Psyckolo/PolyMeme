import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProphetChatDrawerProps {
  onAsk: (question: string) => Promise<string>;
}

export function ProphetChatDrawer({ onAsk }: ProphetChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await onAsk(input);
      const assistantMessage: Message = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = { 
        role: "assistant", 
        content: "Unable to process your question. Please try again." 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] bg-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))] animate-pulse z-50"
          data-testid="button-ask-prophet"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] bg-background border-l-2 border-border">
        <SheetHeader>
          <SheetTitle className="text-2xl font-display flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[hsl(var(--neon-cyan))]" />
            Ask the Prophet
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-[calc(100vh-120px)] mt-6">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">Ask me anything about today's prediction</p>
                  <p className="text-xs mt-2">Note: This is for informational purposes only, not financial advice.</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-[hsl(var(--neon-magenta)_/_0.2)] border border-[hsl(var(--neon-magenta)_/_0.5)] ml-8"
                      : "bg-[hsl(var(--neon-cyan)_/_0.2)] border border-[hsl(var(--neon-cyan)_/_0.5)] mr-8"
                  }`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Prophet is thinking...
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="mt-4 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about the prediction..."
              className="flex-1"
              disabled={isLoading}
              data-testid="input-chat"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))]"
              data-testid="button-send-chat"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
