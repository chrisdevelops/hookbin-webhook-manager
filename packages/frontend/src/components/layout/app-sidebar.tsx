import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Settings01Icon,
  Logout01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebhooks } from "@/context/webhook-context";
import { getWebhookUrl, getWebhookStatus } from "@/types";
import { formatRelativeTime } from "@/lib/format";

function StatusIndicator({ status }: { status: "active" | "active-unread" | "inactive" }) {
  const colors = {
    active: "bg-green-500",
    "active-unread": "bg-yellow-500",
    inactive: "bg-red-500",
  };

  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${colors[status]}`}
      title={
        status === "active"
          ? "Active"
          : status === "active-unread"
          ? "Active (unread requests)"
          : "Inactive"
      }
    />
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  const { webhookId } = useParams();
  const { webhooks, isLoading, error, createWebhook } = useWebhooks();
  const [isCreating, setIsCreating] = useState(false);

  const handleCopyUrl = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const url = getWebhookUrl(id);
    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard", { duration: 1000 });
  };

  const handleSelectWebhook = (id: string) => {
    navigate(`/webhooks/${id}`);
  };

  const handleCreateWebhook = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const webhook = await createWebhook({ name: "New Webhook" });
      navigate(`/webhooks/${webhook.id}`);
      toast.success("Webhook created", { duration: 1000 });
    } catch {
      toast.error("Failed to create webhook");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <span className="text-sm font-semibold">Hookbin</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCreateWebhook}
            disabled={isCreating}
            title="Create webhook"
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarGroup>
            <SidebarGroupContent>
              {isLoading ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  Loading webhooks...
                </div>
              ) : error ? (
                <div className="px-4 py-8 text-center text-xs text-destructive">
                  {error}
                </div>
              ) : webhooks.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No webhooks yet. Click + to create one.
                </div>
              ) : (
              <SidebarMenu>
                {webhooks.map((webhook) => {
                  const status = getWebhookStatus(webhook);
                  const isSelected = webhook.id === webhookId;
                  const shortId = webhook.id.slice(3);

                  return (
                    <SidebarMenuItem key={webhook.id}>
                      <SidebarMenuButton
                        isActive={isSelected}
                        onClick={() => handleSelectWebhook(webhook.id)}
                        className="h-auto py-2"
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate font-medium">
                              {webhook.name}
                            </span>
                            <span className="truncate text-[10px] text-muted-foreground font-mono">
                              {shortId}
                            </span>
                            {webhook.lastRequestAt && (
                              <span className="text-[10px] text-muted-foreground">
                                {formatRelativeTime(webhook.lastRequestAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => handleCopyUrl(e, webhook.id)}
                              className="opacity-0 group-hover/menu-button:opacity-100"
                            >
                              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                            </Button>
                            <StatusIndicator status={status} />
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <button
                {...props}
                className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-[10px]">U</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-left text-xs">
                  Local User
                </span>
              </button>
            )}
          />
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem>
              <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
