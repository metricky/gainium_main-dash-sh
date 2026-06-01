import React, { useEffect, useRef, useState } from 'react';
import { useNotesStore } from '../../../stores/notesStore';
import WidgetWrapper from '../WidgetWrapper';

export interface NotesWidgetProps {
  widgetId?: string;
  isEditable?: boolean;
  disabled?: boolean;
  isCollapsible?: boolean;
  allowResize?: boolean;
  onRemove?: () => void;
  onSettings?: () => void;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: import('../WidgetWrapper').WidgetMenuActions;
  variant?: 'widget' | 'panel';
  className?: string;
  defaultContent?: string;
  showTitle?: boolean;
}

// Very small, safe markdown renderer (no HTML) supporting a subset: headings, bold, italic, code, code blocks, blockquote, lists, links, hr

// Very small, safe markdown renderer (no HTML) supporting a subset: headings, bold, italic, code, code blocks, blockquote, lists, links, hr
function renderMarkdown(md: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  const flushParagraph = (buffer: string[]) => {
    if (!buffer.length) return;
    const text = buffer.join(' ');
    elements.push(
      <p
        key={`p-${elements.length}`}
        className="text-muted-foreground leading-relaxed mb-3"
      >
        {renderInline(text)}
      </p>
    );
    buffer.length = 0;
  };
  const renderInline = (txt: string): React.ReactNode => {
    // Escape angle brackets
    let safe = txt.replace(/[<>]/g, (m) => (m === '<' ? '&lt;' : '&gt;'));
    // Code spans
    safe = safe.replace(/`([^`]+)`/g, (_, code) => `@@CODE${btoa(code)}@@`);
    // Bold
    safe = safe
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // Italic
    safe = safe
      .replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, '$1<em>$2</em>')
      .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>');
    // Links [text](url)
    safe = safe.replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    // Replace code placeholders
    const parts = safe.split(/(@@CODE[^@]+@@)/g).filter(Boolean);
    return parts.map((part, idx) => {
      const codeMatch = /^@@CODE(.+)@@$/.test(part);
      if (codeMatch) {
        const decoded = atob(part.slice(6, -2));
        return (
          <code
            key={idx}
            className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs font-mono"
          >
            {decoded}
          </code>
        );
      }
      // naive HTML tag parse for strong/em/a we just injected
      const temp = document.createElement('div');
      temp.innerHTML = part;
      const children: React.ReactNode[] = [];
      temp.childNodes.forEach((node, nIdx) => {
        if (node.nodeType === 3)
          children.push(
            <React.Fragment key={nIdx}>{node.textContent}</React.Fragment>
          );
        else if (node instanceof HTMLElement) {
          if (node.tagName === 'STRONG')
            children.push(
              <strong key={nIdx} className="text-foreground font-medium">
                {node.textContent}
              </strong>
            );
          else if (node.tagName === 'EM')
            children.push(
              <em key={nIdx} className="italic text-muted-foreground">
                {node.textContent}
              </em>
            );
          else if (node.tagName === 'A')
            children.push(
              <a
                key={nIdx}
                href={node.getAttribute('href') || ''}
                className="text-primary underline decoration-primary/30 hover:decoration-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                {node.textContent}
              </a>
            );
          else
            children.push(
              <React.Fragment key={nIdx}>{node.textContent}</React.Fragment>
            );
        }
      });
      return <React.Fragment key={idx}>{children}</React.Fragment>;
    });
  };
  while (i < lines.length) {
    const line = lines[i];
    // Horizontal rule
    if (/^\s*---+$/.test(line)) {
      elements.push(
        <hr key={`hr-${elements.length}`} className="border-border my-4" />
      );
      i++;
      continue;
    }
    // Code block
    if (/^```/.test(line)) {
      // (language ignored for now)
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing
      elements.push(
        <pre
          key={`code-${elements.length}`}
          className="bg-muted border border-border rounded-md p-md overflow-x-auto text-xs"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }
    // Heading
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      if (level === 1) {
        elements.push(
          <h1
            key={`h-${elements.length}`}
            className="text-xl font-semibold mb-4 mt-0 text-foreground"
          >
            {renderInline(content)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2
            key={`h-${elements.length}`}
            className="text-lg font-semibold mb-3 mt-4 text-foreground"
          >
            {renderInline(content)}
          </h2>
        );
      } else {
        elements.push(
          <h3
            key={`h-${elements.length}`}
            className="text-base font-semibold mb-2 mt-3 text-foreground"
          >
            {renderInline(content)}
          </h3>
        );
      }
      i++;
      continue;
    }
    // Blockquote
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      let j = i;
      while (j < lines.length && /^>\s?/.test(lines[j])) {
        quote.push(lines[j].replace(/^>\s?/, ''));
        j++;
      }
      elements.push(
        <blockquote
          key={`bq-${elements.length}`}
          className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4"
        >
          {renderInline(quote.join(' '))}
        </blockquote>
      );
      i = j;
      continue;
    }
    // Lists
    if (/^\s*([-*])\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length && /^\s*([-*])\s+/.test(lines[j])) {
        items.push(
          <li key={j} className="mb-1 text-muted-foreground">
            {renderInline(lines[j].replace(/^\s*([-*])\s+/, ''))}
          </li>
        );
        j++;
      }
      elements.push(
        <ul key={`ul-${elements.length}`} className="mb-3 pl-4 list-disc">
          {items}
        </ul>
      );
      i = j;
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length && /^\s*\d+\.\s+/.test(lines[j])) {
        items.push(
          <li key={j} className="mb-1 text-muted-foreground">
            {renderInline(lines[j].replace(/^\s*\d+\.\s+/, ''))}
          </li>
        );
        j++;
      }
      elements.push(
        <ol key={`ol-${elements.length}`} className="mb-3 pl-4 list-decimal">
          {items}
        </ol>
      );
      i = j;
      continue;
    }
    // Blank line ends paragraph
    if (/^\s*$/.test(line)) {
      flushParagraph([]);
      i++;
      continue;
    }
    // Paragraph buffer (simple: treat single line as its own paragraph)
    elements.push(
      <p
        key={`p-${elements.length}`}
        className="text-muted-foreground leading-relaxed mb-3"
      >
        {renderInline(line)}
      </p>
    );
    i++;
  }
  return elements;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({
  widgetId = 'notes-default',
  isEditable = true,
  disabled = false,
  isCollapsible = true,
  allowResize: _allowResize = true,
  onRemove,
  onSettings,
  onCollapse,
  onTabMove,
  menuActions,
  variant = 'widget',
  className,
  defaultContent,
  showTitle = true,
}) => {
  const { getNote, setNote, updateNoteContent } = useNotesStore();
  const note = getNote(widgetId);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Formatting Helpers ---
  const commit = (newValue: string, selStart?: number, selEnd?: number) => {
    updateNoteContent(widgetId, newValue);
    requestAnimationFrame(() => {
      if (typeof selStart === 'number') {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        ta.selectionStart = selStart;
        ta.selectionEnd = typeof selEnd === 'number' ? selEnd : selStart;
      }
    });
  };
  const getSelection = () => {
    const ta = textareaRef.current;
    if (!ta) return { value: note?.content || '', start: 0, end: 0 };
    return { value: ta.value, start: ta.selectionStart, end: ta.selectionEnd };
  };
  const wrapInline = (wrapper: string, placeholder: string) => {
    if (!note) return;
    const { value, start, end } = getSelection();
    const selected = value.slice(start, end) || placeholder;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const already = selected.startsWith(wrapper) && selected.endsWith(wrapper);
    let newInner: string;
    if (already)
      newInner = selected.slice(
        wrapper.length,
        selected.length - wrapper.length
      );
    else newInner = wrapper + selected + wrapper;
    const newValue = before + newInner + after;
    const newStart = start + (already ? 0 : wrapper.length);
    const newEnd =
      newStart +
      (already ? selected.length - wrapper.length * 2 : selected.length);
    commit(newValue, newStart, newEnd);
  };
  const insertAtLineStart = (prefix: string) => {
    if (!note) return;
    const { value, start, end } = getSelection();
    const pre = value.slice(0, start);
    const selection = value.slice(start, end);
    const post = value.slice(end);
    const lines = selection.split(/\n/);
    const updated = lines
      .map((l) => (l.startsWith(prefix) ? l : prefix + l))
      .join('\n');
    commit(pre + updated + post, start, start + updated.length);
  };
  const toggleHeading = (level: 1 | 2 | 3) => {
    if (!note) return;
    const { value, start } = getSelection();
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEndIdx = value.indexOf('\n', start);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
    const line = value.slice(lineStart, lineEnd);
    const prefix = '#'.repeat(level) + ' ';
    let newLine: string;
    if (line.startsWith(prefix))
      newLine = line.replace(new RegExp('^' + '#'.repeat(level) + '\\s+'), '');
    else {
      newLine = line.replace(/^#{1,6}\s+/, '').trimStart();
      newLine = prefix + newLine;
    }
    const newValue = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
    const cursor = lineStart + newLine.length;
    commit(newValue, cursor, cursor);
  };
  const insertBlock = (block: string) => {
    if (!note) return;
    const { value, start, end } = getSelection();
    const before = value.slice(0, start);
    const after = value.slice(end);
    const insertion = block;
    const pos = before.length + insertion.length;
    commit(before + insertion + after, pos, pos);
  };
  const makeCodeBlock = () => {
    if (!note) return;
    const { value, start, end } = getSelection();
    const selected = value.slice(start, end) || 'code';
    const before = value.slice(0, start);
    const after = value.slice(end);
    const block = '```\n' + selected + '\n```';
    const newValue = before + block + after;
    const newStart = before.length + 4;
    commit(newValue, newStart, newStart + selected.length);
  };
  const makeLink = () => {
    if (!note) return;
    const url = window.prompt('Enter URL');
    if (!url) return;
    const { value, start, end } = getSelection();
    const selected = value.slice(start, end) || 'link text';
    const before = value.slice(0, start);
    const after = value.slice(end);
    const insertion = `[${selected}](${url})`;
    const newValue = before + insertion + after;
    const caretStart = before.length + 1;
    commit(newValue, caretStart, caretStart + selected.length);
  };

  useEffect(() => {
    if (!note) {
      const content =
        defaultContent ||
        '# Welcome to Notes\n\nStart writing your notes here...';
      const title = showTitle ? 'My Notes' : '';
      setNote(widgetId, {
        title,
        content,
      });
    }
  }, [note, widgetId, setNote, defaultContent, showTitle]);

  // Click outside to exit edit mode
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        isEditing &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setIsEditing(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing]);
  const applyClassName = (base: string) =>
    className && className.length > 0 ? `${base} ${className}` : base;

  const loadingContent = (
    <div
      className={applyClassName(
        'flex h-full items-center justify-center text-sm text-muted-foreground'
      )}
    >
      Loading notes...
    </div>
  );

  if (!note) {
    if (variant === 'panel') {
      return loadingContent;
    }

    return (
      <WidgetWrapper
        metadata={{ id: widgetId, type: 'notes', title: 'Notes' }}
        isEditable={isEditable}
        isCollapsible={isCollapsible}
        {...(onRemove && { onRemove })}
        {...(onSettings && { onSettings })}
        {...(onCollapse && { onCollapse })}
        {...(onTabMove && { onTabMove })}
        {...(menuActions && { menuActions })}
      >
        {loadingContent}
      </WidgetWrapper>
    );
  }

  const noteMetadata = {
    id: widgetId,
    type: 'notes' as const,
    title: note.title || 'Notes',
  };

  const containerClasses = applyClassName('flex h-full flex-col');
  const toolbarButtonClass = 'rounded px-2 py-1 hover:bg-muted';

  const body = (
    <div ref={containerRef} className={containerClasses}>
      {isEditing ? (
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-border bg-muted/40 p-xs text-xs">
            <button
              className={toolbarButtonClass}
              onClick={() => wrapInline('**', 'bold')}
              aria-label="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              className={`${toolbarButtonClass} italic`}
              onClick={() => wrapInline('*', 'italic')}
              aria-label="Italic"
            >
              I
            </button>
            <button
              className={`${toolbarButtonClass} font-mono`}
              onClick={() => wrapInline('`', 'code')}
              aria-label="Code"
            >
              `
            </button>
            <button
              className={toolbarButtonClass}
              onClick={() => toggleHeading(1)}
              aria-label="Heading 1"
            >
              H1
            </button>
            <button
              className={toolbarButtonClass}
              onClick={() => toggleHeading(2)}
              aria-label="Heading 2"
            >
              H2
            </button>
            <button
              className={toolbarButtonClass}
              onClick={() => toggleHeading(3)}
              aria-label="Heading 3"
            >
              H3
            </button>
            <button
              className={toolbarButtonClass}
              onClick={() => insertAtLineStart('- ')}
              aria-label="Bullet List"
            >
              • List
            </button>
            <button
              className={toolbarButtonClass}
              onClick={() => insertAtLineStart('1. ')}
              aria-label="Numbered List"
            >
              1.
            </button>
            <button
              className={toolbarButtonClass}
              onClick={() => insertAtLineStart('> ')}
              aria-label="Quote"
            >
              ❝
            </button>
            <button
              className={toolbarButtonClass}
              onClick={makeCodeBlock}
              aria-label="Code Block"
            >
              {'</>'}
            </button>
            <button
              className={toolbarButtonClass}
              onClick={() => insertBlock('\n\n---\n\n')}
              aria-label="Horizontal Rule"
            >
              HR
            </button>
            <button
              className={toolbarButtonClass}
              onClick={makeLink}
              aria-label="Link"
            >
              🔗
            </button>
            <div className="ml-auto flex gap-1">
              <button
                className="rounded bg-primary px-2 py-1 text-primary-foreground hover:opacity-90"
                onClick={() => setIsEditing(false)}
              >
                Preview
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className="flex-1 w-full resize-none rounded-b-md border-x border-b border-border bg-background p-md font-mono text-sm text-foreground outline-none"
            value={note.content}
            onChange={(e) => updateNoteContent(widgetId, e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                setIsEditing(false);
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
              }
              if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault();
                wrapInline('**', 'bold');
              }
              if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
                e.preventDefault();
                wrapInline('*', 'italic');
              }
            }}
          />
          <div className="flex gap-sm border-t border-border px-2 py-1 text-xs text-muted-foreground">
            <span>Esc: preview</span>
            <span>Ctrl/⌘+S: save</span>
            <span>Ctrl/⌘+B, Ctrl/⌘+I</span>
          </div>
        </div>
      ) : (
        <div
          className={`h-full overflow-auto transition-colors duration-200 ${
            isEditable ? 'cursor-text hover:bg-muted/20' : 'cursor-default'
          } ${disabled ? 'opacity-50' : ''}`}
          onClick={() => isEditable && setIsEditing(true)}
        >
          <div className="min-h-full p-lg">
            {note.content ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {renderMarkdown(note.content)}
              </div>
            ) : (
              <div className="text-sm italic text-muted-foreground/60">
                {isEditable
                  ? 'Click to start writing...'
                  : 'No notes available...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (variant === 'panel') {
    return body;
  }

  return (
    <WidgetWrapper
      metadata={noteMetadata}
      isEditable={isEditable}
      isCollapsible={isCollapsible}
      {...(onRemove && { onRemove })}
      {...(onSettings && { onSettings })}
      {...(onCollapse && { onCollapse })}
      {...(onTabMove && { onTabMove })}
      {...(menuActions && { menuActions })}
    >
      {body}
    </WidgetWrapper>
  );
};

export default NotesWidget;
