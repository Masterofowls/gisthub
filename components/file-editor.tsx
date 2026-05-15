import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, IconButton, Divider, useTheme, Chip } from 'react-native-paper';
import { GistFile } from '../types/github';
import { POPULAR_LANGUAGES, LANGUAGE_LABELS, getLanguageFromFilename } from '../constants/languages';

interface FileEditorEntry {
  filename: string;
  content: string;
  language?: string;
}

interface FileEditorProps {
  files: FileEditorEntry[];
  onChange: (files: FileEditorEntry[]) => void;
}

export function FileEditor({ files, onChange }: FileEditorProps) {
  const theme = useTheme();
  const [expandedLangPicker, setExpandedLangPicker] = useState<number | null>(null);

  const updateFile = (idx: number, patch: Partial<FileEditorEntry>) => {
    const updated = files.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    onChange(updated);
  };

  const addFile = () => {
    onChange([...files, { filename: `file${files.length + 1}.txt`, content: '' }]);
  };

  const removeFile = (idx: number) => {
    if (files.length <= 1) return;
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <View>
      {files.map((file, idx) => (
        <View
          key={idx}
          style={[
            styles.fileBlock,
            { backgroundColor: theme.colors.surfaceVariant, borderRadius: 12 },
          ]}
        >
          <View style={styles.fileHeader}>
            <TextInput
              label="Filename"
              value={file.filename}
              onChangeText={(v) => {
                const lang = getLanguageFromFilename(v);
                updateFile(idx, { filename: v, language: lang });
              }}
              mode="outlined"
              style={styles.filenameInput}
              dense
            />
            {files.length > 1 && (
              <IconButton
                icon="close"
                size={18}
                onPress={() => removeFile(idx)}
                iconColor={theme.colors.error}
              />
            )}
          </View>

          <Chip
            compact
            mode="outlined"
            style={styles.langChip}
            onPress={() => setExpandedLangPicker(expandedLangPicker === idx ? null : idx)}
          >
            {LANGUAGE_LABELS[file.language ?? ''] ?? file.language ?? 'Auto'}
          </Chip>

          {expandedLangPicker === idx && (
            <View style={styles.langPicker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {POPULAR_LANGUAGES.map((lang) => (
                  <Chip
                    key={lang}
                    compact
                    selected={file.language === lang}
                    onPress={() => {
                      updateFile(idx, { language: lang });
                      setExpandedLangPicker(null);
                    }}
                    style={styles.langOption}
                  >
                    {LANGUAGE_LABELS[lang] ?? lang}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          )}

          <TextInput
            label="Content"
            value={file.content}
            onChangeText={(v) => updateFile(idx, { content: v })}
            mode="outlined"
            multiline
            numberOfLines={12}
            style={styles.codeInput}
            contentStyle={styles.codeContent}
          />
        </View>
      ))}

      <Button
        mode="outlined"
        icon="plus"
        onPress={addFile}
        style={styles.addFileBtn}
      >
        Add File
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  fileBlock: {
    padding: 12,
    marginBottom: 12,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filenameInput: {
    flex: 1,
  },
  langChip: {
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  langPicker: {
    marginBottom: 6,
  },
  langOption: {
    marginRight: 4,
  },
  codeInput: {
    fontFamily: 'monospace',
  },
  codeContent: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  addFileBtn: {
    marginTop: 4,
  },
});
