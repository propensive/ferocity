const pluginKeyword = 'mermaid';
const tokenTypeInline = 'inline';

function preProcess(source: string) {
  return source
    .replace(/\</g, '&lt;')
    .replace(/\>/g, '&gt;');
}

export function extendMarkdownItWithMermaid() {
  return {
    extendMarkdownIt(md: any) {
      md.use(require('markdown-it-container'), pluginKeyword, {
        anyClass: true,
        validate: () => true,

        render: (tokens: any, idx: any) => {
          const token = tokens[idx];
          if (token.info.trim() === pluginKeyword) {
            for (const [i, value] of tokens.entries()) {
              if (value.tag === 'p') {
                value.type = tokenTypeInline;
                value.tag = '';
                value.content = '';
                value.children = [];
              } else if (value !== undefined && value.type === tokenTypeInline) {
                value.content = preProcess(value.content);
              }
            }
          }

          if (token.nesting === 1) {
            return `<div class="${pluginKeyword}">`;
          } else {
            return '</div>';
          }
        }
      });

      const highlight = md.options.highlight;
      md.options.highlight = (code: any, lang: any) => {
        if (lang && lang.match(/\bmermaid\b/i)) {
          return `<div class="${pluginKeyword}">${preProcess(code)}</div>`;
        }
        return highlight(code, lang);
      };
      return md;
    }
  };
}
