import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { Practice } from "./components/Practice";
import { OpeningsList } from "./components/OpeningsList";
import { useState, useEffect } from "react";

export default function App() {
  const [view, setView] = useState<"dashboard" | "practice" | "openings">("dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-[#161512]">
      {/* Dark header like Lichess */}
      <header className="sticky top-0 z-10 bg-header border-b border-gray-700/50">
        <div className="max-w-5xl mx-auto px-4 h-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 22H5v-2h14v2M17.16 8.26A4.96 4.96 0 0 0 12 4c-2.76 0-5 2.24-5 5 0 1.63.78 3.07 2 3.97V17h6v-4.03c1.22-.9 2-2.34 2-3.97 0-.24-.02-.48-.06-.71-.26-.89-.85-1.64-1.78-2.03M12 2a1 1 0 0 1 1 1v1h-2V3a1 1 0 0 1 1-1z"/>
            </svg>
            <h2 className="text-base font-semibold text-white tracking-tight">Opening Trainer</h2>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 pb-16">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Content view={view} setView={setView} />
        </div>
      </main>

      <Authenticated>
        {/* Bottom navigation - cleaner design */}
        <nav className="fixed bottom-0 left-0 right-0 bg-header border-t border-gray-700/50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex justify-around items-center">
            <NavButton
              active={view === "dashboard"}
              onClick={() => setView("dashboard")}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              label="Dashboard"
            />
            <NavButton
              active={view === "practice"}
              onClick={() => setView("practice")}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Practice"
            />
            <NavButton
              active={view === "openings"}
              onClick={() => setView("openings")}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              label="Openings"
            />
          </div>
        </nav>
      </Authenticated>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: '#262421',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-5 py-2 rounded-lg transition-colors ${
        active
          ? "text-primary"
          : "text-gray-400 hover:text-gray-200"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function Content({ view, setView }: { view: string; setView: (v: "dashboard" | "practice" | "openings") => void }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const seedOpenings = useMutation(api.openings.seedOpenings);

  useEffect(() => {
    if (loggedInUser) {
      seedOpenings().catch(() => {});
    }
  }, [loggedInUser, seedOpenings]);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Unauthenticated>
        <div className="flex flex-col gap-8 items-center py-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 22H5v-2h14v2M17.16 8.26A4.96 4.96 0 0 0 12 4c-2.76 0-5 2.24-5 5 0 1.63.78 3.07 2 3.97V17h6v-4.03c1.22-.9 2-2.34 2-3.97 0-.24-.02-.48-.06-.71-.26-.89-.85-1.64-1.78-2.03M12 2a1 1 0 0 1 1 1v1h-2V3a1 1 0 0 1 1-1z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Chess Opening Trainer</h1>
            <p className="text-lg text-gray-400">Master chess openings with spaced repetition</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {view === "dashboard" && <Dashboard onStartPractice={() => setView("practice")} />}
        {view === "practice" && <Practice />}
        {view === "openings" && <OpeningsList />}
      </Authenticated>
    </>
  );
}
