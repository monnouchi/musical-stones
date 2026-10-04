# 開発・検証ガイド

利用者向けの遊び方は [README](../README.md) を参照してください。

## ローカル起動

```sh
npm start
```

Node.js 20以降、アプリの依存インストール不要。試聴は <http://127.0.0.1:4187/musical-stones/review/>、ゲームは <http://127.0.0.1:4187/musical-stones/>。ポート変更は`PORT=4188 npm start`。ES modulesのためHTTPで開きます。

## 検証と音源再生成

```sh
npm test
npm run check
```

実Chrome QAは開発用Playwright CLIとGoogle Chromeで実行します。

```sh
playwright-cli -s=musical-stones-qa open http://127.0.0.1:4187/musical-stones/ --config=scripts/chrome-qa.config.json
playwright-cli -s=musical-stones-qa run-code --filename=scripts/startup-qa.js
playwright-cli -s=musical-stones-qa run-code --filename=scripts/browser-qa.js
playwright-cli -s=musical-stones-qa run-code --filename=scripts/mobile-qa.js
playwright-cli -s=musical-stones-qa run-code --filename=scripts/review-qa.js
playwright-cli -s=musical-stones-qa run-code --filename=scripts/audio-qa.js
playwright-cli -s=musical-stones-qa run-code --filename=scripts/set-sample-qa.js
playwright-cli -s=musical-stones-qa run-code --filename=scripts/effects-qa.js
playwright-cli -s=musical-stones-qa close
```

試聴WAVは`node scripts/render-song.mjs`で再生成（既存の承認済み1曲目WAVは保持）。開発用Playwright Coreのimport先を`DEMO5_PLAYWRIGHT_MODULE`で指定できます。レンダリング用Chromeは`finally`で終了します。結果・制約は [docs/QA.md](QA.md)。旧公開版の重点レビューは [docs/REVIEW.md](REVIEW.md)。

## GitHub Pagesの配信構成

`index.html`、`style.css`、`src/`、`assets/`、`.nojekyll`をrootに配置。既存Pagesは`main`／`/(root)`。バックエンド・ビルド工程・外部APIは不要です。CSS・module importは同じ版番号のURLでキャッシュ混在を避けます。

## 設計・検証の記録

- [初期設計](DESIGN.md)
- [オルゴール音色の試作](PROTOTYPE-v0.3.md)
- [3曲の設計と操作演出](PROTOTYPE-v0.4.md)
- [検証結果と制約](QA.md)
- [初期版のレビュー](REVIEW.md)

これらは開発時点の記録です。現在の操作と保存仕様はREADMEを参照してください。
