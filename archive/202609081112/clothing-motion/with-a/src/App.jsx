import { useEffect, useRef, useState } from 'react'

const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const GARMENTS = [
  { id:'oxford', name:'The Oxford Shirt', category:'Shirts', price:78, colours:['White','Pale blue','Faded navy'], fabric:'100% long-staple cotton oxford, 140gsm, woven in Portugal', detail:'Cut straight through the body with a soft collar that stands without fusing.', sold:['XS'], image:'/media/garment-oxford.webp', factory:'Oficina Norte — Guimarães' },
  { id:'tee', name:'Heavy Cotton Tee', category:'Shirts', price:34, colours:['White','Black','Ecru','Washed olive'], fabric:'100% organic cotton, 240gsm, tubular knit', detail:'Heavy enough to hold its shape after a year of washing. It shrinks about 2cm in length on the first wash and then stops.', sold:[], image:'/media/garment-tee.webp', factory:'Oficina Norte — Guimarães' },
  { id:'chore', name:'Chore Jacket', category:'Outerwear', price:165, colours:['Indigo','Sand'], fabric:'12oz cotton canvas, unlined', detail:'Three patch pockets, a corozo button front, and a back yoke that lets you reach forward without the shoulders pulling.', sold:['S','XL'], image:'/media/chore-concept-graded.webp', factory:'Calder Mill — Blackburn' },
  { id:'overshirt', name:'Wool Overshirt', category:'Outerwear', price:210, colours:['Charcoal','Oat'], fabric:'80% wool, 20% nylon, brushed', detail:'Warm enough to be the only layer down to about 8°C. Sized to go over a shirt.', sold:[], image:'/media/garment-overshirt.webp', factory:'Fábrica do Vale — Porto' },
  { id:'trouser', name:'Pleated Trouser', category:'Trousers', price:120, colours:['Black','Stone','Brown'], fabric:'58% wool, 42% cotton twill', detail:'A single forward pleat, a mid rise, and a leg that tapers slightly from the knee.', sold:['M'], image:'/media/garment-trouser.webp', factory:'Fábrica do Vale — Porto' },
  { id:'jean', name:'Straight Jean', category:'Trousers', price:98, colours:['Rinse','Mid wash','Ecru'], fabric:'13.5oz rigid cotton denim, selvedge', detail:'Rigid, not stretch. It will feel stiff for two weeks and then fit only you.', sold:[], image:'/media/garment-jean.webp', factory:'Calder Mill — Blackburn' },
  { id:'knit', name:'Lambswool Crew', category:'Knitwear', price:135, colours:['Navy','Grey melange','Rust'], fabric:'100% lambswool, spun in Scotland', detail:'Fully fashioned, so the panels are knitted to shape rather than cut out of a sheet of fabric.', sold:['L'], image:'/media/garment-knit.webp', factory:'Hawick Knit Studio — Hawick' },
  { id:'cardigan', name:'Shawl Cardigan', category:'Knitwear', price:155, colours:['Charcoal','Camel'], fabric:'70% wool, 30% alpaca', detail:'A heavy shawl collar that stays up without a scarf.', sold:['XS','S'], image:'/media/garment-cardigan.webp', factory:'Hawick Knit Studio — Hawick' },
  { id:'shorts', name:'Camp Short', category:'Trousers', price:64, colours:['Khaki','Navy'], fabric:'8oz washed cotton twill', detail:'A 7 inch inseam and an elasticated back half of the waistband.', sold:['XL'], image:'/media/garment-shorts.webp', factory:'Oficina Norte — Guimarães' },
]
const CATEGORIES = ['Shirts','Outerwear','Trousers','Knitwear']
const SIZE_CHART = [
  { size:'XS', chest:88, waist:74, sleeve:61 }, { size:'S', chest:96, waist:82, sleeve:63 },
  { size:'M', chest:104, waist:90, sleeve:65 }, { size:'L', chest:112, waist:98, sleeve:66 },
  { size:'XL', chest:120, waist:107, sleeve:67 },
]
const CARE = [
  'Everything here is washable at 30°C except the knitwear and the wool overshirt, which are hand wash or wool cycle only.',
  'Nothing we sell should go in a tumble dryer.',
  'The denim is unwashed. Wash it cold and inside out, and expect it to bleed onto light upholstery for the first few wears.',
  'We will repair anything we made, for as long as we are trading. Send it back and we quote before doing the work.',
]
const SHIPPING = [
  'Free delivery on orders over £100, otherwise £4.95. Two to three working days in the UK.',
  'Europe is £12 and five to seven working days, duties included.',
  'Rest of the world is £22 and seven to fourteen working days, duties not included.',
  '60 days to return anything unworn with its tags on, and return postage is free in the UK.',
  'Exchanges for a different size ship the same day the return is scanned, so you are not waiting twice.',
]
const REVIEWS = [
  { name:'Priya N.', bought:'The Oxford Shirt, M', text:'I am 5ft 9in and it is the first shirt in years that has not been too short in the body. The collar does what they say it does.' },
  { name:'Daniel O.', bought:'Straight Jean, 32', text:'Genuinely stiff for the first fortnight, exactly as warned. Now they are the only pair I wear. Sizing ran true for me.' },
  { name:'Marta K.', bought:'Lambswool Crew, S', text:'Softer than I expected for the weight. It pilled a little under the arms in the first month and then settled.' },
]
const ABOUT = [
  'Eleven people, one shop in Leeds, and a website. We make about thirty styles a year and keep the ones that sell for a decade.',
  'Every garment is made in one of four factories we have visited, and each product page names which one.',
  'We do not run sales. The price is the price all year, and it is the same price in the shop as it is here.',
]
const FACTORIES = ['Oficina Norte — Guimarães','Calder Mill — Blackburn','Fábrica do Vale — Porto','Hawick Knit Studio — Hawick']

const clamp = (value, min=0, max=1) => Math.min(max, Math.max(min, value))
const segment = (value, start, end) => clamp((value-start)/(end-start))
const ease = (value) => 1-Math.pow(1-value,3)

function PixelImage({ progressRef }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas=canvasRef.current
    const context=canvas?.getContext('2d',{alpha:false})
    if(!canvas||!context) return undefined
    const image=new Image(); image.src='/media/chore-concept-graded.webp'
    const scratch=document.createElement('canvas')
    const scratchContext=scratch.getContext('2d',{alpha:false})
    let frame=0; let active=true
    const render=()=>{
      if(!active||!image.complete||!image.naturalWidth||!scratchContext) return
      const dpr=Math.min(window.devicePixelRatio||1,1.5)
      const rect=canvas.getBoundingClientRect(); const width=Math.max(1,Math.round(rect.width*dpr)); const height=Math.max(1,Math.round(rect.height*dpr))
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
      const p=progressRef.current; const resolve=ease(segment(p,.04,.5)); const sampleWidth=Math.round(18+resolve*420); const sampleHeight=Math.max(1,Math.round(sampleWidth*(height/width)))
      scratch.width=sampleWidth; scratch.height=sampleHeight
      const sourceRatio=image.naturalWidth/image.naturalHeight; const targetRatio=width/height
      let sx=0,sy=0,sw=image.naturalWidth,sh=image.naturalHeight
      if(sourceRatio>targetRatio){sw=image.naturalHeight*targetRatio;sx=(image.naturalWidth-sw)*(.58-segment(p,.5,.86)*.08)}
      else {sh=image.naturalWidth/targetRatio;sy=(image.naturalHeight-sh)*(.48-segment(p,.5,.86)*.1)}
      scratchContext.drawImage(image,sx,sy,sw,sh,0,0,sampleWidth,sampleHeight)
      context.imageSmoothingEnabled=false; context.drawImage(scratch,0,0,sampleWidth,sampleHeight,0,0,width,height)
    }
    const requestRender=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(render)}
    image.addEventListener('load',requestRender); window.addEventListener('resize',requestRender); window.addEventListener('marlow-progress',requestRender); requestRender()
    return()=>{active=false;cancelAnimationFrame(frame);image.removeEventListener('load',requestRender);window.removeEventListener('resize',requestRender);window.removeEventListener('marlow-progress',requestRender)}
  },[progressRef])
  return <canvas ref={canvasRef} className="pixel-canvas" aria-hidden="true" />
}

function SignatureScene({ chosen, chooseSize, add, bagCount, openBag }) {
  const sceneRef=useRef(null); const progressRef=useRef(0)
  useEffect(()=>{
    const root=document.documentElement; const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'); let raf=0; let last=-1
    const update=()=>{
      raf=0; const scene=sceneRef.current; if(!scene)return
      const rect=scene.getBoundingClientRect(); const approach=window.innerHeight*.65; const distance=Math.max(1,scene.offsetHeight-window.innerHeight)
      const next=reduced.matches?1:clamp((approach-rect.top)/(distance+approach)); progressRef.current=next
      if(Math.abs(next-last)<.001)return; last=next
      const aperture=ease(segment(next,.02,.42)); const settle=ease(segment(next,.35,.54)); const mobile=window.innerWidth<=720
      const commerce=ease(segment(next,mobile?.49:.46,mobile?.66:.61)); const copyExit=ease(segment(next,mobile?.42:.46,mobile?.49:.61))
      const vw=window.innerWidth,vh=window.innerHeight; const [startW,openW,endW]=mobile?[.7,1,.92]:[.31,.76,.46]; const [startH,openH,endH]=mobile?[.42,1,.47]:[.54,.84,.82]
      root.style.setProperty('--progress',next.toFixed(4)); root.style.setProperty('--stage-lift',`${((1-next)*12).toFixed(2)}px`); root.style.setProperty('--aperture',aperture.toFixed(4)); root.style.setProperty('--settle',settle.toFixed(4)); root.style.setProperty('--commerce',commerce.toFixed(4)); root.style.setProperty('--commerce-inset',`${((1-commerce)*100).toFixed(2)}%`); root.style.setProperty('--copy-inset',`${(copyExit*100).toFixed(2)}%`); root.style.setProperty('--copy-opacity',(1-copyExit).toFixed(4)); root.style.setProperty('--sharp',ease(segment(next,.24,.48)).toFixed(4)); root.style.setProperty('--frame-w',`${vw*(startW+aperture*(openW-startW)+settle*(endW-openW))}px`); root.style.setProperty('--frame-h',`${vh*(startH+aperture*(openH-startH)+settle*(endH-openH))}px`); root.style.setProperty('--frame-left',`${50+settle*(mobile?0:22)}%`); root.style.setProperty('--frame-top',`${50-settle*(mobile?23:0)}%`); window.dispatchEvent(new Event('marlow-progress'))
    }
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(update)}; schedule(); window.addEventListener('scroll',schedule,{passive:true}); window.addEventListener('resize',schedule); reduced.addEventListener('change',schedule)
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);reduced.removeEventListener('change',schedule)}
  },[])
  const garment=GARMENTS.find((item)=>item.id==='chore')
  return <section ref={sceneRef} id="the-weave" className="weave-scene" aria-labelledby="scene-title">
    <div className="sticky-stage">
      <div className="stage-index" aria-hidden="true"><span>01</span><span>Canvas / 12 oz</span><span>Scroll to resolve</span></div>
      <div className="image-aperture"><img className="pixel-fallback" src="/media/chore-concept-pixel.webp" alt=""/><PixelImage progressRef={progressRef}/><img className="sharp-image" src="/media/chore-concept-graded.webp" alt="Model wearing a sand-coloured canvas chore jacket in a studio; representative concept imagery"/><div className="crop-mark crop-mark-a"/><div className="crop-mark crop-mark-b"/></div>
      <div className="opening-copy"><p className="eyebrow">MATERIAL STUDY / No. 03</p><h2 id="scene-title"><span>From</span> fibre<br/><i>to form.</i></h2><p>Coarse at first. Then all the useful decisions appear: weight, reach, pocket, line.</p></div>
      <article className="product-panel" aria-label="Chore Jacket quick shop">
        <div className="product-heading"><p className="eyebrow">OUTERWEAR / 03</p><h3>Chore Jacket</h3><p className="price">£165</p></div>
        <p className="detail">{garment.detail}</p><div className="spec-row"><span>Cloth</span><span>{garment.fabric}</span></div><div className="spec-row"><span>Colours</span><span>{garment.colours.join(', ')}</span></div>
        <SizePicker garment={garment} value={chosen.chore||''} onChoose={chooseSize}/><button className="add-button" type="button" disabled={!chosen.chore} onClick={()=>add(garment)}><span>{chosen.chore?`Add size ${chosen.chore}`:'Choose a size'}</span><span>£165</span></button>
        <p className="concept-note">Representative concept image — not a verified inventory photograph.</p>
      </article>
      <button className="mini-bag" type="button" onClick={openBag} aria-label={`Open bag with ${bagCount} items`}><span>Bag</span><span>{bagCount}</span></button>
      <div className="progress-rail" aria-hidden="true"><span/></div>
    </div>
  </section>
}

function SizePicker({ garment, value, onChoose }) {
  return <fieldset className="size-picker"><legend>Choose a size</legend><div className="sizes">{SIZES.map((size)=>{const sold=garment.sold.includes(size);return <button key={size} type="button" disabled={sold} aria-pressed={value===size} onClick={()=>onChoose(garment.id,size)}><span>{size}</span>{sold&&<small>Gone</small>}</button>})}</div></fieldset>
}

function GarmentCard({ garment, chosen, chooseSize, add, index }) {
  return <article className={`garment-card card-${index%3}`} style={{'--card-index':index}}>
    <div className="garment-image"><img src={garment.image} alt={`Representative concept study for ${garment.name}`}/><span>{String(index+1).padStart(2,'0')}</span></div>
    <div className="garment-title"><div><p>{garment.category}</p><h3>{garment.name}</h3></div><p>£{garment.price}</p></div>
    <p className="garment-detail">{garment.detail}</p>
    <dl className="garment-spec"><div><dt>Fabric</dt><dd>{garment.fabric}</dd></div><div><dt>Colours</dt><dd>{garment.colours.join(', ')}</dd></div><div><dt>Made by</dt><dd>{garment.factory}</dd></div></dl>
    <SizePicker garment={garment} value={chosen[garment.id]||''} onChoose={chooseSize}/>
    <button className="card-add" type="button" disabled={!chosen[garment.id]} onClick={()=>add(garment)}><span>{chosen[garment.id]?`Add ${chosen[garment.id]}`:'Select size'}</span><span>£{garment.price}</span></button>
  </article>
}

function BagDrawer({ open, close, bag, remove }) {
  const total=bag.reduce((sum,line)=>sum+line.price,0); const postage=total===0||total>=100?0:4.95
  return <>{open&&<button className="bag-scrim is-open" type="button" aria-label="Close bag" onClick={close}/>}<aside className={`bag-drawer ${open?'is-open':''}`} aria-label="Shopping bag" aria-hidden={!open}>
    <div className="drawer-head"><div><p className="eyebrow">Your selection</p><h2>Bag <sup>{bag.length}</sup></h2></div><button type="button" onClick={close}>Close</button></div>
    <div className="drawer-lines">{bag.length===0?<div className="empty-bag"><p>Nothing in the bag yet.</p><button type="button" onClick={close}>Return to the collection</button></div>:bag.map((line,index)=><div className="drawer-line" key={`${line.id}-${line.size}-${index}`}><p><strong>{line.name}</strong><span>Size {line.size}</span></p><p>£{line.price}</p><button type="button" onClick={()=>remove(index)}>Remove</button></div>)}</div>
    {bag.length>0&&<div className="drawer-totals"><p><span>Subtotal</span><span>£{total.toFixed(2)}</span></p><p><span>Delivery</span><span>{postage===0?'Free':`£${postage.toFixed(2)}`}</span></p>{postage>0&&<p className="delivery-gap">£{(100-total).toFixed(2)} more for free delivery over £100.</p>}<p className="grand-total"><span>Total</span><span>£{(total+postage).toFixed(2)}</span></p><button type="button">Checkout</button></div>}
  </aside></>
}

export default function App(){
  const [category,setCategory]=useState('All'); const [chosen,setChosen]=useState({}); const [bag,setBag]=useState([]); const [bagOpen,setBagOpen]=useState(false)
  const shown=category==='All'?GARMENTS:GARMENTS.filter((g)=>g.category===category)
  const chooseSize=(id,size)=>setChosen((state)=>({...state,[id]:size}))
  const add=(garment)=>{const size=chosen[garment.id];if(!size||garment.sold.includes(size))return;setBag((lines)=>[...lines,{id:garment.id,name:garment.name,size,price:garment.price}]);setBagOpen(true)}
  useEffect(()=>{document.body.style.overflow=bagOpen?'hidden':'';return()=>{document.body.style.overflow=''}},[bagOpen])
  return <main>
    <nav className="site-nav" aria-label="Primary"><a href="#top">M&amp;V</a><div><a href="#collection">Collection</a><a href="#fit-care">Fit &amp; care</a><a href="#delivery">Delivery</a></div><button type="button" onClick={()=>setBagOpen(true)}>Bag <sup>{bag.length}</sup></button></nav>
    <header id="top" className="masthead"><div className="brandline"><span>Marlow &amp; Vale</span><span>Leeds / Since 2014</span></div><h1>Clothes that<br/>wear <em>in</em>, not out.</h1><p className="lede">The fabric is the first thing you meet. The garment comes into focus after.</p><a className="scroll-cue" href="#the-weave">Enter the weave <span>↓</span></a></header>
    <SignatureScene chosen={chosen} chooseSize={chooseSize} add={add} bagCount={bag.length} openBag={()=>setBagOpen(true)}/>

    <section id="collection" className="collection" aria-labelledby="collection-title">
      <header className="collection-intro"><p className="eyebrow">THE PERMANENT NINE / 2026</p><h2 id="collection-title">Nothing seasonal.<br/><i>Everything useful.</i></h2><p>Nine garments, kept in the range because they earn the space. The image studies below are representative concepts for this fictional inventory.</p></header>
      <div className="filter-bar" aria-label="Filter collection"><div>{['All',...CATEGORIES].map((item)=><button type="button" key={item} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item} <sup>{item==='All'?GARMENTS.length:GARMENTS.filter((g)=>g.category===item).length}</sup></button>)}</div><p aria-live="polite">Showing {shown.length} of {GARMENTS.length}{category==='All'?'':` in ${category}`}</p></div>
      <div className="garment-grid">{shown.map((garment,index)=><GarmentCard key={garment.id} garment={garment} chosen={chosen} chooseSize={chooseSize} add={add} index={index}/>)}</div>
    </section>

    <section id="fit-care" className="fit-care" aria-labelledby="fit-title">
      <div className="fit-heading"><p className="eyebrow">FIT, WASH, REPEAT</p><h2 id="fit-title">Keep the<br/><i>good part.</i></h2><p>Body measurements in centimetres. Between two sizes? Everything except the knitwear is cut with room, so take the smaller one.</p></div>
      <div className="size-table-wrap"><table><caption>Size chart, measured on the body in centimetres.</caption><thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Sleeve</th></tr></thead><tbody>{SIZE_CHART.map((row)=><tr key={row.size}><th>{row.size}</th><td>{row.chest}</td><td>{row.waist}</td><td>{row.sleeve}</td></tr>)}</tbody></table></div>
      <div className="care-ledger">{CARE.map((fact,index)=><article key={fact}><span>{String(index+1).padStart(2,'0')}</span><p>{fact}</p></article>)}</div>
    </section>

    <section id="delivery" className="delivery" aria-labelledby="delivery-title">
      <header><p className="eyebrow">AFTER THE CHOICE</p><h2 id="delivery-title">Clear terms.<br/><i>No small print.</i></h2></header>
      <div className="shipping-list">{SHIPPING.map((line,index)=><p key={line}><span>{String(index+1).padStart(2,'0')}</span>{line}</p>)}</div>
      <div className="reviews"><p className="eyebrow">WORN IN / THREE NOTES</p>{REVIEWS.map((review)=><figure key={review.name}><blockquote>“{review.text}”</blockquote><figcaption><strong>{review.name}</strong><span>Bought the {review.bought}</span></figcaption></figure>)}</div>
    </section>

    <footer className="shop-footer">
      <div className="footer-word" aria-hidden="true">M&amp;V</div><p className="eyebrow">ONE SHOP / FOUR FACTORIES</p><h2>We know who<br/><i>made it.</i></h2>
      <div className="about-grid">{ABOUT.map((line,index)=><p key={line}><span>{String(index+1).padStart(2,'0')}</span>{line}</p>)}</div>
      <div className="factory-list"><p>Our four factories</p>{FACTORIES.map((factory)=><span key={factory}>{factory}</span>)}</div>
      <div className="footer-end"><p>Marlow &amp; Vale</p><p>11 people · 1 Leeds shop · 0 sales</p><a href="#top">Back to the top ↑</a></div>
    </footer>
    <BagDrawer open={bagOpen} close={()=>setBagOpen(false)} bag={bag} remove={(index)=>setBag((lines)=>lines.filter((_,i)=>i!==index))}/>
  </main>
}
