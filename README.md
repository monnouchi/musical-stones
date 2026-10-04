# おとのつづき（仮）

遺跡で見つけた音の宝石を聴き、動かし、短い独自曲をよみがえらせる音楽パズル。3曲・3段階、楽譜の知識は不要です。静的HTML/CSS/JavaScriptとWebAudioで、GitHub Pagesの`/demo5/`配下に対応します。

**現在のローカル試作は v0.3.0-local。公開は保留です。** 宝石を自由な位置へ動かす操作と、1曲だけ作り直したオルゴール風の試聴を用意しました。[公開版v0.2.1](https://monnouchi.github.io/demo5/?v=0.2.1)とは異なります。

## まず新しい1曲を聴く

```sh
npm start
```

Node.js 20以降、アプリの依存インストール不要。試聴は <http://127.0.0.1:4187/demo5/review/first-song.html>、ゲームは <http://127.0.0.1:4187/demo5/>。WAV本体は [review/sprout-musicbox.wav](review/sprout-musicbox.wav)。ポート変更は`PORT=4188 npm start`。ES modulesのため`file://`ではなくHTTPで開きます。

1曲目を3拍子・8小節、モチーフの反復→移調→問いかけ→返事・回帰→終止として作り直しました。約17秒。WAVはゲームと同じWebAudio合成で出力した完成曲です。残り2曲の楽曲データは変更せず、横展開はこの1曲の試聴後に判断します。設計は [docs/PROTOTYPE-v0.3.md](docs/PROTOTYPE-v0.3.md)。

## 自由に動かす

- 宝石をタップして試聴。ドラッグを離した場所へ、そのまま置けます。
- 台座の近くにだけ磁石が働き、吸着します。引き離せば自由な位置へ。
- 配置済み同士は交換。自由な宝石を占有台座へ入れると、元の宝石はその自由位置へ移ります。
- 盤面の端では安全に止まります。Esc・pointercancel・リサイズ中は移動を取消。
- 宝石を聴く→空いた盤面をタップでも自由移動。「はめる」は近い空き台座へ、「外す」は台座から外へ。
- 左右ボタンは自由位置で移動、台座上で隣への移動・交換。ドラッグを使わず操作できます。

| キー | 操作 |
| --- | --- |
| Tab、Enter / Space | 宝石へ移動、試聴、ボタン操作 |
| 矢印キー | 自由な位置へ移動（台座からも引き離す） |
| 1〜4 | 台座を指定して配置 |
| Shift＋左右 | 台座上で隣と交換 |
| Delete / Backspace | 台座から外す |
| P / S / Esc / M | 並びを再生／停止・移動取消／ミュート |

自由位置と台座順序を分けて保存し、再読み込み・サイズ変更でも保持します。音量・ミュート・達成も保存。画面を離れると停止し、戻っても自動再生しません。拡大文字とreduced-motionに対応します。

正解はお手本の再構成。お手本は断片を発光させず、曲線の光は正誤に関係なく隣接宝石をつなぎます。色・A/B/C/Dは無作為な識別、全宝石が全台座に入ります。空の台座を飛ばして、配置済みの音だけを左から再生します。明示判定後は完成編曲と鑑賞画面が開き、停止・音量・ミュートを操作できます。

## 検証と再生成

```sh
npm test
npm run check
```

実Chrome QAは開発用Playwright CLIとGoogle Chromeで実行します。

```sh
playwright-cli -s=demo5-free open http://127.0.0.1:4187/demo5/ --config=scripts/chrome-qa.config.json
playwright-cli -s=demo5-free run-code --filename=scripts/browser-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/mobile-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/review-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/audio-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/sample-qa.js
playwright-cli -s=demo5-free close
```

試聴WAVは`node scripts/render-song.mjs`で再生成。開発用Playwright Coreのimport先を`DEMO5_PLAYWRIGHT_MODULE`で指定できます。レンダリング用Chromeは`finally`で終了します。結果・制約は [docs/QA.md](docs/QA.md)。旧公開版の重点レビューは [docs/REVIEW.md](docs/REVIEW.md)。

## 配信構成と権利

`index.html`、`style.css`、`src/`、`assets/`、`.nojekyll`をrootに配置。既存Pagesは`main`／`/(root)`。バックエンド・ビルド工程・外部APIは不要です。CSS・module importは同じ版番号のURLでキャッシュ混在を避けます。

独自曲・合成音色・コード・文書は [MIT License](LICENSE)。第三者音源・既存曲の引用・CDN・外部フォントは使いません。曲の魅力や実スピーカーの聴き心地は、ユーザーの試聴で判断する段階です。
