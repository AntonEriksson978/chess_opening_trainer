import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { OpeningEditor } from "./OpeningEditor";
import { BulkImport } from "./BulkImport";

export function OpeningsList() {
  const openings = useQuery(api.openings.listAll);
  const toggleActive = useMutation(api.openings.toggleActive);
  const [editingOpeningId, setEditingOpeningId] = useState<
    Id<"openings"> | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [expandedOpenings, setExpandedOpenings] = useState<Set<string>>(
    new Set()
  );

  if (openings === undefined) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleToggle = async (
    openingId: Id<"openings">,
    lineId?: Id<"lines">
  ) => {
    try {
      await toggleActive({ openingId, lineId });
      toast.success("Updated");
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const toggleExpanded = (openingId: string) => {
    setExpandedOpenings((prev) => {
      const next = new Set(prev);
      if (next.has(openingId)) {
        next.delete(openingId);
      } else {
        next.add(openingId);
      }
      return next;
    });
  };

  const groupedOpenings = {
    beginner: openings.filter((o) => o.difficulty === "beginner"),
    intermediate: openings.filter((o) => o.difficulty === "intermediate"),
    advanced: openings.filter((o) => o.difficulty === "advanced"),
  };

  const difficultyLabels = {
    beginner: { label: "Beginner", color: "text-green-400" },
    intermediate: { label: "Intermediate", color: "text-yellow-400" },
    advanced: { label: "Advanced", color: "text-red-400" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">
            Opening Library
          </h2>
          <p className="text-gray-400 text-sm">Select openings to practice</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkImporting(true)}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 text-sm"
          >
            Bulk Import
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium text-sm"
          >
            + New Opening
          </button>
        </div>
      </div>

      {(["beginner", "intermediate", "advanced"] as const).map((difficulty) => (
        <div key={difficulty}>
          <h3
            className={`text-sm font-medium mb-3 uppercase tracking-wide ${difficultyLabels[difficulty].color}`}
          >
            {difficultyLabels[difficulty].label}
          </h3>
          <div className="space-y-2">
            {groupedOpenings[difficulty].map((opening) => {
              const progress =
                (opening.currentMoveIndex / opening.totalMoves) * 100;
              const isExpanded = expandedOpenings.has(opening._id);
              const hasLines = opening.lines.length > 0;

              return (
                <div
                  key={opening._id}
                  className="bg-[#1f1e1b] rounded-lg border border-gray-700/50 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white truncate">
                            {opening.name}
                          </h4>
                          <span className="text-xs text-gray-500 font-mono shrink-0">
                            {opening.eco}
                          </span>
                          {opening.isUserCreated && (
                            <span className="text-xs bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                          {opening.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="capitalize">{opening.side}</span>
                          <span>·</span>
                          <span>{opening.totalMoves} moves</span>
                          {hasLines && (
                            <>
                              <span>·</span>
                              <span>{opening.lines.length} variations</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setEditingOpeningId(opening._id)}
                          className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(opening._id)}
                          className={`
                            px-3 py-1.5 rounded font-medium text-sm transition-colors
                            ${
                              opening.isActive
                                ? "bg-primary text-white hover:bg-primary-hover"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }
                          `}
                        >
                          {opening.isActive ? "Active" : "Add"}
                        </button>
                      </div>
                    </div>

                    {opening.isActive && opening.currentMoveIndex > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700/50">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Main Line Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-primary h-1 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {hasLines && (
                      <button
                        onClick={() => toggleExpanded(opening._id)}
                        className="mt-3 text-sm text-primary hover:text-primary-hover flex items-center gap-1"
                      >
                        {isExpanded ? "Hide" : "Show"} variations
                        <span
                          className={`transition-transform text-xs ${isExpanded ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </button>
                    )}
                  </div>

                  {isExpanded && hasLines && (
                    <div className="border-t border-gray-700/50 bg-[#171614] p-3 space-y-2">
                      {opening.lines.map((line) => {
                        const lineProgress =
                          (line.currentMoveIndex / line.totalMoves) * 100;
                        return (
                          <div
                            key={line._id}
                            className="flex items-center justify-between p-3 bg-[#1f1e1b] rounded-lg border border-gray-700/50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm truncate">
                                  {line.name}
                                </span>
                                <span className="text-xs text-gray-500 shrink-0">
                                  {line.totalMoves} moves
                                </span>
                              </div>
                              {line.isActive && line.currentMoveIndex > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 bg-gray-700 rounded-full h-1">
                                    <div
                                      className="bg-green-500 h-1 rounded-full"
                                      style={{ width: `${lineProgress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(lineProgress)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleToggle(opening._id, line._id)
                              }
                              className={`
                                px-3 py-1.5 rounded font-medium text-xs transition-colors ml-3 shrink-0
                                ${
                                  line.isActive
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }
                              `}
                            >
                              {line.isActive ? "Active" : "Add"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {(editingOpeningId || isCreating) && (
        <OpeningEditor
          openingId={editingOpeningId ?? undefined}
          onClose={() => {
            setEditingOpeningId(null);
            setIsCreating(false);
          }}
        />
      )}

      {isBulkImporting && (
        <BulkImport onClose={() => setIsBulkImporting(false)} />
      )}
    </div>
  );
}
