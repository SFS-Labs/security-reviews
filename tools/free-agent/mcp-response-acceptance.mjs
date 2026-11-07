/** Fail-closed checks for REA's bounded Camber-selected MCP diagnostic. */
const EXPECTED = ['binary_session','inspect_apktool_client','inspect_adb_client'];

export function verifyMcpToolReply(tool, response) {
  if (!EXPECTED.includes(tool)) throw Error('Unapproved MCP tool reply');
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw Error('MCP tool returned no result object: '+tool);
  }
  if (Object.hasOwn(response, 'error')) throw Error('MCP result contains error: '+tool);
  if (Object.hasOwn(response, 'isError') && typeof response.isError !== 'boolean') {
    throw Error('Malformed MCP isError flag: '+tool);
  }
  if (response.isError === true) throw Error('MCP tool reported isError=true: '+tool);
  const structured = response.structuredContent && typeof response.structuredContent === 'object' &&
    !Array.isArray(response.structuredContent) && Object.keys(response.structuredContent).length > 0;
  const textual = Array.isArray(response.content) && response.content.some(
    part => part && part.type === 'text' && typeof part.text === 'string' && part.text.trim().length > 0
  );
  if (!structured && !textual) throw Error('MCP tool returned no inspectable evidence: '+tool);
}

export function assertCompleteCamberEvidence(requested, results) {
  if (!Array.isArray(requested) || requested.length !== EXPECTED.length ||
      requested.some((name,i)=>name!==EXPECTED[i])) throw Error('Expected exact approved tool plan');
  if (!Array.isArray(results) || results.length !== EXPECTED.length) {
    throw Error('Incomplete Camber MCP execution');
  }
  for (let i=0;i<EXPECTED.length;i++) {
    const result=results[i];
    if (!result || result.tool!==EXPECTED[i] || result.outcome!=='REPLIED' ||
        result.mcp_response_received!==true ||
        !result.args || typeof result.args!=='object' || Array.isArray(result.args) ||
        Object.keys(result.args).length!==0) throw Error('Camber MCP evidence failed for '+EXPECTED[i]);
  }
  if (results[0].identity!=='rea-agents@6.8.0') throw Error('REA identity not verified');
}
