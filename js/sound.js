/* 효과음 + 8비트 배경음악 (WebAudio로 직접 만듦) */
const Sound = (() => {
  let ac = null, master, bgmGain, sfxGain, sfxOn = true, bgmOn = true, cur = null, timer = null;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
    bgmGain = ac.createGain(); bgmGain.gain.value = 0.16; bgmGain.connect(master);
    sfxGain = ac.createGain(); sfxGain.gain.value = 0.35; sfxGain.connect(master);
    if (pending) { const p = pending; pending = null; bgm(p); }
  }
  function tone(f, t0, dur, type = 'square', g = 1, dest = sfxGain, slide = 0) {
    if (!ac) return;
    const o = ac.createOscillator(), v = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t0 + dur);
    v.gain.setValueAtTime(0.0001, t0); v.gain.linearRampToValueAtTime(g, t0 + 0.01);
    v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(v); v.connect(dest); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  const SFX = {
    blip: () => tone(1200, ac.currentTime, 0.04, 'square', 0.3),
    sel: () => { const t = ac.currentTime; tone(880, t, 0.05, 'square', 0.4); tone(1320, t + 0.05, 0.06, 'square', 0.4); },
    bump: () => tone(110, ac.currentTime, 0.08, 'square', 0.4),
    enc: () => { const t = ac.currentTime; [72, 71, 72, 71, 72, 76, 79].forEach((n, i) => tone(N(n), t + i * 0.06, 0.07, 'square', 0.45)); },
    good: () => { const t = ac.currentTime; [72, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.08, 0.12, 'square', 0.45)); },
    bad: () => { const t = ac.currentTime; tone(N(60), t, 0.15, 'square', 0.4); tone(N(55), t + 0.15, 0.25, 'square', 0.4); },
    throw: () => tone(600, ac.currentTime, 0.3, 'triangle', 0.5, sfxGain, 2.5),
    wob: () => tone(300, ac.currentTime, 0.08, 'square', 0.35),
    catch: () => { const t = ac.currentTime; [67, 72, 76, 79, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.09, 0.14, 'square', 0.45)); },
    page: () => { const t = ac.currentTime; [79, 84, 88, 91].forEach((n, i) => tone(N(n), t + i * 0.12, 0.3, 'triangle', 0.5)); },
    door: () => { const t = ac.currentTime; tone(N(60), t, 0.08, 'square', 0.3); tone(N(67), t + 0.08, 0.1, 'square', 0.3); }
  };
  function sfx(n) { if (!ac || !sfxOn || !SFX[n]) return; try { SFX[n](); } catch (e) {} }

  // 5음계(중국풍) 짧은 노래. [음, 길이(8분음표 단위)], 0 = 쉼
  const SONGS = {
    field: { bpm: 112, lead: [[74,2],[76,2],[79,2],[81,2],[79,3],[76,1],[74,2],[72,2],[74,4],[0,2],[76,2],[79,2],[81,2],[84,2],[81,3],[79,1],[76,2],[79,2],[81,6],[0,2],
      [84,2],[81,2],[79,2],[76,2],[79,3],[81,1],[79,2],[76,2],[74,2],[72,2],[74,4],[0,2],[72,2],[74,2],[76,2],[79,2],[76,2],[74,2],[72,2],[74,6],[0,2]],
      bass: [50,57,55,57,48,55,50,57,52,59,57,59,53,57,50,57] },
    battle: { bpm: 156, lead: [[76,1],[79,1],[81,1],[84,1],[81,1],[79,1],[76,2],[74,1],[76,1],[79,1],[81,1],[79,2],[76,2],[84,1],[86,1],[88,1],[86,1],[84,1],[81,1],[79,2],[81,1],[79,1],[76,1],[74,1],[76,4]],
      bass: [45,45,52,45,43,43,50,43,41,41,48,41,43,43,47,50] },
    title: { bpm: 100, lead: [[79,2],[81,2],[84,4],[81,2],[79,2],[76,4],[74,2],[76,2],[79,2],[81,2],[79,8],[84,2],[86,2],[88,4],[86,2],[84,2],[81,4],[79,2],[81,2],[84,2],[86,2],[84,8]],
      bass: [48,55,52,55,45,52,48,52,41,48,45,48,43,50,47,50] },
    win: { bpm: 140, lead: [[72,1],[76,1],[79,1],[84,3],[81,1],[84,1],[88,4],[0,2],[86,1],[84,1],[81,1],[84,1],[79,6]], bass: [48,52,55,52,53,57,48,55], once: true }
  };
  let pending = null, wanted = null, songGain = null;
  function bgm(name) {
    wanted = name;
    if (cur === name) return;
    stopBgm();
    if (!ac) { pending = name; return; }
    if (!bgmOn) return;
    const s = SONGS[name]; if (!s) return;
    cur = name;
    const g = songGain = ac.createGain(); g.gain.value = 1; g.connect(bgmGain);
    const step = 60 / s.bpm / 2;
    let t = ac.currentTime + 0.1;
    const loop = () => {
      if (songGain !== g) return;
      let tt = t, total = 0;
      s.lead.forEach(([n, l]) => { if (n) tone(N(n), tt, l * step * 0.9, 'square', 0.5, g); tt += l * step; total += l; });
      const bl = total / s.bass.length;
      s.bass.forEach((n, i) => tone(N(n), t + i * bl * step, bl * step * 0.8, 'triangle', 0.9, g));
      t += total * step;
      if (!s.once) timer = setTimeout(loop, Math.max(50, (t - ac.currentTime - 0.6) * 1000));
    };
    loop();
  }
  function stopBgm() {
    cur = null; clearTimeout(timer);
    if (songGain && ac) { const g = songGain; try { g.gain.setTargetAtTime(0, ac.currentTime, 0.05); setTimeout(() => g.disconnect(), 300); } catch (e) {} }
    songGain = null;
  }
  return {
    init, sfx, bgm,
    stopBgm() { wanted = null; stopBgm(); },
    setSfx(v) { sfxOn = v; },
    setBgm(v) { bgmOn = v; const w = wanted; if (!v) stopBgm(); else if (w) { cur = null; bgm(w); } },
    get current() { return cur; }
  };
})();
