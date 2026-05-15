import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { Gist } from '../types/github';
import { getLanguageFromFilename, getLanguageLabel, getLanguageColor } from '../constants/languages';

interface GistCardProps {
  gist: Gist;
  onPress: () => void;
  onLongPress?: () => void;
}

export function GistCard({ gist, onPress, onLongPress }: GistCardProps) {
  const theme = useTheme();
  const files = Object.values(gist.files);
  const firstFile = files[0];
  const lang = firstFile ? getLanguageFromFilename(firstFile.filename) : null;
  const langLabel = lang ? getLanguageLabel(lang) : 'Text';
  const langColor = lang ? getLanguageColor(lang) : '#8B949E';
  const description = gist.description?.trim() || firstFile?.filename || 'No description';
  const fileCount = files.length;
  const timeAgo = formatDistanceToNow(new Date(gist.updated_at), { addSuffix: true });

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.langDot, { backgroundColor: langColor }]} />
            <Text
              variant="titleSmall"
              numberOfLines={1}
              style={[styles.description, { color: theme.colors.onSurface }]}
            >
              {description}
            </Text>
            {!gist.public && (
              <Chip
                compact
                style={[styles.secretChip, { backgroundColor: theme.colors.errorContainer }]}
                textStyle={{ color: theme.colors.onErrorContainer, fontSize: 10 }}
              >
                Secret
              </Chip>
            )}
          </View>

          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
            numberOfLines={1}
          >
            {firstFile?.filename}
          </Text>

          <View style={styles.footer}>
            <Chip
              compact
              style={[styles.langChip, { backgroundColor: theme.colors.secondaryContainer }]}
              textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 11 }}
            >
              {langLabel}
            </Chip>
            {fileCount > 1 && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {fileCount} files
              </Text>
            )}
            <Text
              variant="bodySmall"
              style={[styles.time, { color: theme.colors.onSurfaceVariant }]}
            >
              {timeAgo}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  content: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  description: {
    flex: 1,
    fontWeight: '600',
  },
  secretChip: {
    height: 20,
  },
  langChip: {
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  time: {
    marginLeft: 'auto',
  },
});
