import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Surface, Text, IconButton, Divider, useTheme, Chip } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { SyntaxHighlighter } from '../utils/syntax-highlighter';
import { GistFile } from '../types/github';
import { getLanguageFromFilename, getLanguageLabel } from '../constants/languages';

interface CodeViewerProps {
  file: GistFile;
  isDark?: boolean;
  showCopyButton?: boolean;
}

export function CodeViewer({ file, isDark = true, showCopyButton = true }: CodeViewerProps) {
  const theme = useTheme();
  const lang = file.language
    ? file.language.toLowerCase()
    : getLanguageFromFilename(file.filename);
  const langLabel = getLanguageLabel(lang);
  const content = file.content ?? '';
  const lineCount = content.split('\n').length;
  const sizeKB = (file.size / 1024).toFixed(1);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(content);
  };

  return (
    <Surface
      style={[styles.container, { borderRadius: 12 }]}
      elevation={1}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#161B22' : '#F6F8FA',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          },
        ]}
      >
        <Chip compact style={styles.langChip}>
          {langLabel}
        </Chip>
        <Text
          variant="bodySmall"
          style={{ color: isDark ? '#8B949E' : '#6E7781', flex: 1, marginLeft: 8 }}
          numberOfLines={1}
        >
          {file.filename}
        </Text>
        <Text variant="bodySmall" style={{ color: isDark ? '#8B949E' : '#6E7781' }}>
          {lineCount} lines · {sizeKB} KB
        </Text>
        {showCopyButton && (
          <IconButton
            icon="content-copy"
            size={18}
            iconColor={isDark ? '#8B949E' : '#6E7781'}
            onPress={handleCopy}
          />
        )}
      </View>
      <Divider />
      <ScrollView style={styles.code} nestedScrollEnabled>
        {content ? (
          <SyntaxHighlighter code={content} language={lang} isDark={isDark} fontSize={13} />
        ) : (
          <Text style={{ color: isDark ? '#8B949E' : '#6E7781', padding: 12 }}>
            (empty file)
          </Text>
        )}
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  langChip: {
    height: 22,
  },
  code: {
    maxHeight: 400,
  },
});
