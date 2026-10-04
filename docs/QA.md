# ローカル候補 v0.4 の検証記録

2026-10-04。Mac上の専用checkout、Chrome 154（隔離・headless）、Playwright CLI、Node.js 25で確認。公開版v0.3.0（`66e72df`）は変更していない。新候補はローカルだけ。

## 結果

- Node **27 / 27成功**、構文チェック成功。
- 全3曲のゲーム通し **68項目**、native touch **18項目**成功、pageerror 0。
- 全曲試聴ページ **20項目**成功、pageerror／console error 0。初期無音、一曲ずつ、音量／消音、個別／全停止、背景停止と復帰時の停止維持、3曲とも自然終了、WAVのHTTP200とRIFF、320×568で横はみ出しなし。
- 操作の光 **19項目**成功、pageerror 0。接触直後の発光と3粒、自由位置の着床光、台座の波紋と3本の接続光、全要素の寿命、20回の実ポインター連打（最大18 DOM要素）、停止・シャッフル・クリア・再生・曲切替・リサイズ・背景cleanupを確認。reduced-motionは粒／波紋／線の移動なし、180msの静的発光だけ。
- 通しQAでは390×844／390×664／320×568 × 全3曲、操作後の文言を含めて停止まで同時表示、200%文字、保存復元、ドラッグ取消、交換と宝石の保存、お手本の発光0、判定前の報酬漏れ防止も確認。

## 音楽の検証

承認済み1曲目は音列・和声・拍子・BPM・通常／完成のイベントが一致。公開版のWAVもbyte単位で保持。音色エンジンは変更していない。改名は表示とメタデータだけ。

3曲はC major／G major／D minor。新2曲について、すべての小節に旋律の強拍と低音、最終休符、半拍グリッド、裏拍を強拍へまたがせないことをNodeで検証。D minorではC-sharpを含むA7と最後のD minor和音、旋律C-sharp→Dを確認。全6編曲の旋律と通常／完成の一致、有限値、同一声部・同一音高・同時刻の重複なし。

48kHz OfflineAudioContext、master1での実装出力：

| 曲 | 通常 peak / RMS | 完成 peak / RMS | 完成イベント／発音数 |
| --- | --- | --- | --- |
| 芽吹く光 | .19501 / .04223 | .19033 / .04286 | 70 / 230 |
| 水晶のこだま | .19210 / .04295 | .19353 / .04261 | 64 / 208 |
| 月影の祈り | .14407 / .03179 | .14474 / .03229 | 59 / 188 |

すべてNaN/Infinityなし、非ゼロ、クリッピングなし、末尾の余韻あり。実AudioContextでも3曲の全未来発音を停止し、150ms後にそれぞれ230／208／188のonended、管理ノード0、playing=false。

主旋律の基本周波数は全曲370〜1046.5Hz。最も低い／高い旋律音を250〜6000HzのButterworth帯域に通したRMS比は.911／.998。オルゴール音の2／3倍音比は.097／.016。これは理想フィルターでの測定で、実スマホの周波数特性や音質の保証ではない。

WAVは44.1kHz／16bit PCM／mono。16.95／15.283356／18.313651秒、サイズ1,495,034／1,348,036／1,615,308 bytes。完成曲と同じエンジンから出力し、最初の既存録音は保持した。

## 光の連続capture

`output/playwright/magic-touch-0.png`、`magic-touch-80.png`、`magic-free-drop.png`、`magic-snap-0.png`、`magic-snap-120.png`、`magic-snap-300.png`、`magic-settled.png`を実Chromeで順に撮影。接触の内側の明るい面、小さな粒、自由位置の反応、台座の波紋と曲線の光、最後に残らない状態を目視確認した。秒数は待機名で、画像取得の時間も含む実タイムスタンプは`set-effects.log`に記録。

連打直後の390×664エミュレーションでrequestAnimationFrameの28フレームを測定し、中央値・最大とも16.7ms。これはheadless Chromeの短い測定で、実機モバイルFPSを保証しない。演出は18個・660msに制限し、JSの毎フレーム更新を使わない。

## 証拠と未確認

コードは`scripts/browser-qa.js`、`mobile-qa.js`、`audio-qa.js`、`set-sample-qa.js`、`effects-qa.js`。Git除外のログは`output/playwright/set-browser.log`、`set-mobile.log`、`set-audio.log`、`set-samples.log`、`set-effects.log`、`set-render.log`。設計は[PROTOTYPE-v0.4.md](PROTOTYPE-v0.4.md)。

実iPhone Safari／Android、画面ロック／Bluetooth切替、実スピーカーの魅力、初心者が耳で解く難易度は未確認。背景は模擬visibilitychange。曲としての評価はユーザーの試聴が必要。今回の作業はローカル候補までで、公開・pushしていない。別Stopwatchへ変更なし。専用サーバー4187を継続する。

専用Chrome `demo5-set`とレンダリング用Chromeは終了済み。CLIは`(no browsers)`、専用daemon PID52830とPlaywright専用プロファイルのChrome／helper残数0を確認。

---

以下は旧v0.3以前の記録。現在の音楽・演出の検証値には使用しない。

> 以下は承認済みv0.3のローカル検証記録。公開用v0.3.0は版番号・公開案内のみを更新。公開CI・配信ファイル一致・公開Chrome確認は`output/playwright/deploy-v0.3-proof.json`に記録する。

# ローカル試作 v0.3 の検証記録

2026-10-04。macOS、Google Chrome 154、Playwright CLI 0.1.22、Node.js 25。専用Chromeを隔離して検証。現在の公開版はv0.2.1（`ac3ec56`）で、以下の変更はローカルだけ。push・Pages設定・可視性の変更はしていない。別Stopwatchへ変更なし。

## 最新の結果

- `npm test`: **23 / 23成功**。`npm run check`: 成功。
- 実Chrome通し **68項目**、native touch **18項目**、操作と演出の重点確認 **10項目**成功。通しとタッチのpageerrorは0。
- 全3曲×通常／完成の実WebAudio出力6ケースにNaN/Infinityなし、非ゼロ、クリッピングなし。
- 新1曲目完成の230発音、旧3曲目完成の133発音は、停止150ms後にすべてonended、管理ノード0、playing=false。
- 試聴WAVの明示再生、16.95秒のduration、8秒位置へのシーク、背景停止と復帰時の停止維持を確認。HTTP200 `audio/wav`、RIFF、1,495,034 bytes。部分取得HTTP206、44 bytes。320×568で横はみ出しなし、試聴ページのconsole error・pageerror 0。

## 自由配置の受け入れ確認

自由位置と台座順を分けて保存。盤面内の任意位置・台座から引き離す・盤面外での端制限・reload保持を実操作で確認。実際の宝石DOMが掴んだ位置との差を保って動き、台座近傍だけで滑らかに吸着する。hoverは保存せず、releaseで1回確定。Esc／pointercancel／リサイズ／ドラッグ中の数字キーで取消し、後続pointerupが変更を上書きしない。

台座同士の交換、自由位置から占有台座への交換、端での移動後も全宝石を保持。CDPのnative touchStart/move/end/cancelでも移動・吸着・交換・取消しを確認し、ドラッグ中にページがスクロールしない。タップだけの移動／はめる／外す／左右交換と、矢印・数字・Shift＋左右・Deleteによる代替操作も確認。

全3曲で390×844、390×664、320×568の宝石・お手本・並び再生・判定・停止が同時に見え、試聴で文言が変わっても停止まで画面内。200%文字は縦スクロールで操作へ到達でき、横はみ出しなし。reduced-motionで動作中のアニメーション0。通常動作では着床時のアニメーションを確認。誤順でも同じ接続光、お手本中の断片発光0、完成編曲・鑑賞画面は明示判定後だけ。

リサイズ通知より先にpointerupが来る競合と、drag後の本当の次のタップまで抑止する問題は、実Chromeで再現して修正・再検証した。

## 新しい1曲の音声と範囲

「ひとつの芽」だけを3/4、96 BPM、8小節に再作曲し、独自合成のオルゴール風へ変更。設計と試聴は[PROTOTYPE-v0.3.md](PROTOTYPE-v0.3.md)。残り2曲の楽曲データは公開版`ac3ec56`と一致する。

| 新1曲目 | events | peak | RMS | 曲＋余韻 |
| --- | --- | --- | --- | --- |
| 通常 | 46 | .19501 | .04223 | 16.65秒 |
| 完成 | 70 | .19033 | .04286 | 16.65秒 |

上記は48kHz OfflineAudioContext、master1で合成した値。配布WAVは44.1kHz／16bit PCM／mono、終端余白込み16.95秒、peak .19033／RMS .04311。完成と通常の旋律は同じで、伴奏を変える。全和声境界の根音と次の低音までのリリース制限はNodeで検証。

WAVの有限値や操作の成功は、曲の魅力の評価を代替しない。ヘッドレスChromeでは主観的な実聴を行っていない。内蔵スピーカー、実iPhone Safari／Android、Bluetooth切替、画面ロック、初心者の耳による難易度は未確認。背景は模擬visibilitychangeを使用。まずこの1曲の試聴を受けてから残り2曲を扱う。

## 再現と証拠

起動・QA・WAV再生成のコマンドはREADME。実行コードは`scripts/browser-qa.js`、`mobile-qa.js`、`review-qa.js`、`audio-qa.js`、`sample-qa.js`。生成用Chromeは`render-song.mjs`のfinallyで終了する。

ローカル証拠（Git除外）は`output/playwright/free-browser.log`（68）、`free-mobile.log`（18）、`free-focus.log`（10）、`free-audio.log`（6編曲と230／133停止）、`free-sample.log`（WAVプレイヤー）。画像は`free-320.png`、`free-390.png`、`first-song-player.png`。試作用サーバー4187だけを継続する。

専用セッション`demo5-free`はclose済み。CLIは`(no browsers)`、専用daemon PID36659と`playwright_chromiumdev_profile`のChrome／helper残数0をプロセス一覧で確認。他アプリや別プロジェクトのプロセスは終了していない。

---

以下は公開前の旧v0.2検証記録。現在の曲・操作の検証値には使用しない。

# ローカル試作 v0.2 の検証記録

検証日: 2026-10-04。macOS、Google Chrome 154、Playwright CLI 0.1.22、Node.js 25。隔離したテストChromeで実行。

## 範囲と公開状態

`monnouchi/demo5` は public、専用 checkout は `task-7/demo5`。初回は空リポジトリと確認済み。初稿とMIT Licenseはmainへpushされ、monの設定によるPagesデプロイ成功を確認済み。公開URLは `https://monnouchi.github.io/demo5/`、確認した公開コミットは `70e4efff80a60fc095d9763edde4d4924d51bb52`。

v0.2はローカル検証と重点レビューを終え、本人の明示承認に従い既存Pagesへ通常pushする。公開設定・可視性は変更しない。別Stopwatchのcheckoutやサーバーには変更を加えていない。試作用サーバーは専用ポート4187で継続する。

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
| 灯りの帰り道 | .13870 / .03553 | .14028 / .03541 | 17.993秒 |

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

重点レビューを完了。小画面の14px操作文字／13px説明、達成チェックの別行化、山場の主音、ドラッグ中キー操作を修正した。重点17項目も成功。レビュー内容は`docs/REVIEW.md`、再検証のログは`output/playwright/review-*.log`。公開時のSHA／CI／配信一致は`output/playwright/deploy-proof.json`と最終報告に記録する。

## Chrome終了確認

専用セッション`demo5-polish`をclose。CLIは`(no browsers)`。専用プロファイル`playwright_chromiumdev_profile-kHu23f`のChrome本体・helperと専用daemonの残数0をプロセス一覧で確認。試作URLはその後もHTTP200。試作サーバーだけを継続している。
