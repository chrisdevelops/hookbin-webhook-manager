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
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 2048 2048"
              className="h-6 w-6"
              aria-label="Hookbin logo"
            >
              <path
                fill="currentColor"
                d="M 778.56 618.209 C 779.285 618.212 780.009 618.229 780.733 618.26 C 783.845 618.407 788.765 619.459 790.389 622.476 C 795.796 632.516 796.133 689.148 787.477 695.042 C 771.671 705.804 749.134 717.617 731.984 727.278 C 692.764 749.48 653.431 771.48 613.985 793.277 L 566.763 819.778 C 558.155 824.629 545.936 832.134 537.037 835.433 C 575.049 855.227 616.511 879.445 654.287 900.484 L 901.064 1037.74 C 926.146 1051.46 951.139 1065.34 976.043 1079.38 C 988.923 1086.7 1010.57 1099.98 1023.47 1105.64 C 1042.09 1096.9 1069.05 1080.75 1087.48 1070.44 L 1205.26 1004.82 L 1414.78 888.326 C 1445.84 871.032 1479.36 853.583 1509.81 835.757 C 1493.95 828.004 1475.52 817.119 1459.86 808.422 L 1366.57 756.374 L 1299.6 718.605 C 1287.52 711.783 1274.68 704.809 1262.96 697.294 C 1257.94 694.434 1255.01 687.141 1254.61 681.604 C 1253.54 667.172 1253.45 652.671 1253.52 638.205 C 1253.6 622.296 1261.02 613.149 1276.83 621.842 C 1296.9 632.874 1316.87 644.179 1336.92 655.27 L 1485.63 738.005 C 1503.72 748.051 1618.36 809.309 1625.43 816.941 C 1628.85 820.637 1630.24 823.85 1630.85 828.763 C 1632.36 840.747 1631.57 853.516 1631.57 865.6 L 1631.51 930.765 L 1631.58 1148.75 C 1631.59 1184.63 1633.95 1443.58 1629.72 1453.15 C 1627.9 1457.26 1623.97 1460.16 1620.25 1462.38 C 1584.29 1483.86 1546.64 1503.32 1510.05 1523.77 L 1251.98 1667.41 L 1112.85 1745.38 L 1062.15 1774.14 C 1052.98 1779.31 1043.31 1785.04 1033.95 1789.55 C 1025.89 1793.44 1021.75 1793.83 1013.64 1790.01 C 991.996 1779.83 969.029 1766.11 948.04 1754.33 L 819.521 1682.48 L 520.451 1515.06 C 489.744 1497.62 458.449 1480.78 428.08 1462.78 C 424.254 1460.52 421.129 1457.67 419.52 1453.42 C 414.833 1441.04 417.263 1335.87 417.274 1312.23 L 417.284 1127.15 L 417.227 941.148 C 417.205 907.904 417.069 874.522 417.351 841.288 C 417.397 835.879 418.394 824.705 420.835 820.166 C 423.016 816.112 431.671 810.677 435.869 808.325 C 460.142 794.723 484.661 781.438 508.927 767.823 L 679.674 672.168 C 702.092 659.679 724.656 647.577 746.802 634.614 C 756.244 629.087 768.203 621.221 778.56 618.209 z M 1057 1171.4 L 1056.94 1510.27 C 1056.96 1570.12 1056.93 1629.97 1057.08 1689.82 C 1057.09 1691.21 1057.43 1692.36 1058.51 1693.26 L 1425.68 1488.74 C 1469.43 1464.31 1518.61 1438.81 1561.09 1413.56 C 1562.46 1365.72 1561.7 890.61 1560.58 888.91 C 1518.05 911.338 1473.06 937.684 1430.87 961.318 L 1227.36 1075.45 L 1109.08 1141.66 C 1092.46 1151.04 1072.94 1161.39 1057 1171.4 z M 487.912 1413.7 C 513.63 1430.2 552.822 1450.29 580.536 1466.02 C 657.079 1509.41 733.893 1552.32 810.973 1594.75 L 934.71 1663.7 C 944.004 1668.87 980.154 1690 988.191 1693.08 L 988.225 1353 C 988.228 1294.01 989.474 1230.08 987.907 1171.59 C 976.89 1163.81 957.423 1153.68 945.194 1146.84 L 872.994 1106.2 L 611.289 959.167 L 528.781 912.833 C 516.697 906.042 499.311 896.965 487.854 889.733 L 487.912 1413.7 z"
              />
              <path
                fill="currentColor"
                d="M 1028.17 250.4 C 1046.97 249.108 1064.99 251.081 1082.65 257.838 C 1111.36 268.953 1134.53 290.93 1147.16 319.009 C 1159.38 346.418 1159.92 377.619 1148.66 405.438 C 1134.09 442.034 1108.45 459.927 1074.19 474.684 C 1073.52 491.193 1070.6 521.037 1081.36 534.399 C 1089.04 543.934 1106.04 552.599 1116.52 559.949 C 1159.97 590.416 1190.6 639.429 1190.97 693.374 C 1191.13 735.793 1172.92 779.107 1143.09 809.597 C 1112.62 841.125 1070.72 859.028 1026.87 859.255 C 981.891 859.307 938.194 842.448 906.911 810.25 C 850.501 752.19 856.131 688.754 856.082 615.589 C 856.539 598.971 855.587 581.922 856.077 565.547 C 856.44 553.439 861.097 540.253 875.164 542.134 C 880.809 542.889 883.653 544.702 887.974 548.282 C 903.3 560.978 916.345 576.38 930.716 590.132 C 944.086 605.394 963.026 619.187 975.498 635.012 C 1005.13 672.612 965.083 687.789 933.152 684.195 L 933.12 685.133 C 932.257 714.814 936.009 736.609 957.154 759.097 C 975.461 777.894 996.858 787.92 1022.78 788.499 C 1121.27 790.702 1154.8 663.902 1070.85 614.344 C 1057.11 606.235 1038.4 595.842 1027.32 585.003 C 998.783 557.09 1003.98 511.431 1004.26 474.644 C 964.376 455.079 934.268 428.206 927.522 382.339 C 917.648 315.219 962.499 259.887 1028.17 250.4 z M 1049.44 411.948 C 1075.49 407.131 1092.73 382.152 1088 356.088 C 1083.27 330.024 1058.35 312.698 1032.27 317.341 C 1006.07 322.006 988.641 347.071 993.393 373.258 C 998.146 399.445 1023.27 416.788 1049.44 411.948 z"
              />
            </svg>
            <span className="text-sm font-semibold">Hookbin</span>
          </div>
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
                  const shortId = webhook.id;

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
