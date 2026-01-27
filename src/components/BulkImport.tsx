import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

type Props = {
  onClose: () => void;
};

const EXAMPLE_FORMAT = `Name: Italian Game - Giuoco Piano
ECO: C54
Side: white
Difficulty: beginner
Description: Classical Italian with c3 and d4
Moves: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4

Line: Evans Gambit
Moves: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5

Line: Giuoco Pianissimo
Moves: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6 5. c3

---

Name: Sicilian Defense - Dragon
ECO: B70
Side: black
Difficulty: intermediate
Description: Aggressive defense with fianchettoed bishop
Moves: 1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6`;

export function BulkImport({ onClose }: Props) {
  const bulkImport = useMutation(api.openings.bulkImport);
  const [text, setText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!text.trim()) {
      toast.error("Please enter some openings to import");
      return;
    }

    setIsImporting(true);
    try {
      const result = await bulkImport({ text });
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} opening(s)`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} error(s) during import`);
        console.error("Import errors:", result.errors);
      }
      if (result.imported > 0) {
        onClose();
      }
    } catch (error) {
      toast.error("Failed to import openings");
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadExample = () => {
    setText(EXAMPLE_FORMAT);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1e1b] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700/50">
        <div className="sticky top-0 bg-[#1f1e1b] border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Bulk Import Openings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-[#171614] rounded-lg p-4 border border-gray-700/50">
            <h3 className="text-sm font-semibold text-white mb-2">
              Import Format
            </h3>
            <div className="text-sm text-gray-400 space-y-2">
              <p>Each opening should include:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>
                  <code className="text-primary">Name:</code> Opening name
                  (required)
                </li>
                <li>
                  <code className="text-primary">ECO:</code> ECO code (optional)
                </li>
                <li>
                  <code className="text-primary">Side:</code> white or black
                  (default: white)
                </li>
                <li>
                  <code className="text-primary">Difficulty:</code> beginner,
                  intermediate, or advanced
                </li>
                <li>
                  <code className="text-primary">Description:</code> Brief
                  description (optional)
                </li>
                <li>
                  <code className="text-primary">Moves:</code> Move sequence in
                  algebraic notation (required)
                </li>
              </ul>
              <p className="mt-3">
                Add variations with{" "}
                <code className="text-primary">Line: Name</code> followed by{" "}
                <code className="text-primary">Moves:</code>
              </p>
              <p>
                Separate multiple openings with{" "}
                <code className="text-primary">---</code>
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Paste your openings here
              </label>
              <button
                onClick={handleLoadExample}
                className="text-sm text-primary hover:text-primary-hover"
              >
                Load example
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 bg-[#171614] border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-500 font-mono text-sm"
              rows={16}
              placeholder={`Name: Italian Game
ECO: C50
Side: white
Difficulty: beginner
Description: A classical opening
Moves: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5

Line: Two Knights Defense
Moves: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6

---

Name: Next opening...`}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1f1e1b] border-t border-gray-700/50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium disabled:opacity-50"
          >
            {isImporting ? "Importing..." : "Import Openings"}
          </button>
        </div>
      </div>
    </div>
  );
}
