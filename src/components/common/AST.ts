export type AstNode =
  | { type: 'document'; children: BlockNode[] }
  | { type: 'paragraph'; children: InlineNode[]; start: number; end: number }
  | { type: 'text'; value: string; start: number; end: number }
  | { type: 'bold'; children: InlineNode[]; start: number; end: number }
  | { type: 'italic'; children: InlineNode[]; start: number; end: number }
  | { type: 'strikethrough'; children: InlineNode[]; start: number; end: number };

export type BlockNode = Extract<AstNode, { type: 'paragraph' }>;
export type InlineNode =
  | { type: 'text'; value: string; start: number; end: number }
  | { type: 'bold' | 'italic' | 'strikethrough'; children: InlineNode[]; start: number; end: number };

export class AST {
  private ast: AstNode = { type: 'document', children: [] };

  private lastText: string = '';

  private static hasMarkdownSyntax(node: AstNode): boolean {
    switch (node.type) {
      case 'document':
        return node.children.some((child) => AST.hasMarkdownSyntax(child));
      case 'paragraph':
        return node.children.some((child) => AST.hasMarkdownSyntax(child));
      case 'text':
        return false;
      default:
        return true;
    }
  }

  parse(text: string): [AstNode, boolean] {
    if (text === this.lastText) return [this.ast, false];

    const newAst = AST.parseBlocks(text);
    const hasMarkdown = AST.hasMarkdownSyntax(newAst);

    if (hasMarkdown) {
      this.ast = newAst;
      this.lastText = text;
      return [this.ast, true];
    }

    return [this.ast, false];
  }

  private static parseBlocks(text: string): AstNode {
    const blocks: BlockNode[] = [];
    let pos = 0;

    while (pos < text.length) {
      const lineEnd = text.indexOf('\n', pos);
      const lineContent = lineEnd === -1
        ? text.slice(pos)
        : text.slice(pos, lineEnd);

      blocks.push({
        type: 'paragraph',
        children: AST.parseInline(lineContent, pos),
        start: pos,
        end: lineEnd === -1 ? text.length : lineEnd,
      });

      pos = (lineEnd === -1 ? text.length : lineEnd) + 1;
    }

    return { type: 'document', children: blocks };
  }

  public static parseInline(text: string, basePos: number): InlineNode[] {
    const nodes: InlineNode[] = [];
    let buffer = '';
    const stack: Extract<InlineNode, { children: InlineNode[] }>[] = [];
    let pos = 0;

    const flushBuffer = (endPos: number) => {
      if (buffer) {
        const target = stack.length > 0 ? stack[stack.length - 1].children : nodes;
        target.push({
          type: 'text',
          value: buffer,
          start: basePos + endPos - buffer.length,
          end: basePos + endPos,
        });
        buffer = '';
      }
    };

    while (pos < text.length) {
      const currentChar = text[pos];
      const nextChar = text[pos + 1];

      if (currentChar === '~' && nextChar === '~') {
        flushBuffer(pos);
        AST.handleFormat(stack, nodes, 'strikethrough', '~~', pos, basePos);
        pos += 2;
        continue;
      }

      if (currentChar === '*' && nextChar === '*') {
        flushBuffer(pos);
        AST.handleFormat(stack, nodes, 'bold', '**', pos, basePos);
        pos += 2;
        continue;
      }

      if (currentChar === '*' && nextChar !== '*') {
        flushBuffer(pos);
        AST.handleFormat(stack, nodes, 'italic', '*', pos, basePos);
        pos += 1;
        continue;
      }

      buffer += currentChar;
      pos++;
    }

    flushBuffer(pos);

    while (stack.length > 0) {
      const unclosed = stack.pop()!;
      if (unclosed.end === -1) {
        const textContent = unclosed.children.map((child) => {
          if (child.type === 'text') return child.value;
          return '';
        }).join('');

        const textNode: InlineNode = {
          type: 'text',
          value: textContent,
          start: unclosed.start,
          end: basePos + pos,
        };
        const index = nodes.indexOf(unclosed);
        if (index !== -1) {
          nodes.splice(index, 1, textNode);
        }
      }
    }

    return nodes;
  }

  private static handleFormat(
    stack: Extract<InlineNode, { children: InlineNode[] }>[],
    nodes: InlineNode[],
    type: 'bold' | 'italic' | 'strikethrough',
    symbol: string,
    pos: number,
    basePos: number,
  ) {
    const existingIndex = stack.findIndex((n) => n.type === type);

    if (existingIndex !== -1) {
      const node = stack.splice(existingIndex, 1)[0];
      node.end = basePos + pos + symbol.length;
    } else {
      const newNode: InlineNode = {
        type,
        children: [],
        start: basePos + pos,
        end: -1,
      };
      stack.push(newNode);
      nodes.push(newNode);
    }
  }

  getAST(): AstNode {
    return this.ast;
  }
}
