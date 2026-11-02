import { makeAssistantDataUI, useAuiState, type DataMessagePartProps } from "@assistant-ui/react-native";
import { VoiceNotePlayer } from "./player";
import { VOICE_NOTE, type VoiceNote } from "./types";

/** A voice note inside a message, in the bubble colours of whoever sent it. */
export function VoiceNotePart({ data }: DataMessagePartProps<VoiceNote>) {
  const id = useAuiState((s) => s.message.id);
  const role = useAuiState((s) => s.message.role);
  return <VoiceNotePlayer id={id} note={data} tone={role === "user" ? "user" : "assistant"} />;
}

/** Mount inside the runtime provider so assistant messages render voice notes. */
export const VoiceNoteDataUI = makeAssistantDataUI<VoiceNote>({ name: VOICE_NOTE, render: VoiceNotePart });
