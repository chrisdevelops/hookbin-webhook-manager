import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WebhookStatus } from "@/types";

interface WebhookHeaderProps {
  name: string;
  description: string;
  url: string;
  status: WebhookStatus;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

function StatusIndicator({ status }: { status: WebhookStatus }) {
  const config = {
    active: { color: "bg-green-500 dark:bg-green-400", label: "Active" },
    "active-unread": { color: "bg-yellow-500 dark:bg-yellow-400", label: "Active" },
    inactive: { color: "bg-red-500 dark:bg-red-400", label: "Inactive" },
  };

  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function WebhookHeader({
  name,
  description,
  url,
  status,
  onNameChange,
  onDescriptionChange,
}: WebhookHeaderProps) {
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [descriptionValue, setDescriptionValue] = useState(description);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setNameValue(name);
  }, [name]);

  useEffect(() => {
    setDescriptionValue(description);
  }, [description]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [editingDescription]);

  const handleNameBlur = () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed.length >= 3 && trimmed.length <= 128) {
      onNameChange(trimmed);
    } else {
      setNameValue(name); // Revert on invalid
    }
  };

  const handleDescriptionBlur = () => {
    setEditingDescription(false);
    if (descriptionValue.length <= 512) {
      onDescriptionChange(descriptionValue);
    } else {
      setDescriptionValue(description); // Revert on invalid
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard", { duration: 1000 });
  };

  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-3">
        {editingName ? (
          <Input
            ref={nameInputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameBlur();
              if (e.key === "Escape") {
                setNameValue(name);
                setEditingName(false);
              }
            }}
            className="h-8 max-w-md text-lg font-semibold"
          />
        ) : (
          <h1
            onClick={() => setEditingName(true)}
            className="cursor-pointer text-lg font-semibold hover:text-muted-foreground"
          >
            {name}
          </h1>
        )}
        <StatusIndicator status={status} />
      </div>

      {editingDescription ? (
        <Textarea
          ref={descriptionInputRef}
          value={descriptionValue}
          onChange={(e) => setDescriptionValue(e.target.value)}
          onBlur={handleDescriptionBlur}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDescriptionValue(description);
              setEditingDescription(false);
            }
          }}
          placeholder="Add a description..."
          className="max-w-lg resize-none text-sm"
          rows={2}
        />
      ) : (
        <p
          onClick={() => setEditingDescription(true)}
          className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
        >
          {description || "Click to add description..."}
        </p>
      )}

      <div className="flex items-center gap-2">
        <code className="rounded bg-muted dark:bg-input px-2 py-1 font-mono text-xs text-foreground">
          {url}
        </code>
        <Button variant="ghost" size="icon-xs" onClick={handleCopyUrl}>
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}
