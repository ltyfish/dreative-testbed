// Shared stdio MCP configuration for both provider arms, including optional image tools.
// Secrets stay in the local config/environment; never include this file in archives.
export function validateToolServers(servers) {
  if (!servers || typeof servers !== 'object' || Array.isArray(servers)) throw new Error('mcpServers must be an object')
  for (const [name, def] of Object.entries(servers)) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name) || !def || typeof def.command !== 'string' || !def.command)
      throw new Error(`MCP ${name}: this testbed adapter requires a named stdio command`)
    if (def.args && (!Array.isArray(def.args) || def.args.some(a => typeof a !== 'string')))
      throw new Error(`MCP ${name}: args must be strings`)
    if (def.env && (typeof def.env !== 'object' || Array.isArray(def.env) || Object.values(def.env).some(v => typeof v !== 'string')))
      throw new Error(`MCP ${name}: env must contain string values`)
  }
  return servers
}

export function codexToolArgs(servers) {
  validateToolServers(servers)
  return Object.entries(servers).flatMap(([name, def]) => {
    const args = ['-c', `mcp_servers.${name}.command=${JSON.stringify(def.command)}`]
    if (def.args) args.push('-c', `mcp_servers.${name}.args=${JSON.stringify(def.args)}`)
    for (const [key, value] of Object.entries(def.env ?? {}))
      args.push('-c', `mcp_servers.${name}.env.${JSON.stringify(key)}=${JSON.stringify(value)}`)
    return args
  })
}
