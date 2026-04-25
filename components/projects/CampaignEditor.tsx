"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback } from "react";
import { CAMPAIGN_PROSE_CLASSES } from "@/lib/utils/campaignHtml";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Minus,
} from "lucide-react";

interface CampaignEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  error?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded transition-colors
        ${
          active
            ? "bg-[var(--color-brand-crust)]/15 text-[var(--color-brand-crust)]"
            : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-overlay)]"
        }
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-[var(--color-border)] mx-0.5" />;
}

export function CampaignEditor({
  value,
  onChange,
  placeholder = "Tell your story — what are you building, why does it matter, and how will backers' support make it happen?",
  minHeight = "280px",
  error,
}: CampaignEditorProps) {
  const editor = useEditor({
    // Required on React 19 + SSR — otherwise Tiptap throws during the initial
    // server render and the error boundary takes over. See:
    // https://tiptap.dev/docs/editor/getting-started/install/nextjs
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Constrained block types only — no arbitrary HTML
        codeBlock: false,
        code: false,
        // Link ships with StarterKit in v3 — configure it here instead of
        // registering a second Link extension (which triggers a duplicate-name
        // warning and breaks hydration).
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: [
          CAMPAIGN_PROSE_CLASSES,
          "outline-none min-h-[inherit]",
          // TipTap placeholder plumbing — show the `data-placeholder` attribute
          // as soft grey text when the editor is empty.
          "[&_.is-empty::before]:content-[attr(data-placeholder)] [&_.is-empty::before]:text-[var(--color-ink-subtle)] [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0",
        ].join(" "),
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. when a draft is loaded)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={`rounded-[var(--radius-card)] border ${
        error ? "border-[var(--color-brand-danger)]" : "border-[var(--color-border)]"
      } bg-[var(--color-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-brand-crust)] transition-shadow`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <ToolbarButton
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Section heading (H2) — appears in the sidebar navigation on your public page"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          title="Subsection heading (H3) — nested under the nearest Section heading"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton title="Add link" onClick={setLink} active={editor.isActive("link")}>
          <LinkIcon className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          title="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="px-4 py-3 cursor-text"
        style={{ minHeight }}
      />

      {/* Formatting guide + character count */}
      <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5 text-[11px] text-[var(--color-ink-subtle)] leading-relaxed">
          <span>
            <strong className="font-semibold text-[var(--color-ink-muted)]">H2</strong> = section
            (shows in the right-side nav).{" "}
            <strong className="font-semibold text-[var(--color-ink-muted)]">H3</strong> = subsection
            (indented under its H2). Use bold for emphasis, not as a heading — it won't appear in
            navigation.
          </span>
          <span>
            Section headings ending in <strong className="font-semibold text-[var(--color-ink-muted)]">?</strong> are auto-promoted into your FAQ.
          </span>
        </div>
        <span className="text-xs text-[var(--color-ink-subtle)] font-mono tabular-nums shrink-0 pt-0.5">
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length} chars
        </span>
      </div>
    </div>
  );
}
