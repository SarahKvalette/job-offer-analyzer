"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  History,
  LayoutGrid,
  Moon,
  Plus,
  Search,
  Sun,
  User,
} from "lucide-react";
import {
  getHistorySnapshot,
  getHistoryServerSnapshot,
  subscribeToHistory,
} from "@/lib/storage/history";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  group: "navigate" | "actions" | "history";
  label: string;
  hint?: string;
  icon: React.ReactNode;
  onRun: () => void;
};

const GROUP_ORDER: Item["group"][] = ["actions", "navigate", "history"];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const items = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );

  // Global ⌘+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const navigateTo = (path: string) => {
    router.push(path);
    close();
  };

  const triggerProfileDrawer = () => {
    close();
    // The drawer trigger lives in the header — find it by aria-label and click.
    setTimeout(() => {
      const trigger = document.querySelector<HTMLElement>(
        'button[aria-label="Open your profile"]'
      );
      trigger?.click();
    }, 50);
  };

  const triggerHistoryDrawer = () => {
    close();
    setTimeout(() => {
      const trigger = document.querySelector<HTMLElement>(
        'button[aria-label="Open history"]'
      );
      trigger?.click();
    }, 50);
  };

  const allItems: Item[] = useMemo(() => {
    const out: Item[] = [
      {
        id: "new-analysis",
        group: "actions",
        label: t.palette.actions.newAnalysis,
        icon: <Plus className="size-4" />,
        onRun: () => navigateTo("/"),
      },
      {
        id: "open-pipeline",
        group: "navigate",
        label: t.palette.actions.openPipeline,
        icon: <LayoutGrid className="size-4" />,
        onRun: () => navigateTo("/pipeline"),
      },
      {
        id: "open-stats",
        group: "navigate",
        label: t.palette.actions.openStats,
        icon: <ArrowRight className="size-4 opacity-50" />,
        onRun: () => navigateTo("/stats"),
      },
      {
        id: "open-profile",
        group: "navigate",
        label: t.palette.actions.openProfile,
        icon: <User className="size-4" />,
        onRun: triggerProfileDrawer,
      },
      {
        id: "open-history",
        group: "navigate",
        label: t.palette.actions.openHistory,
        icon: <History className="size-4" />,
        onRun: triggerHistoryDrawer,
      },
      {
        id: "toggle-theme",
        group: "actions",
        label: t.palette.actions.toggleTheme,
        icon:
          resolvedTheme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          ),
        onRun: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          close();
        },
      },
      ...items.map(
        (entry): Item => ({
          id: `entry-${entry.id}`,
          group: "history",
          label: entry.analysis.meta.title,
          hint: entry.analysis.meta.company ?? undefined,
          icon: <ArrowRight className="size-4 opacity-50" />,
          onRun: () => navigateTo(`/?id=${entry.id}`),
        })
      ),
    ];
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, resolvedTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.hint ?? "").toLowerCase().includes(q)
    );
  }, [allItems, query]);

  const grouped = useMemo(() => {
    const acc = new Map<Item["group"], Item[]>();
    for (const item of filtered) {
      const list = acc.get(item.group) ?? [];
      list.push(item);
      acc.set(item.group, list);
    }
    return GROUP_ORDER.filter((g) => acc.has(g)).map((g) => ({
      group: g,
      label: t.palette.groups[g],
      items: acc.get(g) ?? [],
    }));
  }, [filtered]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={t.palette.triggerLabel}
            className="gap-2"
          >
            <Search className="size-4" />
            <kbd className="border-foreground/15 bg-foreground/5 hidden items-center gap-0.5 rounded border px-1 font-mono text-[10px] leading-none sm:inline-flex">
              {t.palette.shortcut}
            </kbd>
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-40 bg-black/40 backdrop-blur-sm duration-200" />
        <Dialog.Popup
          className={cn(
            "bg-background ring-border/60 fixed left-1/2 top-[20%] z-50 w-[90vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl shadow-2xl ring-1",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in data-[state=open]:zoom-in-95",
            "data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
            "duration-150"
          )}
        >
          <Dialog.Title className="sr-only">{t.palette.triggerLabel}</Dialog.Title>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="text-muted-foreground size-4" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.palette.placeholder}
              className="placeholder:text-muted-foreground/60 flex-1 bg-transparent py-3.5 text-sm outline-none"
            />
            <kbd className="text-muted-foreground border-border rounded border px-1.5 py-0.5 font-mono text-[10px]">
              ESC
            </kbd>
          </div>
          <ScrollArea className="max-h-[60vh]">
            {grouped.length === 0 ? (
              <p className="text-muted-foreground px-4 py-10 text-center text-sm">
                {t.palette.empty}
              </p>
            ) : (
              <div className="py-1">
                {grouped.map((g) => (
                  <section key={g.group}>
                    <h4 className="text-muted-foreground px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider">
                      {g.label}
                    </h4>
                    <ul className="px-1.5 pb-1.5">
                      {g.items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={item.onRun}
                            className="hover:bg-muted/60 focus:bg-muted/60 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm outline-none"
                          >
                            <span className="text-muted-foreground">
                              {item.icon}
                            </span>
                            <span className="text-foreground flex-1 truncate">
                              {item.label}
                            </span>
                            {item.hint && (
                              <span className="text-muted-foreground truncate text-xs">
                                {item.hint}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </ScrollArea>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
