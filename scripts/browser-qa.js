// Run in an isolated Playwright CLI Chrome session after a fresh snapshot:
// playwright-cli -s=demo5-music run-code --filename scripts/browser-qa.js
async page => {
  const report = [];
  const assert = (value, label) => { if (!value) throw new Error(label); report.push(label); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(...args) {
        super(...args);
        const analyser = this.createAnalyser(); analyser.fftSize = 2048;
        const oscillators = new Set();
        window.__audioQA = { context: this, analyser, oscillators };
        const makeGain = this.createGain.bind(this); let first = true;
        this.createGain = () => { const gain = makeGain(); if (first) { gain.connect(analyser); first = false; } return gain; };
        const makeOsc = this.createOscillator.bind(this);
        this.createOscillator = () => { const osc = makeOsc(); oscillators.add(osc); osc.addEventListener('ended', () => oscillators.delete(osc)); return osc; };
      }
    };
  });
  await page.goto('http://127.0.0.1:4187/demo5/');
  await page.waitForSelector('#pieces button');
  const rms = () => page.evaluate(() => {
    if (!window.__audioQA) return 0;
    const samples = new Float32Array(2048); window.__audioQA.analyser.getFloatTimeDomainData(samples);
    return Math.sqrt(samples.reduce((sum,x) => sum + x*x,0) / samples.length);
  });
  assert(await page.evaluate(() => !window.__audioQA), 'No AudioContext or autoplay at load');
  assert(await page.locator('#check').isDisabled(), 'Incomplete order cannot be submitted');
  await page.getByRole('button', { name:'音 A を聴く', exact:true }).click();
  await page.waitForTimeout(450);
  assert(await rms() > .0001, 'Explicit preview produces real Chrome PCM output');
  await page.locator('#mute').click(); await page.waitForTimeout(250);
  assert(await rms() < .00001, 'Mute silences real PCM output');
  await page.locator('#mute').click(); await page.waitForTimeout(150);
  assert(await rms() > .0001, 'Unmute restores audio during playback');
  await page.locator('#stop').click(); await page.waitForTimeout(100);
  assert(await rms() < .00001, 'Stop silences all scheduled audio');
  assert(await page.evaluate(() => window.__audioQA.oscillators.size === 0), 'Stop releases scheduled oscillators');
  await page.locator('#shuffle').click();
  await page.locator('#check').click();
  assert((await page.locator('#feedback').textContent()).includes('もう少し'), 'Incorrect full order offers a listening hint');
  await page.locator('#clear').click();
  await page.getByRole('button',{name:'音 A を選ぶ',exact:true}).focus(); await page.keyboard.press('Enter');
  await page.keyboard.press('2');
  assert((await page.locator('[data-slot="1"]').textContent()).includes('音 A'), 'Keyboard Enter + digit places a fragment');
  await page.getByRole('button',{name:'音 B を選ぶ',exact:true}).focus(); await page.keyboard.press('Space');
  await page.keyboard.press('1');
  await page.locator('[data-slot="1"]').focus(); await page.keyboard.press('Enter'); await page.keyboard.press('1');
  assert((await page.locator('[data-slot="0"]').textContent()).includes('音 A'), 'Keyboard swaps occupied slots');
  await page.locator('#clear').focus(); await page.keyboard.press('Enter');
  await page.locator('[data-focus="select-s-kite"]').focus(); await page.keyboard.press('Enter'); await page.keyboard.press('1');
  await page.locator('[data-focus="select-s-pebble"]').focus(); await page.keyboard.press('Enter'); await page.keyboard.press('2');
  await page.locator('#check').focus(); await page.keyboard.press('Enter');
  assert((await page.locator('#feedback').textContent()).includes('つながった'), 'First song solved entirely with keyboard');
  await page.waitForTimeout(550);
  assert(await rms() > .0001, 'Completion plays the full arrangement');
  await page.keyboard.press('Escape');await page.waitForTimeout(100);
  assert(await rms() < .00001, 'Escape stops completion playback');
  await page.locator('#volume').fill('23');
  await page.locator('#mute').click();
  const savedSlots = await page.locator('#slots').textContent();
  await page.reload();await page.waitForSelector('#pieces button');
  assert(await page.locator('#volume').inputValue() === '23', 'Volume survives reload');
  assert(await page.locator('#mute').getAttribute('aria-pressed') === 'true', 'Mute survives reload');
  assert(await page.locator('#slots').textContent() === savedSlots, 'Exact order and labels survive reload');
  assert((await page.locator('#levels').textContent()).includes('✓'), 'Completion survives reload');
  assert(await page.evaluate(() => !window.__audioQA), 'Reload restores state without starting audio');
  await page.locator('#mute').click();
  // White-box solution values are used only here to exercise the remaining level transitions.
  const idsByLevel = [['w-sand','w-cloud','w-reed'],['l-moss','l-rain','l-fern','l-shell']];
  for (let levelIndex=1;levelIndex<3;levelIndex++) {
    await page.getByRole('button',{name:new RegExp(`^${levelIndex+1}曲目`)}).click();
    for(const [slotIndex,id] of idsByLevel[levelIndex-1].entries()) {
      await page.locator(`[data-focus="select-${id}"]`).click();
      await page.locator(`[data-slot="${slotIndex}"]`).click();
    }
    await page.locator('#check').click();
    assert((await page.locator('#feedback').textContent()).includes('つながった'), `Song ${levelIndex+1} completes and plays`);
    await page.waitForTimeout(300);await page.locator('#stop').click();
  }
  assert((await page.locator('#feedback').textContent()).includes('3曲'), 'All-three completion is displayed');
  await page.locator('#reference').click();await page.waitForTimeout(350);
  // Playwright forces document visibility in this macOS Chrome environment.
  // Exercise the actual application event handler with an explicit hidden
  // event; record this as simulation rather than natural tab-switch coverage.
  await page.evaluate(() => {
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });await page.waitForTimeout(150);
  assert(await page.evaluate(() => window.__audioQA.context.state === 'suspended'), 'Simulated visibilitychange stops and suspends real audio');
  await page.evaluate(() => {
    delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));
  });await page.waitForTimeout(150);
  assert(await page.locator('#stop').isDisabled(), 'Returning to the tab does not auto-resume');
  await page.locator('#reference').click();await page.waitForTimeout(350);
  assert(await rms() > .0001, 'Explicit playback works after background return');
  await page.locator('#stop').click();
  await page.locator('#reference').click();await page.waitForTimeout(300);
  await page.goto('about:blank');await page.goBack();await page.waitForSelector('#pieces button');
  assert(await page.evaluate(() => !window.__audioQA), 'Actual pagehide/back navigation restores without autoplay');
  await page.getByRole('button',{name:/^1曲目/}).click();await page.locator('#reference').click();
  await page.waitForTimeout(5250);
  assert(await page.locator('#stop').isDisabled(), 'Natural song completion stops progress and audio');
  await page.setViewportSize({width:1280,height:1000});
  await page.screenshot({path:'output/playwright/desktop.png',fullPage:true});
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Desktop has no horizontal overflow');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'output/playwright/mobile.png',fullPage:true});
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '390px screen has no horizontal overflow');
  await page.setViewportSize({width:320,height:640});
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '320px screen has no horizontal overflow');
  assert(errors.length === 0, `No page JavaScript errors (${errors.length})`);
  return {passed:report.length,checks:report,errors};
}
