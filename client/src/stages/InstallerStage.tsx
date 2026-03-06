import { useState, useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, shuffleArray } from "../utils/random.ts";

type WizardStep = {
  title: string;
  body: string;
  /** Which button is the correct action: "next" | "decline" | "accept" */
  correct: "next" | "decline" | "accept";
  /** If true this is a bloatware offer that must be declined */
  isTrap: boolean;
};

const PROGRAM_NAMES = [
  "SuperTools Pro",
  "QuickEdit 2024",
  "FileSync Ultra",
  "MediaView Plus",
  "DeskHelper 3.0",
  "NetBoost Suite",
];

const TRAP_OFFERS: { title: string; body: string }[] = [
  {
    title: "Install WebBar Toolbar",
    body: "Enhance your browser with WebBar Toolbar! Get quick access to search, weather, and deals directly from your browser toolbar.",
  },
  {
    title: "McShield Antivirus Trial",
    body: "Protect your PC with McShield Antivirus! Start your 30-day free trial now. After the trial, a subscription fee of $9.99/month applies.",
  },
  {
    title: "BrowseBoost Addon",
    body: "Install BrowseBoost to speed up your browsing experience! This addon optimizes your homepage and default search provider.",
  },
  {
    title: "SearchHelper Extension",
    body: "Make SearchHelper your default search engine and homepage for quick, convenient web searches!",
  },
  {
    title: "PC Optimizer Pro",
    body: "Your computer may be running slow! Install PC Optimizer Pro to clean up your registry and boost performance.",
  },
  {
    title: "CloudSync Backup",
    body: "Never lose a file again! Install CloudSync Backup to automatically upload all your documents to our cloud servers.",
  },
  {
    title: "GameBooster Plugin",
    body: "Install GameBooster to optimize your system for gaming! Also installs recommended partner applications.",
  },
  {
    title: "ShopSaver Browser Extension",
    body: "Save money while you shop! ShopSaver automatically finds coupon codes and tracks your browsing for the best deals.",
  },
];

const INSTALL_PATHS = [
  "C:\\Program Files\\",
  "C:\\Program Files (x86)\\",
  "D:\\Software\\",
];

const LEGIT_STEPS: { title: string; body: string }[] = [
  {
    title: "Select Installation Path",
    body: "Choose where to install the program:",
  },
  {
    title: "Start Menu Entry",
    body: "Create a Start Menu shortcut for easy access to the program.",
  },
  {
    title: "Program Features",
    body: "The following components will be installed:\n- Core Application\n- Documentation\n- Language Packs",
  },
  {
    title: "Desktop Shortcut",
    body: "Create a desktop shortcut to launch the program quickly.",
  },
  {
    title: "File Associations",
    body: "Associate supported file types with this program for quick opening.",
  },
];

type FooterButton = {
  action: "decline" | "next" | "accept";
  label: string;
};

type ButtonPair = [FooterButton, FooterButton];

const FIXED_SLOTS = [15, 60] as const;

function makeButtonPair(step: WizardStep, rand: () => number): ButtonPair {
  const decline: FooterButton = { action: "decline", label: "Decline" };
  const positive: FooterButton =
    step.correct === "accept" || step.isTrap
      ? { action: "accept", label: "Accept" }
      : { action: "next", label: "Next >" };
  return shuffleArray([decline, positive], rand) as ButtonPair;
}

function makeSteps(difficulty: number, rand: () => number): WizardStep[] {
  const steps: WizardStep[] = [];

  // Welcome step
  steps.push({
    title: "Welcome",
    body: "Welcome to the Setup Wizard. This wizard will guide you through the installation. Click Next to continue.",
    correct: "next",
    isTrap: false,
  });

  // License agreement (always accept)
  steps.push({
    title: "License Agreement",
    body: "Please read the following license agreement carefully.\n\nTHIS SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND... By clicking Accept you agree to the terms.",
    correct: "accept",
    isTrap: false,
  });

  // Shuffle and pick legit steps (1-2 based on difficulty)
  const legitPool = shuffleArray([...LEGIT_STEPS], rand);
  const legitCount = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < legitCount && i < legitPool.length; i++) {
    steps.push({
      title: legitPool[i]!.title,
      body: legitPool[i]!.body,
      correct: "next",
      isTrap: false,
    });
  }

  // Trap offers: 1 at difficulty 1, up to 5 at difficulty 5
  const trapCount = Math.min(difficulty, TRAP_OFFERS.length);
  const trapPool = shuffleArray([...TRAP_OFFERS], rand);
  for (let i = 0; i < trapCount; i++) {
    steps.push({
      title: trapPool[i]!.title,
      body: trapPool[i]!.body,
      correct: "decline",
      isTrap: true,
    });
  }

  // Shuffle middle steps (keep welcome first, add finish at end)
  const middle = shuffleArray(steps.slice(1), rand);
  return [steps[0]!, ...middle];
}


export function InstallerStage({ difficulty, seed, onSubmit }: StageProps) {
  const { steps, programName, installPath } = useMemo(() => {
    const rand = seededRandom(seed);
    const name =
      PROGRAM_NAMES[Math.floor(rand() * PROGRAM_NAMES.length)]! +
      " v" +
      String(Math.floor(rand() * 5) + 1) +
      "." +
      String(Math.floor(rand() * 10));
    const path =
      INSTALL_PATHS[Math.floor(rand() * INSTALL_PATHS.length)]! + name.replace(/\s/g, "");
    return {
      steps: makeSteps(difficulty, rand),
      programName: name,
      installPath: path,
    };
  }, [difficulty, seed]);

  const [currentStep, setCurrentStep] = useState(0);
  const [restartChecked, setRestartChecked] = useState(true);

  // Generate button pair per step (deterministic from seed + step index)
  const layout = useMemo(() => {
    return steps.map((s, i) => makeButtonPair(s, seededRandom(seed + i + 1000)));
  }, [steps, seed]);

  const isFinish = currentStep >= steps.length;

  const handleButton = (action: "next" | "decline" | "accept") => {
    if (isFinish) return;
    const step = steps[currentStep]!;
    if (action === step.correct) {
      if (currentStep + 1 >= steps.length) {
        setCurrentStep(steps.length);
      } else {
        setCurrentStep((s) => s + 1);
      }
    } else {
      onSubmit(false);
    }
  };

  const handleFinish = () => {
    onSubmit(true);
  };

  const step = isFinish ? null : steps[currentStep]!;
  const buttons = isFinish
    ? layout[layout.length - 1]!
    : layout[currentStep]!;

  return (
    <div className="flex-col gap-md">
      <p className="stage-prompt">
        Install <strong>{programName}</strong> correctly — decline all bloatware!
      </p>
      <div
        className="crayon-card"
        style={{
          background: "#fff",
          width: "min(520px, 100%)",
          minHeight: 340,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: "linear-gradient(90deg, #1e3a8a, #3b82f6)",
            color: "#fff",
            padding: "8px 14px",
            fontWeight: 700,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: "1rem" }}>&#128187;</span>
          {programName} Setup
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "16px 20px", fontSize: "0.9rem" }}>
          {isFinish ? (
            <div className="flex-col" style={{ gap: 12, alignItems: "stretch" }}>
              <p style={{ fontWeight: 700, fontSize: "1rem" }}>
                Setup Complete
              </p>
              <p>
                {programName} has been successfully installed to:
              </p>
              <p
                style={{
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
              >
                {installPath}
              </p>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={restartChecked}
                  onChange={(e) => setRestartChecked(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Restart computer now
              </label>
            </div>
          ) : (
            <div className="flex-col" style={{ gap: 10, alignItems: "stretch" }}>
              <p style={{ fontWeight: 700, fontSize: "1rem" }}>
                {step!.title}
              </p>
              <p style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>
                {step!.body}
              </p>
              {step!.title === "Select Installation Path" && (
                <p
                  style={{
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  }}
                >
                  {installPath}
                </p>
              )}
              {step!.isTrap && (
                <div
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.4)",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: "0.8rem",
                    fontStyle: "italic",
                  }}
                >
                  Recommended
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #ccc",
            background: "#f0f0f0",
            padding: "10px 16px",
            position: "relative",
            height: 52,
          }}
        >
          {isFinish ? (
            <button
              className="crayon-btn primary edgefx"
              onClick={handleFinish}
              style={{
                position: "absolute",
                left: `${String(FIXED_SLOTS[0])}%`,
                top: 10,
                fontSize: "0.85rem",
                padding: "6px 20px",
              }}
            >
              Finish
            </button>
          ) : (
            buttons.map((btn, i) => (
              <button
                key={btn.action}
                onClick={() => handleButton(btn.action)}
                style={{
                  position: "absolute",
                  left: `${String(FIXED_SLOTS[i])}%`,
                  top: 10,
                  background: "#e5e7eb",
                  border: "1px solid #aaa",
                  borderRadius: 6,
                  padding: "6px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                {btn.label}
              </button>
            ))
          )}
        </div>
      </div>
      {/* Step indicator */}
      <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
        Step {Math.min(currentStep + 1, steps.length + 1)} / {steps.length + 1}
      </div>
    </div>
  );
}
