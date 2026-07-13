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
        } else if (gongData[dz].auxStars.indexOf(sn) < 0) {
          gongData[dz].auxStars.push(sn);
        }
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

  // ===== 构建数据（4-2-2-4 空心矩形） =====
  // 子在最下面一行第3个（grid row 4, col 3），逆时针排列
  // 网格位置：
  //  row1: 卯(3)  辰(4)  巳(5)  午(6)
  //  row2: 亥(11)          未(7)
  //  row3: 戌(10)          申(8)
  //  row4: 酉(9)  申(8错) 子(0)  丑(1)
  //
  // 等等，让我重新排。12地支逆时针，子在最下行第3个：
  //  行1(上): 卯  辰  巳  午   (4个)
  //  行2:     亥          未   (左右各1)
  //  行3:     戌          申   (左右各1)
  //  行4(下): 酉  申? 子  丑   (4个)
  //
  // 不对，12个宫位不能重复。让我按斗数标准排：
  // 地支逆时针：子→亥→戌→酉→申→未→午→巳→辰→卯→寅→丑
  // 子在最下行第3个
  //
  // 行1(上, 4个):  卯  辰  巳  午
  // 行2(左1, 右1): 亥          未
  // 行3(左1, 右1): 戌          申
  // 行4(下, 4个):  酉  申(错!) 子  丑
  //
  // 问题：申在行3和行4都出现了。让我重新排：
  // 逆时针从子开始，沿着外圈走：
  // 子(下3) → 丑(下4) → 寅(上1? 不对)
  //
  // 斗数标准排法：地支固定在网格上，逆时针绕一圈
  // 行1(上4): 寅  卯  辰  巳
  // 行2:      丑          午
  // 行3:      子          未
  // 行4(下4): 亥  戌  酉  申
  //
  // 但用户说"子在最下面那行的第三个"，所以下行是：? ? 子 ?
  // 下行4个：酉 申 子 丑？不对，地支顺序是固定的
  //
  // 斗数的地支位置是固定的：
  //  巳 午 未 申
  //  辰      酉
  //  卯      戌
  //  寅 丑  子 亥
  //
  // 这是标准斗数盘，子在下行第3个 ✓
  // 逆时针：子→亥→戌→酉→申→未→午→巳→辰→卯→寅→丑
  //
  // 对应 grid 位置 (row, col):
  //  row1: 巳(3) 午(4) 未(5) 申(6)
  //  row2: 辰(2)          酉(7)
  //  row3: 卯(1)          戌(8)
  //  row4: 寅(0) 丑(11?) 子(0) 亥(11)
  //
  // 不对。让我直接用标准斗数盘的地支位置：
  //  巳  午  未  申
  //  辰       酉
  //  卯       戌
  //  寅  丑  子  亥
  //
  // 12地支在网格中的位置（行从1开始，列从1开始）：
  // (1,1)=巳 (1,2)=午 (1,3)=未 (1,4)=申
  // (2,1)=辰                    (2,4)=酉
  // (3,1)=卯                    (3,4)=戌
  // (4,1)=寅 (4,2)=丑 (4,3)=子 (4,4)=亥
  //
  // 子确实在最下行第3个 ✓

  // 宫位索引映射：12地支 → grid位置
  // DZ索引: 0=子 1=丑 2=寅 3=卯 4=辰 5=巳 6=午 7=未 8=申 9=酉 10=戌 11=亥
  var GRID_POS = {
    0:  { r: 4, c: 3 },  // 子
    1:  { r: 4, c: 2 },  // 丑
    2:  { r: 4, c: 1 },  // 寅
    3:  { r: 3, c: 1 },  // 卯
    4:  { r: 2, c: 1 },  // 辰
    5:  { r: 1, c: 1 },  // 巳
    6:  { r: 1, c: 2 },  // 午
    7:  { r: 1, c: 3 },  // 未
    8:  { r: 1, c: 4 },  // 申
    9:  { r: 2, c: 4 },  // 酉
    10: { r: 3, c: 4 },  // 戌
    11: { r: 4, c: 4 },  // 亥
  };

  function bcd(pd) {
    var gd = pd.gongData, mi = pd.mingIdx;
    var d = [];

    function calcLines(ms, ss, as) {
      var u = 0;
      for (var k = 0; k < ms.length; k++) { u += 2; if (ms[k].mutagen && ms[k].mutagen.length > 0) u += ms[k].mutagen.length; }
      for (var si = 0; si < ss.length; si++) u += 1.5;
      for (var ai = 0; ai < as.length; ai++) {
        var n = as[ai];
        if (n.indexOf('化') !== 0 && '左辅右弼天魁天钺文昌文曲天马禄存红鸾天喜'.indexOf(n) >= 0) u += 1;
      }
      if (u <= 2) return 1; if (u <= 5) return 2; if (u <= 9) return 3; if (u <= 13) return 4; return 5;
    }

    for (var i = 0; i < 12; i++) {
      var dz = DZ[i], gn = '', im = false, is = false;
      for (var j = 0; j < 12; j++) { var di = mod(mi - j + 12, 12); if (di === i) { gn = GW[j]; im = (j === 0); is = (di === pd.shenIdx); break; } }
      var ms = (gd[dz] ? gd[dz].mainStars : []) || [];
      var as = (gd[dz] ? gd[dz].auxStars : []) || [];
      var ss = (gd[dz] ? gd[dz].shaStars : []) || [];
      var ie = gd[dz] ? gd[dz].isEmpty : false;
      var hm = false, contentLines = calcLines(ms, ss, as);

      var totalStars = ms.length + ss.length;
      for (var k = 0; k < ms.length; k++) { if (ms[k].mutagen) totalStars += ms[k].mutagen.length; }
      for (var ai = 0; ai < as.length; ai++) { var n = typeof as[ai] === 'string' ? as[ai] : ''; if (n.indexOf('化') !== 0 && '左辅右弼天魁天钺文昌文曲天马禄存红鸾天喜'.indexOf(n) >= 0) totalStars++; else if (n.indexOf('化') >= 0) totalStars++; }
      var isSingle = (totalStars === 1);

      function starSpan(cls, color, name) { return '<span style="display:inline-block;white-space:nowrap;margin:0 1px 1px 1px"><span class="' + cls + '" style="color:' + color + '">' + name + '</span></span>'; }
      var fullHtml = '';
      for (var k = 0; k < ms.length; k++) {
        hm = true; var c = '#fff';
        if (ms[k].brightness === '旺') c = '#ddd'; else if (ms[k].brightness === '得') c = '#ccc'; else if (ms[k].brightness === '不' || ms[k].brightness === '平' || ms[k].brightness === '陷') c = '#999';
        fullHtml += '<span style="display:inline-block;white-space:nowrap;margin:0 1px 1px 1px"><span class="star-main" style="color:' + c + '">' + ms[k].name + '</span>';
        if (ms[k].mutagen && ms[k].mutagen.length > 0) { for (var u = 0; u < ms[k].mutagen.length; u++) fullHtml += '<span class="star-hua" style="color:#1e64b4">' + ms[k].mutagen[u] + '</span>'; }
        fullHtml += '</span>';
      }
      for (var si = 0; si < ss.length; si++) {
        hm = true; var cc = '#c0392b';
        if (ss[si].brightness === '庙' || ss[si].brightness === '旺') cc = '#ef9a9a';
        else if (ss[si].brightness === '得' || ss[si].brightness === '利') cc = '#e57373';
        else if (ss[si].brightness === '平') cc = '#e74c3c';
        else cc = '#c0392b';
        fullHtml += starSpan('star-sha', cc, ss[si].name);
      }
      for (var ai = 0; ai < as.length; ai++) {
        var n = typeof as[ai] === 'string' ? as[ai] : '';
        if (n.indexOf('化') !== 0 && '左辅右弼天魁天钺文昌文曲天马禄存红鸾天喜'.indexOf(n) >= 0) { hm = true; if (fullHtml.indexOf(n) < 0) fullHtml += starSpan('star-aux', '#555', n); }
        else if (n.indexOf('化') >= 0) { hm = true; if (fullHtml.indexOf(n) < 0) fullHtml += starSpan('star-hua', '#1e64b4', n); }
      }
      if (ie && !hm) fullHtml = '';

      var pos = GRID_POS[i];
      d.push({ dz: dz, idx: i, name: gn, isMing: im, isShen: is, fullHtml: fullHtml, contentLines: contentLines, isSingle: isSingle, gridRow: pos.r, gridCol: pos.c });
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

  function applyHighlightToCircle(cd) {
    var tapIdx = S.tapIdx, daxianSel = S.daxianSel, xiaoXianPalIdx = S.xiaoXianPalIdx;
    var pd = S.panData; if (!pd) return;
    for (var n = 0; n < cd.length; n++) { cd[n].isHighlight = false; cd[n].isSizheng = false; cd[n].isDaxianMing = false; cd[n].isDaxianSz = false; cd[n].isXiaoXian = false; cd[n].isXiaoXianOpp = false; }
    if (xiaoXianPalIdx >= 0) {
      for (var n = 0; n < cd.length; n++) { cd[n].isXiaoXian = (cd[n].idx === xiaoXianPalIdx); }
    } else if (tapIdx >= 0) {
      var sf = getSF4(tapIdx);
      for (var n = 0; n < cd.length; n++) { cd[n].isHighlight = (sf.indexOf(cd[n].idx) >= 0 && cd[n].idx === tapIdx); cd[n].isSizheng = (sf.indexOf(cd[n].idx) >= 0 && cd[n].idx !== tapIdx); }
    } else if (daxianSel >= 0 && pd.daxianRange && pd.daxianRange[daxianSel]) {
      var dir = ((pd.yi.g % 2 === 0 && pd.gender === '男') || (pd.yi.g % 2 !== 0 && pd.gender !== '男')) ? 1 : -1;
      var nmi = mod(pd.mingIdx + dir * daxianSel, 12);
      var sf = getSF4(nmi);
      for (var n = 0; n < cd.length; n++) { cd[n].isDaxianMing = (sf.indexOf(cd[n].idx) >= 0 && cd[n].idx === nmi); cd[n].isDaxianSz = (sf.indexOf(cd[n].idx) >= 0 && cd[n].idx !== nmi); }
    }
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
        (it.isHighlight ? ' hl' : '') +
        (it.isDaxianMing ? ' gx' : '') +
        (it.isDaxianSz ? ' gx-sz' : '') +
        (it.isSizheng ? ' sz' : '') +
        (it.isXiaoXian ? ' xx' : '') +
        (it.isMing ? ' ming' : '') +
        (it.isShen ? ' shen' : '');
      cell.style.gridRow = it.gridRow;
      cell.style.gridColumn = it.gridCol;
      cell.dataset.idx = it.idx;

      var inner = document.createElement('div');
      inner.className = 'gong-inner';

      var head = document.createElement('div');
      head.className = 'g-head';
      var dzSpan = document.createElement('span');
      dzSpan.className = 'g-dz';
      dzSpan.textContent = it.dz;
      var nameSpan = document.createElement('span');
      nameSpan.className = 'g-name';
      nameSpan.textContent = it.name;
      head.appendChild(dzSpan);
      head.appendChild(nameSpan);
      inner.appendChild(head);

      if (it.isShen) { var tag = document.createElement('span'); tag.className = 'g-shen-tag2'; tag.textContent = '身'; head.appendChild(tag); }

      var stars = document.createElement('div');
      stars.className = 'g-stars';
      stars.innerHTML = it.fullHtml;
      inner.appendChild(stars);

      cell.appendChild(inner);

      if (it.isXiaoXian) {
        var xxTag = document.createElement('div');
        xxTag.className = 'g-xx-top';
        xxTag.textContent = S.xiaoXianYearDisplay || '小限';
        cell.appendChild(xxTag);
      }

      wrap.appendChild(cell);
    }
  }

  function renderDaxian() {
    var scroll = $('daxianScroll');
    scroll.innerHTML = '';
    for (var i = 0; i < S.daxianRange.length; i++) {
      var dr = S.daxianRange[i];
      var btn = document.createElement('div');
      btn.className = 'daxian-btn' + (S.daxianSel === i ? ' on' : '');
      btn.innerHTML = '<span class="db-num">' + dr.num + '岁</span><span class="db-range">' + dr.num + '-' + (dr.num + 9) + '</span>';
      btn.dataset.i = i;
      btn.addEventListener('click', function(e) { selDaxian(parseInt(e.currentTarget.dataset.i)); });
      scroll.appendChild(btn);
    }
  }

  function renderXiaoXian() {
    var bar = $('xiaoBar');
    if (S.xiaoXianYears.length === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    // 更新按钮文字
    if (S.xiaoXianYearDisplay) $('xiaoBtn').textContent = S.xiaoXianYearDisplay;
  }

  function renderChart() {
    $('baziText').textContent = S.bazi;
    $('chartInfo').textContent = S.shengXiao + ' · ' + S.yangYinGender + ' · ' + S.wuXingJu + ' · 命宫' + S.mingGong + ' 身宫' + S.shenGong;
    // 小限始终显示，默认选第一个大限的第一年
    if (S.xiaoXianYears.length === 0 && S.daxianRange.length > 0) {
      var xyRange = S.daxianRange[0];
      S.xiaoXianYears = []; S.xiaoXianDisplays = [];
      for (var a = xyRange.start; a <= xyRange.end; a++) {
        S.xiaoXianYears.push(a);
        S.xiaoXianDisplays.push(S.birthYear + a - 1 + '年（' + a + '岁）');
      }
    }
    renderDaxian();
    renderXiaoXian();
    renderCircle();
  }

  function selDaxian(i) {
    var pd = S.panData; if (!pd) return;
    var nl = '', nmi = pd.mingIdx;
    if (S.daxianSel === i) {
      S.daxianSel = -1; S.daxianLabel = ''; S.tapIdx = -1;
      S.xiaoXianYear = -1; S.xiaoXianYearDisplay = ''; S.xiaoXianYears = []; S.xiaoXianDisplays = []; S.xiaoXianPalIdx = -1; S.xiaoXianIdx = -1;
      updateHighlight(-1, null, null);
      renderDaxian(); renderXiaoXian(); renderCircle();
      return;
    }
    if (i >= 0 && i < S.daxianRange.length) {
      var dr = S.daxianRange[i];
      nl = dr.num + '-' + (dr.num + 9) + '年';
      var dir = ((pd.yi.g % 2 === 0 && pd.gender === '男') || (pd.yi.g % 2 !== 0 && pd.gender !== '男')) ? 1 : -1;
      nmi = mod(pd.mingIdx + dir * i, 12);
    }
    var xyRange = S.daxianRange[i];
    var xyYears = [], xyDisplays = [];
    for (var a = xyRange.start; a <= xyRange.end; a++) { xyYears.push(a); xyDisplays.push(S.birthYear + a - 1 + '年（' + a + '岁）'); }
    var sf = getSF4(nmi);
    S.daxianSel = i; S.daxianLabel = nl; S.tapIdx = -1;
    S.xiaoXianYear = -1; S.xiaoXianYears = xyYears; S.xiaoXianDisplays = xyDisplays; S.xiaoXianPalIdx = -1;
    updateHighlight(nmi, sf, sf);
    renderDaxian(); renderXiaoXian(); renderCircle();
  }

  function tapGong(idx) {
    var pd = S.panData; if (!pd) return;
    if (S.tapIdx === idx) {
      S.tapIdx = -1; S.daxianSel = -1; S.daxianLabel = '';
      updateHighlight(-1, null, null);
      renderCircle();
      return;
    }
    var sf = getSF4(idx);
    S.tapIdx = idx; S.daxianSel = -1; S.daxianLabel = '';
    updateHighlight(idx, sf, null);
    renderCircle();
  }

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
    $('xiaoBtn').textContent = display || '选择年限';
    if (pi >= 0) {
      S.circleData = S.circleData.map(function(it) {
        var ni = {}; for (var k in it) ni[k] = it[k];
        ni.isXiaoXian = (it.idx === pi);
        ni.isHighlight = false; ni.isSizheng = false; ni.isDaxianMing = false; ni.isDaxianSz = false;
        return ni;
      });
    } else {
      S.xiaoXianPalIdx = -1;
      S.circleData = S.circleData.map(function(it) {
        var ni = {}; for (var k in it) ni[k] = it[k];
        ni.isXiaoXian = false; ni.isSizheng = false; ni.isXiaoXianOpp = false;
        ni.isHighlight = false; ni.isDaxianMing = false; ni.isDaxianSz = false;
        return ni;
      });
    }
    renderCircle();
  }

  function xiaoNext() {
    var idx = S.xiaoXianIdx + 1;
    if (idx >= S.xiaoXianYears.length) { var nextDi = S.daxianSel + 1; if (nextDi < S.daxianRange.length) { selDaxian(nextDi); setTimeout(function() { if (S.xiaoXianYears.length > 0) applyXiaoXian(0); }, 100); } return; }
    applyXiaoXian(idx);
  }

  function xiaoPrev() {
    var idx = S.xiaoXianIdx - 1;
    if (idx < 0) { var prevDi = S.daxianSel - 1; if (prevDi >= 0) { selDaxian(prevDi); setTimeout(function() { var len = S.xiaoXianYears.length; if (len > 0) applyXiaoXian(len - 1); }, 100); } return; }
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
    $('analysisShowBtn').style.display = 'none';

    var pd = doCalcChart(year, month, day, hour, g);
    if (!pd) {
      S.analysisLoading = false;
      $('analysisLoadingBox').style.display = 'none';
      $('analysisErrorText').textContent = '排盘失败';
      $('analysisErrorBox').style.display = 'block';
      return;
    }

    var currentYear = new Date().getFullYear();
    var prompt = '当前是' + currentYear + '年。' + '【命主信息】\n出生: ' + year + '年' + month + '月' + day + '日 ' + S.time + '\n八字: ' + pd.bazi + '\n性别: ' + g + '\n五行局: ' + pd.wxj + '\n命宫: ' + pd.mingGong + ' 身宫: ' + pd.shenGong + '\n\n【十二宫】\n';
    for (var di = 0; di < 12; di++) {
      var dz = DZ[di], gd = pd.gongData[dz];
      if (!gd) continue;
      var gn = '', mi = pd.mingIdx;
      for (var j = 0; j < 12; j++) { var ddi = mod(mi - j, 12); if (ddi === di) { gn = GW[j]; break; } }
      var mainN = gd.mainStars.map(function(s){return s.name + (s.mutagen && s.mutagen[0] ? '(' + s.mutagen[0] + ')' : '') + (s.brightness ? '[' + s.brightness + ']' : '');}).join(' ');
      var auxN = gd.auxStars.filter(function(n){return typeof n === 'string' && n.indexOf('化') !== 0;}).join(' ');
      var shaN = gd.shaStars.map(function(s){return s.name;}).join(' ');
      prompt += dz + ' ' + gn + ': ' + (mainN || (gd.isEmpty ? '(空)' : '')) + (shaN ? ' | 煞: ' + shaN : '') + (auxN ? ' | 辅: ' + auxN : '') + '\n';
    }

    fetch('https://apihub.agnes-ai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + AI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'agnes-2.0-flash',
        messages: [
          { role: 'system', content: '你是精通紫微斗数三合派的大师。请根据用户的斗数盘断命。\n\n## 核心心法\n1. 先看星，不看宫 — 先观察全盘星曜分布，建立整体印象\n2. 定命宫，看三方四正（命宫+官禄+财帛+迁移）\n3. 看大限走势 — 阳男阴女顺行，阴男阳女逆行\n4. 吉处藏凶 — 好大运的下一个大运若是空宫+煞星最危险\n5. 身宫所在即人生重心\n\n## 特殊格局\n- 火贪格: 贪狼+火星同宫 → 武贵\n- 紫府坐垣: 紫微+天府在辰戌丑未 → 将相之才\n- 七杀朝斗: 七杀旺地 → 将星\n- 武贪格: 武曲+贪狼 → 中年后发财，少年不得志\n- 日丽中天: 太阳在午 → 大吉\n- 半空折翅: 廉贞+贪狼在辰戌丑未落陷 → 中年大灾\n\n## 星曜特性\n- 紫微: 帝王之星，尊贵 | 天府: 财库温和\n- 贪狼: 桃花/武官视位置而定 | 巨门: 口舌是非\n- 天相: 辅佐之才 | 天梁: 荫星老人星\n- 七杀: 将星威武 | 破军: 消耗变动\n- 太阳: 光明官星 | 太阴: 财星\n- 天同: 福星 | 武曲: 财星刚毅\n- 文昌文曲: 科甲 | 左辅右弼: 助力\n\n## 空宫原则\n空宫不是没内容，而是借对宫主星。对宫=本宫+6\n\n## 四化（年干决定）\n甲: 廉贞禄 破军权 武曲科 太阳忌\n乙: 天机禄 天梁权 紫微科 太阴忌\n丙: 天同禄 文昌权 廉贞科 天机忌\n丁: 天同禄 巨门权 文昌科 太阳忌\n戊: 贪狼禄 太阴权 右弼科 天机忌\n己: 武曲禄 天机权 文昌科 廉贞忌\n庚: 太阳禄 武曲权 太阴科 天同忌\n辛: 巨门禄 太阳权 文曲科 文昌忌\n壬: 天梁禄 紫微权 左辅科 天马忌\n癸: 破军禄 巨门权 太阴科 贪狼忌\n\n## 批命步骤\n1. 先看命宫: 主星+空宫+煞星 → 命格基调\n2. 看身宫: 人生重心\n3. 看三方四正: 命+官+财+迁\n4. 看当前大限: 几岁到几岁，宫位吉凶\n5. 看特殊格局\n6. 给出总体断语\n\n## 风格要求\n- 直接干脆，敢下断语\n- 结合星曜亮度（庙旺平陷）判断吉凶程度\n- 最后给一句总结性断语\n- 用中文，口语化，分段落\n- 开头不要有废话，直接开讲\n- 绝对不要自我介绍，不要提你的名字或身份，直接分析斗数盘\n- 不要自我怀疑或纠正自己，你给出的就是最终结论，直接说' },
          { role: 'user', content: prompt + '\n\n请给我分析斗数。' }
        ],
        max_tokens: 4096,
        temperature: 0.7
      })
    }).then(function(res) { return res.json(); }).then(function(data) {
      S.analysisLoading = false;
      $('analysisLoadingBox').style.display = 'none';
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        var txt = data.choices[0].message.content.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/\n{3,}/g, '\n\n');
        txt = txt.replace(/^(你好[，!！]*)?我是.*?(。|\n)/, '').replace(/^(你好[，!！]*)?\n/, '');
        S.analysisText = txt; S.analysisShow = true;
        $('analysisShowBtn').style.display = 'none';
        showAnalysis();
      } else {
        S.analysisError = 'AI返回异常';
        $('analysisErrorText').textContent = S.analysisError;
        $('analysisErrorBox').style.display = 'block';
      }
    }).catch(function(err) {
      S.analysisLoading = false;
      $('analysisLoadingBox').style.display = 'none';
      S.analysisError = '请求失败: ' + (err.message || '网络错误');
      $('analysisErrorText').textContent = S.analysisError;
      $('analysisErrorBox').style.display = 'block';
    });
  }

  function showAnalysis() {
    if (!S.analysisShow || !S.analysisText) return;
    $('analysisContent').textContent = S.analysisText;
    $('analysisOverlay').style.display = 'flex';
  }
  function hideAnalysis() { $('analysisOverlay').style.display = 'none'; }

  // ===== 页面切换 =====
  function showPage(pageId) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
    $(pageId).classList.add('active');
  }

  // ===== 滚轮选择器 =====
  function createPicker(options, colId, onScroll) {
    var col = $(colId);
    var activeIdx = 0;
    col.innerHTML = '';
    for (var i = 0; i < options.length; i++) {
      var item = document.createElement('div');
      item.className = 'picker-col-item';
      item.textContent = options[i];
      item.dataset.index = i;
      col.appendChild(item);
    }
    function setActive(idx) {
      activeIdx = idx;
      var items = col.querySelectorAll('.picker-col-item');
      for (var i = 0; i < items.length; i++) items[i].className = 'picker-col-item' + (i === idx ? ' active' : '');
      col.scrollTop = idx * 36 - 72;
    }
    setActive(0);
    col.addEventListener('scroll', function() {
      var idx = Math.round(col.scrollTop / 36);
      if (idx !== activeIdx && idx >= 0 && idx < options.length) {
        activeIdx = idx;
        var items = col.querySelectorAll('.picker-col-item');
        for (var i = 0; i < items.length; i++) items[i].className = 'picker-col-item' + (i === idx ? ' active' : '');
      }
      onScroll && onScroll(activeIdx);
    }, { passive: true });
    col.querySelectorAll('.picker-col-item').forEach(function(item) {
      item.addEventListener('click', function() { setActive(parseInt(item.dataset.index)); });
    });
    return { setActive: setActive, getActive: function() { return activeIdx; } };
  }

  // ===== 初始化 =====
  function init() {
    var now = new Date();
    S.date = fmt(now);
    S.time = '12:00';
    S.canSubmit = true;
    S.gender = '男';
    $('genderM').classList.add('on');

    // 日期
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

    $('birthDate').addEventListener('click', function() { $('dateMask').style.display = 'flex'; });
    $('dateCancel').addEventListener('click', function() { $('dateMask').style.display = 'none'; });
    $('dateConfirm').addEventListener('click', function() { updateDateValue(); $('dateMask').style.display = 'none'; });

    // 时间
    var hours = []; for (var h = 0; h < 24; h++) hours.push(h < 10 ? '0' + h : String(h));
    var mins = []; for (var m = 0; m < 60; m++) mins.push(m < 10 ? '0' + m : String(m));
    var timeHourPicker = createPicker(hours, 'timeHourCol', function() {});
    var timeMinPicker = createPicker(mins, 'timeMinCol', function() {});

    function updateTimeValue() {
      var h = hours[timeHourPicker.getActive()], m = mins[timeMinPicker.getActive()];
      S.time = h + ':' + m;
      $('birthTime').value = h + '时' + m + '分';
      checkSubmit();
    }
    timeHourPicker.setActive(6); timeMinPicker.setActive(0);
    $('birthTime').value = '12时00分';

    $('birthTime').addEventListener('click', function() { $('timeMask').style.display = 'flex'; });
    $('timeCancel').addEventListener('click', function() { $('timeMask').style.display = 'none'; });
    $('timeConfirm').addEventListener('click', function() { updateTimeValue(); $('timeMask').style.display = 'none'; });

    $('genderM').addEventListener('click', function() { S.gender = '男'; $('genderM').classList.add('on'); $('genderF').classList.remove('on'); });
    $('genderF').addEventListener('click', function() { S.gender = '女'; $('genderF').classList.add('on'); $('genderM').classList.remove('on'); });

    $('calcBtn').addEventListener('click', doCalc);
    $('backBtn').addEventListener('click', function() { showPage('pageInput'); });

    $('analysisBtn').addEventListener('click', requestAnalysis);
    $('analysisShowBtn').addEventListener('click', showAnalysis);
    $('analysisOverlayBtn').addEventListener('click', hideAnalysis);
    $('analysisOverlay').addEventListener('click', function(e) { if (e.target === $('analysisOverlay')) hideAnalysis(); });
    $('analysisRetryBtn').addEventListener('click', function() { $('analysisErrorBox').style.display = 'none'; requestAnalysis(); });

    $('xiaoPrev').addEventListener('click', xiaoPrev);
    $('xiaoNext').addEventListener('click', xiaoNext);
    $('xiaoBtn').addEventListener('click', function() {
      if (S.xiaoXianYears.length === 0) return;
      var overlay = document.createElement('div');
      overlay.className = 'xiao-picker-overlay';
      var popup = document.createElement('div');
      popup.className = 'xiao-picker-popup';
      var header = document.createElement('div');
      header.className = 'xiao-picker-header';
      header.innerHTML = '<span class="xiao-picker-cancel" id="xpcCancel">取消</span><span>选择年限</span><span class="xiao-picker-confirm" id="xpcConfirm">确定</span>';
      var body = document.createElement('div');
      body.className = 'xiao-picker-body';
      var col = document.createElement('div');
      col.className = 'xiao-picker-col';
      for (var xi = 0; xi < S.xiaoXianYears.length; xi++) {
        var it = document.createElement('div');
        it.className = 'xiao-picker-item' + (xi === S.xiaoXianIdx ? ' active' : '');
        it.textContent = S.xiaoXianDisplays[xi];
        it.dataset.index = xi;
        col.appendChild(it);
      }
      setTimeout(function() {
        col.scrollTop = (S.xiaoXianIdx >= 0 ? S.xiaoXianIdx : 0) * 40 - 100;
      }, 10);
      var xActiveIdx = S.xiaoXianIdx >= 0 ? S.xiaoXianIdx : 0;
      col.addEventListener('scroll', function() {
        var idx = Math.round(col.scrollTop / 40);
        if (idx !== xActiveIdx && idx >= 0 && idx < S.xiaoXianYears.length) {
          xActiveIdx = idx;
          var items = col.querySelectorAll('.xiao-picker-item');
          for (var i = 0; i < items.length; i++) items[i].className = 'xiao-picker-item' + (i === idx ? ' active' : '');
        }
      }, { passive: true });
      col.querySelectorAll('.xiao-picker-item').forEach(function(el) {
        el.addEventListener('click', function() {
          var idx = parseInt(this.dataset.index);
          xActiveIdx = idx;
          var items = col.querySelectorAll('.xiao-picker-item');
          for (var i = 0; i < items.length; i++) items[i].className = 'xiao-picker-item' + (i === idx ? ' active' : '');
        });
      });
      body.appendChild(col);
      popup.appendChild(header);
      popup.appendChild(body);
      overlay.appendChild(popup);
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) document.body.removeChild(overlay);
      });
      overlay.querySelector('#xpcCancel').addEventListener('click', function() {
        document.body.removeChild(overlay);
      });
      overlay.querySelector('#xpcConfirm').addEventListener('click', function() {
        document.body.removeChild(overlay);
        applyXiaoXian(xActiveIdx);
        $('xiaoBtn').textContent = S.xiaoXianDisplays[xActiveIdx] || '选择年限';
      });
    });

    $('panWrap').addEventListener('click', function(e) {
      var cell = e.target.closest('.gong-cell');
      if (cell) { tapGong(parseInt(cell.dataset.idx)); }
      else if (!e.target.closest('.gong-cell')) {
        S.tapIdx = -1; S.daxianSel = -1; S.daxianLabel = '';
        updateHighlight(-1, null, null);
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
      S.bazi = pd.bazi; S.shengXiao = pd.shengXiao; S.wuXingJu = pd.wxj;
      S.yangYinGender = yy + S.gender;
      S.mingZhu = pd.mingZhu; S.shenZhu = pd.shenZhu;
      S.mingGong = pd.mingGong; S.shenGong = pd.shenGong;
      S.panData = pd;
      S.birthDate = S.date.replace(/-/g, '/');
      S.birthTime = S.time;
      S.birthYear = year;
      S.daxianRange = pd.daxianRange;
      S.daxianSel = -1; S.daxianLabel = ''; S.tapIdx = -1;
      S.circleData = bcd(pd);
      S.analysisLoading = false; S.analysisError = ''; S.analysisText = ''; S.analysisShow = false;

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
