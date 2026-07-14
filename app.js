// ===== 王哥斗数查询 - 网页版 =====
(function() {
  'use strict';

  var DZ = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var GW = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'];
  var SX = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  var TG = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var AI_KEY = 'sk-UU8aUBTYJABYeRNZCVPZKRfmBxnL1bApCxSD9k8IV0hnkLgA';
  var SHA_LIST = ['擎羊','陀罗','火星','铃星','地劫','地空'];
  var SHA_BRIGHT_MAP = {
    '擎羊': { '子':'庙','丑':'庙','寅':'旺','卯':'陷','辰':'旺','巳':'旺','午':'庙','未':'庙','申':'旺','酉':'陷','戌':'旺','亥':'旺' },
    '陀罗': { '子':'庙','丑':'庙','寅':'旺','卯':'陷','辰':'旺','巳':'旺','午':'庙','未':'庙','申':'旺','酉':'陷','戌':'旺','亥':'旺' },
    '火星': { '子':'陷','丑':'陷','寅':'旺','卯':'庙','辰':'旺','巳':'旺','午':'陷','未':'陷','申':'旺','酉':'庙','戌':'旺','亥':'旺' },
    '铃星': { '子':'陷','丑':'陷','寅':'旺','卯':'庙','辰':'旺','巳':'旺','午':'陷','未':'陷','申':'旺','酉':'庙','戌':'旺','亥':'旺' },
    '地劫': { '子':'平','丑':'陷','寅':'旺','卯':'庙','辰':'旺','巳':'平','午':'平','未':'陷','申':'旺','酉':'庙','戌':'陷','亥':'平' },
    '地空': { '子':'平','丑':'陷','寅':'旺','卯':'庙','辰':'旺','巳':'平','午':'平','未':'陷','申':'旺','酉':'庙','戌':'陷','亥':'平' }
  };

  function mod(n, m) { return ((n % m) + m) % m; }
  function getSF4(i) { return [i, mod(i + 4, 12), mod(i + 8, 12), mod(i + 6, 12)]; }
  function hourToTimeIndex(h) { return Math.floor((parseInt(h) + 1) / 2) % 12; }
  function parseYearGZ(bazi) {
    if (!bazi || bazi.length < 2) return { g: 0, z: 0 };
    return { g: Math.max(0, TG.indexOf(bazi.substring(0, 1))), z: Math.max(0, DZ.indexOf(bazi.substring(1, 2))) };
  }

  var $ = function(id) { return document.getElementById(id); };
  var S = {
    date: '', time: '', gender: '男', canSubmit: false,
    bazi: '', shengXiao: '', wuXingJu: '', yangYinGender: '', mingZhu: '', shenZhu: '',
    mingGong: '', shenGong: '',
    circleData: [], daxianRange: [], daxianSel: -1, daxianLabel: '',
    tapIdx: -1, panData: null,
    birthDate: '', birthTime: '', birthYear: 0,
    xiaoXianYear: -1, xiaoXianYearDisplay: '', xiaoXianYears: [], xiaoXianDisplays: [], xiaoXianPalIdx: -1, xiaoXianIdx: -1,
    analysisLoading: false, analysisError: '', analysisText: '', analysisShow: false,
  };

  function fmt(d) {
    return d.getFullYear() + '-' +
      (d.getMonth() < 9 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' +
      (d.getDate() < 10 ? '0' + d.getDate() : d.getDate());
  }

  // ===== 排盘 =====
  function doCalcChart(year, month, day, hour, gender) {
    var g = gender === '男' ? 'male' : 'female';
    var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var ti = hourToTimeIndex(hour);
    var pd = iztro.astro.bySolar(dateStr, ti, g, 'zh-CN');
    if (!pd) return null;

    var yi = parseYearGZ(pd.chineseDate || '');
    var wxj = pd.fiveElementsClass || '木二局';
    var wxjNum = parseInt(wxj.replace(/\D/g, '')) || 2;
    var sx = SX[yi.z] || '';
    var mingDz = pd.earthlyBranchOfSoulPalace;
    var shenDz = pd.earthlyBranchOfBodyPalace;
    var mingIdx = DZ.indexOf(mingDz);
    var shenIdx = DZ.indexOf(shenDz);

    var gongData = {};
    for (var i = 0; i < 12; i++) gongData[DZ[i]] = { mainStars: [], auxStars: [], shaStars: [], isEmpty: false, ages: [] };

    var palaces = pd.palaces || [];
    for (var i = 0; i < palaces.length; i++) {
      var p = palaces[i], dz = p.earthlyBranch, ebIdx = DZ.indexOf(dz);
      if (ebIdx < 0) continue;
      var ms = p.majorStars || [];
      for (var j = 0; j < ms.length; j++) {
        var s = ms[j], mg = s.mutagen || '';
        gongData[dz].mainStars.push({ name: s.name, brightness: s.brightness || '', mutagen: (typeof mg === 'string' && mg.length > 0) ? ['化' + mg] : [] });
      }
      var mns = p.minorStars || [];
      for (var j = 0; j < mns.length; j++) {
        var s = mns[j], sn = s.name, st = s.type || '';
        if (st === 'tough') {
          var brt = (SHA_BRIGHT_MAP[sn] && SHA_BRIGHT_MAP[sn][dz]) ? SHA_BRIGHT_MAP[sn][dz] : '';
          gongData[dz].shaStars.push({ name: sn, brightness: brt });
        } else if (gongData[dz].auxStars.indexOf(sn) < 0) gongData[dz].auxStars.push(sn);
      }
      var ads = p.adjectiveStars || [];
      for (var j = 0; j < ads.length; j++) {
        var sn = ads[j].name;
        if (gongData[dz].auxStars.indexOf(sn) < 0) gongData[dz].auxStars.push(sn);
      }
      if (gongData[dz].mainStars.length === 0) {
        var opposite = DZ[(ebIdx + 6) % 12];
        if (gongData[opposite] && gongData[opposite].mainStars.length > 0) gongData[dz].isEmpty = true;
      }
      gongData[dz].ages = p.ages || [];
    }
    var dr = [];
    for (var i = 0; i < 12; i++) { var start = wxjNum + i * 10; dr.push({ start: start, end: start + 9, num: start }); }
    return { bazi: pd.chineseDate || '', shengXiao: sx + '年', wxj: wxj, wxjNum: wxjNum,
      mingZhu: pd.soul || '', shenZhu: pd.body || '', mingGong: mingDz, shenGong: shenDz,
      mingIdx: mingIdx, shenIdx: shenIdx, gongData: gongData, daxianRange: dr, yi: yi, gender: gender, palaces: palaces };
  }

  // ===== 宫位网格 =====
  // 巳 午 未 申
  // 辰    酉
  // 卯    戌
  // 寅 丑 子 亥
  var GRID_POS = {
    0:{r:4,c:3},1:{r:4,c:2},2:{r:4,c:1},3:{r:3,c:1},4:{r:2,c:1},5:{r:1,c:1},
    6:{r:1,c:2},7:{r:1,c:3},8:{r:1,c:4},9:{r:2,c:4},10:{r:3,c:4},11:{r:4,c:4}
  };

  function bcd(pd) {
    var gd = pd.gongData, mi = pd.mingIdx;
    var d = [];
    for (var i = 0; i < 12; i++) {
      var dz = DZ[i], gn = '', im = false, is = false;
      for (var j = 0; j < 12; j++) { var di = mod(mi - j + 12, 12); if (di === i) { gn = GW[j]; im = (j === 0); is = (di === pd.shenIdx); break; } }
      var ms = (gd[dz] ? gd[dz].mainStars : []) || [];
      var as = (gd[dz] ? gd[dz].auxStars : []) || [];
      var ss = (gd[dz] ? gd[dz].shaStars : []) || [];
      var ie = gd[dz] ? gd[dz].isEmpty : false;
      var hm = false;

      function starSpan(cls, c, n) { return '<span style="display:inline-block;white-space:nowrap;margin:0 1px 1px 1px"><span class="' + cls + '" style="color:' + c + '">' + n + '</span></span>'; }
      var fullHtml = '';
      for (var k = 0; k < ms.length; k++) {
        hm = true; var c = '#fff';
        if (ms[k].brightness === '旺') c = '#ddd'; else if (ms[k].brightness === '得') c = '#ccc'; else if (ms[k].brightness === '不' || ms[k].brightness === '平' || ms[k].brightness === '陷') c = '#999';
        fullHtml += '<span style="display:inline-block;white-space:nowrap;margin:0 1px 1px 1px"><span class="star-main" style="color:' + c + '">' + ms[k].name + '</span>';
        if (ms[k].mutagen && ms[k].mutagen.length > 0) { for (var u = 0; u < ms[k].mutagen.length; u++) fullHtml += '<span class="star-hua">' + ms[k].mutagen[u] + '</span>'; }
        fullHtml += '</span>';
      }
      for (var si = 0; si < ss.length; si++) {
        hm = true; var cc = '#e57373';
        if (ss[si].brightness === '庙' || ss[si].brightness === '旺') cc = '#ef9a9a';
        else if (ss[si].brightness === '得' || ss[si].brightness === '利') cc = '#e57373';
        else cc = '#c0392b';
        fullHtml += starSpan('star-sha', cc, ss[si].name);
      }
      for (var ai = 0; ai < as.length; ai++) {
        var n = typeof as[ai] === 'string' ? as[ai] : '';
        if (n.indexOf('化') !== 0 && '左辅右弼天魁天钺文昌文曲天马禄存红鸾天喜'.indexOf(n) >= 0) { hm = true; if (fullHtml.indexOf(n) < 0) fullHtml += starSpan('star-aux', '#aaa', n); }
        else if (n.indexOf('化') >= 0) { hm = true; if (fullHtml.indexOf(n) < 0) fullHtml += starSpan('star-hua', '#64b4ff', n); }
      }
      if (ie && !hm) fullHtml = '';

      var pos = GRID_POS[i];
      d.push({ dz: dz, idx: i, name: gn, isMing: im, isShen: is, fullHtml: fullHtml, gridRow: pos.r, gridCol: pos.c });
    }
    return d;
  }

  // ===== 高亮 =====
  function updateHighlight(highlightIdx, sizhengIdxs, daxianIdxs) {
    var isDaxian = !!daxianIdxs;
    var nmi = isDaxian ? highlightIdx : -1;
    S.circleData = S.circleData.map(function(it) {
      var ni = {}; for (var k in it) ni[k] = it[k];
      ni.isXiaoXian = false; ni.isXiaoXianOpp = false;
      if (isDaxian) {
        ni.isDaxianMing = (daxianIdxs.indexOf(it.idx) >= 0 && it.idx === nmi);
        ni.isDaxianSz = (daxianIdxs.indexOf(it.idx) >= 0 && it.idx !== nmi);
        ni.isHighlight = false; ni.isSizheng = false;
      } else if (sizhengIdxs) {
        ni.isHighlight = (sizhengIdxs.indexOf(it.idx) >= 0 && it.idx === highlightIdx);
        ni.isSizheng = (sizhengIdxs.indexOf(it.idx) >= 0 && it.idx !== highlightIdx);
        ni.isDaxianMing = false; ni.isDaxianSz = false;
      } else {
        ni.isHighlight = false; ni.isSizheng = false; ni.isDaxianMing = false; ni.isDaxianSz = false;
      }
      return ni;
    });
  }

  // ===== 渲染 =====
  function renderCircle() {
    var wrap = $('panWrap');
    var oldCells = wrap.querySelectorAll('.gong-cell');
    for (var i = 0; i < oldCells.length; i++) wrap.removeChild(oldCells[i]);
    for (var i = 0; i < S.circleData.length; i++) {
      var it = S.circleData[i];
      var cell = document.createElement('div');
      cell.className = 'gong-cell' +
        (it.isHighlight ? ' hl-tap' : '') +
        (it.isDaxianMing ? ' gx' : '') +
        (it.isDaxianSz ? ' sz' : '') +
        (it.isSizheng ? ' sz' : '') +
        (it.isXiaoXian ? ' xx-hl' : '') +
        (it.isMing ? ' ming' : '') +
        (it.isShen ? ' shen' : '');
      cell.style.gridRow = it.gridRow; cell.style.gridColumn = it.gridCol;
      cell.dataset.idx = it.idx;

      var inner = document.createElement('div');
      inner.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column';
      var head = document.createElement('div');
      head.className = 'g-head';
      var dzSpan = document.createElement('span'); dzSpan.className = 'g-dz'; dzSpan.textContent = it.dz;
      var nameSpan = document.createElement('span'); nameSpan.className = 'g-name'; nameSpan.textContent = it.name;
      head.appendChild(dzSpan);
      head.appendChild(nameSpan);
      if (it.isShen) { var tag = document.createElement('span'); tag.className = 'g-shen-tag2'; tag.textContent = '身'; nameSpan.parentNode.insertBefore(tag, nameSpan); }
      inner.appendChild(head);
      var stars = document.createElement('div'); stars.className = 'g-stars'; stars.innerHTML = it.fullHtml;
      inner.appendChild(stars);
      cell.appendChild(inner);
      if (it.isXiaoXian) {
        var xb = document.createElement('span'); xb.className = 'g-xian-badge'; xb.textContent = '限';
        cell.appendChild(xb);
      }
      wrap.appendChild(cell);
    }
  }

  function renderDaxian() {
    var btn = $('dxBtn');
    if (S.daxianSel >= 0 && S.daxianRange[S.daxianSel]) {
      var dr = S.daxianRange[S.daxianSel];
      btn.textContent = dr.num + '岁 (' + dr.num + '-' + (dr.num+9) + '年)';
    } else {
      btn.textContent = S.daxianRange.length > 0 ? (S.daxianRange[0].num + '岁 ' + S.daxianRange[0].num + '-' + (S.daxianRange[0].num+9) + '年') : '选择大限';
    }
  }

  function renderXiaoXian() {
    var bar = $('xxBar');
    if (S.xiaoXianYears.length === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    if (S.xiaoXianYearDisplay) $('xxBtn').textContent = S.xiaoXianYearDisplay;
  }

  function renderChart() {
    $('baziText').textContent = S.bazi;
    $('chartInfo').textContent = S.shengXiao + ' · ' + S.yangYinGender + ' · ' + S.wuXingJu + ' · 命宫' + S.mingGong + ' 身宫' + S.shenGong;
    // 默认选第一个大限
    if (S.daxianSel < 0 && S.daxianRange.length > 0) selDaxian(0);
  }

  // ===== 大限 =====
  function selDaxian(i) {
    var pd = S.panData; if (!pd) return;
    S.daxianSel = i; S.tapIdx = -1;
    var dir = ((pd.yi.g % 2 === 0 && pd.gender === '男') || (pd.yi.g % 2 !== 0 && pd.gender !== '男')) ? 1 : -1;
    var nmi = mod(pd.mingIdx + dir * i, 12);
    var sf = getSF4(nmi);
    var dr = S.daxianRange[i];
    // 生成小限
    var xyYears = [], xyDisplays = [];
    for (var a = dr.start; a <= dr.end; a++) { xyYears.push(a); xyDisplays.push(S.birthYear + a - 1 + '年（' + a + '岁）'); }
    S.xiaoXianYear = -1; S.xiaoXianYears = xyYears; S.xiaoXianDisplays = xyDisplays; S.xiaoXianPalIdx = -1; S.xiaoXianIdx = -1;
    S.xiaoXianYearDisplay = '';
    updateHighlight(nmi, sf, sf);
    renderDaxian(); renderXiaoXian(); renderCircle();
  }

  function dxNext() {
    var i = S.daxianSel + 1;
    if (i >= S.daxianRange.length) i = 0;
    selDaxian(i);
  }
  function dxPrev() {
    var i = S.daxianSel - 1;
    if (i < 0) i = S.daxianRange.length - 1;
    selDaxian(i);
  }

  // ===== 宫位点击 =====
  function tapGong(idx) {
    var pd = S.panData; if (!pd) return;
    if (S.tapIdx === idx) {
      S.tapIdx = -1; S.daxianSel = -1;
      updateHighlight(-1, null, null);
      renderCircle(); renderDaxian(); renderXiaoXian();
      return;
    }
    var sf = getSF4(idx);
    S.tapIdx = idx; S.daxianSel = -1;
    updateHighlight(idx, sf, null);
    renderCircle(); renderDaxian(); renderXiaoXian();
  }

  // ===== 小限 =====
  function findPalaceByAge(pd, age) {
    var gd = pd.gongData;
    for (var i = 0; i < 12; i++) { var ages = gd[DZ[i]] ? gd[DZ[i]].ages : null; if (ages && ages.indexOf(parseInt(age)) >= 0) return i; }
    return -1;
  }
  function applyXiaoXian(idx) {
    var pd = S.panData;
    if (!pd || idx < 0 || idx >= S.xiaoXianYears.length) return;
    var age = S.xiaoXianYears[idx], display = S.xiaoXianDisplays[idx];
    var pi = findPalaceByAge(pd, age);
    S.xiaoXianYear = age; S.xiaoXianYearDisplay = display; S.xiaoXianPalIdx = pi; S.xiaoXianIdx = idx; S.tapIdx = -1;
    $('xxBtn').textContent = display;
    // 更新宫位高亮
    S.circleData = S.circleData.map(function(it) {
      var ni = {}; for (var k in it) ni[k] = it[k];
      ni.isXiaoXian = (it.idx === pi);
      ni.isHighlight = false; ni.isSizheng = false; ni.isDaxianMing = false; ni.isDaxianSz = false;
      return ni;
    });
    renderCircle();
  }
  function xxNext() {
    var idx = S.xiaoXianIdx + 1;
    if (idx >= S.xiaoXianYears.length) {
      var nextDi = S.daxianSel + 1;
      if (nextDi < S.daxianRange.length) {
        // 直接切换大限并选中第一年，跳过中间的大限高亮渲染
        S.daxianSel = nextDi; S.tapIdx = -1;
        var dr = S.daxianRange[nextDi];
        var dir = ((S.panData.yi.g % 2 === 0 && S.panData.gender === '男') || (S.panData.yi.g % 2 !== 0 && S.panData.gender !== '男')) ? 1 : -1;
        var nmi = mod(S.panData.mingIdx + dir * nextDi, 12);
        var xyYears = [], xyDisplays = [];
        for (var a = dr.start; a <= dr.end; a++) { xyYears.push(a); xyDisplays.push(S.birthYear + a - 1 + '年（' + a + '岁）'); }
        S.xiaoXianYears = xyYears; S.xiaoXianDisplays = xyDisplays;
        renderDaxian();
        applyXiaoXian(0);
      }
      return;
    }
    applyXiaoXian(idx);
  }
  function xxPrev() {
    var idx = S.xiaoXianIdx - 1;
    if (idx < 0) {
      var prevDi = S.daxianSel - 1;
      if (prevDi >= 0) {
        S.daxianSel = prevDi; S.tapIdx = -1;
        var dr = S.daxianRange[prevDi];
        var dir = ((S.panData.yi.g % 2 === 0 && S.panData.gender === '男') || (S.panData.yi.g % 2 !== 0 && S.panData.gender !== '男')) ? 1 : -1;
        var nmi = mod(S.panData.mingIdx + dir * prevDi, 12);
        var xyYears = [], xyDisplays = [];
        for (var a = dr.start; a <= dr.end; a++) { xyYears.push(a); xyDisplays.push(S.birthYear + a - 1 + '年（' + a + '岁）'); }
        S.xiaoXianYears = xyYears; S.xiaoXianDisplays = xyDisplays;
        renderDaxian();
        applyXiaoXian(xyYears.length - 1);
      }
      return;
    }
    applyXiaoXian(idx);
  }

  // ===== AI =====
  function requestAnalysis() {
    if (S.analysisLoading) return;
    var p = S.date.split('-');
    var year = parseInt(p[0], 10), month = parseInt(p[1], 10), day = parseInt(p[2], 10);
    var tp = S.time.split(':');
    var hour = parseInt(tp[0], 10);
    var g = S.gender;

    S.analysisLoading = true;
    $('analysisLoadingBox').style.display = 'block';
    $('analysisErrorBox').style.display = 'none';

    var pd = doCalcChart(year, month, day, hour, g);
    if (!pd) {
      S.analysisLoading = false; $('analysisLoadingBox').style.display = 'none';
      $('analysisErrorText').textContent = '排盘失败'; $('analysisErrorBox').style.display = 'block';
      return;
    }
    var cy = new Date().getFullYear();
    var prompt = '当前是' + cy + '年。【命主信息】\n出生: ' + year + '年' + month + '月' + day + '日 ' + S.time + '\n八字: ' + pd.bazi + '\n性别: ' + g + '\n五行局: ' + pd.wxj + '\n命宫: ' + pd.mingGong + ' 身宫: ' + pd.shenGong + '\n\n【十二宫】\n';
    for (var di = 0; di < 12; di++) {
      var dz = DZ[di], gd = pd.gongData[dz];
      if (!gd) continue;
      var gn = '', mi = pd.mingIdx;
      for (var j = 0; j < 12; j++) { var ddi = mod(mi - j, 12); if (ddi === di) { gn = GW[j]; break; } }
      var mn = gd.mainStars.map(function(s){return s.name + (s.mutagen&&s.mutagen[0]?'('+s.mutagen[0]+')':'')+(s.brightness?'['+s.brightness+']':'');}).join(' ');
      var an = gd.auxStars.filter(function(n){return typeof n==='string'&&n.indexOf('化')!==0;}).join(' ');
      var sn = gd.shaStars.map(function(s){return s.name;}).join(' ');
      prompt += dz+' '+gn+': '+(mn||(gd.isEmpty?'(空)':''))+(sn?' | 煞: '+sn:'')+(an?' | 辅: '+an:'')+'\n';
    }
    fetch('https://apihub.agnes-ai.com/v1/chat/completions', {
      method:'POST', headers:{'Authorization':'Bearer '+AI_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'agnes-2.0-flash', max_tokens:4096, temperature:0.7,
        messages:[
          {role:'system',content:'你是精通紫微斗数三合派的大师。请根据用户的斗数盘断命。\n\n## 核心心法\n1. 先看星，不看宫 — 先观察全盘星曜分布，建立整体印象\n2. 定命宫，看三方四正（命宫+官禄+财帛+迁移）\n3. 看大限走势 — 阳男阴女顺行，阴男阳女逆行\n4. 吉处藏凶 — 好大运的下一个大运若是空宫+煞星最危险\n5. 身宫所在即人生重心\n\n## 特殊格局\n- 火贪格: 贪狼+火星同宫 → 武贵\n- 紫府坐垣: 紫微+天府在辰戌丑未 → 将相之才\n- 七杀朝斗: 七杀旺地 → 将星\n- 武贪格: 武曲+贪狼 → 中年后发财，少年不得志\n- 日丽中天: 太阳在午 → 大吉\n- 半空折翅: 廉贞+贪狼在辰戌丑未落陷 → 中年大灾\n\n## 星曜特性\n- 紫微: 帝王之星，尊贵 | 天府: 财库温和\n- 贪狼: 桃花/武官视位置而定 | 巨门: 口舌是非\n- 天相: 辅佐之才 | 天梁: 荫星老人星\n- 七杀: 将星威武 | 破军: 消耗变动\n- 太阳: 光明官星 | 太阴: 财星\n- 天同: 福星 | 武曲: 财星刚毅\n- 文昌文曲: 科甲 | 左辅右弼: 助力\n\n## 空宫原则\n空宫不是没内容，而是借对宫主星。对宫=本宫+6\n\n## 四化（年干决定）\n甲: 廉贞禄 破军权 武曲科 太阳忌\n乙: 天机禄 天梁权 紫微科 太阴忌\n丙: 天同禄 文昌权 廉贞科 天机忌\n丁: 天同禄 巨门权 文昌科 太阳忌\n戊: 贪狼禄 太阴权 右弼科 天机忌\n己: 武曲禄 天机权 文昌科 廉贞忌\n庚: 太阳禄 武曲权 太阴科 天同忌\n辛: 巨门禄 太阳权 文曲科 文昌忌\n壬: 天梁禄 紫微权 左辅科 天马忌\n癸: 破军禄 巨门权 太阴科 贪狼忌\n\n## 批命步骤\n1. 先看命宫: 主星+空宫+煞星 → 命格基调\n2. 看身宫: 人生重心\n3. 看三方四正: 命+官+财+迁\n4. 看当前大限: 几岁到几岁，宫位吉凶\n5. 看特殊格局\n6. 给出总体断语\n\n## 风格要求\n- 直接干脆，敢下断语\n- 结合星曜亮度（庙旺平陷）判断吉凶程度\n- 最后给一句总结性断语\n- 用中文，口语化，分段落\n- 开头不要有废话，直接开讲\n- 绝对不要自我介绍，不要提你的名字或身份，直接分析斗数盘'},
          {role:'user',content:prompt+'\n\n请给我分析斗数。'}
        ]
      })
    }).then(function(r){return r.json();}).then(function(d){
      S.analysisLoading=false; $('analysisLoadingBox').style.display='none';
      if(d&&d.choices&&d.choices[0]&&d.choices[0].message){
        var t=d.choices[0].message.content.replace(/\*\*/g,'').replace(/^#+\s*/gm,'').replace(/\n{3,}/g,'\n\n');
        t=t.replace(/^(你好[，!！]*)?我是.*?(。|\n)/,'');
        S.analysisText=t; S.analysisShow=true; showAnalysis();
      } else { S.analysisError='AI返回异常'; $('analysisErrorText').textContent=S.analysisError; $('analysisErrorBox').style.display='block'; }
    }).catch(function(e){
      S.analysisLoading=false; $('analysisLoadingBox').style.display='none';
      S.analysisError='请求失败: '+(e.message||'网络错误');
      $('analysisErrorText').textContent=S.analysisError; $('analysisErrorBox').style.display='block';
    });
  }
  function showAnalysis() { if(!S.analysisShow||!S.analysisText)return; $('analysisContent').textContent=S.analysisText; $('analysisOverlay').style.display='flex'; }
  function hideAnalysis() { $('analysisOverlay').style.display='none'; }

  // ===== 页面切换 =====
  function showPage(id) {
    var pages = document.querySelectorAll('.page');
    for(var i=0;i<pages.length;i++)pages[i].classList.remove('active');
    $(id).classList.add('active');
    // 切换视频
    var v1=$('bgPage1'),v2=$('bgPage2');
    if(id==='pageInput'){v1.style.display='block';v2.style.display='none';v1.play();v2.pause();}
    else{v1.style.display='none';v2.style.display='block';v2.play();v1.pause();}
  }

  // ===== 齿轮感滚轮（CSS Scroll Snap 实现） =====
  // 中间一条固定指示线（由 CSS .picker-indicator 提供）
  // 滚动松手后自动吸附到最近的项
  function makeRatcheted(col, items, callback, activeIdx) {
    var H = 40;
    var SP = 80; // (200-40)/2 首尾留白

    col.innerHTML = '';
    // 顶部留白（让第一项能居中）
    var ts = document.createElement('div');
    ts.style.cssText = 'height:' + SP + 'px;flex-shrink:0;pointer-events:none;';
    col.appendChild(ts);

    for (var i = 0; i < items.length; i++) {
      var el = document.createElement('div');
      el.className = 'picker-col-item';
      el.textContent = items[i];
      el.style.cssText = 'height:' + H + 'px;line-height:' + H + 'px;scroll-snap-align:center;';
      el.dataset.idx = i;
      col.appendChild(el);
    }

    // 底部留白
    var bs = document.createElement('div');
    bs.style.cssText = 'height:' + SP + 'px;flex-shrink:0;pointer-events:none;';
    col.appendChild(bs);

    // 检测离中心最近的项
    function getCenter() {
      var cr = col.getBoundingClientRect();
      var cy = cr.top + cr.height / 2;
      var els = col.querySelectorAll('.picker-col-item');
      var best = 0, minD = Infinity;
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - cy);
        if (d < minD) { minD = d; best = i; }
      }
      return best;
    }

    function paint() {
      var idx = getCenter();
      var els = col.querySelectorAll('.picker-col-item');
      for (var i = 0; i < els.length; i++) {
        els[i].className = 'picker-col-item' + (i === idx ? ' active' : '');
      }
      if (callback) callback(idx);
    }

    // 初始定位
    if (activeIdx !== undefined && activeIdx >= 0) {
      col.scrollTop = activeIdx * H;
    }

    // 等渲染完成后再刷高亮
    setTimeout(paint, 100);

    // 鼠标滚轮交给浏览器原生滚动 + CSS scroll-snap 吸附，不做人工干预

    col.addEventListener('scroll', paint, { passive: true });

    return {
      getIndex: function() { return getCenter(); },
      setIndex: function(idx) {
        col.scrollTop = idx * H;
        setTimeout(paint, 100);
      }
    };
  }

  // ===== 创建滚轮选择器（旧版接口，多列日期/时间用） =====
  function createPicker(options, colId, onScroll) {
    var col = $(colId);
    var r = makeRatcheted(col, options, function(idx) { onScroll && onScroll(idx); }, 0);
    return { setActive: r.setIndex, getActive: r.getIndex };
  }

  // ===== 通用选择器弹窗（居中 + 棘轮） =====
  function showCenteredPicker(title, items, activeIdx, onConfirm) {
    var overlay = document.createElement('div');
    overlay.className = 'picker-overlay';
    var popup = document.createElement('div');
    popup.className = 'picker-popup';
    popup.innerHTML = '<div class="picker-header"><span class="picker-cancel" id="pcCancel">取消</span><span>'+title+'</span><span class="picker-confirm" id="pcConfirm">确定</span></div>';
    var body = document.createElement('div');
    body.className = 'picker-body';
    var col = document.createElement('div');
    col.className = 'picker-col';

    var picker = makeRatcheted(col, items, function(idx) {}, activeIdx >= 0 ? activeIdx : 0);

    var indicator = document.createElement('div');
    indicator.className = 'picker-indicator';
    body.appendChild(indicator);
    body.appendChild(col);
    popup.appendChild(body);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#pcCancel').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.querySelector('#pcConfirm').addEventListener('click', function() {
      document.body.removeChild(overlay);
      onConfirm(picker.getIndex());
    });
  }

  // ===== 初始化 =====
  function init() {
    var now = new Date();
    S.date = fmt(now);
    S.time = '12:00';
    S.canSubmit = true;
    S.gender = '男';
    $('genderM').classList.add('on');

    // 日期选择器
    var years = []; for (var y = 2025; y >= 1940; y--) years.push(String(y));
    var months = []; for (var m = 1; m <= 12; m++) months.push(m < 10 ? '0' + m : String(m));
    var days = []; for (var d = 1; d <= 31; d++) days.push(d < 10 ? '0' + d : String(d));
    var dateYearPicker = createPicker(years, 'dateYearCol', function() {});
    var dateMonthPicker = createPicker(months, 'dateMonthCol', function() {});
    var dateDayPicker = createPicker(days, 'dateDayCol', function() {});
    function updateDateValue() {
      var y = years[dateYearPicker.getActive()], mo = months[dateMonthPicker.getActive()], da = days[dateDayPicker.getActive()];
      S.date = y + '-' + mo + '-' + da;
      $('birthDate').value = y + '年' + mo + '月' + da + '日';
      checkSubmit();
    }
    var today = new Date();
    var ty = String(today.getFullYear()), tm = ('0' + (today.getMonth() + 1)).slice(-2), td = ('0' + today.getDate()).slice(-2);
    dateYearPicker.setActive(years.indexOf(ty));
    dateMonthPicker.setActive(months.indexOf(tm));
    dateDayPicker.setActive(days.indexOf(td));
    $('birthDate').value = ty + '年' + tm + '月' + td + '日';

    function showDatePicker() {
      showCenteredPicker('选择日期', years.map(function(y,i){
        return y + '年' + months[dateMonthPicker.getActive()] + '月' + days[dateDayPicker.getActive()] + '日';
      }), 0, function() {
        // rebuild more flexible — use the three-col approach via existing mechanism
        // Actually simpler: just use the old mask but centered CSS
      });
    }
    $('birthDate').addEventListener('click', function() { $('dateMask').style.display = 'flex'; });
    $('dateCancel').addEventListener('click', function() { $('dateMask').style.display = 'none'; });
    $('dateConfirm').addEventListener('click', function() { updateDateValue(); $('dateMask').style.display = 'none'; });

    // 时间选择器
    var hours = []; for (var h = 0; h < 24; h++) hours.push(h < 10 ? '0' + h : String(h));
    var mins = []; for (var m = 0; m < 60; m++) mins.push(m < 10 ? '0' + m : String(m));
    var timeHourPicker = createPicker(hours, 'timeHourCol', function() {});
    var timeMinPicker = createPicker(mins, 'timeMinCol', function() {});
    function updateTimeValue() {
      var h = hours[timeHourPicker.getActive()], m = mins[timeMinPicker.getActive()];
      S.time = h + ':' + m;
      $('birthTime').value = h + '时' + m + '分'; checkSubmit();
    }
    timeHourPicker.setActive(6); timeMinPicker.setActive(0);
    $('birthTime').value = '12时00分';
    $('birthTime').addEventListener('click', function() { $('timeMask').style.display = 'flex'; });
    $('timeCancel').addEventListener('click', function() { $('timeMask').style.display = 'none'; });
    $('timeConfirm').addEventListener('click', function() { updateTimeValue(); $('timeMask').style.display = 'none'; });

    $('genderM').addEventListener('click', function() { S.gender='男'; $('genderM').classList.add('on'); $('genderF').classList.remove('on'); });
    $('genderF').addEventListener('click', function() { S.gender='女'; $('genderF').classList.add('on'); $('genderM').classList.remove('on'); });
    $('calcBtn').addEventListener('click', doCalc);
    $('backBtn').addEventListener('click', function() { showPage('pageInput'); });

    $('analysisBtn').addEventListener('click', requestAnalysis);
    $('analysisOverlayBtn').addEventListener('click', hideAnalysis);
    $('analysisOverlay').addEventListener('click', function(e){if(e.target===$('analysisOverlay'))hideAnalysis();});
    $('analysisRetryBtn').addEventListener('click', function(){$('analysisErrorBox').style.display='none';requestAnalysis();});

    // 大限
    $('dxPrev').addEventListener('click', dxPrev);
    $('dxNext').addEventListener('click', dxNext);
    $('dxBtn').addEventListener('click', function() {
      if (S.daxianRange.length === 0) return;
      var items = S.daxianRange.map(function(d){return d.num+'岁 ('+d.num+'-'+(d.num+9)+'年)';});
      showCenteredPicker('选择大限', items, S.daxianSel >= 0 ? S.daxianSel : 0, function(idx) {
        selDaxian(idx);
      });
    });

    // 小限
    $('xxPrev').addEventListener('click', xxPrev);
    $('xxNext').addEventListener('click', xxNext);
    $('xxBtn').addEventListener('click', function() {
      if (S.xiaoXianYears.length === 0) return;
      showCenteredPicker('选择年限', S.xiaoXianDisplays, S.xiaoXianIdx >= 0 ? S.xiaoXianIdx : 0, function(idx) {
        applyXiaoXian(idx);
        $('xxBtn').textContent = S.xiaoXianDisplays[idx];
      });
    });

    // 宫位点击
    $('panWrap').addEventListener('click', function(e) {
      var cell = e.target.closest('.gong-cell');
      if (cell) { tapGong(parseInt(cell.dataset.idx)); }
      else if (S.tapIdx >= 0) {
        S.tapIdx = -1; S.xiaoXianPalIdx = -1;
        // 恢复大限高亮
        if (S.daxianSel >= 0 && S.panData) {
          var pd = S.panData;
          var dir = ((pd.yi.g % 2 === 0 && pd.gender === '男') || (pd.yi.g % 2 !== 0 && pd.gender !== '男')) ? 1 : -1;
          var nmi = mod(pd.mingIdx + dir * S.daxianSel, 12);
          var sf = getSF4(nmi);
          updateHighlight(nmi, sf, sf);
        } else {
          updateHighlight(-1, null, null);
        }
        renderCircle();
      }
    });

    checkSubmit();
  }

  function checkSubmit() { S.canSubmit = !!(S.date && S.time); $('calcBtn').disabled = !S.canSubmit; }

  function doCalc() {
    if (!S.canSubmit) return;
    var p = S.date.split('-');
    var year = parseInt(p[0], 10), month = parseInt(p[1], 10), day = parseInt(p[2], 10);
    var tp = S.time.split(':');
    var hour = parseInt(tp[0], 10);
    $('loadingToast').classList.add('show');
    try {
      var pd = doCalcChart(year, month, day, hour, S.gender);
      if (!pd) throw new Error('排盘失败');
      var yy = (pd.yi.g % 2 === 0) ? '阳' : '阴';
      S.bazi=pd.bazi;S.shengXiao=pd.shengXiao;S.wuXingJu=pd.wxj;
      S.yangYinGender=yy+S.gender;S.mingZhu=pd.mingZhu;S.shenZhu=pd.shenZhu;
      S.mingGong=pd.mingGong;S.shenGong=pd.shenGong;S.panData=pd;
      S.birthDate=S.date.replace(/-/g,'/');S.birthTime=S.time;S.birthYear=year;
      S.daxianRange=pd.daxianRange;S.daxianSel=-1;S.daxianLabel='';S.tapIdx=-1;
      S.circleData=bcd(pd);
      S.analysisLoading=false;S.analysisError='';S.analysisText='';S.analysisShow=false;

      showPage('pageChart');
      renderChart();
      $('loadingToast').classList.remove('show');
    } catch(err) {
      $('loadingToast').classList.remove('show');
      alert('排盘失败: ' + (err.message || '未知错误'));
      console.error(err);
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
