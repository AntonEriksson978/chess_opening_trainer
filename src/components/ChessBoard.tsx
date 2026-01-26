import { useState } from "react";

interface ChessBoardProps {
  position: string[];
  onMove: (move: string) => void;
  userSide: "white" | "black";
  disabled?: boolean;
  highlightResult?: "correct" | "incorrect" | null;
}

export function ChessBoard({ position, onMove, userSide, disabled, highlightResult }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Initialize board with starting position
  const initialBoard: Record<string, string> = {
    a1: "R", b1: "N", c1: "B", d1: "Q", e1: "K", f1: "B", g1: "N", h1: "R",
    a2: "P", b2: "P", c2: "P", d2: "P", e2: "P", f2: "P", g2: "P", h2: "P",
    a7: "p", b7: "p", c7: "p", d7: "p", e7: "p", f7: "p", g7: "p", h7: "p",
    a8: "r", b8: "n", c8: "b", d8: "q", e8: "k", f8: "b", g8: "n", h8: "r",
  };

  // SVG piece components (Lichess-style)
  const pieces: Record<string, string> = {
    // White pieces
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    // Black pieces
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  };

  // Apply moves to get current board state
  const board = { ...initialBoard };

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = userSide === "white" ? ["8", "7", "6", "5", "4", "3", "2", "1"] : ["1", "2", "3", "4", "5", "6", "7", "8"];
  const displayFiles = userSide === "white" ? files : [...files].reverse();

  const handleSquareClick = (square: string) => {
    if (disabled) return;

    if (selectedSquare) {
      const move = `${selectedSquare}${square}`;
      onMove(move);
      setSelectedSquare(null);
    } else if (board[square]) {
      setSelectedSquare(square);
    }
  };

  const isWhitePiece = (piece: string) => piece === piece.toUpperCase();

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
                        ${!disabled && piece ? "cursor-pointer" : ""}
                        ${disabled ? "cursor-default" : ""}
                      `}
                    >
                      {piece && (
                        <span
                          className={`
                            text-[min(10vw,3.5rem)] leading-none select-none
                            ${isWhitePiece(piece)
                              ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                              : "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]"
                            }
                          `}
                          style={{
                            textShadow: isWhitePiece(piece)
                              ? '0 0 2px #000, 0 0 2px #000'
                              : '0 0 1px rgba(255,255,255,0.5)'
                          }}
                        >
                          {pieces[piece]}
                        </span>
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
