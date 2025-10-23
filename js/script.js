(()=>{'use strict';
// --- PERUBAHAN ADMIN ---
const CASHIER_KEY='K4',CASHIER_NAME='Admin 2';
// -----------------------
let subActive=false;
function buildShiftPayloadCompat(st){const shift_id=`${st.date}-${st.idx||1}`;return{date:st.date,jam_mulai:st.start_at,jam_tutup:st.end_at,cashier:CASHIER_NAME,tanggal:st.date,jamMulai:st.start_at,jamTutup:st.end_at,admin:CASHIER_NAME,shift_id,cashier_key:CASHIER_KEY}}

const BACKEND_URL='http://localhost:3000';

const $=(q,r=document)=>r.querySelector(q);
const IDR=n=>'Rp. '+new Intl.NumberFormat('id-ID').format(Math.max(0,Math.round(n||0)));
const parseIDR=s=>{s=String(s||'').toLowerCase().trim();if(!s)return 0;if(s.endsWith('k'))s=String(parseFloat(s)*1000);return Number(s.replace(/[^0-9\-]/g,'')||0)};
const parseIDR2=s=>{s=String(s||'').toLowerCase().trim();if(!s)return 0;if(s.endsWith('k'))return Math.round(parseFloat(s)*1000);s=s.replace(/[^0-9\-.,]/g,'').replace(/[.,]/g,'');return Number(s)||0};
const now=()=>new Date();
const fmt={ymd:(d=now())=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10),hms:(d=now())=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,hmsS:(d=now())=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`};
function witaDateTime(d=new Date()){const parts=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(d);const pick=t=>parts.find(p=>p.type===t)?.value||'';return{tanggal:`${pick('year')}-${pick('month')}-${pick('day')}`,jam:`${pick('hour')}:${pick('minute')}:${pick('second')}`}}
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',1600)};

const el={shiftBadge:$('#shiftStatus'),tz:$('#tzDebug'),kSaldoAwal:$('#kSaldoAwal'),kCash:$('#kCash'),kQris:$('#kQris'),kOmzet:$('#kOmzet'),kExp:$('#kExp'),kLaci:$('#kLaci'),kCashN:$('#kCashN'),kQrisN:$('#kQrisN'),kOmzetN:$('#kOmzetN'),kReal:$('#kReal'),kSelisih:$('#kSelisih'),kSelisihTag:$('#kSelisihTag'),txNama:$('#txNama'),txBarang:$('#txBarang'),txHarga:$('#txHarga'),pill:$('#pricePill'),btnCash:$('#addCash'),btnQris:$('#addQris'),txBody:$('#txBody'),btnStart:$('#btnStart'),btnClose:$('#btnClose'),btnReset:$('#btnReset'),pcCopy:$('#pcCopy'),pcQty:$('#pcQty'),pcType:$('#pcType'),pcAddRow:$('#pcAddRow'),pcBody:$('#pcBody'),pcTotal:$('#pcTotal'),autoHarga:$('#autoHarga'),manualQty:$('#manualQty'),manualCopy:$('#manualCopy'),manualName:$('#manualName'),manualUnitPrice:$('#manualUnitPrice'),manualAdd:$('#manualAdd'),pcTuan:$('#pcTuan'),pcNoHP:$('#pcNoHP'),pcTanggal:$('#pcTanggal'),pcPukul:$('#pcPukul'),pcPanjar:$('#pcPanjar'),pcSisa:$('#pcSisa'),paidStamp:$('#paidStamp'),pcClear:$('#pcClear'),btnPrintReport:$('#btnPrintReport'),fullReport:$('#fullReport'),pcSub:$('#pcSub'),subNote:$('#subNote')};
const adminSpan=document.getElementById('adminName');if(adminSpan)adminSpan.textContent=CASHIER_NAME;

const getAuthToken = () => localStorage.getItem('token'); // Placeholder for JWT retrieval

const apiAddTx = async (payload) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found.');
    }
    const response = await fetch(`${BACKEND_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const jsonData = await response.json();
    if (jsonData.ok === false) throw new Error(jsonData.error || 'Server error');
    return jsonData;
  } catch (error) {
    console.error('❌ Error kirim:', error);
    throw error;
  }
};

const OPEN_KEY='p21_shift_open_date';
const shiftKeyFor=d=>'p21_shift_state_'+d;
const readState=d=>{try{return JSON.parse(localStorage.getItem(shiftKeyFor(d))||'null')}catch{return null}};
const writeState=(d,o)=>localStorage.setItem(shiftKeyFor(d),JSON.stringify(o||null));
const clearOpen=()=>localStorage.removeItem(OPEN_KEY);
function setTransaksiEnabled(enable){el.txNama.disabled=el.txBarang.disabled=!enable;el.pill.style.pointerEvents=enable?'auto':'none';el.pill.style.opacity=enable?'1':'.5';updateButtonsState()}
function updateButtonsState(){const enabled=(el.pill.style.pointerEvents!=='none');const hasName=!!el.txNama.value?.trim();const hasPrice=(+el.txHarga.value||0)>0;const ok=enabled&&hasName&&hasPrice;el.btnCash.disabled=!ok;el.btnQris.disabled=!ok}
function applyStarted(st){el.shiftBadge.textContent=`Mulai ${st.start_at} (Shift ${st.idx||1}) • ${st.date}`;el.btnStart.disabled=true;el.btnClose.disabled=false;setTransaksiEnabled(true)}
function applyClosed(st){el.shiftBadge.textContent=`Tutup ${st.end_at} (Shift ${st.idx||1}) • ${st.date}`;el.btnStart.disabled=false;el.btnClose.disabled=true;setTransaksiEnabled(false)}
function applyIdle(){el.shiftBadge.textContent='Belum mulai';el.btnStart.disabled=false;el.btnClose.disabled=true;setTransaksiEnabled(false)}
function initShift(){const openDate=localStorage.getItem(OPEN_KEY);if(openDate){const st=readState(openDate);if(st&&st.start_at&&!st.end_at){applyStarted(st);return}clearOpen()}const today=fmt.ymd();const stToday=readState(today);if(stToday&&stToday.start_at&&!stToday.end_at){localStorage.setItem(OPEN_KEY,today);applyStarted({...stToday,date:today});return}applyIdle()}
initShift();

el.btnStart.addEventListener('click',async()=>{const openDate=localStorage.getItem(OPEN_KEY);if(openDate){const st=readState(openDate);if(st&&st.start_at&&!st.end_at){st.end_at=fmt.hmsS();writeState(openDate,st)}clearOpen()}const d=fmt.ymd();const key='p21_shift_count_'+d;const idx=(parseInt(localStorage.getItem(key)||'0',10)+1);localStorage.setItem(key,String(idx));const st={date:d,start_at:fmt.hmsS(),end_at:null,idx};writeState(d,st);localStorage.setItem(OPEN_KEY,d);applyStarted(st);toast('Shift '+idx+' dimulai');try{fetch(WEB_APP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({type:'shift_start',payload:buildShiftPayloadCompat(st)})})}catch(e){}});

el.btnClose.addEventListener('click',async()=>{const d=localStorage.getItem(OPEN_KEY);if(!d){toast('Tidak ada shift aktif.');return}const st=readState(d);if(!st||!st.start_at||st.end_at){clearOpen();initShift();return}st.end_at=fmt.hmsS();writeState(d,st);clearOpen();applyClosed(st);try{await fetch(WEB_APP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({type:'save_shift',payload:{date:st.date,jam_mulai:st.start_at,jam_tutup:st.end_at,cashier:CASHIER_NAME}})});toast(`Shift ${st.idx} ditutup & disimpan`)}catch(e){toast('Gagal menyimpan shift')}});

el.btnReset.addEventListener('click',()=>{if(!confirm('Reset Shift?'))return;try{clearOpen();Object.keys(localStorage).filter(k=>k.startsWith('p21_shift_state_')).forEach(k=>localStorage.removeItem(k));const d=fmt.ymd();localStorage.removeItem('p21_shift_count_'+d);toast('Shift direset');initShift()}catch(e){alert('Gagal reset: '+e)}});

const STEP=1000;
const setPrice=v=>{v=Math.max(0,Math.round((v||0)/STEP)*STEP);el.txHarga.value=v;el.pill.textContent=IDR(v);updateButtonsState()};
const addPrice=d=>setPrice((+el.txHarga.value||0)+d);
el.pill?.addEventListener('wheel',e=>{e.preventDefault();if(el.pill.style.pointerEvents!=='none'){addPrice(e.deltaY<0?STEP:-STEP)}},{passive:false});
el.pill?.addEventListener('dblclick',()=>{if(el.pill.style.pointerEvents!=='none'){setPrice(0)}});
setPrice(+el.txHarga.value||0);
el.txNama?.addEventListener('input',updateButtonsState);

const KEY_TX_COUNTER='p21_tx_counter_'+CASHIER_KEY,KEY_TX_DATE='p21_tx_date_'+CASHIER_KEY;
const nextTxNumber=()=>{const d=fmt.ymd();const last=localStorage.getItem(KEY_TX_DATE);let n=0;if(last===d)n=parseInt(localStorage.getItem(KEY_TX_COUNTER)||'0',10);n++;localStorage.setItem(KEY_TX_COUNTER,String(n));localStorage.setItem(KEY_TX_DATE,d);return String(n).padStart(5,'0')};
function refreshKPI(){const rows=[...(el.txBody.children||[])];const sumBy=t=>rows.filter(r=>(r.cells[6]?.textContent||'')===t).reduce((s,r)=>s+parseIDR(r.cells[5]?.textContent||'0'),0);const cntBy=t=>rows.filter(r=>(r.cells[6]?.textContent||'')===t).length;const cash=sumBy('Cash'),qris=sumBy('QRIS');const cashN=cntBy('Cash'),qrisN=cntBy('QRIS');const omzet=cash+qris;const omzetN=cashN+qrisN;const saldoAwal=parseIDR2(el.kSaldoAwal.value),pengeluaran=parseIDR2(el.kExp.value),real=parseIDR2(el.kReal.value);const laci=Math.max(0,saldoAwal+cash-pengeluaran);const selisih=real-laci;const tag=selisih===0?{text:'PAS'}:(selisih>0?{text:'LEBIH'}:{text:'KURANG'});el.kCash.textContent=IDR(cash);el.kQris.textContent=IDR(qris);el.kOmzet.textContent=IDR(omzet);el.kCashN.textContent=cashN+'x';el.kQrisN.textContent=qrisN+'x';el.kOmzetN.textContent=omzetN+'x';el.kLaci.textContent=IDR(laci);const absVal=Math.abs(selisih);el.kSelisih.textContent=IDR(absVal);el.kSelisihTag.textContent=tag.text;return{cash,qris,omzet,cashN,qrisN,omzetN,laci,real,selisih}}

const addTx=async(method)=>{if(el.pill.style.pointerEvents==='none'){toast('Mulai shift dulu');return}const nama=(el.txNama.value||'').trim(),barang=(el.txBarang.value||'').trim(),harga=+(el.txHarga.value||0);if(!nama||!harga){toast('Isi nama & harga.');return}const nowD=new Date();const{tanggal:witaTgl,jam:witaJam}=witaDateTime(nowD);const tgljam=`${fmt.ymd(nowD)} ${fmt.hmsS(nowD)}`;const num=nextTxNumber(),kode=`${num}-${method.toUpperCase()}`;const row={Timestamp:tgljam,Tanggal:witaTgl,Jam:witaJam,'Kode Transaksi':kode,'Nama Transaksi':nama,Admin:CASHIER_NAME,Barang:barang,Harga:harga,Metode:method};const tr=document.createElement('tr');tr.innerHTML=`<td>${row.Timestamp}</td><td>${row['Kode Transaksi']}</td><td>${row['Nama Transaksi']}</td><td>${row.Admin}</td><td>${row.Barang||'-'}</td><td>${IDR(row.Harga)}</td><td>${row.Metode}</td>`;el.txBody.insertBefore(tr,el.txBody.firstChild);el.txNama.value='';el.txBarang.value='';setPrice(0);updateButtonsState();try{await apiAddTx(row);toast('Transaksi tersimpan')}catch{toast('Gagal simpan transaksi')}refreshKPI()};

el.btnCash?.addEventListener('click',()=>addTx('Cash'));
el.btnQris?.addEventListener('click',()=>addTx('QRIS'));

[$('#kSaldoAwal'),$('#kExp'),$('#kReal')].forEach(inp=>{inp.addEventListener('blur',()=>{const v=parseIDR2(inp.value);inp.value=v?IDR(v):'';refreshKPI()});inp.addEventListener('input',refreshKPI)});
$('#kReal').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();printReport()}});

const IDR2=IDR;const roundUp1000=n=>n>0?Math.ceil(n/1000)*1000:0;
const UNIT_MAP={'A4 Standar':'Lembar','A4 PPT 2 Slide':'Slide','A3 Standar':'Lembar','F4 Standar':'Lembar','A4 Full Color':'Lembar','F4 Full Color':'Lembar','Pas Foto':'Pcs','Map Bening':'Pcs','Jarak Ongkir Maxim':'Ribu Rupiah','Jilid Lakban':'Pcs','Ong. Lipat Leaflet':'Lembar','Jilid Antero Biasa':'Pcs','Antero Laminating':'Lembar','ATK Campur x Rp':'Pcs','Penjepit Kecil':'Pcs','Penjepit Sedang':'Pcs','Leaflet 1 Sisi':'Lembar','Leaflet 2 Sisi':'Lembar'};
function a4_unit_price(q){if(!q||q<=0)return 0;const anchors=[[1,320.74],[50,319.25],[100,295],[200,290],[300,285],[500,280],[1000,275],[2000,260],[5000,250],[10000,230]];if(q>=anchors.at(-1)[0])return anchors.at(-1)[1];if(q<=anchors[0][0])return anchors[0][1];for(let i=0;i<anchors.length-1;i++){const[qa,pa]=anchors[i],[qb,pb]=anchors[i+1];if(q>=qa&&q<=qb){const t=(q-qa)/(qb-qa);return pa+t*(pb-pa)}}return anchors.at(-1)[1]}

const a4_total=q=>Math.round(q*a4_unit_price(q));
const f4_total=q=>Math.round(a4_total(q)+15*Math.max(0,q));
const a4c=q=>650*q,f4c=q=>665*q,ppt=q=>175*q;
function pas(q){if(!q||q<=0)return 0;if(q===1)return 3000;if(q===2)return 4000;if(q===3)return 5000;const startUnit=1666,endUnit=850,minQ=4,maxQ=50;if(q>=maxQ)return Math.round(q*endUnit);let unit;unit=startUnit+((q-minQ)/(maxQ-minQ))*(endUnit-startUnit);return Math.round(q*unit)}
function mapBening(q){if(q<=0)return 0;if(q<=4)return q*2000;if(q<=12){const total=8000+(q-4)/8*(20000-8000);return Math.round(total)}const unit12=20000/12;if(q<=50){const unit=unit12+(q-12)/(50-12)*(1500-unit12);return Math.round(q*unit)}return Math.round(q*1500)}
const jarakOngkirMaxim=q=>q<=0?0:1000*q;
function jilidLakban(q){if(q<=0)return 0;const start=5000,end=3500,maxQ=50;if(q>=maxQ)return Math.round(q*end);const unit=start+((q-1)/(maxQ-1))*(end-start);return Math.round(q*unit)}
const ongLipatLeaflet=q=>q<=0?0:100*q;
function jilidAnteroBiasa(q){return q<=0?0:8000*q}
function anteroLaminating(q){return q<=0?0:12000*q}
function atkCampur(q){return q<=0?0:1000*q}
function penjepitKecil(q){if(q<=0)return 0;const start=1000,end=700,maxQ=30;if(q>=maxQ)return Math.round(q*end);const unit=start+((q-1)/(maxQ-1))*(end-start);return Math.round(q*unit)}
function penjepitSedang(q){if(q<=0)return 0;const start=2000,end=1000,maxQ=50;if(q>=maxQ)return Math.round(q*end);const unit=start+((q-1)/(maxQ-1))*(end-start);return Math.round(q*unit)}
function leaflet1Sisi(q){if(q<=0)return 0;const start=333,end=285,maxQ=1000;if(q>=maxQ)return Math.round(q*end);const unit=start+((q-1)/(maxQ-1))*(end-start);return Math.round(q*unit)}
function leaflet2Sisi(q){if(q<=0)return 0;const start=666,end=570,maxQ=500;if(q>=maxQ)return Math.round(q*end);const unit=start+((q-1)/(maxQ-1))*(end-start);return Math.round(q*unit)}
function getTotal(type,qty){if(type==='A3 Standar')return a4_total(qty)*2;if(type==='A4 Standar')return a4_total(qty);if(type==='F4 Standar')return f4_total(qty);if(type==='A4 Full Color')return a4c(qty);if(type==='F4 Full Color')return f4c(qty);if(type==='A4 PPT 2 Slide')return ppt(qty);if(type==='Pas Foto')return pas(qty);if(type==='Map Bening')return mapBening(qty);if(type==='Jarak Ongkir Maxim')return jarakOngkirMaxim(qty);if(type==='Jilid Lakban')return jilidLakban(qty);if(type==='Ong. Lipat Leaflet')return ongLipatLeaflet(qty);if(type==='Jilid Antero Biasa')return jilidAnteroBiasa(qty);if(type==='Antero Laminating')return anteroLaminating(qty);if(type==='ATK Campur x Rp')return atkCampur(qty);if(type==='Penjepit Kecil')return penjepitKecil(qty);if(type==='Penjepit Sedang')return penjepitSedang(qty);if(type==='Leaflet 1 Sisi')return leaflet1Sisi(qty);if(type==='Leaflet 2 Sisi')return leaflet2Sisi(qty);return 0}
function makeRow(copy,qty,label,rowTotal,totalLembar){const unitName=UNIT_MAP[label]||'Lembar';const unitPerCopy=copy>0?Math.round(rowTotal/copy):0;const tr=document.createElement('tr');tr.setAttribute('data-raw',String(rowTotal));tr.setAttribute('data-lembar',String(totalLembar));tr.innerHTML=`<td class="rangkapCell" data-copy="${copy}" contenteditable="true" inputmode="numeric">${copy} x</td><td class="qtyCell"><div class="qtyBox" title="Klik untuk ganti satuan"><div class="qtyNum">${qty}</div><div class="qtyUnit">${unitName}</div></div></td><td>${label}</td><td class="pcUnit">${IDR2(unitPerCopy)}</td><td class="pcTotal">${IDR2(rowTotal)}</td><td><button class="btn delPc" title="Hapus" style="width:34px;height:34px;font-size:16px;border-radius:10px;background:#3b82f6">×</button></td>`;return tr}
function updateAutoHarga(){const copy=Math.max(1,parseInt(el.pcCopy.value)||0);const qty=Math.max(1,parseInt(el.pcQty.value)||0);const type=el.pcType.value||'A4 Standar';const totalLembar=copy*qty;if(totalLembar<=0){el.autoHarga.value='';return}let rowTotal=getTotal(type,totalLembar);if(subActive)rowTotal=Math.round(rowTotal*0.95);const unitPerLembar=Math.max(0,Math.round(rowTotal/totalLembar));el.autoHarga.value=unitPerLembar?IDR2(unitPerLembar):''}
el.pcQty?.addEventListener('input',updateAutoHarga);
el.pcCopy?.addEventListener('input',updateAutoHarga);
el.pcType?.addEventListener('change',updateAutoHarga);
updateAutoHarga();
function refreshPcTotal(){let sum=[...el.pcBody.children].reduce((s,row)=>s+Number(row.getAttribute('data-raw')||0),0);sum=roundUp1000(sum);el.pcTotal.value=IDR2(sum);const panjarVal=parseIDR(el.pcPanjar.value||'0');if(!el.pcPanjar.value.trim()){el.pcSisa.value='';return}const sisa=Math.max(0,sum-panjarVal);el.pcSisa.value=IDR2(sisa)}

el.pcAddRow?.addEventListener('click',()=>{const copy=Math.max(1,parseInt(el.pcCopy.value)||0),qty=Math.max(1,parseInt(el.pcQty.value)||0),type=el.pcType.value;if(!copy||!qty){alert('Isi Rangkap & Qty');return}const totalLembar=copy*qty;let rowTotal=getTotal(type,totalLembar);if(['A4 Standar','A4 PPT 2 Slide'].includes(type)&&totalLembar<=50){const ratio=(50-totalLembar)/49;rowTotal+=Math.round(500*ratio)}if(subActive)rowTotal=Math.round(rowTotal*0.95);
el.pcBody.prepend(makeRow(copy,qty,type,rowTotal,totalLembar));
el.pcQty.value='';updateAutoHarga();refreshPcTotal()});
el.manualAdd?.addEventListener('click',()=>{const q=Math.max(1,parseInt(el.manualQty.value)||1),c=Math.max(1,parseInt(el.manualCopy.value)||1);const name=(el.manualName.value||'').trim();const unit=parseIDR2(el.manualUnitPrice.value);if(!name||!unit){alert('Lengkapi item manual.');return}const totalLembar=q*c;const rowTotal=totalLembar*unit;
el.pcBody.prepend(makeRow(c,q,`${name} (Manual)`,rowTotal,totalLembar));
el.manualQty.value=1;el.manualCopy.value=1;el.manualName.value='';el.manualUnitPrice.value='';refreshPcTotal()});

el.pcBody?.addEventListener('click',e=>{const btn=e.target.closest('.delPc')||e.target.closest('.del');if(!btn)return;btn.closest('tr').remove();refreshPcTotal()});
el.pcClear.addEventListener('click',()=>{
  if(el.pcBody.children.length===0){alert("Tabel kosong");return}
  if(!confirm('Bersihkan semua item nota?'))return
  el.pcBody.innerHTML="";
  if(el.pcTotal.tagName==='INPUT'){el.pcTotal.value="Rp. 0"}else{el.pcTotal.textContent="Rp. 0"}
  const tuan=document.getElementById('pcTuan');
  const noHP=document.getElementById('pcNoHP');
  const tgl=document.getElementById('pcTanggal');
  const jam=document.getElementById('pcPukul');
  const catatan=document.getElementById('pcCatatan');
  const chkLunas=document.getElementById('chkLunas');
  const paidStamp=document.getElementById('paidStamp');
  if(tuan)tuan.value='';
  if(noHP)noHP.value='';
  if(tgl)tgl.textContent='';
  if(jam)jam.textContent='';
  if(catatan)catatan.value='';
  if(chkLunas)chkLunas.checked=false;
  if(paidStamp)paidStamp.style.display='none';
  el.pcPanjar.value='';
  el.pcSisa.value='';
  updateAutoHarga()
});
el.pcPanjar?.addEventListener('input',()=>{const totalVal=parseIDR(el.pcTotal.value||el.pcTotal.textContent||'0');if(!el.pcPanjar.value.trim()){el.pcSisa.value='';return}const panjarVal=parseIDR(el.pcPanjar.value);const sisa=Math.max(0,totalVal-panjarVal);el.pcSisa.value=IDR2(sisa)});
el.pcSub?.addEventListener('click',()=>{subActive=!subActive;const btn=document.getElementById('pcSub');if(btn){btn.style.background=subActive?'#16a34a':'#dc2626';btn.setAttribute('aria-pressed',String(subActive))}if(el.subNote){el.subNote.textContent=subActive?'Selamat, Anda salah satu pelanggan Setia kami, Anda berhak Mendapat Diskon Khusus dari Kami. Terima kasih Sudah Menjadi Langganan Kami':'Menggunakan Kalkulator Auto, Banyak Auto Diskon Siap Harga Langganan.'}updateAutoHarga()});
(function inlineInfo(){let locked=false;function fillWITAOnce(){if(locked)return;const parts=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',weekday:'long',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());const pick=t=>parts.find(p=>p.type===t)?.value||'';el.pcTanggal.textContent=`${pick('weekday')}, ${pick('day')} ${pick('month')} ${pick('year')}`;el.pcPukul.textContent=`${pick('hour')}:${pick('minute')} WITA`;locked=true}el.pcTuan.addEventListener('input',()=>{if(el.pcTuan.value.trim().length>0)fillWITAOnce()});el.pcTuan.addEventListener('keydown',(e)=>{if(e.key==='Enter'&&el.pcTuan.value.trim().length>0){fillWITAOnce();el.pcTuan.blur()}});const pcClearBtn=document.getElementById('pcClear');if(pcClearBtn){pcClearBtn.addEventListener('click',()=>{locked=false})}})();
(function tzTick(){const tick=()=>{const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'unknown';const s=document.getElementById('tzDebug');if(s)s.textContent=`${tz} ${fmt.hmsS()}`};tick();setInterval(tick,60000)})();
(function(){const LS_KEY='p21_col_split_v3';const container=document.querySelector('.container');const splitter=document.querySelector('.splitter');if(!container||!splitter)return;function applySplit(frac){frac=Math.max(0.25,Math.min(0.75,frac));const left=(frac*100).toFixed(2);const right=(100-frac*100).toFixed(2);container.style.setProperty('--col-left',`${left}fr`);container.style.setProperty('--col-right',`${right}fr`);try{localStorage.setItem(LS_KEY,JSON.stringify({frac}))}catch(e){}}try{const saved=JSON.parse(localStorage.getItem(LS_KEY)||'null');if(saved&&typeof saved.frac==='number')applySplit(saved.frac)}catch(e){}let dragging=false;splitter.addEventListener('mousedown',(ev)=>{if(window.matchMedia('(max-width:1100px)').matches)return;dragging=true;document.body.style.cursor='col-resize';ev.preventDefault()});window.addEventListener('mousemove',(ev)=>{if(!dragging)return;applySplit((ev.clientX-container.getBoundingClientRect().left)/container.getBoundingClientRect().width)});window.addEventListener('mouseup',()=>{if(!dragging)return;dragging=false;document.body.style.cursor=''});splitter.addEventListener('dblclick',()=>applySplit(0.55))})();
function collectTransactions(){const rows=[...(el.txBody.children||[])];return rows.map(r=>({t:r.cells[0]?.textContent||'',k:r.cells[1]?.textContent||'',n:r.cells[2]?.textContent||'',a:r.cells[3]?.textContent||'',b:r.cells[4]?.textContent||'',h:r.cells[5]?.textContent||'',m:r.cells[6]?.textContent||''}))}
function buildReport(){const date=fmt.ymd();const{cash,qris,omzet,cashN,qrisN,omzetN,laci,real,selisih}=refreshKPI();const saldoAwal=parseIDR2(el.kSaldoAwal.value),pengeluaran=parseIDR2(el.kExp.value);const tx=collectTransactions();const cashTx=tx.filter(r=>(r.m||'').toLowerCase()==='cash');const qrisTx=tx.filter(r=>(r.m||'').toLowerCase()==='qris');const st=readState(date);let durasi='';if(st&&st.start_at&&st.end_at){const[hStart,mStart,sStart]=st.start_at.split(':');const[hEnd,mEnd,sEnd]=st.end_at.split(':');let startMinutes=parseInt(hStart,10)*60+parseInt(mStart,10);let endMinutes=parseInt(hEnd,10)*60+parseInt(mEnd,10);if(endMinutes<startMinutes)endMinutes+=24*60;const diffMin=endMinutes-startMinutes;const hours=Math.floor(diffMin/60);const minutes=diffMin%60;durasi=(hours?hours+'j ':'')+minutes+'m'}const selisihAbsV=Math.abs(selisih);const selisihText=selisih<0?`minus ${IDR(selisihAbsV)}`:selisih>0?`Lebih ${IDR(selisihAbsV)}`:`PAS ${IDR(selisihAbsV)}`;const selisihCls=selisih>0?'pos':(selisih<0?'neg':'zero');el.fullReport.innerHTML=`<div class="rtitle">Laporan Harian — Percetakan 21</div><div class="header-info">Tanggal: ${date} • Admin: ${CASHIER_NAME}</div><div class="box" style="margin:8px 0"><div class="kpi-grid"><div class="kpi-item"><div class="k">Saldo Awal</div><div class="v">${IDR(saldoAwal)}</div></div><div class="kpi-item"><div class="k">Cash</div><div class="v">${IDR(cash)} <span class="subtle">(${cashN}x)</span></div></div><div class="kpi-item"><div class="k">QRIS</div><div class="v">${IDR(qris)} <span class="subtle">(${qrisN}x)</span></div></div><div class="kpi-item"><div class="k">Omzet</div><div class="v">${IDR(omzet)} <span class="subtle">(${omzetN}x)</span></div></div><div class="kpi-item"><div class="k">Pengeluaran</div><div class="v">${IDR(pengeluaran)}</div></div><div class="kpi-item"><div class="k">Uang Laci</div><div class="v">${IDR(laci)}</div></div><div class="kpi-item"><div class="k">Uang Real</div><div class="v">${IDR(real)}</div></div><div class="kpi-item"><div class="k">Selisih</div><div class="v ${selisihCls}">${selisihText}</div></div><div class="kpi-item"><div class="k">Durasi</div><div class="v">${durasi}</div></div></div></div><div class="two-columns"><div class="box"><b>Transaksi Cash (${cashN}x)</b><table><thead><tr><th>Jam</th><th>Kode</th><th>Nama</th><th>Harga</th></tr></thead><tbody>${cashTx.map(r=>`<tr><td>${(r.t||'').split(' ')[1]}</td><td>${r.k}</td><td>${r.n}</td><td>${r.h}</td></tr>`).join('')}</tbody></table></div><div class="box"><b>Transaksi QRIS (${qrisN}x)</b><table><thead><tr><th>Jam</th><th>Kode</th><th>Nama</th><th>Harga</th></tr></thead><tbody>${qrisTx.map(r=>`<tr><td>${(r.t||'').split(' ')[1]}</td><td>${r.k}</td><td>${r.n}</td><td>${r.h}</td></tr>`).join('')}</tbody></table></div></div>`}
function printReport(){buildReport();document.body.classList.add('print-report');setTimeout(()=>window.print(),10);window.onafterprint=()=>{document.body.classList.remove('print-report')}}
el.btnPrintReport?.addEventListener('click',printReport);

document.getElementById('btnSettings').addEventListener('click', () => {
    window.location.href = 'settings.html';
});

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

async function saveCalcToSheet() {
  if(!el.pcBody || el.pcBody.children.length === 0) {
    alert('Belum ada item di nota!');
    return false;
  }
  
  const rows = [...el.pcBody.children].map(tr => {
    const qty = parseInt(tr.querySelector('.qtyNum')?.textContent || '0');
    const jenis = tr.cells[2]?.textContent?.trim() || '';
    const hargaSatuan = parseIDR(tr.querySelector('.pcUnit')?.textContent || 'Rp. 0');
    const jumlah = parseIDR(tr.querySelector('.pcTotal')?.textContent || 'Rp. 0');
    return { 'Qty': qty, 'jenis pesanan': jenis, 'harga satuan': hargaSatuan, 'Jumlah': jumlah };
  });

  const now = new Date();
  const {tanggal: witaTgl, jam: witaJam} = witaDateTime(now);
  
  const catatanInput = (document.getElementById('pcCatatan')?.value || '').trim();
  const lunasText = document.getElementById('chkLunas')?.checked ? ' [LUNAS]' : '';
  const finalCatatan = `${CASHIER_NAME} : ${catatanInput}${lunasText}`;

  const payload = {
    Timestamp: `${witaTgl} ${witaJam}`,
    Tanggal: witaTgl,
    Jam: witaJam,
    'Kode Transaksi': 'NOTA-' + Date.now(), // Generate a unique code for the receipt
    'Nama Transaksi': 'Pesanan Kalkulator',
    Admin: CASHIER_NAME,
    Barang: JSON.stringify(rows), // Store details as a string or in a separate collection
    Harga: parseIDR(el.pcTotal.value || '0'),
    Metode: 'Nota',
    'Tuan': (el.pcTuan.value || '').trim(),
    'Nomor HP': (el.pcNoHP.value || '').trim(),
    'Panjar': parseIDR(el.pcPanjar.value || '0'),
    'Sisa': parseIDR(el.pcSisa.value || '0'),
    'Catatan': finalCatatan
  };

  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found.');
    }
    const response = await fetch(`${BACKEND_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (response.ok) {
      toast('✅ Nota tersimpan ke database!');
      return true;
    } else {
      toast('❌ Gagal: ' + (result.message || 'Unknown error'));
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    toast('❌ Gagal kirim data');
    return false;
  }
}

const btnSave=document.getElementById('pcSave');if(btnSave){btnSave.addEventListener('click',async()=>{if(el.pcBody.children.length===0){alert('Belum ada item di nota!');return}const confirmed=confirm('Simpan nota ini ke database?');if(!confirmed)return;await saveCalcToSheet()})}

const btnPrintSave=document.getElementById('pcPrintSave');if(btnPrintSave){btnPrintSave.addEventListener('click',async()=>{if(el.pcBody.children.length===0){alert('Belum ada item di nota!');return}const confirmed=confirm('Cetak dan simpan nota ini ke database?');if(!confirmed)return;const saved = await saveCalcToSheet();if(saved){printReport()}})}
const chkLunas=document.getElementById('chkLunas');const paidStamp=document.getElementById('paidStamp');if(chkLunas&&paidStamp){chkLunas.addEventListener('change',()=>{paidStamp.style.display=chkLunas.checked?'block':'none'})}
(function enableLeaveGuard(){function shouldGuard(){try{if(document.body.classList.contains('print-report'))return false;var open=localStorage.getItem(OPEN_KEY);var active=false;if(open){var st=readState(open);active=!!(st&&st.start_at&&!st.end_at)}var draftPrice=(+el.txHarga.value||0)>0;var draftName=(el.txNama.value||'').trim().length>0||(el.txBarang.value||'').trim().length>0;var hasCalcRows=!!(el.pcBody&&el.pcBody.children&&el.pcBody.children.length>0);var hasPanjar=(el.pcPanjar&&el.pcPanjar.value||'').trim().length>0;var hasReal=(el.kReal&&el.kReal.value||'').trim().length>0;return active||draftPrice||draftName||hasCalcRows||hasPanjar||hasReal}catch(e){return false}}window.addEventListener('beforeunload',function(e){if(!shouldGuard())return;e.preventDefault();e.returnValue=''})})();
refreshKPI()})();