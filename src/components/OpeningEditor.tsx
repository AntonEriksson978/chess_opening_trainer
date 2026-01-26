import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

type Props = {
  openingId?: Id<"openings">;
  onClose: () => void;
};

export function OpeningEditor({ openingId, onClose }: Props) {
  const opening = useQuery(
    api.openings.getOpening,
    openingId ? { openingId } : "skip"
  );
  const createOpening = useMutation(api.openings.createOpening);
  const updateOpening = useMutation(api.openings.updateOpening);
  const deleteOpening = useMutation(api.openings.deleteOpening);
  const addLine = useMutation(api.openings.addLine);
  const updateLine = useMutation(api.openings.updateLine);
  const deleteLine = useMutation(api.openings.deleteLine);

  const [name, setName] = useState("");
  const [eco, setEco] = useState("");
  const [description, setDescription] = useState("");
  const [side, setSide] = useState<"white" | "black">("white");
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [movesText, setMovesText] = useState("");
  const [lines, setLines] = useState<
    Array<{ id?: Id<"lines">; name: string; moves: string; isNew?: boolean }>
  >([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (opening) {
      setName(opening.name);
      setEco(opening.eco);
      setDescription(opening.description);
      setSide(opening.side);
      setDifficulty(opening.difficulty);
      setMovesText(opening.moves.join(" "));
      setLines(
        opening.lines.map((l) => ({
          id: l._id,
          name: l.name,
          moves: l.moves.join(" "),
        }))
      );
    }
  }, [opening]);

  const parseMoves = (text: string): string[] => {
    return text
      .replace(/\d+\./g, "") // Remove move numbers
      .split(/\s+/)
      .filter((m) => m.trim().length > 0);
  };

  const handleSave = async () => {
    const moves = parseMoves(movesText);
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (moves.length === 0) {
      toast.error("At least one move is required");
      return;
    }

    try {
      if (openingId) {
        // Update existing opening
        await updateOpening({
          openingId,
          name,
          eco,
          description,
          side,
          difficulty,
          moves,
        });

        // Handle lines
        for (const line of lines) {
          const lineMoves = parseMoves(line.moves);
          if (line.id && !line.isNew) {
            // Update existing line
            await updateLine({
              lineId: line.id,
              name: line.name,
              moves: lineMoves,
            });
          } else if (line.isNew && lineMoves.length > 0) {
            // Add new line
            await addLine({
              openingId,
              name: line.name || "Variation",
              moves: lineMoves,
            });
          }
        }

        toast.success("Opening updated");
      } else {
        // Create new opening
        await createOpening({
          name,
          eco,
          description,
          side,
          difficulty,
          moves,
        });
        toast.success("Opening created");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save opening");
    }
  };

  const handleDelete = async () => {
    if (!openingId) return;
    try {
      await deleteOpening({ openingId });
      toast.success("Opening deleted");
      onClose();
    } catch (error) {
      toast.error("Failed to delete opening");
    }
  };

  const handleDeleteLine = async (index: number) => {
    const line = lines[index];
    if (line.id && !line.isNew) {
      try {
        await deleteLine({ lineId: line.id });
        toast.success("Line deleted");
      } catch (error) {
        toast.error("Failed to delete line");
        return;
      }
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleAddLine = () => {
    setLines([...lines, { name: "", moves: "", isNew: true }]);
  };

  const updateLineField = (
    index: number,
    field: "name" | "moves",
    value: string
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  if (openingId && opening === undefined) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-[#1f1e1b] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1e1b] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700/50">
        <div className="sticky top-0 bg-[#1f1e1b] border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {openingId ? "Edit Opening" : "New Opening"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#171614] border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-500"
                placeholder="e.g., Italian Game"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                ECO Code
              </label>
              <input
                type="text"
                value={eco}
                onChange={(e) => setEco(e.target.value)}
                className="w-full px-3 py-2 bg-[#171614] border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-500"
                placeholder="e.g., C50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#171614] border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-500"
              rows={2}
              placeholder="Brief description of the opening"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Side
              </label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as "white" | "black")}
                className="w-full px-3 py-2 bg-[#171614] border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white"
              >
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value as "beginner" | "intermediate" | "advanced"
                  )
                }
                className="w-full px-3 py-2 bg-[#171614] border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Main Line Moves *
            </label>
            <textarea
              value={movesText}
              onChange={(e) => setMovesText(e.target.value)}
              className="w-full px-3 py-2 bg-[#171614] border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-500 font-mono text-sm"
              rows={3}
              placeholder="e.g., 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter moves in algebraic notation. Move numbers are optional.
            </p>
          </div>

          <div className="border-t border-gray-700/50 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">
                Additional Lines / Variations
              </h3>
              <button
                onClick={handleAddLine}
                className="text-sm text-primary hover:text-primary-hover font-medium"
              >
                + Add Line
              </button>
            </div>

            {lines.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No additional lines. Click "Add Line" to add variations.
              </p>
            ) : (
              <div className="space-y-4">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="border border-gray-700/50 rounded-lg p-4 bg-[#171614]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={line.name}
                        onChange={(e) =>
                          updateLineField(index, "name", e.target.value)
                        }
                        className="flex-1 px-2 py-1 bg-[#1f1e1b] border border-gray-700 rounded focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-500 text-sm"
                        placeholder="Line name (e.g., Main Line, Variation 1)"
                      />
                      <button
                        onClick={() => handleDeleteLine(index)}
                        className="ml-2 text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <textarea
                      value={line.moves}
                      onChange={(e) =>
                        updateLineField(index, "moves", e.target.value)
                      }
                      className="w-full px-2 py-1 bg-[#1f1e1b] border border-gray-700 rounded focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-500 font-mono text-sm"
                      rows={2}
                      placeholder="e.g., 1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1f1e1b] border-t border-gray-700/50 px-6 py-4 flex items-center justify-between">
          {openingId ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-red-400 hover:text-red-300 font-medium"
            >
              Delete Opening
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium"
            >
              {openingId ? "Save Changes" : "Create Opening"}
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1f1e1b] rounded-xl p-6 max-w-sm border border-gray-700/50">
              <h3 className="font-bold text-white mb-2">Delete Opening?</h3>
              <p className="text-gray-400 mb-4">
                This will permanently delete this opening and all its lines.
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
