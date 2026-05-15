import React, { useMemo } from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import hljs from 'highlight.js/lib/core';

// Register commonly used languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import java from 'highlight.js/lib/languages/java';
import kotlin from 'highlight.js/lib/languages/kotlin';
import swift from 'highlight.js/lib/languages/swift';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import markdown from 'highlight.js/lib/languages/markdown';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import graphql from 'highlight.js/lib/languages/graphql';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import scala from 'highlight.js/lib/languages/scala';
import dart from 'highlight.js/lib/languages/dart';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('java', java);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('graphql', graphql);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('scala', scala);
hljs.registerLanguage('dart', dart);

// GitHub Dark theme colors
const THEME_DARK: Record<string, string> = {
  default: '#E6EDF3',
  comment: '#8B949E',
  keyword: '#FF7B72',
  string: '#A5D6FF',
  number: '#79C0FF',
  function: '#D2A8FF',
  title: '#D2A8FF',
  'class-name': '#FFA657',
  type: '#FFA657',
  builtin: '#79C0FF',
  literal: '#79C0FF',
  variable: '#FFA657',
  attribute: '#79C0FF',
  tag: '#7EE787',
  name: '#7EE787',
  selector: '#7EE787',
  meta: '#8B949E',
  addition: '#aff5b4',
  deletion: '#ffdcd7',
  operator: '#FF7B72',
  punctuation: '#E6EDF3',
  symbol: '#79C0FF',
  params: '#E6EDF3',
  property: '#79C0FF',
  'attr-name': '#79C0FF',
  'attr-value': '#A5D6FF',
};

const THEME_LIGHT: Record<string, string> = {
  default: '#24292F',
  comment: '#6E7781',
  keyword: '#CF222E',
  string: '#0A3069',
  number: '#0550AE',
  function: '#8250DF',
  title: '#8250DF',
  'class-name': '#953800',
  type: '#953800',
  builtin: '#0550AE',
  literal: '#0550AE',
  variable: '#953800',
  attribute: '#0550AE',
  tag: '#116329',
  name: '#116329',
  selector: '#116329',
  meta: '#6E7781',
  addition: '#24292e',
  deletion: '#82071e',
  operator: '#CF222E',
  punctuation: '#24292F',
  symbol: '#0550AE',
  params: '#24292F',
  property: '#0550AE',
  'attr-name': '#0550AE',
  'attr-value': '#0A3069',
};

interface Token {
  text: string;
  classes: string[];
}

// Tokenize hljs HTML output into colored spans
function tokenizeHLJS(html: string): Token[] {
  const tokens: Token[] = [];
  const regex = /<span class="hljs-([^"]+)">|<\/span>|([^<]+)/g;
  const classStack: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      classStack.push(match[1]);
    } else if (match[0] === '</span>') {
      classStack.pop();
    } else if (match[2]) {
      const text = match[2]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      tokens.push({ text, classes: [...classStack] });
    }
  }
  return tokens;
}

function getColor(classes: string[], isDark: boolean): string {
  const theme = isDark ? THEME_DARK : THEME_LIGHT;
  for (const cls of [...classes].reverse()) {
    if (theme[cls]) return theme[cls];
  }
  return theme.default;
}

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  isDark?: boolean;
  fontSize?: number;
}

export function SyntaxHighlighter({
  code,
  language,
  isDark = true,
  fontSize = 13,
}: SyntaxHighlighterProps) {
  const tokens = useMemo(() => {
    try {
      const result = hljs.highlight(code, { language, ignoreIllegals: true });
      return tokenizeHLJS(result.value);
    } catch {
      return [{ text: code, classes: [] }];
    }
  }, [code, language]);

  const bgColor = isDark ? '#0D1117' : '#F6F8FA';

  const lines = useMemo(() => {
    // Reassemble tokens into lines for line numbers
    const lineTokens: Token[][] = [[]];
    for (const token of tokens) {
      const parts = token.text.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) lineTokens.push([]);
        if (parts[i]) {
          lineTokens[lineTokens.length - 1].push({ text: parts[i], classes: token.classes });
        }
      }
    }
    return lineTokens;
  }, [tokens]);

  return (
    <ScrollView
      horizontal
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.lineNumbers}>
        {lines.map((_, idx) => (
          <Text
            key={idx}
            style={[
              styles.lineNumber,
              { fontSize, color: isDark ? '#484F58' : '#8C959F' },
            ]}
          >
            {idx + 1}
          </Text>
        ))}
      </View>
      <View style={styles.codeArea}>
        {lines.map((lineTokens, idx) => (
          <View key={idx} style={styles.line}>
            {lineTokens.map((token, ti) => (
              <Text
                key={ti}
                style={[
                  styles.token,
                  {
                    fontSize,
                    color: getColor(token.classes, isDark),
                    fontFamily: 'monospace',
                  },
                ]}
              >
                {token.text}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    minWidth: '100%',
  },
  lineNumbers: {
    alignItems: 'flex-end',
    marginRight: 12,
    opacity: 0.7,
    minWidth: 30,
  },
  lineNumber: {
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  codeArea: {
    flex: 1,
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 20,
  },
  token: {
    lineHeight: 20,
  },
});
