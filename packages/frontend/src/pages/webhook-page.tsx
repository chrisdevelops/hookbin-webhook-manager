import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Delete01Icon,
  Recycle01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useWebhooks } from "@/context/webhook-context";
import { getWebhookUrl, getWebhookStatus, type WebhookRequest } from "@/types";
import { WebhookHeader } from "@/components/webhook/webhook-header";
import { RequestList } from "@/components/webhook/request-list";

export function WebhookPage() {
  const { webhookId } = useParams<{ webhookId: string }>();
  const navigate = useNavigate();
  const {
    getWebhook,
    updateWebhook,
    deleteWebhook,
    toggleWebhookActive,
    clearWebhookHistory,
    getRequests,
  } = useWebhooks();

  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requests, setRequests] = useState<WebhookRequest[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const webhook = webhookId ? getWebhook(webhookId) : undefined;

  // Load requests when webhook or page changes
  useEffect(() => {
    if (!webhookId) return;

    const loadRequests = async () => {
      setLoadingRequests(true);
      try {
        const result = await getRequests(webhookId, currentPage);
        setRequests(result.requests);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      } catch (error) {
        console.error("Failed to load requests:", error);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadRequests();
  }, [webhookId, currentPage, getRequests]);

  // Reset to page 1 when webhook changes
  useEffect(() => {
    setCurrentPage(1);
  }, [webhookId]);

  const handleNameChange = useCallback(
    async (name: string) => {
      if (webhookId && name.length >= 3 && name.length <= 128) {
        try {
          await updateWebhook(webhookId, { name });
        } catch (error) {
          console.error("Failed to update name:", error);
        }
      }
    },
    [webhookId, updateWebhook]
  );

  const handleDescriptionChange = useCallback(
    async (description: string) => {
      if (webhookId && description.length <= 512) {
        try {
          await updateWebhook(webhookId, { description });
        } catch (error) {
          console.error("Failed to update description:", error);
        }
      }
    },
    [webhookId, updateWebhook]
  );

  const handleToggleActive = useCallback(async () => {
    if (webhookId) {
      try {
        await toggleWebhookActive(webhookId);
      } catch (error) {
        console.error("Failed to toggle webhook:", error);
      }
    }
  }, [webhookId, toggleWebhookActive]);

  const handleClearHistory = useCallback(async () => {
    if (webhookId) {
      try {
        await clearWebhookHistory(webhookId);
        setRequests([]);
        setTotalCount(0);
        setTotalPages(1);
      } catch (error) {
        console.error("Failed to clear history:", error);
      }
    }
  }, [webhookId, clearWebhookHistory]);

  const handleDelete = useCallback(async () => {
    if (webhookId) {
      try {
        await deleteWebhook(webhookId);
        navigate("/");
      } catch (error) {
        console.error("Failed to delete webhook:", error);
      }
    }
  }, [webhookId, deleteWebhook, navigate]);

  const handleRequestClick = useCallback(
    (requestId: string) => {
      navigate(`/webhooks/${webhookId}/requests/${requestId}`);
    },
    [webhookId, navigate]
  );

  if (!webhook) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Webhook not found</p>
      </div>
    );
  }

  const status = getWebhookStatus(webhook);
  const webhookUrl = getWebhookUrl(webhook.id);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <WebhookHeader
            name={webhook.name}
            description={webhook.description}
            url={webhookUrl}
            status={status}
            onNameChange={handleNameChange}
            onDescriptionChange={handleDescriptionChange}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button {...props} variant="ghost" size="icon">
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                </Button>
              )}
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleActive}>
                <HugeiconsIcon
                  icon={webhook.isActive ? ViewOffSlashIcon : ViewIcon}
                  strokeWidth={2}
                />
                {webhook.isActive ? "Disable" : "Enable"} webhook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearHistory}>
                <HugeiconsIcon icon={Recycle01Icon} strokeWidth={2} />
                Clear request history
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
                Delete webhook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <RequestList
        requests={requests}
        totalPages={totalPages}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onRequestClick={handleRequestClick}
        isLoading={loadingRequests}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the webhook "{webhook.name}" and all
              its request history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
