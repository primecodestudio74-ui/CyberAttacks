import React, { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

// A small, dependency-free markdown renderer scoped to what the chatbot
// actually needs: headings, bold/italic, inline code, fenced code blocks
// (with copy-to-clipboard), bullet/numbered lists, and simple tables.
// Keeping this custom avoids pulling in a heavy markdown + syntax
// highlighting stack for a well-defined, bounded set of formatting needs.

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  }, [code]);

  return (
    <div className="relative my-3 rounded-xl border border-slate-800 bg-[#0b1220] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed font-mono text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Very small inline-formatting pass: **bold**, *italic*, `code`.
const renderInline = (text, keyPrefix) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="text-white font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[0.9em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
};

const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
const isTableDivider = (line) => /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-');

const renderTable = (lines, keyPrefix) => {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((cell) => cell.trim())
  );
  const [header, , ...body] = rows;
  return (
    <div key={keyPrefix} className="my-3 overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-left text-[12px]">
        <thead className="bg-slate-900/60">
          <tr>
            {header.map((cell, i) => (
              <th key={i} className="px-3 py-2 font-black uppercase tracking-wider text-cyan-500 text-[10px]">
                {renderInline(cell, `${keyPrefix}-h-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-t border-slate-800/60">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-400 align-top">
                  {renderInline(cell, `${keyPrefix}-r${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks = [];
  let i = 0;
  let listBuffer = [];
  let listOrdered = false;

  const flushList = () => {
    if (!listBuffer.length) return;
    const Tag = listOrdered ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={`my-2 pl-5 space-y-1 text-sm text-slate-300 ${listOrdered ? 'list-decimal' : 'list-disc'}`}
      >
        {listBuffer.map((item, idx) => (
          <li key={idx}>{renderInline(item, `li-${blocks.length}-${idx}`)}</li>
        ))}
      </Tag>
    );
    listBuffer = [];
    listOrdered = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line.trim())) {
      flushList();
      const language = line.trim().replace(/^```/, '').trim();
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push(<CodeBlock key={`code-${blocks.length}`} language={language} code={codeLines.join('\n')} />);
      continue;
    }

    // Table
    if (isTableRow(line) && lines[i + 1] && isTableDivider(lines[i + 1])) {
      flushList();
      const tableLines = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      blocks.push(renderTable(tableLines, `table-${blocks.length}`));
      continue;
    }

    // Headings
    const headingMatch = /^(#{1,4})\s+(.*)/.exec(line);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const sizes = { 1: 'text-lg', 2: 'text-base', 3: 'text-sm', 4: 'text-sm' };
      blocks.push(
        <p
          key={`h-${blocks.length}`}
          className={`${sizes[level]} font-black uppercase tracking-wide text-cyan-400 mt-4 mb-1 first:mt-0`}
        >
          {renderInline(headingMatch[2], `h-${blocks.length}`)}
        </p>
      );
      i += 1;
      continue;
    }

    // Bullet list item
    const bulletMatch = /^\s*[-*]\s+(.*)/.exec(line);
    const numberedMatch = /^\s*\d+\.\s+(.*)/.exec(line);
    if (bulletMatch || numberedMatch) {
      const ordered = Boolean(numberedMatch);
      if (listBuffer.length && listOrdered !== ordered) flushList();
      listOrdered = ordered;
      listBuffer.push((bulletMatch || numberedMatch)[1]);
      i += 1;
      continue;
    }

    flushList();

    if (!line.trim()) {
      i += 1;
      continue;
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm leading-relaxed mb-2 last:mb-0">
        {renderInline(line, `p-${blocks.length}`)}
      </p>
    );
    i += 1;
  }
  flushList();

  return <div className="chatbot-markdown">{blocks}</div>;
};

export default MarkdownRenderer;
