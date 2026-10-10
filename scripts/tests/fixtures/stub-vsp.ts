// @version 1.0.0
// Stub vsp for sap-mcp-proxy tests: newline-delimited JSON-RPC, logs every request it receives to $STUB_LOG.
import { appendFileSync } from 'node:fs';
const log = process.env.STUB_LOG;
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c: string) => {
  buf += c;
  let i: number;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    if (log) appendFileSync(log, line + '\n');
    let m: any; try { m = JSON.parse(line); } catch { continue; }
    if (m.id === undefined) continue; // notification
    const reply = (result: unknown) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result }) + '\n');
    if (m.method === 'initialize') reply({ protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'stub-vsp', version: '0' }, stubEnv: { cwd: process.cwd(), SAP_MODE: process.env.SAP_MODE, SAP_ALLOWED_PACKAGES: process.env.SAP_ALLOWED_PACKAGES, SAP_FEATURE_UI5: process.env.SAP_FEATURE_UI5, SAP_URL: process.env.SAP_URL, SAP_USER: process.env.SAP_USER } });
    else if (m.method === 'tools/list') reply({ tools: [{ name: 'SAP', description: 'stub', inputSchema: { type: 'object' } }] });
    else if (m.method === 'tools/call') reply({ content: [{ type: 'text', text: 'STUB_CALLED ' + JSON.stringify(m.params) }] });
    else reply({});
  }
});
if (process.env.STUB_EXIT_CODE) process.on('SIGTERM', () => process.exit(Number(process.env.STUB_EXIT_CODE)));
