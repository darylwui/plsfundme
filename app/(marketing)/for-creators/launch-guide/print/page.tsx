"use client";

import { useEffect } from "react";
import Link from "next/link";

type Item = { id: string; label: string; spec: string; editable?: boolean };
type Section = { id: string; title: string; intro: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    id: "basics",
    title: "Campaign basics",
    intro: "The basics backers see first. Get these right and everything else follows.",
    items: [
      { id: "title", label: "Project title", spec: "5–100 characters. Clear and specific beats clever — backers skim fast.", editable: true },
      { id: "short_desc", label: "Short description", spec: "20–200 characters. The hook that appears in search results and Explore cards." },
      { id: "cover_image", label: "Cover image", spec: "1200×675 px, JPG or PNG, under 2 MB. Your campaign's first impression — make it count." },
      { id: "full_desc", label: "Full description", spec: "Tell the story: what it is, why it matters, what backers receive. Minimum 50 characters." },
      { id: "category", label: "Category", spec: "Pick the one that fits best — it determines where your campaign appears on Explore." },
    ],
  },
  {
    id: "funding",
    title: "Funding goal & deadline",
    intro: "Set a goal you can genuinely deliver on. Aim ambitious, but be honest — your backers are counting on you.",
    items: [
      { id: "goal", label: "Funding goal (SGD)", spec: "Minimum SGD 500, maximum SGD 10,000,000. Aim for what you genuinely need to deliver." },
      { id: "deadline", label: "Campaign deadline", spec: "Must be a future date. Most campaigns run 30–60 days — shorter creates urgency." },
    ],
  },
  {
    id: "rewards",
    title: "Reward tiers",
    intro: "At least one tier required. Price it by what it costs you to deliver — not just what feels right.",
    items: [
      { id: "reward_title", label: "Tier title", spec: 'What backers call what they\'re getting. E.g. "Early bird", "Supporter", "Founding member".' },
      { id: "reward_pledge", label: "Minimum pledge amount", spec: "The lowest amount that unlocks this tier. Factor in delivery costs." },
      { id: "reward_desc", label: "Tier description", spec: "What backers actually receive. Be specific — vague promises erode trust and increase disputes." },
      { id: "reward_delivery", label: "Estimated delivery date", spec: "Optional but strongly recommended. Sets expectations on when backers receive their reward." },
      { id: "reward_physical", label: "Physical item flag", spec: "Check this if you're shipping something physical. Backers see it before they pledge." },
      { id: "reward_cap", label: "Max backers cap", spec: "Optional. Use for limited-edition runs or capacity-constrained experiences." },
    ],
  },
  {
    id: "milestones",
    title: "Milestones & payouts",
    intro: "Your funds unlock in three stages, not all at once. Know what you'll prove at each before you launch.",
    items: [
      { id: "m1", label: "Milestone 1 — first deliverable (40% of funds)", spec: "Your first concrete proof of progress. Photos, prototypes, signed supplier agreements — anything verifiable." },
      { id: "m2", label: "Milestone 2 — mid-project proof (40% of funds)", spec: "Show the project advancing. This is the largest release, so the proof needs to match." },
      { id: "m3", label: "Milestone 3 — final delivery (20% of funds)", spec: "Completion proof: rewards shipped, build delivered, or service rendered. Closes out the campaign." },
    ],
  },
  {
    id: "submit",
    title: "After you submit",
    intro: "Almost there. Submit and we'll review your campaign — usually within 2–3 business days.",
    items: [
      { id: "review", label: "Admin review", spec: "We review within 2–3 business days. You'll get an email when approved or if changes are needed." },
      { id: "live", label: "You're live", spec: "Once approved, your campaign page is public and backers can start pledging." },
    ],
  },
];

export default function LaunchGuidePrintPage() {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Print controls — hidden when printing */}
      <div className="print:hidden flex items-center gap-4 px-8 py-4 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          Print / Save as PDF
        </button>
        <Link
          href="/for-creators/launch-guide"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Back to checklist
        </Link>
      </div>

      {/* Document */}
      <div className="max-w-2xl mx-auto px-10 py-12">
        {/* Header */}
        <div className="mb-10 pb-6 border-b-2 border-gray-900">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            getthatbread.sg
          </p>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">
            Campaign launch checklist
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Check off each item before opening the campaign form.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.id}>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-wide mb-1">
                {section.title}
              </h2>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">{section.intro}</p>

              <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                {section.items.map((item, i) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 px-4 py-3.5 ${
                      i < section.items.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="shrink-0 mt-0.5 w-4 h-4 accent-amber-800 cursor-pointer"
                      aria-label={item.label}
                    />
                    <div className="min-w-0">
                      {item.editable ? (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                            {item.label}
                          </p>
                          <input
                            type="text"
                            defaultValue="The world's best idea!"
                            maxLength={100}
                            className="w-full font-bold text-base text-gray-900 border-b border-dashed border-gray-300 focus:border-amber-700 focus:outline-none py-0.5 bg-transparent"
                          />
                        </>
                      ) : (
                        <p className="font-semibold text-sm text-gray-900 leading-snug">
                          {item.label}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.spec}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-400">getthatbread.sg — campaign launch checklist</p>
          <p className="text-xs text-gray-400">Ready? Head to the campaign form.</p>
        </div>
      </div>
    </div>
  );
}
