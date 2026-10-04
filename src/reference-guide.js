// Tutorial progress is independent of fresh puzzle placement on each startup.
export const GUIDE_KEY = 'musical-stones.reference-guide.v1';
export class ReferenceGuide {
  constructor(storage) {
    this.storage = storage;
    let seen = false;
    try { seen = storage?.getItem(GUIDE_KEY) === '1'; } catch { /* private storage */ }
    this.step = seen ? 'hidden' : 'reference';
  }
  remember() {
    try { this.storage?.setItem(GUIDE_KEY, '1'); } catch { /* play still works */ }
  }
  started(audible) {
    if (this.step !== 'reference' || !audible) return;
    this.remember(); this.step = 'stones';
  }
  preview() { if (this.step === 'stones') this.step = 'hidden'; }
  skip() { this.remember(); this.step = 'hidden'; }
  reopen() { this.step = 'reference'; }
}
