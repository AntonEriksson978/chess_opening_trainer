import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { ChessBoard } from "./ChessBoard";
import { toast } from "sonner";

export function Practice() {
  const nextPractice = useQuery(api.practice.getNextPractice);
  const submitPractice = useMutation(api.practice.submitPractice);

  const [currentPosition, setCurrentPosition] = useState<string[]>([]);
  const [userMoveIndex, setUserMoveIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [showingResult, setShowingResult] = useState(false);
  const [lastResult, setLastResult] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    if (nextPractice) {
      setCurrentPosition([]);
      setUserMoveIndex(0);
      setStartTime(Date.now());
      setShowingResult(false);
      setLastResult(null);
    }
  }, [nextPractice]);

  if (nextPractice === undefined) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!nextPractice) {
    return (
      <div className="bg-[#1f1e1b] rounded-lg p-6 border border-gray-700/50 text-center">
        <p className="text-gray-300 mb-2">No openings due for practice</p>
        <p className="text-sm text-gray-500">Check back later or add more openings to practice</p>
      </div>
    );
  }

  const { opening, progress, moves, lineName } = nextPractice;
  const practiceUpToIndex = progress.currentMoveIndex;
  const isUserTurn = opening.side === "white" ? currentPosition.length % 2 === 0 : currentPosition.length % 2 === 1;
  const expectedMove = moves[currentPosition.length];

  const handleMove = async (move: string) => {
    if (showingResult) return;

    const newPosition = [...currentPosition, move];
    setCurrentPosition(newPosition);

    if (isUserTurn) {
      const isCorrect = move === expectedMove;
      setLastResult(isCorrect ? "correct" : "incorrect");
      setShowingResult(true);

      const timeSpent = Date.now() - startTime;

      await submitPractice({
        openingId: opening._id,
        lineId: progress.lineId,
        moveIndex: practiceUpToIndex,
        wasCorrect: isCorrect,
        timeSpentMs: timeSpent,
      });

      if (isCorrect) {
        toast.success("Correct!");
      } else {
        toast.error(`Incorrect. Expected: ${expectedMove}`);
      }

      setTimeout(() => {
        setShowingResult(false);
        setLastResult(null);
        setCurrentPosition([]);
        setUserMoveIndex(0);
        setStartTime(Date.now());
      }, 2000);
    } else {
      if (newPosition.length <= practiceUpToIndex) {
        setTimeout(() => {
          const nextMove = moves[newPosition.length];
          if (nextMove) {
            setCurrentPosition([...newPosition, nextMove]);
          }
        }, 500);
      }
    }
  };

  const progressPercent = Math.round((practiceUpToIndex / moves.length) * 100);

  return (
    <div className="space-y-4">
      {/* Opening info header */}
      <div className="bg-[#1f1e1b] rounded-lg p-4 border border-gray-700/50">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-white">{opening.name}</h3>
            <p className="text-sm text-gray-400">
              {opening.eco} · Playing as {opening.side}
              {lineName && <span className="text-primary"> · {lineName}</span>}
            </p>
          </div>
          <span className="px-2.5 py-1 bg-gray-700/50 text-gray-300 text-xs font-medium rounded">
            {opening.difficulty}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Line progress</span>
            <span className="font-medium text-gray-300">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chess board */}
      <div className="bg-[#1f1e1b] rounded-lg p-4 border border-gray-700/50">
        <ChessBoard
          position={currentPosition}
          onMove={handleMove}
          userSide={opening.side}
          disabled={!isUserTurn || showingResult}
          highlightResult={lastResult}
        />
      </div>

      {/* Move sequence */}
      <div className="bg-[#1f1e1b] rounded-lg p-4 border border-gray-700/50">
        <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Move Sequence</h4>
        <div className="flex flex-wrap gap-1.5">
          {moves.slice(0, practiceUpToIndex + 1).map((move, idx) => (
            <span
              key={idx}
              className={`px-2 py-1 rounded text-sm font-mono ${
                idx < currentPosition.length
                  ? "bg-green-900/40 text-green-400"
                  : idx === currentPosition.length && isUserTurn
                  ? "bg-primary/20 text-primary ring-1 ring-primary"
                  : "bg-gray-700/50 text-gray-400"
              }`}
            >
              {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}.` : ""} {move}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
