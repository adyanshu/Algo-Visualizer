/* ═══════════════════════════════════════════════
   DIVIDE & CONQUER ALGORITHM VISUALIZER
   ═══════════════════════════════════════════════ */

// ── State ──
let currentAlgo = 'merge';
let steps = [];
let stepIdx = -1;
let playing = false;
let playTimer = null;
let speed = 5;

// ── DOM refs ──
const $ = id => document.getElementById(id);
const vizContainer = $('vizContainer');
const inputData = $('inputData');
const stepBadge = $('stepBadge');
const stepText = $('stepText');
const stepCounter = $('stepCounter');
const sidebar = $('sidebar');

// ── Speed ──
$('speedSlider').addEventListener('input', e => {
  speed = +e.target.value;
  $('speedLabel').textContent = speed + 'x';
});
function getDelay() { return 1200 - speed * 100; }

// ── Tab switching ──
document.querySelectorAll('.algo-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.algo-tab.active').classList.remove('active');
    tab.classList.add('active');
    currentAlgo = tab.dataset.algo;
    resetViz();
    setDefaultInput();
    renderSidebar();
  });
});

// ── Buttons ──
$('btnStart').addEventListener('click', startViz);
$('btnStep').addEventListener('click', nextStep);
$('btnReset').addEventListener('click', resetViz);
$('btnRandom').addEventListener('click', generateRandom);

function generateRandom() {
  if (currentAlgo === 'strassen') {
    const m = () => Array.from({length:4},()=>Math.floor(Math.random()*10));
    inputData.value = m().join(',') + ' | ' + m().join(',');
  } else if (currentAlgo === 'closest' || currentAlgo === 'convex') {
    const pts = Array.from({length:8},()=>`(${Math.floor(Math.random()*80+10)},${Math.floor(Math.random()*80+10)})`);
    inputData.value = pts.join(', ');
  } else {
    const n = Math.floor(Math.random()*5)+6;
    const arr = Array.from({length:n},()=>Math.floor(Math.random()*95)+5);
    inputData.value = arr.join(', ');
  }
}

function setDefaultInput() {
  const defaults = {
    merge: '38, 27, 43, 3, 9, 82, 10',
    quick: '50, 23, 9, 18, 61, 32, 45, 7',
    minmax: '42, 15, 73, 8, 56, 31, 67, 22',
    maxsub: '-2, 1, -3, 4, -1, 2, 1, -5, 4',
    strassen: '1,2,3,4 | 5,6,7,8',
    closest: '(2,3), (12,30), (40,50), (5,1), (12,10), (3,4), (7,8), (15,20)',
    convex: '(10,10), (70,20), (50,70), (20,60), (40,30), (30,50), (60,40), (45,55)'
  };
  inputData.value = defaults[currentAlgo] || defaults.merge;
}

function parseArray() {
  return inputData.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
}
function parsePoints() {
  const matches = inputData.value.matchAll(/\((\d+\.?\d*)\s*,\s*(\d+\.?\d*)\)/g);
  return [...matches].map(m => ({x:parseFloat(m[1]), y:parseFloat(m[2])}));
}
function parseMatrices() {
  const parts = inputData.value.split('|');
  const parse = s => s.split(',').map(n=>parseInt(n.trim())).filter(n=>!isNaN(n));
  const a = parse(parts[0]||'');
  const b = parse(parts[1]||'');
  while(a.length<4) a.push(0);
  while(b.length<4) b.push(0);
  return [[[a[0],a[1]],[a[2],a[3]]], [[b[0],b[1]],[b[2],b[3]]]];
}

// ── Reset ──
function resetViz() {
  clearInterval(playTimer);
  playing = false;
  steps = [];
  stepIdx = -1;
  vizContainer.innerHTML = '';
  stepBadge.className = 'step-badge divide';
  stepBadge.textContent = 'READY';
  stepText.textContent = 'Configure input and press Start to begin.';
  stepCounter.textContent = 'Step 0 / 0';
}

// ── Start ──
function startViz() {
  resetViz();
  switch(currentAlgo) {
    case 'merge': steps = generateMergeSortSteps(parseArray()); break;
    case 'quick': steps = generateQuickSortSteps(parseArray()); break;
    case 'minmax': steps = generateMinMaxSteps(parseArray()); break;
    case 'maxsub': steps = generateMaxSubSteps(parseArray()); break;
    case 'strassen': steps = generateStrassenSteps(...parseMatrices()); break;
    case 'closest': steps = generateClosestPairSteps(parsePoints()); break;
    case 'convex': steps = generateConvexHullSteps(parsePoints()); break;
  }
  if (!steps.length) { stepText.textContent = 'No steps generated. Check input.'; return; }
  playing = true;
  playNext();
}

function nextStep() {
  playing = false;
  clearInterval(playTimer);
  if (stepIdx < steps.length - 1) { stepIdx++; renderStep(); }
}

function playNext() {
  if (!playing || stepIdx >= steps.length - 1) { playing = false; return; }
  stepIdx++;
  renderStep();
  playTimer = setTimeout(playNext, getDelay());
}

function renderStep() {
  const s = steps[stepIdx];
  stepBadge.className = 'step-badge ' + s.phase;
  stepBadge.textContent = s.phase.toUpperCase();
  stepText.textContent = s.text;
  stepCounter.textContent = `Step ${stepIdx+1} / ${steps.length}`;
  s.render(vizContainer);
}

/* ═══════════════════════════════════════════════
   MERGE SORT
   ═══════════════════════════════════════════════ */
function generateMergeSortSteps(arr) {
  const steps = [];
  const tree = []; // track tree levels

  function ms(a, depth, label) {
    if (a.length <= 1) {
      steps.push({
        phase:'conquer', text:`Base case: [${a}] is already sorted.`,
        render: c => renderMergeTree(c, tree, steps.indexOf(steps[steps.length-1]))
      });
      return [...a];
    }
    const mid = Math.floor(a.length / 2);
    const left = a.slice(0, mid);
    const right = a.slice(mid);

    // Divide step
    const divNode = {arr:[...a], left:[...left], right:[...right], depth, state:'divide', merged:null};
    tree.push(divNode);
    steps.push({
      phase:'divide', text:`Divide [${a}] → [${left}] and [${right}]`,
      render: c => renderMergeSplit(c, a, left, right, null, 'divide')
    });

    const sortedL = ms(left, depth+1, 'L');
    const sortedR = ms(right, depth+1, 'R');

    // Combine step
    const merged = [];
    let i=0, j=0;
    const lc=[...sortedL], rc=[...sortedR];
    while(i<lc.length && j<rc.length){
      if(lc[i]<=rc[j]) merged.push(lc[i++]); else merged.push(rc[j++]);
    }
    while(i<lc.length) merged.push(lc[i++]);
    while(j<rc.length) merged.push(rc[j++]);

    divNode.state = 'combined';
    divNode.merged = merged;
    steps.push({
      phase:'combine', text:`Merge [${sortedL}] + [${sortedR}] → [${merged}]`,
      render: c => renderMergeSplit(c, a, sortedL, sortedR, merged, 'combine')
    });
    return merged;
  }
  ms(arr, 0, 'root');
  return steps;
}

function renderMergeSplit(container, orig, left, right, merged, phase) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px">';
  html += `<div class="sub-section" style="text-align:center"><h5>Original</h5><div class="array-display">${orig.map(v=>`<div class="arr-cell">${v}</div>`).join('')}</div></div>`;
  html += '<div style="font-size:1.5rem;color:var(--divide)">↙ ↘</div>';
  html += '<div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap">';
  html += `<div class="sub-section"><h5>Left Half</h5><div class="array-display">${left.map(v=>`<div class="arr-cell left">${v}</div>`).join('')}</div></div>`;
  html += `<div class="sub-section"><h5>Right Half</h5><div class="array-display">${right.map(v=>`<div class="arr-cell right">${v}</div>`).join('')}</div></div>`;
  html += '</div>';
  if (merged) {
    html += '<div style="font-size:1.5rem;color:var(--combine)">↘ ↙</div>';
    html += `<div class="sub-section" style="text-align:center;border-color:var(--accent)"><h5 style="color:var(--accent)">Merged Result</h5><div class="array-display">${merged.map(v=>`<div class="arr-cell merged">${v}</div>`).join('')}</div></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

function renderMergeTree(container, tree, idx) {
  // Simple view
  container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-dim)">Base case reached — single element is sorted.</div>';
}

/* ═══════════════════════════════════════════════
   QUICK SORT
   ═══════════════════════════════════════════════ */
function generateQuickSortSteps(arr) {
  const steps = [];
  const fullArr = [...arr];

  function qs(a, lo, hi) {
    if (lo >= hi) {
      if (lo === hi) {
        steps.push({
          phase:'conquer', text:`Base case: element [${a[lo]}] at index ${lo} is in place.`,
          render: c => renderQuickStep(c, [...a], lo, hi, -1, [], [], 'conquer')
        });
      }
      return;
    }
    const pivot = a[hi];
    steps.push({
      phase:'divide', text:`Choose pivot = ${pivot} (rightmost). Partition subarray [${a.slice(lo,hi+1)}].`,
      render: c => renderQuickStep(c, [...a], lo, hi, hi, [], [], 'divide')
    });

    let i = lo;
    const leftIdx = [], rightIdx = [];
    for (let j = lo; j < hi; j++) {
      if (a[j] <= pivot) {
        [a[i], a[j]] = [a[j], a[i]];
        leftIdx.push(i);
        i++;
      } else {
        rightIdx.push(j);
      }
    }
    [a[i], a[hi]] = [a[hi], a[i]];
    const pivotPos = i;

    steps.push({
      phase:'conquer', text:`After partition: pivot ${pivot} placed at index ${pivotPos}. Left: [${a.slice(lo,pivotPos)}], Right: [${a.slice(pivotPos+1,hi+1)}]`,
      render: c => renderQuickStep(c, [...a], lo, hi, pivotPos, a.slice(lo,pivotPos).map((_,k)=>lo+k), a.slice(pivotPos+1,hi+1).map((_,k)=>pivotPos+1+k), 'conquer')
    });

    qs(a, lo, pivotPos - 1);
    qs(a, pivotPos + 1, hi);
  }

  qs([...arr], 0, arr.length - 1);
  steps.push({
    phase:'combine', text:`Array fully sorted: [${[...arr].sort((a,b)=>a-b)}]`,
    render: c => {
      const sorted = [...arr].sort((a,b)=>a-b);
      c.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:30px"><h4 style="color:var(--accent)">✓ Sorted Array</h4><div class="array-display">${sorted.map(v=>`<div class="arr-cell sorted">${v}</div>`).join('')}</div></div>`;
    }
  });
  return steps;
}

function renderQuickStep(container, arr, lo, hi, pivotIdx, leftIndices, rightIndices, phase) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px">';
  html += '<div class="array-display">';
  arr.forEach((v, i) => {
    let cls = 'arr-cell';
    if (i === pivotIdx) cls += ' pivot';
    else if (i >= lo && i <= hi && leftIndices.includes(i)) cls += ' left';
    else if (i >= lo && i <= hi && rightIndices.includes(i)) cls += ' right';
    else if (i < lo || i > hi) cls += ' sorted';
    html += `<div class="${cls}">${v}</div>`;
  });
  html += '</div>';
  html += '<div class="legend">';
  html += '<div class="legend-item"><div class="legend-color" style="background:var(--pink)"></div>Pivot</div>';
  html += '<div class="legend-item"><div class="legend-color" style="background:var(--blue)"></div>≤ Pivot</div>';
  html += '<div class="legend-item"><div class="legend-color" style="background:var(--cyan)"></div>> Pivot</div>';
  html += '<div class="legend-item"><div class="legend-color" style="background:var(--green)"></div>Sorted</div>';
  html += '</div>';
  if (lo <= hi) {
    html += `<div style="font-size:.8rem;color:var(--text-dim)">Working on indices ${lo} to ${hi}</div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

/* ═══════════════════════════════════════════════
   MIN AND MAX FINDING
   ═══════════════════════════════════════════════ */
function generateMinMaxSteps(arr) {
  const steps = [];

  function findMinMax(a, lo, hi) {
    if (lo === hi) {
      steps.push({
        phase:'conquer', text:`Base case: single element [${a[lo]}] → min=${a[lo]}, max=${a[lo]}`,
        render: c => renderMinMaxStep(c, arr, lo, hi, a[lo], a[lo], null, null)
      });
      return {min: a[lo], max: a[lo]};
    }
    if (hi === lo + 1) {
      const mn = Math.min(a[lo], a[hi]), mx = Math.max(a[lo], a[hi]);
      steps.push({
        phase:'conquer', text:`Two elements [${a[lo]}, ${a[hi]}]: min=${mn}, max=${mx}`,
        render: c => renderMinMaxStep(c, arr, lo, hi, mn, mx, null, null)
      });
      return {min: mn, max: mx};
    }
    const mid = Math.floor((lo + hi) / 2);
    steps.push({
      phase:'divide', text:`Divide [${a.slice(lo,hi+1)}] at mid=${mid} → [${a.slice(lo,mid+1)}] and [${a.slice(mid+1,hi+1)}]`,
      render: c => renderMinMaxDivide(c, arr, lo, hi, mid)
    });

    const leftR = findMinMax(a, lo, mid);
    const rightR = findMinMax(a, mid+1, hi);

    const mn = Math.min(leftR.min, rightR.min);
    const mx = Math.max(leftR.max, rightR.max);
    steps.push({
      phase:'combine', text:`Combine: min(${leftR.min},${rightR.min})=${mn}, max(${leftR.max},${rightR.max})=${mx}`,
      render: c => renderMinMaxStep(c, arr, lo, hi, mn, mx, leftR, rightR)
    });
    return {min: mn, max: mx};
  }

  findMinMax(arr, 0, arr.length - 1);
  return steps;
}

function renderMinMaxDivide(container, arr, lo, hi, mid) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px">';
  html += '<div class="array-display">';
  arr.forEach((v,i) => {
    let cls = 'arr-cell';
    if (i >= lo && i <= mid) cls += ' left';
    else if (i > mid && i <= hi) cls += ' right';
    html += `<div class="${cls}">${v}</div>`;
  });
  html += '</div>';
  html += `<div style="font-size:.85rem;color:var(--divide)">↙ Dividing at index ${mid} ↘</div>`;
  html += '</div>';
  container.innerHTML = html;
}

function renderMinMaxStep(container, fullArr, lo, hi, min, max, leftR, rightR) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px">';
  html += '<div class="array-display">';
  fullArr.forEach((v,i) => {
    let cls = 'arr-cell';
    if (v === min && i >= lo && i <= hi) cls += ' min-cell';
    if (v === max && i >= lo && i <= hi) cls += ' max-cell';
    if (i >= lo && i <= hi) cls += ' active';
    html += `<div class="${cls}">${v}</div>`;
  });
  html += '</div>';
  if (leftR && rightR) {
    html += '<div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center">';
    html += `<div class="sub-section"><h5>Left Result</h5><p style="font-size:.85rem">min=${leftR.min}, max=${leftR.max}</p></div>`;
    html += `<div class="sub-section"><h5>Right Result</h5><p style="font-size:.85rem">min=${rightR.min}, max=${rightR.max}</p></div>`;
    html += '</div>';
  }
  html += `<div class="sub-section" style="text-align:center;border-color:var(--accent)"><h5 style="color:var(--accent)">Result</h5><p style="font-size:1rem"><span style="color:var(--blue)">Min = ${min}</span> &nbsp;|&nbsp; <span style="color:var(--red)">Max = ${max}</span></p></div>`;
  html += '<div class="legend"><div class="legend-item"><div class="legend-color" style="background:var(--blue)"></div>Min</div><div class="legend-item"><div class="legend-color" style="background:var(--red)"></div>Max</div></div>';
  html += '</div>';
  container.innerHTML = html;
}

/* ═══════════════════════════════════════════════
   MAX SUBARRAY SUM (Kadane-style D&C)
   ═══════════════════════════════════════════════ */
function generateMaxSubSteps(arr) {
  const steps = [];

  function maxCross(a, lo, mid, hi) {
    let leftSum = -Infinity, sum = 0, maxL = mid;
    for (let i = mid; i >= lo; i--) { sum += a[i]; if (sum > leftSum) { leftSum = sum; maxL = i; } }
    let rightSum = -Infinity; sum = 0; let maxR = mid+1;
    for (let i = mid+1; i <= hi; i++) { sum += a[i]; if (sum > rightSum) { rightSum = sum; maxR = i; } }
    return {sum: leftSum + rightSum, lo: maxL, hi: maxR};
  }

  function maxSub(a, lo, hi) {
    if (lo === hi) {
      steps.push({
        phase:'conquer', text:`Base case: element ${a[lo]} at index ${lo}. Max subarray sum = ${a[lo]}`,
        render: c => renderMaxSubStep(c, arr, lo, hi, lo, hi, a[lo])
      });
      return {sum: a[lo], lo, hi};
    }
    const mid = Math.floor((lo + hi) / 2);
    steps.push({
      phase:'divide', text:`Divide [${a.slice(lo,hi+1)}] at mid=${mid}`,
      render: c => renderMaxSubDivide(c, arr, lo, hi, mid)
    });

    const leftR = maxSub(a, lo, mid);
    const rightR = maxSub(a, mid+1, hi);
    const crossR = maxCross(a, lo, mid, hi);

    steps.push({
      phase:'combine',
      text:`Combine: left=${leftR.sum}, right=${rightR.sum}, cross=${crossR.sum}. Max = ${Math.max(leftR.sum, rightR.sum, crossR.sum)}`,
      render: c => renderMaxSubCombine(c, arr, lo, hi, mid, leftR, rightR, crossR)
    });

    if (leftR.sum >= rightR.sum && leftR.sum >= crossR.sum) return leftR;
    if (rightR.sum >= leftR.sum && rightR.sum >= crossR.sum) return rightR;
    return crossR;
  }

  maxSub(arr, 0, arr.length - 1);
  return steps;
}

function renderMaxSubStep(container, arr, lo, hi, subLo, subHi, sum) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px">';
  html += '<div class="array-display">';
  arr.forEach((v,i) => {
    let cls = 'arr-cell';
    if (i >= subLo && i <= subHi) cls += ' merged';
    else if (i >= lo && i <= hi) cls += ' active';
    html += `<div class="${cls}">${v}</div>`;
  });
  html += '</div>';
  html += `<div style="font-size:.9rem;color:var(--accent)">Sum = ${sum}</div>`;
  html += '</div>';
  container.innerHTML = html;
}

function renderMaxSubDivide(container, arr, lo, hi, mid) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px">';
  html += '<div class="array-display">';
  arr.forEach((v,i) => {
    let cls = 'arr-cell';
    if (i >= lo && i <= mid) cls += ' left';
    else if (i > mid && i <= hi) cls += ' right';
    html += `<div class="${cls}">${v}</div>`;
  });
  html += '</div>';
  html += `<div style="font-size:.85rem;color:var(--divide)">Dividing at index ${mid}</div>`;
  html += '</div>';
  container.innerHTML = html;
}

function renderMaxSubCombine(container, arr, lo, hi, mid, leftR, rightR, crossR) {
  const best = Math.max(leftR.sum, rightR.sum, crossR.sum);
  const winner = best === crossR.sum ? crossR : (best === leftR.sum ? leftR : rightR);
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px">';
  html += '<div class="array-display">';
  arr.forEach((v,i) => {
    let cls = 'arr-cell';
    if (i >= winner.lo && i <= winner.hi) cls += ' merged';
    else if (i >= lo && i <= hi) cls += ' active';
    html += `<div class="${cls}">${v}</div>`;
  });
  html += '</div>';
  html += '<div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">';
  html += `<div class="sub-section"><h5>Left max</h5><p style="font-size:.85rem;color:${leftR.sum===best?'var(--accent)':'var(--text)'}">${leftR.sum}</p></div>`;
  html += `<div class="sub-section"><h5>Cross max</h5><p style="font-size:.85rem;color:${crossR.sum===best?'var(--accent)':'var(--text)'}">${crossR.sum}</p></div>`;
  html += `<div class="sub-section"><h5>Right max</h5><p style="font-size:.85rem;color:${rightR.sum===best?'var(--accent)':'var(--text)'}">${rightR.sum}</p></div>`;
  html += '</div>';
  html += `<div style="font-size:1rem;color:var(--accent);font-weight:700">Best = ${best}</div>`;
  html += '</div>';
  container.innerHTML = html;
}

/* ═══════════════════════════════════════════════
   STRASSEN'S MATRIX MULTIPLICATION (2×2)
   ═══════════════════════════════════════════════ */
function generateStrassenSteps(A, B) {
  const steps = [];
  const a=A[0][0],b=A[0][1],c=A[1][0],d=A[1][1];
  const e=B[0][0],f=B[0][1],g=B[1][0],h=B[1][1];

  steps.push({
    phase:'divide', text:`Input matrices A and B (2×2). Compute 7 Strassen products (M1–M7).`,
    render: cont => renderStrassenMatrices(cont, A, B, null, null)
  });

  const M1=(a+d)*(e+h), M2=(c+d)*e, M3=a*(f-h), M4=d*(g-e), M5=(a+b)*h, M6=(c-a)*(e+f), M7=(b-d)*(g+h);
  const products = {M1:{expr:`(${a}+${d})×(${e}+${h})`,val:M1},M2:{expr:`(${c}+${d})×${e}`,val:M2},M3:{expr:`${a}×(${f}-${h})`,val:M3},M4:{expr:`${d}×(${g}-${e})`,val:M4},M5:{expr:`(${a}+${b})×${h}`,val:M5},M6:{expr:`(${c}-${a})×(${e}+${f})`,val:M6},M7:{expr:`(${b}-${d})×(${g}+${h})`,val:M7}};

  steps.push({
    phase:'conquer', text:`Compute 7 products: M1=${M1}, M2=${M2}, M3=${M3}, M4=${M4}, M5=${M5}, M6=${M6}, M7=${M7}`,
    render: cont => renderStrassenProducts(cont, products)
  });

  const C = [[M1+M4-M5+M7, M3+M5],[M2+M4, M1-M2+M3+M6]];
  steps.push({
    phase:'combine', text:`Combine: C[0][0]=${C[0][0]}, C[0][1]=${C[0][1]}, C[1][0]=${C[1][0]}, C[1][1]=${C[1][1]}`,
    render: cont => renderStrassenMatrices(cont, A, B, C, products)
  });

  // Verification
  const V = [[a*e+b*g, a*f+b*h],[c*e+d*g, c*f+d*h]];
  steps.push({
    phase:'combine', text:`Verification (standard): [${V[0]}, ${V[1]}]. Strassen uses 7 multiplications vs 8 standard.`,
    render: cont => renderStrassenResult(cont, A, B, C, V)
  });

  return steps;
}

function matHtml(M, cls) {
  const n = M.length;
  let h = `<div class="matrix-grid" style="grid-template-columns:repeat(${M[0].length},1fr)">`;
  M.forEach(row => row.forEach(v => { h += `<div class="matrix-cell ${cls||''}">${v}</div>`; }));
  h += '</div>';
  return h;
}

function renderStrassenMatrices(cont, A, B, C, products) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px">';
  html += '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center">';
  html += `<div class="sub-section"><h5>Matrix A</h5>${matHtml(A)}</div>`;
  html += '<span style="font-size:1.5rem;color:var(--text-dim)">×</span>';
  html += `<div class="sub-section"><h5>Matrix B</h5>${matHtml(B)}</div>`;
  if (C) {
    html += '<span style="font-size:1.5rem;color:var(--text-dim)">=</span>';
    html += `<div class="sub-section" style="border-color:var(--accent)"><h5 style="color:var(--accent)">Result C</h5>${matHtml(C,'result')}</div>`;
  }
  html += '</div></div>';
  cont.innerHTML = html;
}

function renderStrassenProducts(cont, products) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px">';
  html += '<h4 style="color:var(--conquer)">7 Strassen Products (vs 8 standard)</h4>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;width:100%">';
  for (const [k,v] of Object.entries(products)) {
    html += `<div class="sub-section" style="text-align:center"><h5>${k}</h5><div style="font-size:.82rem;color:var(--text-dim)">${v.expr}</div><div style="font-size:1rem;color:var(--accent);font-weight:700;margin-top:4px">= ${v.val}</div></div>`;
  }
  html += '</div></div>';
  cont.innerHTML = html;
}

function renderStrassenResult(cont, A, B, C, V) {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px">';
  html += '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center">';
  html += `<div class="sub-section"><h5>Matrix A</h5>${matHtml(A)}</div>`;
  html += '<span style="font-size:1.5rem;color:var(--text-dim)">×</span>';
  html += `<div class="sub-section"><h5>Matrix B</h5>${matHtml(B)}</div>`;
  html += '<span style="font-size:1.5rem;color:var(--text-dim)">=</span>';
  html += `<div class="sub-section" style="border-color:var(--accent)"><h5 style="color:var(--accent)">Strassen Result</h5>${matHtml(C,'result')}</div>`;
  html += '</div>';
  html += `<div class="sub-section" style="text-align:center"><h5>Verification (Standard O(n³))</h5>${matHtml(V)}<p style="font-size:.8rem;color:var(--green);margin-top:8px">✓ Results match</p></div>`;
  html += '</div>';
  cont.innerHTML = html;
}

/* ═══════════════════════════════════════════════
   CLOSEST PAIR OF POINTS
   ═══════════════════════════════════════════════ */
function generateClosestPairSteps(points) {
  const steps = [];
  if (points.length < 2) return steps;

  function dist(p1, p2) { return Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2); }

  function closest(pts) {
    if (pts.length <= 3) {
      let minD = Infinity, pair = [pts[0], pts[1]||pts[0]];
      for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
        const d = dist(pts[i], pts[j]);
        if (d < minD) { minD = d; pair = [pts[i], pts[j]]; }
      }
      steps.push({
        phase:'conquer', text:`Base case (${pts.length} points): closest = ${minD.toFixed(2)} between (${pair[0].x},${pair[0].y}) and (${pair[1].x},${pair[1].y})`,
        render: c => renderPointsStep(c, points, pts, pair, null, null)
      });
      return {dist: minD, pair};
    }

    pts.sort((a,b) => a.x - b.x);
    const mid = Math.floor(pts.length / 2);
    const midX = pts[mid].x;
    const left = pts.slice(0, mid);
    const right = pts.slice(mid);

    steps.push({
      phase:'divide', text:`Divide ${pts.length} points at x=${midX}. Left: ${left.length} pts, Right: ${right.length} pts.`,
      render: c => renderPointsDivide(c, points, left, right, midX)
    });

    const dL = closest(left);
    const dR = closest(right);
    let delta = Math.min(dL.dist, dR.dist);
    let bestPair = dL.dist <= dR.dist ? dL.pair : dR.pair;

    // Strip
    const strip = pts.filter(p => Math.abs(p.x - midX) < delta);
    strip.sort((a,b) => a.y - b.y);
    for (let i=0;i<strip.length;i++) {
      for (let j=i+1;j<strip.length && (strip[j].y-strip[i].y)<delta;j++) {
        const d = dist(strip[i], strip[j]);
        if (d < delta) { delta = d; bestPair = [strip[i], strip[j]]; }
      }
    }

    steps.push({
      phase:'combine', text:`Combine: check strip (${strip.length} pts). Closest = ${delta.toFixed(2)} between (${bestPair[0].x},${bestPair[0].y}) and (${bestPair[1].x},${bestPair[1].y})`,
      render: c => renderPointsStep(c, points, pts, bestPair, midX, delta)
    });

    return {dist: delta, pair: bestPair};
  }

  closest([...points]);
  return steps;
}

function renderPointsDivide(container, allPts, left, right, midX) {
  const scale = getPointScale(allPts);
  let html = '<div class="points-canvas">';
  left.forEach(p => {
    html += `<div class="point left-set" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)}%"></div>`;
    html += `<div class="point-label" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)+2}%">(${p.x},${p.y})</div>`;
  });
  right.forEach(p => {
    html += `<div class="point right-set" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)}%"></div>`;
    html += `<div class="point-label" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)+2}%">(${p.x},${p.y})</div>`;
  });
  html += `<div class="divider-line" style="left:${scale.x(midX)}%"></div>`;
  html += '</div>';
  container.innerHTML = html;
}

function renderPointsStep(container, allPts, subset, pair, midX, delta) {
  const scale = getPointScale(allPts);
  let html = '<div class="points-canvas">';
  allPts.forEach(p => {
    const inSub = subset.some(s=>s.x===p.x&&s.y===p.y);
    const isPair = pair.some(s=>s.x===p.x&&s.y===p.y);
    html += `<div class="point ${isPair?'highlight':''}" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)}%;opacity:${inSub?1:.3}"></div>`;
    html += `<div class="point-label" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)+2}%">(${p.x},${p.y})</div>`;
  });
  if (pair.length === 2) {
    const x1=scale.x(pair[0].x), y1=scale.y(pair[0].y), x2=scale.x(pair[1].x), y2=scale.y(pair[1].y);
    const len = Math.sqrt((x2-x1)**2+(y2-y1)**2);
    const angle = Math.atan2(y2-y1,x2-x1)*180/Math.PI;
    html += `<div class="pair-line" style="left:${x1}%;top:${y1}%;width:${len}%;transform:rotate(${angle}deg)"></div>`;
  }
  if (midX !== null) html += `<div class="divider-line" style="left:${scale.x(midX)}%"></div>`;
  html += '</div>';
  container.innerHTML = html;
}

function getPointScale(pts) {
  const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y);
  const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
  const pad = 10;
  return {
    x: v => pad + (maxX===minX ? 40 : (v-minX)/(maxX-minX)*(100-2*pad)),
    y: v => pad + (maxY===minY ? 40 : (v-minY)/(maxY-minY)*(100-2*pad))
  };
}

/* ═══════════════════════════════════════════════
   CONVEX HULL (Divide & Conquer)
   ═══════════════════════════════════════════════ */
function generateConvexHullSteps(points) {
  const steps = [];
  if (points.length < 3) return steps;

  function cross(O, A, B) { return (A.x-O.x)*(B.y-O.y) - (A.y-O.y)*(B.x-O.x); }

  // Graham-scan style merge for upper/lower hull
  function hull(pts) {
    pts.sort((a,b) => a.x===b.x ? a.y-b.y : a.x-b.x);
    if (pts.length <= 3) {
      // base case: compute hull directly
      const h = computeSmallHull(pts);
      steps.push({
        phase:'conquer', text:`Base case: hull of ${pts.length} points → [${h.map(p=>`(${p.x},${p.y})`).join(', ')}]`,
        render: c => renderConvexStep(c, points, pts, h, null, null, null)
      });
      return h;
    }

    const mid = Math.floor(pts.length / 2);
    const left = pts.slice(0, mid);
    const right = pts.slice(mid);

    steps.push({
      phase:'divide', text:`Divide ${pts.length} points at x=${pts[mid].x}. Left: ${left.length}, Right: ${right.length}`,
      render: c => renderConvexDivide(c, points, left, right)
    });

    const hullL = hull(left);
    const hullR = hull(right);

    // Merge hulls
    const merged = mergeHulls(hullL, hullR);
    steps.push({
      phase:'combine', text:`Merge left hull (${hullL.length} pts) with right hull (${hullR.length} pts) → ${merged.length} pts`,
      render: c => renderConvexStep(c, points, pts, merged, hullL, hullR, null)
    });

    return merged;
  }

  function computeSmallHull(pts) {
    if (pts.length <= 1) return [...pts];
    if (pts.length === 2) return [...pts];
    // 3 points
    const [a,b,c] = pts;
    const cr = cross(a,b,c);
    if (cr > 0) return [a,b,c];
    if (cr < 0) return [a,c,b];
    // Collinear: return endpoints
    return [a,c];
  }

  function mergeHulls(L, R) {
    const all = [...L, ...R];
    // Use monotone chain
    all.sort((a,b) => a.x===b.x ? a.y-b.y : a.x-b.x);
    const lower = [];
    for (const p of all) {
      while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = all.length-1; i >= 0; i--) {
      const p = all[i];
      while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop();
      upper.push(p);
    }
    upper.pop(); lower.pop();
    return lower.concat(upper);
  }

  hull([...points]);
  return steps;
}

function renderConvexDivide(container, allPts, left, right) {
  const scale = getPointScale(allPts);
  let html = '<div class="points-canvas">';
  left.forEach(p => {
    html += `<div class="point left-set" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)}%"></div>`;
    html += `<div class="point-label" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)+2}%">(${p.x},${p.y})</div>`;
  });
  right.forEach(p => {
    html += `<div class="point right-set" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)}%"></div>`;
    html += `<div class="point-label" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)+2}%">(${p.x},${p.y})</div>`;
  });
  const midX = (Math.max(...left.map(p=>p.x)) + Math.min(...right.map(p=>p.x))) / 2;
  html += `<div class="divider-line" style="left:${scale.x(midX)}%"></div>`;
  html += '</div>';
  container.innerHTML = html;
}

function renderConvexStep(container, allPts, subset, hull, hullL, hullR) {
  const scale = getPointScale(allPts);
  let html = '<div class="points-canvas">';
  allPts.forEach(p => {
    const inHull = hull.some(h=>h.x===p.x&&h.y===p.y);
    html += `<div class="point ${inHull?'highlight':''}" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)}%;opacity:${subset.some(s=>s.x===p.x&&s.y===p.y)?1:.3}"></div>`;
    html += `<div class="point-label" style="left:${scale.x(p.x)}%;top:${scale.y(p.y)+2}%">(${p.x},${p.y})</div>`;
  });
  // Draw hull edges
  if (hull.length >= 2) {
    for (let i=0;i<hull.length;i++) {
      const a = hull[i], b = hull[(i+1)%hull.length];
      const x1=scale.x(a.x),y1=scale.y(a.y),x2=scale.x(b.x),y2=scale.y(b.y);
      const len = Math.sqrt((x2-x1)**2+(y2-y1)**2);
      const angle = Math.atan2(y2-y1,x2-x1)*180/Math.PI;
      html += `<div class="hull-line" style="left:${x1}%;top:${y1}%;width:${len}%;transform:rotate(${angle}deg)"></div>`;
    }
  }
  html += '</div>';
  container.innerHTML = html;
}


/* ═══════════════════════════════════════════════
   SIDEBAR INFO
   ═══════════════════════════════════════════════ */
const algoInfo = {
  merge: {
    name: 'Merge Sort',
    desc: 'A stable, comparison-based sorting algorithm that divides the array into halves, recursively sorts each half, then merges them back in order.',
    steps: ['<b>Divide:</b> Split array into two halves at the midpoint.','<b>Conquer:</b> Recursively sort each half until base case (single element).','<b>Combine:</b> Merge two sorted halves by comparing elements sequentially.'],
    recurrence: 'T(n) = 2T(n/2) + O(n)',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
    master: 'a=2, b=2, f(n)=O(n) → Case 2 of Master Theorem → O(n log n)'
  },
  quick: {
    name: 'Quick Sort',
    desc: 'An in-place, comparison-based sort that selects a pivot element, partitions the array around it, and recursively sorts the sub-arrays.',
    steps: ['<b>Divide:</b> Choose a pivot and partition array into elements ≤ pivot and > pivot.','<b>Conquer:</b> Recursively sort the left and right partitions.','<b>Combine:</b> No explicit combine step needed — array is sorted in-place.'],
    recurrence: 'T(n) = T(k) + T(n-k-1) + O(n)',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)',
    master: 'Best case: balanced partitions → O(n log n). Worst: one side empty → O(n²).'
  },
  minmax: {
    name: 'Min & Max Finding',
    desc: 'Find both minimum and maximum in an array using divide and conquer, requiring fewer comparisons (3n/2 - 2) than naive approach (2n - 2).',
    steps: ['<b>Divide:</b> Split array into two halves.','<b>Conquer:</b> Find min & max in each half recursively.','<b>Combine:</b> Compare the two mins and two maxes.'],
    recurrence: 'T(n) = 2T(n/2) + 2',
    best: 'O(n)', avg: 'O(n)', worst: 'O(n)', space: 'O(log n)',
    master: 'a=2, b=2, f(n)=O(1) → Case 1 of Master Theorem → O(n)'
  },
  maxsub: {
    name: 'Maximum Subarray Sum',
    desc: 'Find the contiguous subarray with the largest sum using divide and conquer. Considers left max, right max, and crossing max.',
    steps: ['<b>Divide:</b> Split array at midpoint.','<b>Conquer:</b> Find max subarray in left and right halves.','<b>Combine:</b> Find max crossing subarray and return best of three.'],
    recurrence: 'T(n) = 2T(n/2) + O(n)',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(log n)',
    master: 'a=2, b=2, f(n)=O(n) → Case 2 of Master Theorem → O(n log n)'
  },
  strassen: {
    name: "Strassen's Matrix Multiplication",
    desc: 'Multiplies two matrices using 7 multiplications instead of 8, reducing time complexity from O(n³) to O(n^2.807) for large matrices.',
    steps: ['<b>Divide:</b> Split matrices into four n/2 × n/2 submatrices.','<b>Conquer:</b> Compute 7 products M1–M7 using clever combinations.','<b>Combine:</b> Compute result submatrices from M1–M7 with additions.'],
    recurrence: 'T(n) = 7T(n/2) + O(n²)',
    best: 'O(n^2.807)', avg: 'O(n^2.807)', worst: 'O(n^2.807)', space: 'O(n²)',
    master: 'a=7, b=2, f(n)=O(n²) → Case 1 → O(n^{log₂7}) ≈ O(n^2.807)'
  },
  closest: {
    name: 'Closest Pair of Points',
    desc: 'Finds the closest pair of points in a 2D plane efficiently by dividing points by x-coordinate and checking the strip around the dividing line.',
    steps: ['<b>Divide:</b> Sort by x-coordinate, split at median.','<b>Conquer:</b> Find closest pair in left and right halves.','<b>Combine:</b> Check strip of width 2δ crossing the dividing line.'],
    recurrence: 'T(n) = 2T(n/2) + O(n log n)',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
    master: 'With sorted strip: T(n)=2T(n/2)+O(n) → O(n log n)'
  },
  convex: {
    name: 'Convex Hull (D&C)',
    desc: 'Computes the convex hull of a set of 2D points by dividing the point set, computing hulls for each half, and merging them with tangent lines.',
    steps: ['<b>Divide:</b> Sort points by x-coordinate, split in half.','<b>Conquer:</b> Compute convex hull of each half recursively.','<b>Combine:</b> Merge two hulls by finding upper and lower tangents.'],
    recurrence: 'T(n) = 2T(n/2) + O(n)',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
    master: 'a=2, b=2, f(n)=O(n) → Case 2 → O(n log n)'
  }
};

function renderSidebar() {
  const info = algoInfo[currentAlgo];
  let html = '';

  html += `<h3><span class="dot" style="background:var(--primary)"></span>${info.name}</h3>`;
  html += `<div class="info-card"><h4>Description</h4><p>${info.desc}</p></div>`;

  html += '<div class="info-card"><h4>D&C Steps</h4><ul>';
  info.steps.forEach(s => html += `<li>${s}</li>`);
  html += '</ul></div>';

  html += `<div class="info-card"><h4>Recurrence Relation</h4><div class="recurrence">${info.recurrence}</div>`;
  html += `<p style="font-size:.8rem;color:var(--text-dim);margin-top:6px">${info.master}</p></div>`;

  html += '<div class="info-card"><h4>Time Complexity</h4><table class="complexity-table"><tr><th>Case</th><th>Complexity</th></tr>';
  html += `<tr><td>Best</td><td>${info.best}</td></tr>`;
  html += `<tr><td>Average</td><td>${info.avg}</td></tr>`;
  html += `<tr><td>Worst</td><td>${info.worst}</td></tr>`;
  html += `<tr><td>Space</td><td>${info.space}</td></tr>`;
  html += '</table></div>';

  html += '<div class="info-card"><h4>Legend</h4><div class="legend">';
  html += '<div class="legend-item"><div class="legend-color" style="background:var(--divide)"></div>Divide</div>';
  html += '<div class="legend-item"><div class="legend-color" style="background:var(--conquer)"></div>Conquer</div>';
  html += '<div class="legend-item"><div class="legend-color" style="background:var(--combine)"></div>Combine</div>';
  html += '</div></div>';

  sidebar.innerHTML = html;
}

// ── Init ──
renderSidebar();