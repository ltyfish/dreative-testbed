window.__pixelReady=false;
(async function(){
  const nodes=[...document.querySelectorAll('.px')];
  await Promise.all(nodes.map(n=>new Promise(res=>{
    const im=n.querySelector('img'); if(!im) return res();
    const blocks=+ (n.dataset.blocks||24);
    const go=()=>{
      const r=n.getBoundingClientRect(); const W=Math.max(1,Math.round(r.width)), H=Math.max(1,Math.round(r.height));
      const bw=blocks, bh=Math.max(1,Math.round(blocks*H/W));
      const c1=document.createElement('canvas'); c1.width=bw; c1.height=bh;
      const x1=c1.getContext('2d'); 
      // cover crop
      const ar=im.naturalWidth/im.naturalHeight, tar=W/H; let sw,sh,sx,sy;
      if(ar>tar){sh=im.naturalHeight; sw=sh*tar; sx=(im.naturalWidth-sw)/2; sy=0}
      else {sw=im.naturalWidth; sh=sw/tar; sx=0; sy=(im.naturalHeight-sh)/2}
      x1.drawImage(im,sx,sy,sw,sh,0,0,bw,bh);
      const c2=document.createElement('canvas'); c2.width=W; c2.height=H;
      const x2=c2.getContext('2d'); x2.imageSmoothingEnabled=false;
      x2.drawImage(c1,0,0,bw,bh,0,0,W,H);
      c2.style.cssText='width:100%;height:100%;display:block;filter:grayscale(1) contrast(1.5) brightness(.85);mix-blend-mode:screen';
      im.replaceWith(c2); res();
    };
    if(im.complete && im.naturalWidth) go(); else im.onload=go, im.onerror=res;
  })));
  window.__pixelReady=true;
})();
