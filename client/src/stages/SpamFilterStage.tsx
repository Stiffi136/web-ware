import { useState, useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, shuffleArray } from "../utils/random.ts";

/* ------------------------------------------------------------------ */
/*  Data pools                                                        */
/* ------------------------------------------------------------------ */

type Sender = { name: string; address: string };

const SPAM_SUBJECTS = [
  "You won a car!",
  "You won 1,000,000$!",
  "You won't believe what happened!",
  "URGENT: Verify your account NOW!",
  "Congratulations! You've been selected!",
  "Make $5,000 from home TODAY!",
  "Hot singles in your area!",
  "FREE iPhone 16 - Claim now!",
  "Nigerian prince needs your help",
  "Claim your $10,000 prize now!",
  "You have an unclaimed inheritance!",
  "Act now - offer expires in 1 hour!",
];

const LEGIT_SUBJECTS = [
  "Meeting tomorrow at 10am",
  "Project update - Q3 report",
  "Your order has been shipped",
  "Weekly team standup notes",
  "Invoice #4521 - Due March 15",
  "Lunch plans for Friday?",
  "Re: Quarterly budget review",
  "New office policy update",
  "Happy birthday, Sarah!",
  "Vacation request approved",
  "Updated parking assignments",
  "Reminder: annual review next week",
];

const TRICKY_LEGIT_SUBJECTS = [
  "You won Employee of the Month!",
  "Incredible Q4 results - must see!",
  "Don't miss this - team retreat signup",
  "Free lunch in the break room today",
  "Unbelievable - our project got funded!",
];

const SPAM_SENDERS: Sender[] = [
  { name: "Prize Bot", address: "winner@spam.com" },
  { name: "Dr. Money", address: "prince@hacker.man" },
  { name: "Free Deals", address: "deals@free-stuff.xyz" },
  { name: "Lotto King", address: "lottery@winbig.spam.com" },
  { name: "Cash4U", address: "no-reply@c4sh-prize.net" },
];

const LEGIT_SENDERS: Sender[] = [
  { name: "John Smith", address: "john.smith@company.com" },
  { name: "HR Department", address: "hr@company.com" },
  { name: "Sarah Jones", address: "sarah.jones@company.com" },
  { name: "Mike Johnson", address: "m.johnson@company.com" },
  { name: "IT Support", address: "support@company.com" },
  { name: "Lisa Chen", address: "lisa.chen@company.com" },
  { name: "Amazon", address: "orders@amazon.com" },
  { name: "Slack", address: "team@slack.com" },
  { name: "Dave Miller", address: "d.miller@company.com" },
  { name: "Anna Weber", address: "a.weber@company.com" },
];

const SPAM_ATTACHMENTS = [
  "virus.exe",
  "macros.docx",
  "free_money.bat",
  "totally_safe.scr",
  "prize_claim.exe",
];

const BODY_TEXTS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia consequuntur.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum.",
  "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et.",
];

/* ------------------------------------------------------------------ */
/*  Types & difficulty config                                         */
/* ------------------------------------------------------------------ */

type Email = {
  from: Sender;
  subject: string;
  body: string;
  attachment: string | null;
  isSpam: boolean;
};

function getConfig(difficulty: number) {
  //  senderClue     → spam emails use obvious spam addresses
  //  attachmentClue → spam emails carry suspicious attachments
  //  trickyLegit    → legit emails with spam-sounding subjects
  switch (difficulty) {
    case 1:  return { total: 4, spam: 1, senderClue: true,  attachmentClue: true,  trickyLegit: 0 };
    case 2:  return { total: 4, spam: 2, senderClue: true,  attachmentClue: true,  trickyLegit: 0 };
    case 3:  return { total: 5, spam: 2, senderClue: true,  attachmentClue: false, trickyLegit: 0 };
    case 4:  return { total: 5, spam: 2, senderClue: false, attachmentClue: false, trickyLegit: 1 };
    case 5:  return { total: 6, spam: 3, senderClue: false, attachmentClue: false, trickyLegit: 2 };
    default: return { total: 5, spam: 2, senderClue: true,  attachmentClue: false, trickyLegit: 0 };
  }
}

/* ------------------------------------------------------------------ */
/*  Inbox generator                                                   */
/* ------------------------------------------------------------------ */

function generateInbox(difficulty: number, rand: () => number): Email[] {
  const cfg = getConfig(difficulty);
  const legitCount = cfg.total - cfg.spam;

  const spamSubjects = shuffleArray([...SPAM_SUBJECTS], rand).slice(0, cfg.spam);

  // Build legit subject pool, mixing in tricky ones at high difficulty
  const normalLegit = shuffleArray([...LEGIT_SUBJECTS], rand);
  const trickyLegit = shuffleArray([...TRICKY_LEGIT_SUBJECTS], rand).slice(0, cfg.trickyLegit);
  const legitSubjects = shuffleArray(
    [...trickyLegit, ...normalLegit.slice(0, legitCount - cfg.trickyLegit)],
    rand,
  );

  const spamSenderPool = shuffleArray([...SPAM_SENDERS], rand);
  const legitSenderPool = shuffleArray([...LEGIT_SENDERS], rand);
  let legitIdx = 0;

  const spamAttPool = shuffleArray([...SPAM_ATTACHMENTS], rand);
  const bodyPool = shuffleArray([...BODY_TEXTS], rand);

  const emails: Email[] = [];

  for (let i = 0; i < cfg.spam; i++) {
    emails.push({
      from: cfg.senderClue
        ? spamSenderPool[i % spamSenderPool.length]!
        : legitSenderPool[legitIdx++]!,
      subject: spamSubjects[i]!,
      body: bodyPool[i % bodyPool.length]!,
      attachment: cfg.attachmentClue ? spamAttPool[i % spamAttPool.length]! : null,
      isSpam: true,
    });
  }

  for (let i = 0; i < legitCount; i++) {
    emails.push({
      from: legitSenderPool[legitIdx++] ?? legitSenderPool[i % legitSenderPool.length]!,
      subject: legitSubjects[i]!,
      body: bodyPool[(cfg.spam + i) % bodyPool.length]!,
      attachment: null,
      isSpam: false,
    });
  }

  return shuffleArray(emails, rand);
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function SpamFilterStage({ difficulty, seed, onSubmit }: StageProps) {
  const emails = useMemo(
    () => generateInbox(difficulty, seededRandom(seed)),
    [difficulty, seed],
  );

  const [marked, setMarked] = useState<Set<number>>(() => new Set());

  const toggle = (idx: number) =>
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const handleSubmit = () => {
    const correct = emails.every((e, i) => e.isSpam === marked.has(i));
    onSubmit(correct);
  };

  const spamTotal = emails.filter((e) => e.isSpam).length;

  return (
    <div className="flex-col gap-md">
      <p className="stage-prompt">
        Mark all spam emails! ({marked.size}/{spamTotal})
      </p>

      <div
        className="crayon-card"
        style={{
          width: "min(560px, 100%)",
          padding: 0,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {/* Toolbar */}
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
          <span style={{ fontSize: "1rem" }}>&#9993;</span>
          Inbox ({emails.length})
        </div>

        {/* Email rows */}
        {emails.map((email, i) => {
          const isMarked = marked.has(i);
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => toggle(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(i);
                }
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 14px",
                borderBottom: i < emails.length - 1 ? "1px solid #eee" : "none",
                background: isMarked ? "rgba(239,68,68,0.10)" : "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {/* Checkbox */}
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: `2px solid ${isMarked ? "#ef4444" : "#ccc"}`,
                  background: isMarked ? "#ef4444" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {isMarked ? "\u2715" : ""}
              </span>

              {/* Email content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* From line */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {email.from.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#999",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    &lt;{email.from.address}&gt;
                  </span>
                </div>

                {/* Subject */}
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textDecoration: isMarked ? "line-through" : "none",
                    textDecorationColor: "rgba(239,68,68,0.5)",
                  }}
                >
                  {email.subject}
                </div>

                {/* Body preview */}
                <div
                  style={{
                    color: "#999",
                    fontSize: "0.78rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {email.body}
                </div>

                {/* Attachment badge */}
                {email.attachment && (
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 4,
                      background: "#f3f4f6",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: "0.72rem",
                      color: "#666",
                    }}
                  >
                    &#128206; {email.attachment}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button className="crayon-btn primary edgefx" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}
