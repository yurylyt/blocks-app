import { useRef } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import type { Activity, Entry } from '~/api/types';
import { BlockRow } from './BlockRow';
import { useTheme } from '~/theme/ThemeProvider';

interface Props {
  entry: Entry;
  activity: Activity | null;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

const ACTION_WIDTH = 64;

export function SwipeableBlockRow({ entry, activity, onEdit, onDelete }: Props) {
  const ref = useRef<SwipeableMethods>(null);
  const { tokens } = useTheme();

  function close() {
    ref.current?.close();
  }

  function handleDelete() {
    Alert.alert(
      'Delete block?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: close },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            close();
            onDelete(entry);
          },
        },
      ],
      { cancelable: true, onDismiss: close },
    );
  }

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={32}
      overshootRight={false}
      renderRightActions={(_progress, drag) => (
        <RightActions
          drag={drag}
          danger={tokens.danger}
          onDelete={handleDelete}
        />
      )}
    >
      <Pressable onPress={() => onEdit(entry)} android_ripple={{ color: tokens.surfaceMuted }}>
        <BlockRow entry={entry} activity={activity} />
      </Pressable>
    </ReanimatedSwipeable>
  );
}

function RightActions({
  drag,
  danger,
  onDelete,
}: {
  drag: SharedValue<number>;
  danger: string;
  onDelete: () => void;
}) {
  const deleteStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(drag.value, [-ACTION_WIDTH, 0], [0, ACTION_WIDTH], 'clamp'),
      },
    ],
  }));

  return (
    <View style={styles.actionsRow}>
      <Animated.View style={[styles.action, { backgroundColor: danger }, deleteStyle]}>
        <ActionButton label="Delete" onPress={onDelete} />
      </Animated.View>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <RectButton style={styles.actionButton} onPress={onPress}>
      <Text style={styles.actionLabel}>{label}</Text>
    </RectButton>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    width: ACTION_WIDTH,
  },
  action: {
    width: ACTION_WIDTH,
    overflow: 'hidden',
    borderRadius: Platform.OS === 'ios' ? 12 : 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
