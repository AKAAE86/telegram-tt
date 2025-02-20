import type { AstNode } from './AST';

import { getCaretPosition, setCaretPosition } from '../../util/selection';

import { AST } from './AST';

export class MarkdownEditor {
  private parser = new AST();

  private editorElement?: HTMLDivElement | null;

  private isComposing = false;

  public initEditor(needMarkdown: boolean, editorElement?: HTMLDivElement | null) {
    if (needMarkdown) {
      this.editorElement = editorElement;
      if (this.editorElement) {
        this.editorElement.contentEditable = 'true';
        this.editorElement.addEventListener('input', this.handleInput.bind(this));
        this.editorElement.addEventListener('compositionstart', () => {
          this.isComposing = true;
        });
        this.editorElement.addEventListener('compositionend', () => {
          this.isComposing = false;
          this.handleInput();
        });
      }
    }
  }

  private handleInput() {
    if (this.editorElement && !this.isComposing) {
      const newText = this.editorElement.innerText;
      const [, needReRender] = this.parser.parse(newText);

      if (needReRender) {
        const inputHandler = this.editorElement.oninput;
        // eslint-disable-next-line no-null/no-null
        this.editorElement.oninput = null;

        this.renderAST();

        requestAnimationFrame(() => {
          this.editorElement!.oninput = inputHandler;
        });
      }
    }
  }

  private renderAST() {
    if (this.editorElement) {
      const inputHandler = this.editorElement.oninput;
      // eslint-disable-next-line no-null/no-null
      this.editorElement.oninput = null;

      const originalHtml = this.editorElement.innerHTML;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = originalHtml;

      MarkdownEditor.processEditor(this.editorElement);

      requestAnimationFrame(() => {
        this.editorElement!.oninput = inputHandler;
      });
    }
  }

  private static isInsideTag(node: Node): string {
    let parent = node.parentNode;
    while (parent) {
      const tagName = (parent as Element).tagName?.toLowerCase();
      if (parent.nodeType === Node.ELEMENT_NODE) {
        if (tagName === 'b' || tagName === 'i' || tagName === 's') {
          return tagName;
        }
      }
      parent = parent.parentNode;
    }
    return '';
  }

  private static processEditor(editor: HTMLDivElement) {
    const selection = window.getSelection();
    let originalOffset = 0;
    let range: Range | undefined;
    let originalNode: Node | undefined;
    const originalCaretPosition = getCaretPosition(editor);

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      originalOffset = range.startOffset;
      originalNode = range.startContainer;
    }

    const originalLength = editor.textContent?.length || 0;

    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      },
    );

    const textNodes = [];
    while (walker.nextNode()) {
      const currentNode = walker.currentNode;
      const parentTag = MarkdownEditor.isInsideTag(currentNode);
      textNodes.push({
        node: currentNode,
        parentTag,
      });
    }

    textNodes.forEach(({ node, parentTag }) => {
      const wrapper = document.createElement('div');
      const htmlOutput = MarkdownEditor.renderASTNode({
        type: 'paragraph',
        children: AST.parseInline(node.nodeValue ?? '', 0),
        start: 0,
        end: node.nodeValue?.length ?? 0,
      }, parentTag);

      if (parentTag) {
        wrapper.innerHTML = `<${parentTag}>${htmlOutput}</${parentTag}>`;
      } else {
        wrapper.innerHTML = htmlOutput;
      }

      if (node === originalNode && originalOffset === (node.textContent?.length ?? 0)) {
        const emptyText = document.createTextNode('\u200B');
        wrapper.appendChild(emptyText);
        originalNode = emptyText;
      }

      const fragment = document.createDocumentFragment();
      while (wrapper.firstChild) {
        fragment.appendChild(wrapper.firstChild);
      }

      node.parentNode?.replaceChild(fragment, node);
    });

    if (selection && range && originalNode) {
      const lengthDiff = (editor.textContent?.length || 0) - originalLength;
      const newOffset = Math.max(0, Math.min(originalCaretPosition + lengthDiff, editor.textContent?.length || 0));
      setCaretPosition(editor, newOffset);
    }
  }

  private static renderASTNode(node: AstNode, parentTag: string = ''): string {
    const escapeHTML = (str: string) => str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    switch (node.type) {
      case 'document':
        return node.children.map((child) => this.renderASTNode(child, parentTag)).join('');
      case 'paragraph':
        return node.children.map((child) => this.renderASTNode(child, parentTag)).join('');
      case 'text':
        return escapeHTML(node.value);
      case 'bold':
        return parentTag === 'b'
          ? node.children.map((child) => this.renderASTNode(child, parentTag)).join('')
          : `<b>${node.children.map((child) => this.renderASTNode(child, 'b')).join('')}</b>`;
      case 'italic':
        return parentTag === 'i'
          ? node.children.map((child) => this.renderASTNode(child, parentTag)).join('')
          : `<i>${node.children.map((child) => this.renderASTNode(child, 'i')).join('')}</i>`;
      case 'strikethrough':
        return parentTag === 's'
          ? node.children.map((child) => this.renderASTNode(child, parentTag)).join('')
          : `<s>${node.children.map((child) => this.renderASTNode(child, 's')).join('')}</s>`;
      default:
        return '';
    }
  }
}
