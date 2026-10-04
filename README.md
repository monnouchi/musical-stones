# おとのつづき（仮）

GitHub Pages 向けの静的な音楽パズルです。遺跡で見つけた音の宝石を聴き、石のくぼみに並べて、小さなオリジナル曲をよみがえらせます。楽譜・音名・音楽理論の知識は不要です。Happaとつくるサンプルゲームとして、3つの曲を磨く試作です。

v0.2 は宝石の直接操作、曲・音色・完成演出を刷新しました。公開URL: <https://monnouchi.github.io/demo5/>。重点レビューは [docs/REVIEW.md](docs/REVIEW.md) を参照してください。

## ローカルで遊ぶ

Node.js 20 以降。依存パッケージのインストールは不要です。

```sh
npm start
```

<http://127.0.0.1:4187/demo5/> を開いてください。<http://127.0.0.1:4187/> でも動作します。終了はサーバーのターミナルで Ctrl+C。別ポートは `PORT=4188 npm start`。ES modules を使用するため、`file://` で直接開かず静的 HTTP サーバーを使ってください。

## 遊び方

1. 「お手本」で曲を聴く。いつでも何度でも使えます。
2. 宝石をタップして、ひとつの断片を聴く。
3. 宝石をドラッグして石のくぼみへ。近づくと吸いつき、離すと配置します。配置済み同士は交換、棚へ戻すと取り外し、台座の外で離すと取消です。
4. 「並びを聴く」で試す。置いた宝石を左から続けて鳴らし、空のくぼみは飛ばします。
5. 全部置いたら「よみがえらせる」。正解時は光が静まり、すべての宝石が輝き、分散伴奏と余韻を加えた一曲が鳴ります。「聴くのをやめる」や Esc でいつでも戻れます。

ドラッグを使わず、宝石をタップ→「はめる」で空いているくぼみへ配置できます。左右ボタンで交換し、「戻す」で棚へ戻せます。制限時間・失敗回数のペナルティはありません。

| キー | 操作 |
| --- | --- |
| Tab / Shift+Tab | ボタンへ移動 |
| Enter / Space | 宝石の試聴、ボタン操作 |
| 1〜4 | フォーカス中または選択中の宝石を配置 |
| ← / → | 宝石を隣と交換。棚の宝石は左端／右端の空きへ配置 |
| Delete / Backspace | フォーカス中の宝石を棚へ |
| P | 現在の並びを再生 |
| S / Esc | 停止。ドラッグ中の Esc は取消 |
| M | ミュート切り替え |

入力欄の操作中は全体ショートカットを無効にします。音量・ミュート・配置・達成はブラウザーに保存します。保存不可でも遊べます。画面を離れると停止し、復帰や再読み込みでは自動再生しません。完成画面にも停止・音量・ミュートがあります。OS の動きを減らす設定では背景や宝石のアニメーションを止め、音と静的な光を残します。拡大文字では画面をスクロールできます。

## 3つの独自曲

| 曲 | 断片数 | 完成時の長さ | 聴くポイント |
| --- | --- | --- | --- |
| ひとつの芽 | 2 | 約9.7秒 | C-E-G-Aの呼びかけ、B→Cの解決、返事の終止 |
| 窓辺のさんぽ | 3 | 約10.5秒 | E-G-Eの音型の発展、高い山場から主音へ帰着 |
| 灯りの帰り道 | 4 | 約18秒 | 呼びかけ、展開、下り、V→Iと最後の余韻 |

音列・和声・装飾は本試作のために制作したオリジナルです。第三者の曲・音源・サンプル・CDN・外部フォントは使いません。Web Audio API の独自倍音波形と三角波で合成します。主旋律を B4〜C6 に収め、上側の倍音を加えて伴奏を控えめにしています。試聴は旋律・低音・薄い和音、完成時は同じ旋律に軽い分散伴奏・応答音・最後の和音の余韻を加えます。内蔵スピーカーでの聴き心地は人による確認が必要です。

勝利条件は「お手本の再構成」です。別の順序も音楽として成立し得るため、気持ちよさだけで厳密な判定はしません。A/B/C/D と色は新規ゲームごとに無作為に割り当てる識別子で、すべての宝石がすべてのくぼみに入ります。隣接した宝石の曲線は正誤によらず同じです。お手本は断片を光らせず、順序を視覚表示しません。シャッフルは解答と同じ並びを避けます。

コード・文書・独自曲データ・アイコンは [MIT License](LICENSE)。アプリ自体は外部依存なし。Playwright CLI は開発QA専用です。

## GitHub Pages

配信に必要なファイルは `index.html`、`style.css`、`src/`、`assets/`、`.nojekyll`。相対URLで `/demo5/` 配下に対応し、ビルド工程・バックエンド・外部APIは不要です。

mon によって Pages の公開設定済みです。**Settings → Pages → Build and deployment → Deploy from a branch** で branch `main`、folder `/(root)` を指定する構成です。追加の公開 workflow は不要です。既存の設定や可視性は今回の改修で変更していません。

## 検証

```sh
npm test
npm run check
```

Node 標準テストで判定・交換・取消・シャッフル・保存・和声境界・音声停止・非同期競合を検証します。実 Chrome QA は Playwright CLI と Google Chrome が必要です。

```sh
playwright-cli -s=demo5-polish open http://127.0.0.1:4187/demo5/ --config=scripts/chrome-qa.config.json
playwright-cli -s=demo5-polish run-code --filename=scripts/browser-qa.js
playwright-cli -s=demo5-polish run-code --filename=scripts/mobile-qa.js
playwright-cli -s=demo5-polish run-code --filename=scripts/audio-qa.js
playwright-cli -s=demo5-polish run-code --filename=scripts/review-qa.js
playwright-cli -s=demo5-polish close
```

QA の画像・ログは `output/playwright/`、`.playwright-cli/` に保存しGitから除外します。設計は [docs/DESIGN.md](docs/DESIGN.md)、結果・未確認事項は [docs/QA.md](docs/QA.md)。
