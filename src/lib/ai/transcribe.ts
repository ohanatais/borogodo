/**
 * Stub documentado — costura para captura por áudio (Whisper), fora do escopo do MVP (003).
 * O ramo `audio` em `CaptureInput` e no switch da rota retornam 501 antes de chegar aqui.
 */
export async function transcribeAudio(audio: Blob): Promise<string> {
  void audio
  throw new Error('Transcrição de áudio não implementada nesta versão')
}
