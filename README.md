# おとのつづき（仮）

遺跡で見つけた音の宝石を聴き、動かし、短い独自曲をよみがえらせる音楽パズル。3曲・3段階、楽譜の知識は不要です。静的HTML/CSS/JavaScriptとWebAudioで、GitHub Pagesの`/demo5/`配下に対応します。

**現在の版は v0.4.1。** [GitHub Pagesで遊ぶ](https://monnouchi.github.io/demo5/?v=0.4.0)／[3曲を聴き比べる](https://monnouchi.github.io/demo5/review/?v=0.4.0)。2・3曲目の音楽、曲名、短い操作の光を更新し、1曲目の音楽と3段階・自由配置を維持しています。

## 3曲を聴き比べる

```sh
npm start
```

Node.js 20以降、アプリの依存インストール不要。試聴は <http://127.0.0.1:4187/demo5/review/>、ゲームは <http://127.0.0.1:4187/demo5/>。ポート変更は`PORT=4188 npm start`。ES modulesのためHTTPで開きます。

| 曲 | 調・拍子 | 完成WAV |
| --- | --- | --- |
| 芽吹く光 | ハ長調・3/4、96 BPM | [16.95秒](review/sprout-musicbox.wav) |
| 水晶のこだま | ト長調・2/4、108 BPM | [15.28秒](review/walk-musicbox.wav) |
| 月影の祈り | ニ短調・3/4、88 BPM | [18.31秒](review/lantern-musicbox.wav) |

1曲目の音列・編曲・音色・WAVを保ち、名前だけを変えました。2・3曲目は完成曲を先に書き、小節の頭に旋律と低音を置き、自然なフレーズで3／4断片に分けています。新2曲は裏拍の音を強拍へまたがせず、反復・応答・休符で拍を感じられる形にしました。設計は [docs/PROTOTYPE-v0.4.md](docs/PROTOTYPE-v0.4.md)。

試聴ページは明示再生・一曲ずつ・個別停止／全停止・音量／消音に対応し、背景で停止、復帰時の自動再生なし。WAVはゲームと同じ独自WebAudio合成から出力しています。

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

触れた瞬間に宝石の面が光り、置くと小さな光粒が反応します。台座では波紋と接続光が流れます。正誤とは無関係、追加SEなし、reduced-motionでは静かな発光だけにします。

起動・再読み込みでは、全曲の台座を空にし、宝石を台座外へシャッフルして最初から遊べます。古い保存配置・自由位置・達成は復元しません。音量・消音・選択中の曲は保持します。プレイ中の位置と台座順序は曲切替・リサイズでは変わりません。「シャッフルしてやり直す」は現在の曲だけを空の台座から再開し、音の文字・色は保ちます。「すべて外す」は配置だけを外します。画面を離れると停止し、戻っても自動再生しません。拡大文字とreduced-motionに対応します。

正解はお手本の再構成。お手本は断片を発光させず、曲線の光は正誤に関係なく隣接宝石をつなぎます。色・A/B/C/Dは無作為な識別、全宝石が全台座に入ります。空の台座を飛ばして、配置済みの音だけを左から再生します。明示判定後は完成編曲と鑑賞画面が開き、停止・音量・ミュートを操作できます。

## 検証と再生成

```sh
npm test
npm run check
```

実Chrome QAは開発用Playwright CLIとGoogle Chromeで実行します。

```sh
playwright-cli -s=demo5-free open http://127.0.0.1:4187/demo5/ --config=scripts/chrome-qa.config.json
playwright-cli -s=demo5-free run-code --filename=scripts/startup-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/browser-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/mobile-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/review-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/audio-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/set-sample-qa.js
playwright-cli -s=demo5-free run-code --filename=scripts/effects-qa.js
playwright-cli -s=demo5-free close
```

試聴WAVは`node scripts/render-song.mjs`で再生成（既存の承認済み1曲目WAVは保持）。開発用Playwright Coreのimport先を`DEMO5_PLAYWRIGHT_MODULE`で指定できます。レンダリング用Chromeは`finally`で終了します。結果・制約は [docs/QA.md](docs/QA.md)。旧公開版の重点レビューは [docs/REVIEW.md](docs/REVIEW.md)。

## 配信構成と権利

`index.html`、`style.css`、`src/`、`assets/`、`.nojekyll`をrootに配置。既存Pagesは`main`／`/(root)`。バックエンド・ビルド工程・外部APIは不要です。CSS・module importは同じ版番号のURLでキャッシュ混在を避けます。

独自曲・合成音色・コード・文書は [MIT License](LICENSE)。第三者音源・既存曲の引用・CDN・外部フォントは使いません。曲の魅力や実スピーカーの聴き心地は、ユーザーの試聴で判断する段階です。
