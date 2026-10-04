# ローカル試作 v0.2 の検証記録

検証日: 2026-10-04。macOS、Google Chrome 154、Playwright CLI 0.1.22、Node.js 25。隔離したテストChromeで実行。

## 範囲と公開状態

`monnouchi/demo5` は public、専用 checkout は `task-7/demo5`。初回は空リポジトリと確認済み。初稿とMIT Licenseはmainへpushされ、monの設定によるPagesデプロイ成功を確認済み。公開URLは `https://monnouchi.github.io/demo5/`、確認した公開コミットは `70e4efff80a60fc095d9763edde4d4924d51bb52`。

今回のv0.2はローカルのみ。集中レビュー前にpush・公開設定・可視性変更は行わない。別Stopwatchのcheckoutやサーバーには変更を加えていない。試作用サーバーは専用ポート4187で継続する。

## 自動テスト

`npm test`: **19 / 19 成功**。`npm run check`: 成功。

判定の全順列、シャッフル、無作為な文字割り当て、交換・置き換え・取り外し、保存復元・破損データ・保存拒否を検証。ドラッグの共通くぼみ・棚・隙間・外側の判定と、取消／交換時の宝石保存も検証。

全3曲×通常／完成の音列について、midi・velocity・at・lengthの有限値と時間範囲、旋律一致、装飾追加を確認。すべての和声境界に指定根音があり、低音のリリースが次の根音前に終わることを確認。特に2曲目4.5拍、3曲目6.5拍の終止を検証対象に含む。

音声の明示開始、遅いresumeと停止の競合、18msフェード／22ms発音停止とonended解放、再試聴、音量・消音、背景停止・復帰、自然終了、API失敗、完成の余韻、お手本の答え漏れ防止を検証。

## 実Chromeでの操作

通しフロー **80項目成功、pageerror 0**。タッチフロー **16項目成功、pageerror 0**。最終確認でconsole Error / Warningとpageerrorはいずれも0。

- 初期無音、タップ試聴、タップ→はめる／戻す、数字キー配置・交換、矢印・Delete操作。
- 実ポインターのdrag配置・交換、台座外の取消、pointercancel、Esc取消、棚への取り外し。宝石の消失・重複なし、着床時の不要な試聴なし。
- Chrome CDPのnative touchStart/move/end/cancelでも同じ操作を確認。タップ試聴は配置せず、ドラッグではページがスクロールしない。
- 誤順でも同じ曲線がつながる。お手本中に光る断片は0。正しい配置でも明示判定前には完成演出を開かない。
- 全3曲の判定、完成画面の全宝石、停止・ミュート・音量、Esc閉じる、元ボタンへのフォーカス復帰。
- 3曲目の21秒周期の五線アニメーション、通常動作の完成画面を画像確認。1曲目の実時間での自然終了後、停止・画面終了・判定ボタンへのフォーカス復帰を確認。
- 配置・達成・音量のreload保持、曲切替時の音停止、背景停止と明示復帰。背景hiddenは模擬イベント。実pagehideの保存は前版で検証済み。
- シャッフルの解答回避、すべて棚へ戻す。旧保存状態から移行しても同じ断片IDで復元する。

## 小画面と拡大文字

スクロール位置0で **390×844、390×664、320×568 × 全3曲** を確認。宝石・お手本・並びの再生・判定・停止が同時に画面内にある。宝石をタップして説明文が変わった後も停止ボタンまで表示される。横はみ出しなし、主要操作は44 CSS px以上。

文字200%ではヘッダーと操作ボタンが折り返し、台座も文字に応じて広がる。縦スクロールで操作へ到達でき、横はみ出しなし。reduced-motionでは実行中のアニメーション0、transitionなし。音と静的な光は維持する。

## 実WebAudio出力

OfflineAudioContext 48kHzで、実装の波形・包絡・全イベントをそのまま合成。master音量1での結果：

| 曲 | 通常 peak / RMS | 完成 peak / RMS | 完成長さ |
| --- | --- | --- | --- |
| ひとつの芽 | .13985 / .03530 | .14776 / .03459 | 9.739秒 |
| 窓辺のさんぽ | .13982 / .03544 | .14027 / .03496 | 10.493秒 |
| 灯りの帰り道 | .14798 / .03554 | .14865 / .03542 | 17.993秒 |

6ケースすべてNaN/Infinityなし、出力非ゼロ、クリッピングなし。完成版の曲末後に余韻のエネルギーを確認。旋律の2/3/4倍音の測定比は .321/.140/.060。主旋律範囲はMIDI71〜84。通常と完成の音量は大きく変えず、分散伴奏と装飾で差を作る。

実AudioContextでも、3曲目完成の133発音を停止して150ms後に133個すべてのonended、管理ノード0、playing=falseを確認。前版ではanalyserによるミュートと停止後の無音も確認済み。

`/`、`/demo5/`、CSS・5つのJS・アイコンの9リクエストはHTTP200／適切なContent-Type。外部動的API・音源なし。

## 再現と証拠

再現コード: `scripts/browser-qa.js`、`scripts/mobile-qa.js`、`scripts/audio-qa.js`。起動・実行コマンドはREADME参照。

ローカル証拠（Git除外）：

- `output/playwright/polish-browser.log`: 通し80項目と小画面の判定。
- `output/playwright/polish-mobile.log`: native touch16項目。
- `output/playwright/polish-audio.log`: 6編曲、倍音、133発音の停止。
- `output/playwright/polish-visual.log`: 通常完成演出・自然終了。
- `output/playwright/polish-final.log`: 追加キー・タップ閾値・配信・console。
- `output/playwright/polish-320.png`、`polish-390.png`、`polish-desktop.png`、`polish-room.png`: 通常／完成画面。

## 未確認と次のレビュー

実iPhone Safari、Android、Firefox、画面ロック、Bluetooth切替は未確認。自然なタブ背景移行はPlaywrightが可視性を固定するため模擬イベントで確認。物理スピーカーの聴き心地・曲の魅力・初心者が耳で解ける難易度は人の初回プレイが必要。デジタル波形の検証はこの判断を代替しない。

今回のv0.2のPages配信は保留。次のMAX集中レビューで、動機と終止・小スピーカーの旋律・くぼみの直感・取消と操作・完成演出を確認してから公開へ進む。

## Chrome終了確認

専用セッション`demo5-polish`をclose。CLIは`(no browsers)`。専用プロファイル`playwright_chromiumdev_profile-kHu23f`のChrome本体・helperと専用daemonの残数0をプロセス一覧で確認。試作URLはその後もHTTP200。試作サーバーだけを継続している。
