import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WebhookRequest } from "@/types";
import {
  formatIp,
  formatRelativeTime,
  formatTimestamp,
  getMethodColor,
  getStatusCodeColor,
} from "@/lib/format";

interface RequestListProps {
  requests: WebhookRequest[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRequestClick: (requestId: string) => void;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

function MethodBadge({ method }: { method: string }) {
  const colorClass = getMethodColor(method);
  return (
    <span
      className={`inline-flex min-w-14 items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${colorClass}`}
    >
      {method}
    </span>
  );
}

function StatusCode({ code }: { code: number }) {
  const colorClass = getStatusCodeColor(code);
  return <span className={`font-mono text-xs ${colorClass}`}>{code}</span>;
}

export function RequestList({
  requests,
  totalPages,
  totalCount,
  currentPage,
  onPageChange,
  onRequestClick,
  isLoading = false,
  hasActiveFilters = false,
  onClearFilters,
}: RequestListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    // Show different empty state based on whether filters are active
    if (hasActiveFilters) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No requests match your filters
          </p>
          {onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">No requests yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Incoming requests will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {requests.map((request) => (
            <button
              key={request.id}
              onClick={() => onRequestClick(request.id)}
              className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-muted/50"
            >
              {request.isFavorite && (
                <HugeiconsIcon
                  icon={StarIcon}
                  strokeWidth={2}
                  className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500 opacity-60"
                />
              )}
              <MethodBadge method={request.method} />
              <StatusCode code={request.statusCode} />
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {request.id}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {formatIp(request.sourceIp)}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {request.contentType}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {formatTimestamp(request.createdAt)}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {formatRelativeTime(request.createdAt)}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-6 py-3">
          <span className="text-xs text-muted-foreground">
            {totalCount} requests
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
