"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutGrid,
  List,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

interface CommandPaletteProps {
  onAddApplication?: () => void;
  onGmailSync?: () => void;
}

export function CommandPalette({ onAddApplication, onGmailSync }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search applications, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              onAddApplication?.();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add application
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              onGmailSync?.();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Gmail
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => navigate("/board")}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Go to Board
          </CommandItem>
          <CommandItem onSelect={() => navigate("/list")}>
            <List className="mr-2 h-4 w-4" />
            Go to List
          </CommandItem>
          <CommandItem onSelect={() => navigate("/calendar")}>
            <Calendar className="mr-2 h-4 w-4" />
            Go to Calendar
          </CommandItem>
          <CommandItem onSelect={() => navigate("/analytics")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Go to Analytics
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Go to Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
