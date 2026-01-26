import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Dashboard({ onStartPractice }: { onStartPractice: () => void }) {
  const stats = useQuery(api.practice.getStats);
  const nextPractice = useQuery(api.practice.getNextPractice);

  if (stats === undefined || stats === null) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Your Progress</h2>
        <p className="text-gray-400 text-sm">Track your opening mastery</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard value={stats.activeOpenings} label="Active Openings" color="text-primary" />
        <StatCard value={stats.dueForReview} label="Due for Review" color="text-accent" />
        <StatCard value={stats.totalPracticed} label="Total Practiced" color="text-green-400" />
        <StatCard value={`${stats.accuracy}%`} label="Accuracy" color="text-blue-400" />
      </div>

      {stats.activeOpenings === 0 ? (
        <div className="bg-[#1f1e1b] rounded-lg p-5 border border-gray-700/50">
          <p className="text-gray-300 font-medium mb-1">No active openings yet</p>
          <p className="text-gray-500 text-sm">Go to the Openings tab to select openings to practice</p>
        </div>
      ) : stats.dueForReview > 0 ? (
        <div className="bg-[#1f1e1b] rounded-lg p-5 border border-gray-700/50">
          <h3 className="font-medium text-gray-300 mb-3 text-sm uppercase tracking-wide">Next Up</h3>
          {nextPractice && (
            <div className="space-y-4">
              <div>
                <div className="font-semibold text-white">{nextPractice.opening.name}</div>
                <div className="text-sm text-gray-400 mt-0.5">
                  {nextPractice.opening.eco} · {nextPractice.opening.side}
                </div>
              </div>
              <button
                onClick={onStartPractice}
                className="w-full bg-primary text-white font-semibold py-3 rounded hover:bg-primary-hover transition-colors"
              >
                Start Practice
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#1f1e1b] rounded-lg p-5 border border-green-800/30">
          <p className="text-green-400 font-medium mb-1">All caught up!</p>
          <p className="text-gray-500 text-sm">No openings due for review right now</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="bg-[#1f1e1b] rounded-lg p-4 border border-gray-700/50">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
