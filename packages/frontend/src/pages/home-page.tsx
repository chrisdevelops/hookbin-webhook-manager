export function HomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-semibold text-foreground">
          Select a Webhook
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a webhook from the sidebar to view its request history and details.
        </p>
      </div>
    </div>
  );
}
