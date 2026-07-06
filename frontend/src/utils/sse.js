/**
 * Reads a fetch Response body as a Server-Sent Events (SSE) stream and invokes
 * onEvent(eventName, data) for each event, in the order it arrives.
 *
 * Both the AI generation pipeline (/generate) and the burn-in pipeline
 * (/burn-in) emit progress this way, so this buffering/parsing logic lives
 * here once instead of being copy-pasted into every hook that consumes an
 * SSE endpoint.
 */
export async function consumeSSEStream(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep the partial trailing line for the next chunk

    let currentEvent = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('event:')) {
        currentEvent = trimmed.replace('event:', '').trim();
      } else if (trimmed.startsWith('data:')) {
        const dataVal = trimmed.replace('data:', '').trim();
        onEvent(currentEvent, dataVal);
      }
    }
  }
}
