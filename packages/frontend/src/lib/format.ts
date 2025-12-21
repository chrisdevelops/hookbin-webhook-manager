export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return date.toLocaleDateString();
}

export function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

export function formatHttpMethod(method: string): string {
  return method.toUpperCase();
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950",
    POST: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
    PUT: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950",
    PATCH: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950",
    DELETE: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
  };
  return colors[method.toUpperCase()] || "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950";
}

export function getStatusCodeColor(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) {
    return "text-green-600 dark:text-green-400";
  }
  if (statusCode >= 300 && statusCode < 400) {
    return "text-blue-600 dark:text-blue-400";
  }
  if (statusCode >= 400 && statusCode < 500) {
    return "text-yellow-600 dark:text-yellow-400";
  }
  if (statusCode >= 500) {
    return "text-red-600 dark:text-red-400";
  }
  return "text-muted-foreground";
}

export function truncateBody(body: string, maxLength: number = 5000): { text: string; truncated: boolean } {
  if (body.length <= maxLength) {
    return { text: body, truncated: false };
  }
  return { text: body.slice(0, maxLength), truncated: true };
}

export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function prettyPrintJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}
