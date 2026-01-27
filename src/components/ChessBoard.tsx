import { useState, useMemo } from "react";
import { getGameFromMoves, getBoardState, tryMove, getLegalMoves } from "../lib/chess";

interface ChessBoardProps {
  position: string[];
  onMove: (move: string) => void;
  userSide: "white" | "black";
  disabled?: boolean;
  highlightResult?: "correct" | "incorrect" | null;
}

export function ChessBoard({ position, onMove, userSide, disabled, highlightResult }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Build game state from move list
  const game = useMemo(() => getGameFromMoves(position), [position]);
  const board = useMemo(() => getBoardState(game), [game]);

  // Get available moves for selected piece
  const availableMoves = useMemo(() => {
    if (!selectedSquare) return new Set<string>();
    return new Set(getLegalMoves(game, selectedSquare));
  }, [selectedSquare, game]);

  // SVG piece paths (Lichess cburnett set)
  const pieceToSvg: Record<string, string> = {
    K: "/pieces/wK.svg", Q: "/pieces/wQ.svg", R: "/pieces/wR.svg",
    B: "/pieces/wB.svg", N: "/pieces/wN.svg", P: "/pieces/wP.svg",
    k: "/pieces/bK.svg", q: "/pieces/bQ.svg", r: "/pieces/bR.svg",
    b: "/pieces/bB.svg", n: "/pieces/bN.svg", p: "/pieces/bP.svg",
  };

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = userSide === "white" ? ["8", "7", "6", "5", "4", "3", "2", "1"] : ["1", "2", "3", "4", "5", "6", "7", "8"];
  const displayFiles = userSide === "white" ? files : [...files].reverse();

  const handleSquareClick = (square: string) => {
    if (disabled) return;

    if (selectedSquare) {
      const san = tryMove(game, selectedSquare, square);
      if (san) {
        onMove(san);
      }
      setSelectedSquare(null);
    } else if (board[square]) {
      setSelectedSquare(square);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded overflow-hidden shadow-md transition-all ${
          highlightResult === "correct" ? "ring-4 ring-green-500" :
          highlightResult === "incorrect" ? "ring-4 ring-red-500" : ""
        }`}
      >
        {/* Board with coordinates */}
        <div className="relative">
          {/* Rank labels (left side) */}
          <div className="absolute left-0 top-0 bottom-0 w-5 flex flex-col z-10">
            {ranks.map((rank) => (
              <div
                key={rank}
                className="flex-1 flex items-center justify-center text-[10px] font-medium text-board-dark select-none"
              >
                {rank}
              </div>
            ))}
          </div>

          {/* File labels (bottom) */}
          <div className="absolute left-5 right-0 bottom-0 h-4 flex z-10">
            {displayFiles.map((file) => (
              <div
                key={file}
                className="flex-1 flex items-center justify-center text-[10px] font-medium text-board-dark select-none"
              >
                {file}
              </div>
            ))}
          </div>

          {/* Chess board */}
          <div className="ml-5 mb-4">
            <div className="grid grid-cols-8 aspect-square">
              {ranks.map((rank) =>
                displayFiles.map((file) => {
                  const square = `${file}${rank}`;
                  const isLight = (files.indexOf(file) + parseInt(rank)) % 2 === 0;
                  const piece = board[square];
                  const isSelected = selectedSquare === square;
                  const isAvailableMove = availableMoves.has(square);
                  const isCapture = isAvailableMove && piece;

                  return (
                    <button
                      key={square}
                      onClick={() => handleSquareClick(square)}
                      disabled={disabled}
                      className={`
                        aspect-square flex items-center justify-center relative
                        transition-colors
                        ${isLight ? "bg-board-light" : "bg-board-dark"}
                        ${isSelected ? "bg-board-selected" : ""}
                        ${!disabled && (piece || isAvailableMove) ? "cursor-pointer" : ""}
                        ${disabled ? "cursor-default" : ""}
                      `}
                    >
                      {piece && (
                        <img
                          src={pieceToSvg[piece]}
                          alt={piece}
                          className="w-[85%] h-[85%] select-none pointer-events-none"
                          draggable={false}
                        />
                      )}
                      {isAvailableMove && !piece && (
                        <div className="absolute w-[30%] h-[30%] rounded-full bg-black/20" />
                      )}
                      {isCapture && (
                        <div className="absolute inset-0 rounded-full border-[3px] border-black/20 m-[5%]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        {disabled ? (
          <span>Waiting...</span>
        ) : (
          <span className="font-medium text-gray-700">Your move</span>
        )}
      </div>
    </div>
  );
}
