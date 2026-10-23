import { parse } from '@babel/parser';
import type { Plugin } from 'vite';
import { interfaceTranslations } from '../src/utils/interfaceTranslations.ts';

const translatedAttributes = new Set(['alt', 'aria-description', 'aria-label', 'placeholder', 'title']);
const hasNoTranslate = (node: any) =>
  node?.type === 'JSXElement' &&
  node.openingElement.attributes.some(
    (attribute: any) =>
      attribute.type === 'JSXAttribute' &&
      attribute.name?.name === 'translate' &&
      attribute.value?.value === 'no',
  );

interface Edit {
  start: number;
  end: number;
  replacement: string;
}

const normalizeJsxText = (value: string) => {
  const lines = value.replace(/\r\n?/g, '\n').split('\n');
  const lastNonEmptyLine = lines.reduce(
    (last, line, index) => (line.trim() ? index : last),
    -1,
  );
  if (lastNonEmptyLine === -1) return '';

  return lines
    .map((line, index) => {
      let content = line.replace(/\t/g, ' ');
      if (index !== 0) content = content.replace(/^\s+/, '');
      if (index !== lines.length - 1) content = content.replace(/\s+$/, '');
      return content;
    })
    .filter((line, index) => line.length > 0 && index <= lastNonEmptyLine)
    .join(' ');
};

const containsJsx = (node: any): boolean => {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true;
  return Object.entries(node).some(([key, value]) => {
    if (['loc', 'start', 'end', 'extra', 'comments', 'tokens'].includes(key)) return false;
    if (Array.isArray(value)) return value.some(containsJsx);
    return Boolean(value && typeof value === 'object' && containsJsx(value));
  });
};

export const localizationVitePlugin = (): Plugin => ({
  name: 'localize-ui-jsx',
  enforce: 'pre',
  transform(code, id) {
    const normalizedId = id.replace(/\\/g, '/');
    const isComponent = normalizedId.includes('/src/components/') && normalizedId.endsWith('.tsx');
    const isApp = normalizedId.endsWith('/src/App.tsx');
    if (!isComponent && !isApp) return null;

    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    const edits: Edit[] = [];
    const missingTranslations = new Set<string>();

    const checkCatalog = (text: string) => {
      const key = text.replace(/\s+/g, ' ').trim();
      if (key && (!interfaceTranslations[key]?.en || !interfaceTranslations[key]?.ru)) {
        missingTranslations.add(key);
      }
    };

    const checkExpressionLiterals = (node: any) => {
      if (!node || typeof node !== 'object') return;
      // Internal state comparisons are not visible text. Validate only rendered branches.
      if (['BinaryExpression','UnaryExpression'].includes(node.type)) return;
      if (node.type === 'ConditionalExpression') {
        checkExpressionLiterals(node.consequent); checkExpressionLiterals(node.alternate); return;
      }
      if (node.type === 'LogicalExpression') { checkExpressionLiterals(node.right); return; }
      if (node.type === 'StringLiteral') checkCatalog(node.value);
      if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
        checkCatalog(node.quasis[0]?.value?.cooked ?? '');
      }
      for (const [key, value] of Object.entries(node)) {
        if (['loc', 'start', 'end', 'extra', 'comments', 'tokens'].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(checkExpressionLiterals);
        else if (value && typeof value === 'object') checkExpressionLiterals(value);
      }
    };

    const visit = (node: any, parent?: any) => {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'JSXText' && !hasNoTranslate(parent)) {
        const text = normalizeJsxText(node.value);
        if (text) {
          checkCatalog(text);
          edits.push({
            start: node.start,
            end: node.end,
            replacement: `{localizeText(${JSON.stringify(text)})}`,
          });
        }
      }

      if (
        node.type === 'JSXAttribute' &&
        !hasNoTranslate(parent?.parent) &&
        translatedAttributes.has(node.name?.name) &&
        node.value?.type === 'StringLiteral'
      ) {
        checkCatalog(node.value.value);
        edits.push({
          start: node.value.start,
          end: node.value.end,
          replacement: `{localizeText(${JSON.stringify(node.value.value)})}`,
        });
      }

      if (
        node.type === 'JSXExpressionContainer' &&
        node.expression?.type !== 'JSXEmptyExpression' &&
        !hasNoTranslate(parent) &&
        (
          (parent?.type === 'JSXElement' && parent.children?.includes(node)) ||
          (parent?.type === 'JSXFragment' && parent.children?.includes(node)) ||
          (parent?.type === 'JSXAttribute' && translatedAttributes.has(parent.name?.name))
        ) &&
        !containsJsx(node.expression)
      ) {
        checkExpressionLiterals(node.expression);
        const alreadyLocalized =
          node.expression.type === 'CallExpression' &&
          ['localizeNode', 'localizeText'].includes(node.expression.callee?.name);
        if (!alreadyLocalized) {
          const source = code.slice(node.expression.start, node.expression.end);
          edits.push({
            start: node.expression.start,
            end: node.expression.end,
            replacement: `localizeNode(${source})`,
          });
        }
      }

      for (const [key, value] of Object.entries(node)) {
        if (['loc', 'start', 'end', 'extra', 'comments', 'tokens'].includes(key)) continue;
        if (Array.isArray(value)) value.forEach((child) => visit(child, node));
        else if (value && typeof value === 'object') visit(value, node);
      }
    };

    visit(ast);
    if (missingTranslations.size) {
      throw new Error(
        `Missing English/Russian UI translations in ${id}: ${[...missingTranslations].slice(0, 12).join(' | ')}`,
      );
    }

    if (!edits.length) return null;
    let transformed = code;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      transformed =
        transformed.slice(0, edit.start) +
        edit.replacement +
        transformed.slice(edit.end);
    }
    const importSource = isApp ? './utils/i18n' : '../utils/i18n';
    const existingBindings = new Set<string>();
    for (const statement of (ast.program.body as any[])) {
      if (statement.type !== 'ImportDeclaration' || statement.source.value !== importSource) continue;
      for (const specifier of statement.specifiers) {
        if (specifier.type === 'ImportSpecifier') existingBindings.add(specifier.imported.name);
      }
    }
    const importsNeeded = ['localizeNode', 'localizeText'].filter((name) => !existingBindings.has(name));
    if (importsNeeded.length) {
      transformed = `import { ${importsNeeded.join(', ')} } from '${importSource}';\n${transformed}`;
    }
    return { code: transformed, map: null };
  },
});
