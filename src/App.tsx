import { useState } from "react";
import { Feed } from "./components/Feed";
import { Onboarding } from "./components/Onboarding";
import { PetView } from "./components/PetView";
import { ProgressView } from "./components/ProgressView";
import { SettingsView } from "./components/SettingsView";
import { useStore } from "./store";

type Tab = "feed" | "pet" | "progress" | "settings";

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: "feed", icon: "🧠", label: "Matte" },
  { key: "pet", icon: "🐾", label: "Dyret" },
  { key: "progress", icon: "📊", label: "Fremgang" },
  { key: "settings", icon: "⚙️", label: "Voksne" },
];

export function App() {
  const hasProfile = useStore((s) => s.profile !== null);
  // Main is only mounted with a profile, so after onboarding (also after "Start på nytt")
  // the tabs start fresh on "Matte".
  return hasProfile ? <Main /> : <Onboarding />;
}

function Main() {
  const grade = useStore((s) => s.profile?.grade);
  const [tab, setTab] = useState<Tab>("feed");

  return (
    <div className="app">
      <main className="content">
        {tab === "feed" && <Feed key={grade} onOpenPet={() => setTab("pet")} />}
        {tab === "pet" && <PetView />}
        {tab === "progress" && <ProgressView />}
        {tab === "settings" && <SettingsView />}
      </main>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

