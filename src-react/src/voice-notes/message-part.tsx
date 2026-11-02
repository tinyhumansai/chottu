import { makeAssistantDataUI, type DataMessagePartProps } from "@assistant-ui/react";
import { VoiceNotePlayer } from "./player";
import { VOICE_NOTE, type VoiceNote } from "./types";

export const VoiceNotePart = ({ data }: DataMessagePartProps<VoiceNote>) => <VoiceNotePlayer note={data} />;

/** Mount inside the runtime provider so assistant messages render voice notes. */
export const VoiceNoteDataUI = makeAssistantDataUI<VoiceNote>({ name: VOICE_NOTE, render: VoiceNotePart });
