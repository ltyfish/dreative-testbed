// Authored technical flats — line drawings, not photographs. viewBox 0 0 200 250.
const S = (inner) => `<svg viewBox="0 0 200 250" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;
const btn = (x,ys)=>ys.map(y=>`<circle cx="${x}" cy="${y}" r="2.3" stroke-width="1.1"/>`).join('');
const thin = 1;

// generic top: neck width nw, shoulder drop, sleeve end, hem
function top({nw=14, shx=60, shy=48, cuffA=[28,154], cuffB=[48,170], armpit=[56,96], hip=[52,220], hemQ=228}={}) {
  const [ax,ay]=armpit, [cx1,cy1]=cuffA, [cx2,cy2]=cuffB, [hx,hy]=hip;
  const m=v=>200-v;
  return `M${100-nw} 40 L${shx} ${shy} L${cx1} ${cy1} L${cx2} ${cy2} L${ax} ${ay} L${hx} ${hy} Q100 ${hemQ} ${m(hx)} ${hy} L${m(ax)} ${ay} L${m(cx2)} ${cy2} L${m(cx1)} ${cy1} L${m(shx)} ${shy} L${100+nw} 40`
    + `<path d="M${shx} ${shy} Q${shx-3} ${(shy+ay)/2} ${ax} ${ay}" stroke-width="${thin}"/>`
    + `<path d="M${m(shx)} ${shy} Q${m(shx-3)} ${(shy+ay)/2} ${m(ax)} ${ay}" stroke-width="${thin}"/>`;
}
const shirtCollar = `<path d="M86 40 L83 29 Q100 24 117 29 L114 40"/><path d="M83 29 L93 58 L100 41 L107 58 L117 29"/><path d="M86 40 Q100 46 114 40" stroke-width="${thin}"/>`;
const cuff = (x1,y1,x2,y2,ox,oy)=>`<path d="M${x1} ${y1} L${x2} ${y2}" stroke-width="${thin}"/>`;

function legs({wt=[54,34], wb=52, hipY=84, hipX=46, crotch=118, hemY=240, hemOut=62, hemIn=86}={}) {
  const m=v=>200-v;
  return `M${wt[0]} ${wt[1]} L${m(wt[0])} ${wt[1]} L${m(hipX)} ${hipY} L${m(hemOut)} ${hemY} L${m(hemIn)} ${hemY} L100 ${crotch} L${hemIn} ${hemY} L${hemOut} ${hemY} L${hipX} ${hipY} Z`
   + `<path d="M${wt[0]+1} ${wb} L${m(wt[0]+1)} ${wb}"/>`;
}

const FLATS = {
  oxford: S(
    `<path d="${top({})}"/>` + shirtCollar +
    `<path d="M92 44 L92 218" stroke-width="${thin}"/><path d="M108 44 L108 218" stroke-width="${thin}"/>` +
    btn(100,[60,88,116,144,172,200]) +
    `<path d="M31 158 L50 173" stroke-width="${thin}"/><path d="M169 158 L150 173" stroke-width="${thin}"/>`
  ),
  tee: S(
    `<path d="${top({nw:16, shx:56, shy:50, cuffA:[26,92], cuffB:[46,106], armpit:[54,96], hip:[54,214], hemQ:222})}"/>` +
    `<path d="M84 40 Q100 54 116 40"/><path d="M84 40 Q100 48 116 40" stroke-width="${thin}"/>` +
    `<path d="M56 208 Q100 216 144 208" stroke-width="${thin}"/>` +
    `<path d="M29 96 L48 108" stroke-width="${thin}"/><path d="M171 96 L152 108" stroke-width="${thin}"/>`
  ),
  chore: S(
    `<path d="${top({nw:15, shx:58, shy:46, cuffA:[26,156], cuffB:[46,172], armpit:[54,96], hip:[50,224], hemQ:226})}"/>` +
    `<path d="M85 40 L83 30 Q100 25 117 30 L115 40"/><path d="M85 40 Q100 48 115 40" stroke-width="${thin}"/>` +
    `<path d="M94 44 L94 224" stroke-width="${thin}"/><path d="M106 44 L106 224" stroke-width="${thin}"/>` +
    btn(100,[60,96,132,168,204]) +
    `<rect x="59" y="132" width="30" height="38" rx="1.5" stroke-width="${thin}"/>` +
    `<rect x="111" y="132" width="30" height="38" rx="1.5" stroke-width="${thin}"/>` +
    `<rect x="61" y="66" width="24" height="26" rx="1.5" stroke-width="${thin}"/>` +
    `<path d="M29 159 L48 174" stroke-width="${thin}"/><path d="M171 159 L152 174" stroke-width="${thin}"/>`
  ),
  overshirt: S(
    `<path d="${top({nw:15, shx:56, shy:46, cuffA:[24,158], cuffB:[44,174], armpit:[52,98], hip:[48,226], hemQ:228})}"/>` +
    shirtCollar +
    `<path d="M93 44 L93 226" stroke-width="${thin}"/><path d="M107 44 L107 226" stroke-width="${thin}"/>` +
    btn(100,[62,98,134,170,206]) +
    `<rect x="59" y="152" width="28" height="36" rx="1.5" stroke-width="${thin}"/>` +
    `<rect x="113" y="152" width="28" height="36" rx="1.5" stroke-width="${thin}"/>` +
    `<path d="M27 161 L46 176" stroke-width="${thin}"/><path d="M173 161 L154 176" stroke-width="${thin}"/>`
  ),
  knit: S(
    `<path d="${top({nw:16, shx:54, shy:50, cuffA:[26,152], cuffB:[46,168], armpit:[52,100], hip:[52,208], hemQ:216})}"/>` +
    `<path d="M84 40 Q100 56 116 40"/>` +
    `<path d="M84 40 Q100 62 116 40" stroke-width="2.8"/>` +
    `<path d="M52 198 Q100 208 148 198" stroke-width="2.8"/>` +
    `<path d="M28 155 L47 170" stroke-width="2.8"/><path d="M172 155 L153 170" stroke-width="2.8"/>`
  ),
  cardigan: S(
    `<path d="${top({nw:16, shx:54, shy:50, cuffA:[26,154], cuffB:[46,170], armpit:[52,100], hip:[52,216], hemQ:218})}"/>` +
    `<path d="M72 44 Q76 92 100 126 L100 114 Q88 86 88 42 Q78 30 72 44 Z" stroke-width="1.9"/>` +
    `<path d="M128 44 Q124 92 100 126 L100 114 Q112 86 112 42 Q122 30 128 44 Z" stroke-width="1.9"/>` +
    `<path d="M88 42 Q100 36 112 42" stroke-width="1"/>` +
    `<path d="M100 126 L100 216" stroke-width="${thin}"/>` +
    btn(100,[138,164,190]) +
    `<rect x="60" y="164" width="26" height="32" rx="1.5" stroke-width="${thin}"/>` +
    `<rect x="114" y="164" width="26" height="32" rx="1.5" stroke-width="${thin}"/>` +
    `<path d="M52 208 L148 208" stroke-width="2.8"/>` +
    `<path d="M28 157 L47 172" stroke-width="2.8"/><path d="M172 157 L153 172" stroke-width="2.8"/>`
  ),
  trouser: S(
    `<path d="${legs({})}"/>` +
    `<path d="M100 54 L100 118" stroke-width="${thin}"/>` +
    `<path d="M92 54 Q94 86 96 112" stroke-width="${thin}"/>` +
    `<path d="M108 54 Q106 86 104 112" stroke-width="${thin}"/>` +
    `<path d="M58 56 Q68 68 66 82" stroke-width="${thin}"/>` +
    `<path d="M142 56 Q132 68 134 82" stroke-width="${thin}"/>` +
    btn(100,[42]) +
    `<path d="M62 236 L86 236" stroke-width="${thin}"/><path d="M114 236 L138 236" stroke-width="${thin}"/>`
  ),
  jean: S(
    `<path d="${legs({wt:[52,32], wb:50, hipY:82, hipX:44, crotch:114, hemY:240, hemOut:60, hemIn:88})}"/>` +
    `<path d="M100 50 L100 114" stroke-width="2"/>` +
    `<path d="M56 52 Q74 58 80 78 L56 78" stroke-width="${thin}"/>` +
    `<path d="M144 52 Q126 58 120 78 L144 78" stroke-width="${thin}"/>` +
    `<path d="M120 58 Q130 62 132 72" stroke-width="${thin}"/>` +
    `<path d="M92 50 Q94 82 97 108" stroke-width="${thin}" stroke-dasharray="3 3"/>` +
    `<path d="M108 50 Q106 82 103 108" stroke-width="${thin}" stroke-dasharray="3 3"/>` +
    btn(100,[40]) +
    `<path d="M60 234 L88 234" stroke-width="${thin}"/><path d="M112 234 L140 234" stroke-width="${thin}"/>`
  ),
  shorts: S(
    `<path d="${legs({wt:[52,44], wb:64, hipY:92, hipX:46, crotch:120, hemY:176, hemOut:54, hemIn:88})}"/>` +
    `<path d="M100 64 L100 120" stroke-width="${thin}"/>` +
    `<path d="M104 46 L146 46 Q149 56 146 62 L104 62" stroke-width="0.9" stroke-dasharray="3 3"/>` +
    `<path d="M56 68 Q66 80 64 92" stroke-width="${thin}"/>` +
    `<path d="M144 68 Q134 80 136 92" stroke-width="${thin}"/>` +
    `<path d="M54 170 L88 170" stroke-width="${thin}"/><path d="M112 170 L142 170" stroke-width="${thin}"/>`
  ),
};
module.exports = FLATS;
