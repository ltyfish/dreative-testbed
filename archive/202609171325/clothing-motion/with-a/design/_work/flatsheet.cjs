const F=require('./flats.cjs'); const fs=require('fs')
const cells=Object.entries(F).map(([k,v])=>`<figure><div class="f">${v}</div><figcaption>${k}</figcaption></figure>`).join('')
fs.writeFileSync(__dirname+'/flatsheet.html',`<html><body style="margin:0;background:#E8E3DA;color:#12100D;font:12px system-ui"><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:12px">${cells}</div><style>.f{background:#fff;padding:8px}.f svg{width:100%;display:block}figcaption{padding:4px 0;text-align:center}</style></body></html>`)
