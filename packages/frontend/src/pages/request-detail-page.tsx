import { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Copy01Icon,
  Download01Icon,
  ArrowExpand01Icon,
} from "@hugeicons/core-free-icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebhooks } from "@/context/webhook-context";
import type { WebhookRequest } from "@/types";
import {
  formatTimestamp,
  getMethodColor,
  getStatusCodeColor,
  isValidJson,
  prettyPrintJson,
  truncateBody,
} from "@/lib/format";
import { api } from "@/lib/api";

const TRUNCATION_THRESHOLD = 10000;
const HARD_CAP = 100000;

export function RequestDetailPage() {
  const { webhookId, requestId } = useParams<{
    webhookId: string;
    requestId: string;
  }>();
  const navigate = useNavigate();
  const { getWebhook } = useWebhooks();

  const [request, setRequest] = useState<WebhookRequest | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullBody, setShowFullBody] = useState(false);

  const webhook = webhookId ? getWebhook(webhookId) : undefined;

  // Load request data
  useEffect(() => {
    if (!requestId) return;

    const loadRequest = async () => {
      setIsLoading(true);
      try {
        const data = await api.getRequest(requestId);
        setRequest(data);
      } catch (error) {
        console.error("Failed to load request:", error);
        setRequest(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequest();
  }, [requestId]);

  // Reset showFullBody when request changes
  useEffect(() => {
    setShowFullBody(false);
  }, [requestId]);

  const handleBack = useCallback(() => {
    if (webhookId) {
      navigate(`/webhooks/${webhookId}`);
    }
  }, [webhookId, navigate]);

  // Keyboard navigation for back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "Escape") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack]);

  const handleCopyHeaders = () => {
    if (request) {
      navigator.clipboard.writeText(JSON.stringify(request.headers, null, 2));
      toast.success("Headers copied", { duration: 1000 });
    }
  };

  const handleCopyBody = () => {
    if (request) {
      const textToCopy = isValidJson(request.body)
        ? prettyPrintJson(request.body)
        : request.body;
      navigator.clipboard.writeText(textToCopy);
      toast.success("Body copied", { duration: 1000 });
    }
  };

  const handleExport = () => {
    if (request) {
      window.open(api.getExportUrl(request.id), "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading request...</p>
      </div>
    );
  }

  if (!webhook || !request) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Request not found</p>
      </div>
    );
  }

  const bodyLength = request.body.length;
  const isTooLarge = bodyLength > HARD_CAP;
  const shouldTruncate = bodyLength > TRUNCATION_THRESHOLD && !showFullBody;
  const { text: displayBody, truncated } = shouldTruncate
    ? truncateBody(request.body, TRUNCATION_THRESHOLD)
    : { text: request.body, truncated: false };

  const formattedBody = isValidJson(displayBody)
    ? prettyPrintJson(displayBody)
    : displayBody;

  return (
    <div className="flex h-full flex-col">
      {/* Header with breadcrumbs and navigation */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>Webhooks</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to={`/webhooks/${webhookId}`} />}>
                {webhook.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Request</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleBack}
            title="Back to webhook (Esc)"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Metadata</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleExport}>
                  <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                  Export JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Request ID</dt>
                  <dd className="mt-0.5 font-mono text-xs">{request.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Webhook ID</dt>
                  <dd className="mt-0.5 font-mono text-xs">{request.webhookId}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Timestamp</dt>
                  <dd className="mt-0.5 text-xs">{formatTimestamp(request.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Method</dt>
                  <dd className="mt-0.5">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${getMethodColor(
                        request.method
                      )}`}
                    >
                      {request.method}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status Code</dt>
                  <dd
                    className={`mt-0.5 font-mono text-xs ${getStatusCodeColor(
                      request.statusCode
                    )}`}
                  >
                    {request.statusCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Content-Type</dt>
                  <dd className="mt-0.5 font-mono text-xs">{request.contentType}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Source IP</dt>
                  <dd className="mt-0.5 font-mono text-xs">{request.sourceIp}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Headers */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Headers</CardTitle>
                <Button variant="ghost" size="icon-xs" onClick={handleCopyHeaders}>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-3">
                <dl className="space-y-1 font-mono text-xs">
                  {Object.entries(request.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <dt className="shrink-0 text-muted-foreground">{key}:</dt>
                      <dd className="break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </CardContent>
          </Card>

          {/* Body */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Body
                  {bodyLength > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({bodyLength.toLocaleString()} bytes)
                    </span>
                  )}
                </CardTitle>
                <Button variant="ghost" size="icon-xs" onClick={handleCopyBody}>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isTooLarge ? (
                <div className="rounded-md bg-muted p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Payload too large to display ({bodyLength.toLocaleString()} bytes)
                  </p>
                  <div className="mt-3 flex justify-center">
                    <Button variant="outline" size="sm" onClick={handleCopyBody}>
                      <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                      Copy raw body
                    </Button>
                  </div>
                </div>
              ) : bodyLength === 0 ? (
                <div className="rounded-md bg-muted p-6 text-center">
                  <p className="text-sm text-muted-foreground">No body content</p>
                </div>
              ) : (
                <div className="relative">
                  <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
                    {formattedBody}
                  </pre>
                  {truncated && (
                    <div className="mt-2 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFullBody(true)}
                      >
                        <HugeiconsIcon icon={ArrowExpand01Icon} strokeWidth={2} />
                        View full body
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
