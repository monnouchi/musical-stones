# 開発ガイド

Musical Stones は、音の宝石を並べて3曲を完成させる静的な Web アプリです。利用者向けの遊び方は [README](../README.md) を参照してください。

## ローカルで実行する

Node.js を用意し、リポジトリのルートで次を実行します。

```sh
npm start
```

ブラウザーで `http://127.0.0.1:4187/musical-stones/` を開きます。サーバーは `127.0.0.1` に接続し、既定のポートは 4187 です。変更する場合は `PORT=4188 npm start` を使えます。Web Audio と JavaScript に対応したブラウザーが必要です。

このリポジトリにビルド用の npm スクリプトはありません。`index.html` などの静的ファイルを配信します。

## 構成

- `index.html`、`style.css`、`assets/`：ゲーム画面と見た目
- `src/app.js`：画面操作と各機能の接続
- `src/game.js`、`src/interaction.js`：パズル状態、配置、ドラッグ操作
- `src/music.js`、`src/audio.js`：楽曲データ、音の合成と再生
- `src/gem-visual.js`、`src/effects.js`：宝石の表示と演出
- `src/reference-guide.js`：操作案内
- `review/`：3曲の試聴ページ
- `scripts/serve.mjs`：ローカル配信用サーバー
- `tests/`：楽曲、音声、パズル、操作などの自動テスト

## 変更後の確認

```sh
npm run check
npm test
```

`check` は JavaScript の構文を確認し、`test` は `tests/*.test.mjs` を実行します。画面を変更した場合は、スマートフォン幅での配置、タップ・ドラッグ・キーボード操作もブラウザーで確認してください。音声を変更した場合は、明示操作での再生、停止、消音、画面を離れたときの停止を確認します。

再読み込み時には宝石の配置がリセットされ、音量・消音・選択中の曲は保存されます。この区別を変更する場合は `src/game.js` の保存・復元テストも更新してください。HTML とモジュール参照に付くバージョン付き URL を変更する際は、参照先の整合も確認してください。
