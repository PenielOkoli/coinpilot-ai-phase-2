import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:3148';
const start = performance.now();
const response = await fetch(new URL('/api/chat', base), {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'Explain the BTC signal' }], scenario: 'normal', variation: 0 }),
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.status, 200);
assert.match(response.headers.get('content-type'), /text\/event-stream/);
const reader = response.body.getReader();
const decoder = new TextDecoder();
const deltaTimes = [];
let wire = '';
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  wire += chunk;
  if (chunk.includes('text-delta')) deltaTimes.push(Math.round(performance.now() - start));
}
assert.ok(deltaTimes.length > 5, 'Content must arrive through multiple reads.');
assert.ok(deltaTimes.at(-1) - deltaTimes[0] > 250, 'Content must arrive progressively, not in a single buffered burst.');
assert.match(wire, /"type":"finish"/);
assert.match(wire, /\[DONE\]/);
console.log(JSON.stringify({ base, verifiedAt: new Date().toISOString(), contentReads: deltaTimes.length, firstContentMs: deltaTimes[0], lastContentMs: deltaTimes.at(-1), totalMs: Math.round(performance.now() - start), status: 'passed' }, null, 2));
