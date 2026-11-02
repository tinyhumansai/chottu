import { VoiceNotePart } from "@/voice-notes/message-part";
import { VOICE_NOTE } from "@/voice-notes/types";
import { useCSSVariable } from "uniwind";
import {
  UserMessageAttachments,
} from "@/components/assistant-ui/elements/attachment.aui";
import {
  groupedIconButtonHitSlop,
  iconButtonClassName,
  iconButtonHitSlop,
} from "@/components/assistant-ui/elements/icon-button";
import { File } from "@/components/assistant-ui/elements/file";
import { Image } from "@/components/assistant-ui/elements/image";
import { MarkdownText } from "@/components/assistant-ui/elements/markdown-text";
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "@/components/assistant-ui/elements/reasoning.aui";
import {
  ShimmerLabel,
  useAnnounce,
  webLiveRegion,
} from "@/components/assistant-ui/elements/surfaces";
import { ToolFallback } from "@/components/assistant-ui/elements/tool-fallback";
import { TypingIndicator } from "@/components/assistant-ui/elements/typing-indicator";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  ActionBarPrimitive,
  AuiIf,
  type AssistantState,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadPrimitive,
  type TextMessagePartComponent,
  type ThreadMessage,
  type ToolCallMessagePartComponent,
  type GroupByContext,
  groupPartByType,
  useAui,
  useAuiState,
} from "@assistant-ui/react-native";
import * as Clipboard from "expo-clipboard";
import {
  ArrowUpIcon,
  AudioLinesIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  MicIcon,
  PhoneIcon,
  RefreshCwIcon,
} from "lucide-react-native";
import {
  type ComponentRef,
  type ComponentType,
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AccessibilityInfo,
  type FlatList,
  type FlatListProps,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  View,
  type ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isNewChatView = (s: AssistantState) =>
  s.thread.messages.length === 0 &&
  (!s.thread.isLoading || s.threads.isLoading);

const isHistoryLoadingView = (s: AssistantState) =>
  s.thread.messages.length === 0 &&
  s.thread.isLoading &&
  !s.thread.isDisabled &&
  !s.threads.isLoading;

export type ThreadGroupPart = MessagePrimitive.GroupedParts.GroupPart;

const reasoningDuration = (timing: ThreadGroupPart["timing"]) =>
  timing?.completedAt === undefined
    ? undefined
    : Math.round((timing.completedAt - timing.startedAt) / 1000);

export type ThreadComponents = {
  AssistantMessage?: ComponentType | undefined;
  Welcome?: ComponentType | undefined;
  ToolFallback?: ToolCallMessagePartComponent | undefined;
  /** Renders tool calls that carry a nested conversation and have no registered UI; without it they render like any other tool call. */
  TaskGroup?: ComponentType<{ group: ThreadGroupPart }> | undefined;
  /** Replaces the text input of both the new message composer and the edit composer; read `composer.type` to tell them apart. */
  ComposerInput?: ComponentType | undefined;
  /** Overlays the message list, which keeps a gutter free along its left edge for it; it reads the list through `useThreadViewport`. Mounting or unmounting it remounts the list. */
  Rail?: ComponentType | undefined;
  /** Chottu: shown in the composer in place of send while it is empty (the voice note mic). */
  ComposerExtra?: ComponentType | undefined;
  /** Chottu: drawn over the whole composer row (the voice note recording bar); renders null when idle. */
  ComposerOverlay?: ComponentType | undefined;
};

export type ThreadHistory = {
  /** Whether messages older than the loaded window exist. */
  readonly hasMore: boolean;
  /** Whether a page of older messages is on its way. */
  readonly isLoadingMore: boolean;
  /** Loads the next page of older messages above the window. */
  readonly loadMore: () => void;
};

export type ThreadProps = {
  components?: ThreadComponents | undefined;
  /** Chottu: room taken by floating chrome over the thread (top bar, tab bar), safe areas included. */
  insets?: { top: number; bottom: number } | undefined;
  /** A windowed thread: the list asks for older messages when it reaches its start and shows the loading edge above them. Omit it to page through the runtime's `thread.hasEarlier` and `loadEarlier()`. */
  history?: ThreadHistory | undefined;
};

export type ThreadViewportSnapshot = {
  /** The ids of the messages on screen, in list order. */
  readonly visibleMessageIds: readonly string[];
  /**
   * Zero until the list is within one screenful of its end, then the share of
   * that stretch scrolled, so a reading line placed at this fraction of the
   * viewport can still reach the final turns.
   */
  readonly descent: number;
  /** The message list's height. */
  readonly height: number;
  /** The message list's offset from the top of the thread viewport, which grows while the history edge shows. */
  readonly top: number;
};

export type ThreadViewport = ThreadViewportSnapshot & {
  /** Scrolls the message list until the message starts at the top of the viewport. */
  readonly scrollToMessage: (id: string) => void;
};

type ThreadViewportStore = {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => ThreadViewportSnapshot;
  readonly scrollToMessage: (id: string) => void;
};

const EMPTY_COMPONENTS: ThreadComponents = {};
const EMPTY_IDS: readonly string[] = [];
const IDLE_VIEWPORT: ThreadViewportSnapshot = {
  visibleMessageIds: EMPTY_IDS,
  descent: 0,
  height: 0,
  top: 0,
};
const MESSAGE_VIEWABILITY = {
  minimumViewTime: 0,
  viewAreaCoveragePercentThreshold: 0,
};
type ViewabilityInfo = Parameters<
  NonNullable<FlatListProps<ThreadMessage>["onViewableItemsChanged"]>
>[0];
const SCROLL_RETRY_DELAY = 100;

const ThreadComponentsContext =
  createContext<ThreadComponents>(EMPTY_COMPONENTS);

const ThreadViewportContext = createContext<ThreadViewportStore>({
  subscribe: () => () => {},
  getSnapshot: () => IDLE_VIEWPORT,
  scrollToMessage: () => {},
});

const createViewportStore = () => {
  const listeners = new Set<() => void>();
  let snapshot = IDLE_VIEWPORT;

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    publish: (next: Partial<ThreadViewportSnapshot>) => {
      snapshot = { ...snapshot, ...next };
      for (const listener of listeners) listener();
    },
  };
};

/** What the thread's message list shows right now, for an element that overlays it. */
export const useThreadViewport = (): ThreadViewport => {
  const { subscribe, getSnapshot, scrollToMessage } = useContext(
    ThreadViewportContext,
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useMemo(
    () => ({ ...snapshot, scrollToMessage }),
    [snapshot, scrollToMessage],
  );
};

const copyToClipboard = async (text: string) => {
  await Clipboard.setStringAsync(text);
};

export const Thread: FC<ThreadProps> = ({
  components = EMPTY_COMPONENTS,
  history,
  insets: chrome,
}) => {
  const aui = useAui();
  const isEmpty = useAuiState(isNewChatView);
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const insets = useSafeAreaInsets();
  const viewportRef = useRef<ComponentRef<typeof View>>(null);
  const [viewportTop, setViewportTop] = useState(0);
  const [store] = useState(createViewportStore);
  const listRef = useRef<FlatList<ThreadMessage>>(null);
  const metricsRef = useRef({
    contentHeight: 0,
    viewportHeight: 0,
    scrollY: 0,
  });
  const jumpRef = useRef<
    | {
        id: string;
        retried: boolean;
        timer: ReturnType<typeof setTimeout> | undefined;
      }
    | undefined
  >(undefined);
  const { Rail } = components;

  // Chottu: react-native-web has no `maintainVisibleContentPosition`, so on
  // web the list would stop following a streaming reply. Keep it pinned to
  // the end while the reader is at (or near) the bottom.
  const pinnedRef = useRef(true);
  const followOnWeb =
    Platform.OS === "web" && !Rail
      ? {
          onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              event.nativeEvent;
            pinnedRef.current =
              contentSize.height - layoutMeasurement.height - contentOffset.y <
              120;
          },
          // After layout settles, or the scroll lands short of the new end.
          onContentSizeChange: () => {
            if (pinnedRef.current)
              requestAnimationFrame(() =>
                listRef.current?.scrollToEnd({ animated: false }),
              );
          },
        }
      : {};

  useEffect(() => () => clearTimeout(jumpRef.current?.timer), []);

  const jumpTo = useCallback(
    (id: string) => {
      const index = aui.thread
        .getState()
        .messages.findIndex((message) => message.id === id);
      if (index === -1) return;
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0,
      });
    },
    [aui],
  );

  const scrollToMessage = useCallback(
    (id: string) => {
      clearTimeout(jumpRef.current?.timer);
      jumpRef.current = { id, retried: false, timer: undefined };
      jumpTo(id);
    },
    [jumpTo],
  );

  // The list cannot scroll to a row it has not laid out yet: an instant jump
  // to the estimated offset gets it rendering near the row, and one retry,
  // resolved by id again so a changed list cannot send it to another turn,
  // lands on the row itself.
  const onScrollToIndexFailed = useCallback(
    ({
      index,
      averageItemLength,
    }: {
      index: number;
      averageItemLength: number;
    }) => {
      listRef.current?.scrollToOffset({
        offset: index * averageItemLength,
        animated: false,
      });
      const jump = jumpRef.current;
      if (!jump || jump.retried) return;
      jump.retried = true;
      jump.timer = setTimeout(() => jumpTo(jump.id), SCROLL_RETRY_DELAY);
    },
    [jumpTo],
  );

  const publishDescent = useCallback(() => {
    const { contentHeight, viewportHeight, scrollY } = metricsRef.current;
    const remaining = contentHeight - viewportHeight - scrollY;
    const descent =
      viewportHeight > 0
        ? Math.round(
            Math.min(
              1,
              Math.max(0, (viewportHeight - remaining) / viewportHeight),
            ) * 100,
          ) / 100
        : 0;
    if (descent !== store.getSnapshot().descent) store.publish({ descent });
  }, [store]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: ViewabilityInfo) => {
      store.publish({
        visibleMessageIds: viewableItems.map((token) => token.item.id),
      });
    },
    [store],
  );

  const onListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      metricsRef.current = {
        contentHeight: contentSize.height,
        viewportHeight: layoutMeasurement.height,
        scrollY: contentOffset.y,
      };
      publishDescent();
    },
    [publishDescent],
  );

  const onListContentSizeChange = useCallback(
    (_width: number, height: number) => {
      metricsRef.current.contentHeight = height;
      publishDescent();
    },
    [publishDescent],
  );

  const onListLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, y } = event.nativeEvent.layout;
      metricsRef.current.viewportHeight = height;
      const snapshot = store.getSnapshot();
      if (height !== snapshot.height || y !== snapshot.top) {
        store.publish({ height, top: y });
      }
      publishDescent();
    },
    [publishDescent, store],
  );

  const viewport = useMemo(
    () => ({
      subscribe: store.subscribe,
      getSnapshot: store.getSnapshot,
      scrollToMessage,
    }),
    [store, scrollToMessage],
  );

  useEffect(() => {
    if (isRunning) {
      AccessibilityInfo.announceForAccessibility("Assistant is working");
    }
  }, [isRunning]);

  // KeyboardAvoidingView measures its frame against its parent, so a navigation
  // header above the thread would leave the composer covered by the header's
  // height; the viewport's window position supplies that offset, minus the
  // bottom inset the footer already pads.
  const measureViewport = () => {
    viewportRef.current?.measureInWindow((_x, y) => setViewportTop(y));
  };

  return (
    <ThreadComponentsContext.Provider value={components}>
      <ThreadViewportContext.Provider value={viewport}>
        {/* Chottu: transparent, so the chat wallpaper shows through. */}
        <ThreadPrimitive.Root className="aui-root aui-thread-root flex-1 bg-transparent">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={viewportTop - insets.bottom}
          >
            <View
              ref={viewportRef}
              onLayout={measureViewport}
              className={cn(
                "aui-thread-viewport mx-auto w-full max-w-[44rem] flex-1",
                isEmpty && "justify-center",
              )}
            >
              <AuiIf condition={isNewChatView}>
                <WelcomeSlot />
              </AuiIf>
              <AuiIf condition={isHistoryLoadingView}>
                <ThreadHistorySkeleton />
              </AuiIf>
              <AuiIf condition={(s) => s.thread.messages.length > 0}>
                <AuiIf
                  condition={(s) =>
                    history ? history.isLoadingMore : s.thread.isLoadingEarlier
                  }
                >
                  <HistoryEdge />
                </AuiIf>
                <ThreadPrimitive.MessagesFlatList
                  // Viewability props cannot change once a FlatList is mounted.
                  key={Rail ? "tracked" : "plain"}
                  ref={listRef}
                  className="aui-message-group flex-1"
                  contentContainerClassName={cn(
                    "gap-3 px-3 pt-4 pb-4",
                    Rail && "pl-10",
                  )}
                  // Chottu: messages scroll under the floating top bar.
                  contentContainerStyle={chrome ? { paddingTop: chrome.top + 8 } : undefined}
                  showsVerticalScrollIndicator={false}
                  keyboardDismissMode="interactive"
                  keyboardShouldPersistTaps="handled"
                  {...followOnWeb}
                  {...(Rail
                    ? {
                        onContentSizeChange: onListContentSizeChange,
                        onLayout: onListLayout,
                        onScroll: onListScroll,
                        onScrollToIndexFailed,
                        onViewableItemsChanged,
                        viewabilityConfig: MESSAGE_VIEWABILITY,
                      }
                    : {})}
                  {...(history
                    ? {
                        history,
                      }
                    : {})}
                >
                  {() => <ThreadMessage />}
                </ThreadPrimitive.MessagesFlatList>
              </AuiIf>
              <View
                className="aui-thread-viewport-footer gap-4 px-2"
                // Chottu: the composer floats just above the tab bar.
                style={{ paddingBottom: chrome ? chrome.bottom + 8 : insets.bottom + 8 }}
              >
                <Composer />
                <AuiIf
                  condition={(s) => isNewChatView(s) && s.composer.isEmpty}
                >
                  <ThreadSuggestions />
                </AuiIf>
              </View>
              {Rail && (
                <View
                  pointerEvents="box-none"
                  className="aui-thread-rail absolute inset-0"
                >
                  <Rail />
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </ThreadPrimitive.Root>
      </ThreadViewportContext.Provider>
    </ThreadComponentsContext.Provider>
  );
};

const WelcomeSlot: FC = () => {
  const { Welcome = ThreadWelcome } = useContext(ThreadComponentsContext);
  return <Welcome />;
};

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);
  const isSpoken = useAuiState((s) => s.message.metadata.modality === "voice");
  const { AssistantMessage: CustomAssistantMessage } = useContext(
    ThreadComponentsContext,
  );

  if (isEditing) return <EditComposer />;
  if (isSpoken) return <SpokenMessage />;
  if (role === "user") return <UserMessage />;
  const Assistant = CustomAssistantMessage ?? AssistantMessage;
  return <Assistant />;
};

type VoiceRunPosition = "single" | "start" | "middle" | "end";

const useVoiceRunPosition = (): VoiceRunPosition =>
  useAuiState((s) => {
    const before =
      s.thread.messages[s.message.index - 1]?.metadata.modality === "voice";
    const after =
      s.thread.messages[s.message.index + 1]?.metadata.modality === "voice";
    if (before) return after ? "middle" : "end";
    return after ? "start" : "single";
  });

const SpokenText: TextMessagePartComponent = ({ text }) => (
  <Text
    className="aui-spoken-message-text text-foreground text-sm leading-relaxed"
    selectable
  >
    {text}
  </Text>
);

const SpokenMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const position = useVoiceRunPosition();
  const isSpeaking = useAuiState(
    (s) =>
      s.message.role === "assistant" && s.message.status?.type === "running",
  );
  const opensExchange = position === "start" || position === "single";

  return (
    <MessagePrimitive.Root
      className={cn(
        "aui-spoken-message bg-muted/40 mx-2 px-3 py-1.5",
        `aui-spoken-message-${position}`,
        position === "single" && "rounded-xl py-2",
        position === "start" && "rounded-t-xl pt-2",
        position === "middle" && "-mt-6",
        position === "end" && "-mt-6 rounded-b-xl pb-2",
      )}
    >
      {opensExchange && (
        <View className="aui-spoken-exchange-header mb-1.5 flex-row items-center gap-1.5">
          <Icon as={PhoneIcon} className="text-muted-foreground size-3" />
          <Text className="text-muted-foreground text-xs">
            Voice conversation
          </Text>
        </View>
      )}
      <View className="aui-spoken-message-content flex-row items-start gap-2">
        <View
          className="mt-1 shrink-0"
          accessible
          accessibilityLabel={role === "user" ? "You said" : "Assistant said"}
        >
          <Icon
            as={role === "user" ? MicIcon : AudioLinesIcon}
            className="text-muted-foreground size-3.5"
          />
        </View>
        <View className="min-w-0 flex-1 flex-row items-center">
          <View className="min-w-0 flex-1">
            <MessagePrimitive.Parts components={{ Text: SpokenText }} />
            {isSpeaking && (
              <TypingIndicator
                variant="bare"
                announce={false}
                className="aui-spoken-message-indicator ms-1"
                accessibilityLabel="Assistant is speaking"
              />
            )}
          </View>
          <SpokenActionBar />
        </View>
      </View>
    </MessagePrimitive.Root>
  );
};

const SpokenActionBar: FC = () => (
  <AuiIf
    condition={(s) =>
      !(s.message.role === "assistant" && s.message.status?.type === "running")
    }
  >
    <View className="aui-spoken-action-bar flex-row gap-1">
      <ActionBarPrimitive.Copy
        copyToClipboard={copyToClipboard}
        className={cn(iconButtonClassName, "size-6")}
        hitSlop={groupedIconButtonHitSlop}
        accessibilityLabel="Copy"
      >
        {({ isCopied }) => (
          <Icon
            as={isCopied ? CheckIcon : CopyIcon}
            className="text-muted-foreground size-3.5"
          />
        )}
      </ActionBarPrimitive.Copy>
    </View>
  </AuiIf>
);

// The edge sits above the list rather than inside it as a header: the list
// keeps its first visible row anchored, so a header inserted above that row
// would land outside the viewport instead of pushing into it.
const HistoryEdge: FC = () => {
  useAnnounce("Loading earlier messages");

  return (
    <View
      className="aui-thread-history-edge items-center pb-4"
      accessibilityLiveRegion={webLiveRegion}
    >
      <ShimmerLabel className="text-muted-foreground text-[13px]">
        Loading earlier messages
      </ShimmerLabel>
    </View>
  );
};

const ThreadHistorySkeleton: FC = () => (
  <View
    className="aui-thread-history-skeleton gap-6 px-4 pt-4"
    accessible
    accessibilityRole="progressbar"
    accessibilityLabel="Loading conversation"
  >
    <View className="bg-muted ml-auto h-9 w-2/5 rounded-xl" />
    <View className="gap-2">
      <View className="bg-muted h-4 w-11/12 rounded" />
      <View className="bg-muted h-4 w-4/5 rounded" />
      <View className="bg-muted h-4 w-3/5 rounded" />
    </View>
    <View className="bg-muted ml-auto h-9 w-1/3 rounded-xl" />
    <View className="gap-2">
      <View className="bg-muted h-4 w-10/12 rounded" />
      <View className="bg-muted h-4 w-2/3 rounded" />
    </View>
  </View>
);

const ThreadWelcome: FC = () => (
  <View className="aui-thread-welcome-root mb-6 items-center px-4">
    <Text className="aui-thread-welcome-message text-foreground text-center text-2xl font-medium tracking-tight">
      How can I help you today?
    </Text>
  </View>
);

const ThreadSuggestions: FC = () => (
  <View className="aui-thread-welcome-suggestions w-full flex-row flex-wrap items-center justify-center gap-2">
    <ThreadPrimitive.Suggestions>
      {() => <ThreadSuggestionItem />}
    </ThreadPrimitive.Suggestions>
  </View>
);

const ThreadSuggestionItem: FC = () => (
  <SuggestionPrimitive.Trigger
    send
    className="aui-thread-welcome-suggestion border-border/60 active:bg-muted flex-row items-center gap-1.5 rounded-full border px-3.5 py-1.5"
  >
    <SuggestionPrimitive.Title className="aui-thread-welcome-suggestion-text-1 text-foreground text-sm" />
    <AuiIf condition={(s) => !!s.suggestion.label}>
      <SuggestionPrimitive.Description className="aui-thread-welcome-suggestion-text-2 text-muted-foreground text-sm" />
    </AuiIf>
  </SuggestionPrimitive.Trigger>
);

// Chottu: the placeholder colour comes straight from the theme token; Uniwind's
// `accent-*` class extraction finds no colour in our tokens on web.
const DefaultComposerInput: FC = () => {
  const placeholder = useCSSVariable("--color-muted-foreground");

  return (
    <ComposerPrimitive.Input
      placeholder="Message Chottu"
      placeholderTextColor={placeholder === undefined ? undefined : String(placeholder)}
      // Chottu: one line tall until you type more.
      className="aui-composer-input text-foreground web:resize-none web:outline-none max-h-36 min-h-9 flex-1 px-3 py-1.5 text-base leading-6"
      multiline
      accessibilityLabel="Message input"
    />
  );
};

const Composer: FC = () => {
  const { ComposerInput = DefaultComposerInput, ComposerOverlay } = useContext(
    ThreadComponentsContext,
  );

  return (
    <ComposerPrimitive.Root className="aui-composer-root w-full">
      {/* Chottu: a single floating row, the same height as the tab bar; no attachments yet. */}
      <View className="aui-composer-shell border-border/60 bg-glass relative min-h-[46px] flex-row items-end gap-1 rounded-[23px] border p-1 shadow-md">
        <ComposerInput />
        <ComposerAction />
        {ComposerOverlay && <ComposerOverlay />}
      </View>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  const { ComposerExtra } = useContext(ThreadComponentsContext);
  // The stop control only cancels the send while no run it could stop is going.
  const isSending = useAuiState(
    (s) =>
      s.composer.submission !== undefined &&
      !(s.thread.isRunning && s.thread.capabilities.cancel),
  );

  return (
    <View className="aui-composer-action-wrapper flex-row items-center">
      <View className="flex-row items-center gap-1.5">
        {ComposerExtra && (
          <AuiIf condition={(s) => s.composer.isEmpty && !s.thread.isRunning}>
            <ComposerExtra />
          </AuiIf>
        )}
        <AuiIf
          condition={(s) =>
            s.composer.submission === undefined &&
            (!s.thread.isRunning || s.thread.voice !== undefined) &&
            !(ComposerExtra && s.composer.isEmpty)
          }
        >
          <ComposerPrimitive.Send
            className="aui-composer-send bg-primary active:bg-primary/90 size-9 items-center justify-center rounded-full disabled:opacity-50"
            hitSlop={iconButtonHitSlop}
            accessibilityLabel="Send message"
          >
            <Icon
              as={ArrowUpIcon}
              className="aui-composer-send-icon text-primary-foreground size-4"
            />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf
          condition={(s) =>
            s.composer.submission !== undefined ||
            (s.thread.isRunning && s.thread.voice === undefined)
          }
        >
          <ComposerPrimitive.Cancel
            className="aui-composer-cancel bg-primary active:bg-primary/90 size-9 items-center justify-center rounded-full"
            hitSlop={iconButtonHitSlop}
            accessibilityLabel={
              isSending ? "Cancel sending" : "Stop generating"
            }
          >
            <View className="aui-composer-cancel-icon bg-primary-foreground size-3 rounded-[2px]" />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </View>
    </View>
  );
};

const MessageError: FC = () => (
  <ErrorPrimitive.Root className="aui-message-error-root border-destructive bg-destructive/10 dark:bg-destructive/5 mt-2 rounded-md border p-3">
    <ErrorPrimitive.Message
      className="aui-message-error-message text-destructive text-sm"
      numberOfLines={2}
    />
  </ErrorPrimitive.Root>
);

const UserText: TextMessagePartComponent = ({ text }) => (
  <Text
    className="aui-user-message-text text-bubble-user-foreground text-base leading-6"
    selectable
  >
    {text}
  </Text>
);

const AssistantIndicator: FC = () => {
  const isRunning = useAuiState((s) => s.message.status?.type === "running");
  if (!isRunning) return null;

  return (
    <TypingIndicator
      variant="bare"
      announce={false}
      className="aui-assistant-message-indicator py-2"
      accessibilityLabel="Assistant is working"
    />
  );
};

const messageGroupBy = groupPartByType({
  reasoning: ["group-chainOfThought", "group-reasoning"],
  "tool-call": ["group-chainOfThought", "group-tool"],
  "standalone-tool-call": [],
});

type ThreadGroupKey =
  | "group-chainOfThought"
  | "group-reasoning"
  | "group-tool"
  | "group-task";

const TASK_GROUP_PATH: readonly ThreadGroupKey[] = [
  "group-chainOfThought",
  "group-task",
];

const taskAwareGroupBy = (
  part: Parameters<typeof messageGroupBy>[0],
  context?: GroupByContext,
): readonly ThreadGroupKey[] => {
  const path = messageGroupBy(part, context);
  return part.type === "tool-call" &&
    part.messages !== undefined &&
    path.length > 0 &&
    !context?.toolUIs?.[part.toolName]?.length
    ? TASK_GROUP_PATH
    : path;
};

const AssistantMessage: FC = () => {
  const { ToolFallback: CustomToolFallback, TaskGroup: TaskGroupComponent } =
    useContext(ThreadComponentsContext);
  const ToolFallbackComponent = CustomToolFallback ?? ToolFallback;
  const groupBy = TaskGroupComponent ? taskAwareGroupBy : messageGroupBy;

  return (
    <MessagePrimitive.Root className="aui-assistant-message-root">
      <MessageActionsRow side="start" actions={<AssistantActionBar />}>
      {/* Chottu: replies sit in a bubble too. */}
      <View className="aui-assistant-message-content bg-bubble-assistant max-w-[85%] shrink rounded-[20px] px-4 py-2 shadow-sm">
        <MessagePrimitive.GroupedParts groupBy={groupBy}>
          {({ part, children }) => {
            switch (part.type) {
              case "group-chainOfThought":
              case "group-tool":
                return children;
              case "group-task":
                return TaskGroupComponent ? (
                  <TaskGroupComponent group={part} />
                ) : null;
              case "group-reasoning": {
                const streaming = part.status.type === "running";
                return (
                  <ReasoningRoot streaming={streaming}>
                    <ReasoningTrigger
                      active={streaming}
                      duration={reasoningDuration(part.timing)}
                    />
                    <ReasoningContent>
                      <ReasoningText>{children}</ReasoningText>
                    </ReasoningContent>
                  </ReasoningRoot>
                );
              }
              case "text":
                return <MarkdownText {...part} />;
              case "image":
                return <Image {...part} />;
              case "file":
                return <File {...part} />;
              case "reasoning":
                return <Reasoning {...part} />;
              case "tool-call":
                return part.toolUI ?? <ToolFallbackComponent {...part} />;
              case "data":
                return part.dataRendererUI;
              case "indicator":
                return <AssistantIndicator />;
              default:
                return null;
            }
          }}
        </MessagePrimitive.GroupedParts>
        <MessageError />
      </View>
      </MessageActionsRow>
      <BranchFooter className="aui-assistant-message-footer ms-2" />
    </MessagePrimitive.Root>
  );
};

// Chottu: message actions (copy, retry, edit) sit beside the bubble and show
// on hover (web, desktop) or long press (touch), instead of under every
// message. They keep their space while hidden so nothing shifts, and stay
// reachable for keyboards and screen readers.
const MessageActionsRow: FC<{
  side: "start" | "end";
  actions: ReactNode;
  children: ReactNode;
}> = ({ side, actions, children }) => {
  const [shown, setShown] = useState(false);
  return (
    <Pressable
      accessible={false}
      onHoverIn={() => setShown(true)}
      onHoverOut={() => setShown(false)}
      onLongPress={() => setShown((v) => !v)}
      delayLongPress={350}
      className={cn(
        "web:cursor-auto flex-row items-end gap-1",
        side === "end" && "flex-row-reverse",
      )}
    >
      {children}
      <View
        className={cn(
          "web:transition-opacity web:focus-within:opacity-100 pb-0.5",
          !shown && "opacity-0",
        )}
      >
        {actions}
      </View>
    </Pressable>
  );
};

/** Chottu: the branch picker gets a footer row only when there are branches. */
const BranchFooter: FC<{ className?: string }> = ({ className }) => (
  <AuiIf condition={(s) => s.message.branchCount > 1}>
    <View className={cn("flex-row items-center pt-1", className)}>
      <BranchPicker />
    </View>
  </AuiIf>
);

const AssistantActionBar: FC = () => (
  <AuiIf
    condition={(s) =>
      !(s.message.role === "assistant" && s.message.status?.type === "running")
    }
  >
    <View className="aui-assistant-action-bar-root flex-row">
      <ActionBarPrimitive.Copy
        copyToClipboard={copyToClipboard}
        className={iconButtonClassName}
        hitSlop={groupedIconButtonHitSlop}
        accessibilityLabel="Copy"
      >
        {({ isCopied }) => (
          <Icon
            as={isCopied ? CheckIcon : CopyIcon}
            className="text-muted-foreground size-4"
          />
        )}
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload
        className={iconButtonClassName}
        hitSlop={groupedIconButtonHitSlop}
        accessibilityLabel="Refresh"
      >
        <Icon as={RefreshCwIcon} className="text-muted-foreground size-4" />
      </ActionBarPrimitive.Reload>
    </View>
  </AuiIf>
);

const UserMessage: FC = () => (
  <MessagePrimitive.Root className="aui-user-message-root items-end gap-y-2 px-2">
    <UserMessageAttachments />
    <AuiIf condition={(s) => s.message.parts.length > 0}>
      <MessageActionsRow side="end" actions={<UserActionBar />}>
      {/* Chottu: user bubble colours, and voice notes render in user messages too. */}
      <View className="aui-user-message-content bg-bubble-user max-w-[85%] shrink rounded-[20px] px-4 py-2 shadow-sm">
        <MessagePrimitive.Parts
          components={{
            Text: UserText,
            Image,
            File,
            data: { by_name: { [VOICE_NOTE]: VoiceNotePart } },
          }}
        />
      </View>
      </MessageActionsRow>
    </AuiIf>
    <BranchFooter className="aui-user-message-footer -me-1 justify-end" />
  </MessagePrimitive.Root>
);

const UserActionBar: FC = () => (
  <AuiIf
    condition={(s) =>
      !s.thread.isRunning && s.message.parts.some((p) => p.type === "text")
    }
  >
    <ActionBarPrimitive.Edit
      className={cn(iconButtonClassName, "aui-user-action-edit")}
      hitSlop={groupedIconButtonHitSlop}
      accessibilityLabel="Edit"
    >
      <Icon as={PencilIcon} className="text-muted-foreground size-4" />
    </ActionBarPrimitive.Edit>
  </AuiIf>
);

const DefaultEditComposerInput: FC = () => (
  <ComposerPrimitive.Input
    className="aui-edit-composer-input text-foreground web:resize-none web:outline-none min-h-14 px-4 pt-3 pb-1 text-base"
    multiline
    autoFocus
  />
);

const EditComposer: FC = () => {
  const { ComposerInput = DefaultEditComposerInput } = useContext(
    ThreadComponentsContext,
  );

  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper px-2">
      <ComposerPrimitive.Root className="aui-edit-composer-root border-border/60 dark:border-muted-foreground/15 bg-card ms-auto w-full max-w-[85%] rounded-3xl border">
        <ComposerInput />
        <View className="aui-edit-composer-footer mx-2.5 mb-2.5 flex-row items-center gap-1.5 self-end">
          <ComposerPrimitive.Cancel className="active:bg-accent h-8 justify-center rounded-full px-3.5">
            <Text className="text-foreground text-sm font-medium">Cancel</Text>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send className="bg-primary active:bg-primary/90 h-8 justify-center rounded-full px-3.5">
            <Text className="text-primary-foreground text-sm font-medium">
              Update
            </Text>
          </ComposerPrimitive.Send>
        </View>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<ViewProps> = ({ className, ...rest }) => {
  const branchCount = useAuiState((s) => s.message.branchCount);
  if (branchCount <= 1) return null;

  return (
    <View
      className={cn(
        "aui-branch-picker-root -ms-2 me-2 flex-row items-center",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous
        className={cn(iconButtonClassName, "disabled:opacity-35")}
        hitSlop={groupedIconButtonHitSlop}
        accessibilityLabel="Previous"
      >
        <Icon as={ChevronLeftIcon} className="text-muted-foreground size-4" />
      </BranchPickerPrimitive.Previous>
      <Text className="aui-branch-picker-state text-muted-foreground text-xs font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </Text>
      <BranchPickerPrimitive.Next
        className={cn(iconButtonClassName, "disabled:opacity-35")}
        hitSlop={groupedIconButtonHitSlop}
        accessibilityLabel="Next"
      >
        <Icon as={ChevronRightIcon} className="text-muted-foreground size-4" />
      </BranchPickerPrimitive.Next>
    </View>
  );
};
