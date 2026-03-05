import { useState, useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, shuffleArray } from "../utils/random.ts";

type CookieCategory = {
  id: string;
  label: string;
  description: string;
  required: boolean; // true = functional, always on, can't toggle
};

const ALL_CATEGORIES: CookieCategory[] = [
  {
    id: "necessary",
    label: "Necessary Cookies",
    description: "Required for basic site functionality. These cannot be disabled.",
    required: true,
  },
  {
    id: "analytics",
    label: "Analytics Cookies",
    description: "Help us understand how visitors interact with our website by collecting anonymous usage data.",
    required: false,
  },
  {
    id: "marketing",
    label: "Marketing Cookies",
    description: "Used to deliver personalized advertisements and measure the effectiveness of ad campaigns.",
    required: false,
  },
  {
    id: "social",
    label: "Social Media Cookies",
    description: "Enable sharing content on social media platforms and tracking across websites.",
    required: false,
  },
  {
    id: "personalization",
    label: "Personalization Cookies",
    description: "Allow the website to remember your preferences and provide enhanced, personalized features.",
    required: false,
  },
  {
    id: "thirdparty",
    label: "Third-Party Cookies",
    description: "Set by external services embedded in our pages to provide additional functionality.",
    required: false,
  },
  {
    id: "performance",
    label: "Performance Cookies",
    description: "Collect information about how you use our website to help us improve loading speed and experience.",
    required: false,
  },
];

const SITE_NAMES = [
  "CoolRecipes.com",
  "TechBlog24.net",
  "FreeGames.io",
  "NewsFlash.de",
  "BestDeals.shop",
  "WeatherNow.info",
  "StreamFlix.tv",
  "LearnCode.dev",
];

type BannerConfig = {
  siteName: string;
  /** At difficulty 1, a direct "Only Necessary" button exists */
  hasDirectReject: boolean;
  /** Cookie categories to show (non-functional ones, all start enabled) */
  categories: CookieCategory[];
  /** Which categories start collapsed and need expanding first */
  collapsedIds: Set<string>;
};

function makeBanner(difficulty: number, rand: () => number): BannerConfig {
  const siteName = SITE_NAMES[Math.floor(rand() * SITE_NAMES.length)]!;
  const hasDirectReject = difficulty <= 1;

  // Pick non-functional categories based on difficulty
  const optional = shuffleArray(
    ALL_CATEGORIES.filter((c) => !c.required),
    rand,
  );
  // difficulty 1: 2 categories, difficulty 5: 6 categories
  const count = Math.min(1 + difficulty, optional.length);
  const picked = optional.slice(0, count);

  // At difficulty >= 3, some categories start collapsed
  const collapsedIds = new Set<string>();
  if (difficulty >= 3) {
    const toCollapse = Math.min(difficulty - 2, picked.length);
    for (let i = 0; i < toCollapse; i++) {
      collapsedIds.add(picked[i]!.id);
    }
  }

  const categories = [ALL_CATEGORIES[0]!, ...shuffleArray(picked, rand)];
  return { siteName, hasDirectReject, categories, collapsedIds };
}

export function CookieBannerStage({ difficulty, seed, onSubmit }: StageProps) {
  const config = useMemo(() => makeBanner(difficulty, seededRandom(seed)), [difficulty, seed]);

  const [phase, setPhase] = useState<"banner" | "settings">(
    config.hasDirectReject ? "banner" : "banner",
  );
  // Toggles: non-required categories start ON (must be turned off)
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const cat of config.categories) {
      init[cat.id] = true; // all start enabled
    }
    return init;
  });
  // Expanded state for collapsible categories
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const cat of config.categories) {
      init[cat.id] = !config.collapsedIds.has(cat.id);
    }
    return init;
  });

  const handleAcceptAll = () => {
    onSubmit(false); // Accepting all is always wrong
  };

  const handleOnlyNecessary = () => {
    onSubmit(true); // Direct reject = correct at difficulty 1
  };

  const handleOpenSettings = () => {
    setPhase("settings");
  };

  const handleSave = () => {
    // Check: all non-required must be OFF, required must be ON
    const correct = config.categories.every((cat) => {
      if (cat.required) return toggles[cat.id] === true;
      return toggles[cat.id] === false;
    });
    onSubmit(correct);
  };

  const toggleCategory = (id: string) => {
    const cat = config.categories.find((c) => c.id === id);
    if (cat?.required) return; // Can't toggle required
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-col gap-md" style={{ alignItems: "center" }}>
      <p className="stage-prompt">
        Accept only functional cookies on <strong>{config.siteName}</strong>
      </p>

      {phase === "banner" ? (
        /* ── Initial Banner ── */
        <div
          className="crayon-card"
          style={{
            background: "#fff",
            width: "min(480px, 100%)",
            padding: 0,
            overflow: "hidden",
            border: "1px solid #e0e0e0",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#1a1a2e",
              color: "#fff",
              padding: "14px 18px",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          >
            Cookie Consent
          </div>

          {/* Body */}
          <div style={{ padding: "16px 18px", fontSize: "0.88rem", lineHeight: 1.6 }}>
            <p>
              We use cookies to enhance your experience. By continuing to visit this
              site you agree to our use of cookies.{" "}
              <span style={{ color: "#3b82f6", textDecoration: "underline", cursor: "pointer" }}>
                Privacy Policy
              </span>
            </p>
          </div>

          {/* Buttons */}
          <div
            style={{
              padding: "10px 18px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button
              onClick={handleAcceptAll}
              style={{
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px 24px",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Accept All Cookies
            </button>

            {config.hasDirectReject && (
              <button
                onClick={handleOnlyNecessary}
                style={{
                  background: "transparent",
                  color: "#666",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  padding: "10px 18px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Only Necessary
              </button>
            )}

            <button
              onClick={handleOpenSettings}
              style={{
                background: "transparent",
                color: "#888",
                border: "none",
                padding: "10px 8px",
                fontWeight: 500,
                fontSize: "0.8rem",
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
                marginLeft: config.hasDirectReject ? 0 : "auto",
              }}
            >
              Cookie Settings
            </button>
          </div>
        </div>
      ) : (
        /* ── Settings Panel ── */
        <div
          className="crayon-card"
          style={{
            background: "#fff",
            width: "min(480px, 100%)",
            padding: 0,
            overflow: "hidden",
            border: "1px solid #e0e0e0",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#1a1a2e",
              color: "#fff",
              padding: "14px 18px",
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Cookie Settings
            <button
              onClick={handleAcceptAll}
              style={{
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "5px 14px",
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Accept All
            </button>
          </div>

          {/* Categories */}
          <div style={{ padding: "8px 0", maxHeight: 320, overflowY: "auto" }}>
            {config.categories.map((cat) => {
              const isExpanded = expanded[cat.id] ?? true;
              const isCollapsible = config.collapsedIds.has(cat.id);

              return (
                <div
                  key={cat.id}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: "10px 18px",
                  }}
                >
                  {/* Row: label + toggle */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: isCollapsible ? "pointer" : "default",
                        flex: 1,
                      }}
                      onClick={() => isCollapsible && toggleExpand(cat.id)}
                    >
                      {isCollapsible && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            transition: "transform 0.15s",
                            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            display: "inline-block",
                          }}
                        >
                          &#9654;
                        </span>
                      )}
                      <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                        {cat.label}
                      </span>
                      {cat.required && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            background: "#e0e7ff",
                            color: "#3b5bdb",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          Required
                        </span>
                      )}
                    </div>

                    {/* Toggle switch */}
                    {isExpanded && (
                      <div
                        onClick={() => toggleCategory(cat.id)}
                        style={{
                          width: 40,
                          height: 22,
                          borderRadius: 11,
                          background: toggles[cat.id] ? "#3b82f6" : "#ccc",
                          cursor: cat.required ? "not-allowed" : "pointer",
                          position: "relative",
                          transition: "background 0.15s",
                          flexShrink: 0,
                          opacity: cat.required ? 0.6 : 1,
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#fff",
                            position: "absolute",
                            top: 2,
                            left: toggles[cat.id] ? 20 : 2,
                            transition: "left 0.15s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Description (only when expanded) */}
                  {isExpanded && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "0.78rem",
                        color: "#666",
                        lineHeight: 1.4,
                        paddingLeft: isCollapsible ? 18 : 0,
                      }}
                    >
                      {cat.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid #e0e0e0",
              padding: "12px 18px",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              background: "#fafafa",
            }}
          >
            <button
              onClick={handleSave}
              style={{
                background: "#1a1a2e",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 20px",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
