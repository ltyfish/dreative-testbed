import fs from 'fs'
const c2=JSON.parse(fs.readFileSync('design/_work/candidates2.json','utf8'))
const c4=JSON.parse(fs.readFileSync('design/_work/candidates4.json','utf8'))
const picks=[
 ['cloth-linen-a',c4[26]],['cloth-linen-b',c4[27]],['cloth-linen-c',c4[28]],['cloth-linen-d',c4[30]],['cloth-linen-e',c4[31]],
 ['cloth-weave',c4[12]],['cloth-check',c4[13]],['cloth-denim',c4[17]],['cloth-alpaca',c4[25]],['cloth-cord',c4[39]],
 ['cloth-indigo',c4[4]],['cloth-fine',c4[40]],['cloth-indigoknit',c4[3]],
 ['g-tweed',c2[19]],['g-woolcoat',c2[16]],['g-denimdetail',c2[28]],['g-denim2',c2[29]],['g-knitfold',c2[42]],
 ['g-knitpurple',c2[45]],['g-knitform',c2[46]],['g-hangers',c2[5]],['g-jacketflat',c2[6]],['g-trouserflat',c2[26]],
 ['g-shorts',c2[59]],['g-rail',c2[68]],['g-tee-tech',c2[2]]
]
const man=[]
for(const [name,it] of picks){
  if(!it){console.log('miss',name);continue}
  try{
    const r=await fetch(it.url); if(!r.ok){console.log('fail',name,r.status);continue}
    const buf=Buffer.from(await r.arrayBuffer())
    const ext=(it.url.split('?')[0].split('.').pop()||'jpg').toLowerCase().slice(0,4)
    const f=`design/_work/img/${name}.${ext}`
    fs.writeFileSync(f,buf); man.push({name,file:f,bytes:buf.length,title:it.title,creator:it.creator,license:it.license,page:it.page,source:it.source})
    console.log('ok',name,buf.length)
  }catch(e){console.log('err',name,e.message)}
}
fs.writeFileSync('design/_work/manifest.json',JSON.stringify(man,null,1))
