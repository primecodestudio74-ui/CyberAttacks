import { Code2, ShieldCheck, ShieldAlert } from 'lucide-react';

// Each token below is a display-only string rendered as a React text child.
// These examples are never used as live markup or evaluated as JavaScript.
const vulnerableLines = [
  [['comment', '// Unsafe pattern · display only']],
  [
    ['keyword', 'const '],
    ['plain', 'comment = userInput;'],
  ],
  [
    ['plain', 'commentBox.'],
    ['danger', 'innerHTML'],
    ['plain', ' = comment;'],
  ],
];
const secureLines = [
  [['comment', '// Safe for plain-text comments']],
  [
    ['keyword', 'function '],
    ['function', 'Comment'],
    ['plain', '({ text }) {'],
  ],
  [
    ['keyword', '  return '],
    ['tag', '<p>'],
    ['safe', '{text}'],
    ['tag', '</p>'],
    ['plain', ';'],
  ],
  [['plain', '}']],
];

export function XSSCodeExample({ secure = false }) {
  const lines = secure ? secureLines : vulnerableLines;
  return (
    <article className={`xss-code-example ${secure ? 'is-secure' : 'is-vulnerable'}`}>
      <header>
        <span>
          {secure ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
          {secure ? 'Secure example' : 'Vulnerable example'}
        </span>
        <span className="xss-code-language">{secure ? 'React / JSX' : 'JavaScript'}</span>
      </header>
      <pre tabIndex={0} aria-label={`${secure ? 'Secure' : 'Vulnerable'} code, display only`}>
        <code>
          {lines.map((tokens, line) => (
            <span className="xss-code-line" key={line}>
              <span className="xss-line-number" aria-hidden="true">
                {line + 1}
              </span>
              <span>
                {tokens.map(([kind, text], index) => (
                  <span className={`xss-syntax-${kind}`} key={index}>
                    {text}
                  </span>
                ))}
                {'\n'}
              </span>
            </span>
          ))}
        </code>
      </pre>
      <p>
        {secure
          ? 'React renders this value as text, not HTML. The comment cannot become a page instruction through this text location.'
          : 'HTML insertion can turn untrusted content into page structure or executable behavior. Never send raw comments into this kind of location.'}
      </p>
    </article>
  );
}

export default function XSSCodeComparison() {
  return (
    <section className="xss-code-section" aria-labelledby="xss-code-heading">
      <div className="xss-section-label">
        <Code2 size={16} />
        <h3 id="xss-code-heading">A small code change. A different outcome.</h3>
        <span>Display-only examples</span>
      </div>
      <div className="xss-code-grid">
        <XSSCodeExample />
        <XSSCodeExample secure />
      </div>
      <details className="xss-details xss-rich-html">
        <summary>What if my application needs rich HTML?</summary>
        <div>
          <p>
            Use a maintained, allowlist-based HTML sanitizer, configured for the content you allow. This
            repository has no existing HTML sanitizer, so this lab uses plain text rather than inventing one.
          </p>
          <p>
            Other locations need other defenses: context-aware output encoding, safe DOM APIs, and URL-scheme
            validation. A restrictive Content Security Policy adds defense in depth; it does not replace safe
            rendering. React text interpolation does not make arbitrary HTML, URLs, or script contexts safe.
          </p>
        </div>
      </details>
    </section>
  );
}
