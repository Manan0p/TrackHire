"use client";

import { useState, useEffect, useCallback } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, ColumnDef, SortingState, Column } from "@tanstack/react-table";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { SourceBadge } from "@/components/applications/SourceBadge";
import { CompanyLogo } from "@/components/applications/CompanyLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ArrowUpDown, ChevronUp, ChevronDown, Search } from "lucide-react";
import { formatDate, daysSince, getDaysLabel, getDaysColor, cn } from "@/lib/utils";
import { EVENT_TYPE_LABELS } from "@/types";
import { toast } from "sonner";
import type { ApplicationWithRelations } from "@/types";

export default function ListView() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/applications?limit=200");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const columns: ColumnDef<ApplicationWithRelations>[] = [
    {
      id: "company",
      header: ({ column }) => (
        <SortHeader column={column} label="Company" />
      ),
      accessorFn: (row) => row.company,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CompanyLogo company={row.original.company} size={24} />
          <span className="font-medium text-[13px]">{row.original.company}</span>
        </div>
      ),
    },
    {
      id: "role",
      accessorFn: (row) => row.role,
      header: ({ column }) => <SortHeader column={column} label="Role" />,
      cell: ({ row }) => <span className="text-[13px]">{row.original.role}</span>,
    },
    {
      id: "source",
      header: "Source",
      cell: ({ row }) => <SourceBadge source={row.original.source} size="sm" />,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: "appliedAt",
      accessorFn: (row) => row.appliedAt,
      header: ({ column }) => <SortHeader column={column} label="Applied" />,
      cell: ({ row }) => (
        <span className="text-[12px] text-[var(--text-muted)]">
          {formatDate(row.original.appliedAt)}
        </span>
      ),
    },
    {
      id: "days",
      accessorFn: (row) => daysSince(row.appliedAt || row.createdAt),
      header: ({ column }) => <SortHeader column={column} label="Age" />,
      cell: ({ row }) => {
        const d = daysSince(row.original.appliedAt || row.original.createdAt);
        return (
          <span className={cn("text-[12px] font-medium", getDaysColor(d))}>
            {getDaysLabel(d)}
          </span>
        );
      },
    },
    {
      id: "nextEvent",
      header: "Next Event",
      cell: ({ row }) => {
        const evt = row.original.events[0];
        return evt ? (
          <span className="text-[11px] text-[var(--text-muted)]">
            {EVENT_TYPE_LABELS[evt.type]} · {new Date(evt.scheduledAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          </span>
        ) : (
          <span className="text-[11px] text-[var(--text-subtle)]">—</span>
        );
      },
    },
    {
      id: "matchScore",
      accessorFn: (row) => row.matchScore,
      header: ({ column }) => <SortHeader column={column} label="Match" />,
      cell: ({ row }) => {
        const s = row.original.matchScore;
        if (s === null || s === undefined) return <span className="text-[11px] text-[var(--text-subtle)]">—</span>;
        const color = s >= 80 ? "#10B981" : s >= 60 ? "#F59E0B" : "#F43F5E";
        return (
          <span className="text-[12px] font-bold" style={{ color }}>
            {s}%
          </span>
        );
      },
    },
  ];

  const table = useReactTable({
    data: applications,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleGmailSync = async () => {
    toast.promise(
      fetch("/api/integrations/gmail/sync", { method: "POST" }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Sync failed");
        }
        return res.json();
      }),
      {
        loading: "Syncing Gmail inbox...",
        success: (data) => {
          void fetchApplications();
          return `Synced ${data.synced} threads — found ${data.detected.length} job-related emails`;
        },
        error: (err: Error) => err.message || "Gmail sync failed",
      }
    );
  };

  const handleExportCSV = () => {
    const headers = ["Company", "Role", "Source", "Status", "Applied At", "Match Score"];
    const rows = table.getFilteredRowModel().rows.map((r) => [
      r.original.company,
      r.original.role,
      r.original.source,
      r.original.status,
      r.original.appliedAt ? formatDate(r.original.appliedAt) : "",
      r.original.matchScore ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trackhire-applications.csv";
    a.click();
    toast.success("Exported CSV");
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Top Bar */}
      <header className="flex justify-between items-center px-6 h-14 bg-white border-b border-[var(--border)] shrink-0 z-10 w-full sticky top-0 gap-4">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">Applications</p>
          <h2 className="text-[16px] font-bold text-[var(--foreground)] leading-none">List View</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search..."
              className="h-8 pl-8 text-[13px] w-44 bg-[var(--surface-container-low)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 bg-white text-[13px] hover:bg-slate-50 border-[var(--border)] px-3"
            onClick={handleGmailSync}
          >
            Sync Gmail
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 bg-white text-[13px] hover:bg-slate-50 border-[var(--border)] px-3"
            onClick={handleExportCSV}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </header>

      <div className="flex-grow overflow-auto px-6 py-5">
        <div className="max-w-[1400px] mx-auto flex flex-col h-full gap-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm flex flex-col overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="bg-[var(--surface-container-low)]/50 border-b border-[var(--border)]">
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} className="text-[12px] font-semibold text-[var(--text-muted)] h-9 px-4">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12 text-[var(--text-muted)] text-[13px]">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-[var(--surface-container-low)]/50 transition-colors border-b border-[var(--border)]/40"
                      onClick={() => {
                        setSelectedApp(row.original);
                        setDetailOpen(true);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2.5 px-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        </div>
      </div>

      <ApplicationDetail
        application={selectedApp}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={(updated) => {
          setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setSelectedApp(updated);
        }}
      />
    </div>
  );
}

function SortHeader({
  column,
  label,
}: {
  column: Column<ApplicationWithRelations, unknown>;
  label: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ChevronUp className="w-3 h-3" />
      ) : sorted === "desc" ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
}
