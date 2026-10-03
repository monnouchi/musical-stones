# 試作 v0.1 の検証記録

検証日: 2026-10-03。macOS の Google Chrome 154.0.8037.95、Playwright CLI 0.1.22、Node.js 25.9.0 を使用した。

## リポジトリと作業範囲

- GitHub connector で `monnouchi/demo5` の存在、owner、権限、可視性 public を確認した。
- 専用の `task-7/demo5` へ clone し、コミット・既存ファイルのない空リポジトリであることを確認した。
- 他の checkout や Stopwatch のファイル・サーバーへ変更を加えていない。予定していた 4175 は既存サーバーが使用中だったため、このアプリは 4187 を使用した。
- Pages の有効化、可視性の変更、外部公開、push は行っていない。初回体験の確認を優先した。

## 自動テスト

`npm test`: **15 / 15 成功**。`npm run check`: 成功。

- 2、3、4断片の全順列における正解の一意性、未配置・重複の誤答処理。
- シャッフルの断片保存、解答回避、端の乱数値。
- 新規ゲームの A/B 割り当てが常に逆順にならないこと。
- 選択→配置、占有済み同士の交換、未配置からの置き換え、削除、不正な配置先。
- 配置・文字割り当て・音量・ミュート・達成状態の復元。
- JSON 破損、保存形式の違い、未知の断片、重複した保存データ、localStorage 拒否。
- 音声の明示開始、前の発音の停止、将来の発音と timer の取消、遅い resume 後の誤再生防止。
- master 音量・ミュート、背景 suspend、復帰時の明示再生、音声中断の処理、自然終了、音声 API 失敗。
- お手本が断片順を視覚ハイライトで漏らさないこと。
- 全曲のノート範囲・長さ・伴奏の整合性。

## 実 Chrome QA

デスクトップのフロー: **30項目成功**。タッチエミュレーションのフロー: **9項目成功**。追加修正の2項目も成功。コンソールの Error / Warning、pageerror は0。

- 再生前に AudioContext が存在しないことを確認した。
- 実 AudioContext の PCM 出力を analyser で測定し、試聴・完成伴奏が非ゼロ、ミュートと停止後が無音となることを確認した。停止後の oscillator 残数は0。
- Enter / Space、数字キーによる配置と交換で1曲目を完走した。残りの曲も配置→判定→再生→停止を確認した。
- 誤答のヒント、未完成時の判定無効、全3曲の完成表示を確認した。
- reload 後の順序・文字ラベル・達成・音量・ミュートの保持、および再読み込みで自動再生しないことを確認した。
- 実際の `about:blank` への移動と戻る操作で、pagehide 後の保存と再開時の無音を確認した。
- visibilitychange の hidden 状態を明示的に模擬し、実音声が停止・suspend されること、visible 復帰では自動再生せず、明示再生で音が戻ることを確認した。
- 1280px、390px、320px で横方向のはみ出しがないことを確認した。
- 390×844 のタッチ環境で選択、配置、交換、取り外し、4断片、誤答表示を確認した。主要な操作対象は44×44 CSS px以上。
- お手本中の `.is-playing` が0であり、音を消しても光の順番から答えが読み取れないことを確認した。
- スマホの見出しが不自然な3行にならず、2行で収まるよう修正して画像確認した。
- `/demo5/` と `/` の HTML、CSS、全アプリ JS、アイコンの8リクエストが HTTP 200 / 適切な Content-Type で返ることを確認した。外部の動的リクエストはない。

再現コード: `scripts/browser-qa.js`、`scripts/mobile-qa.js`、`scripts/chrome-qa.config.json`。初回の成功後、答えのハイライト抑制とスマホ見出しを修正し、対象項目を実 Chrome と追加 unit test で再確認した。

## 証拠ファイル（ローカルのみ）

- `output/playwright/desktop-qa.log`: デスクトップ30項目の結果と実行コード。
- `output/playwright/mobile-qa.log`: タッチ9項目の結果と実行コード。
- `output/playwright/refinement-qa.log`: お手本の答え漏れ防止、スマホ見出し修正の検証。
- `output/playwright/desktop.png`: 1280px の全画面。
- `output/playwright/mobile.png`: 390px の全画面、修正後。
- `output/playwright/mobile-touch-level3.png`: 4断片のタッチ画面。

画像とログは `.gitignore` の対象。コードと文書に含める検証結果は、この記録を使う。

## Chrome の終了確認

専用セッション `demo5-music` を `close` した。続く CLI 一覧は `(no browsers)`。プロセス一覧でも専用 Chrome 本体・helper・crashpad・Playwright daemon の残存がないことを確認した。ローカルアプリの Node サーバーだけを遊べるよう継続している。

## 未確認事項

- 自然なタブ変更・最小化時の visibilitychange は、この環境で Playwright が document の可視状態を固定するため直接確認できなかった。背景イベントは模擬、pagehide は実ナビゲーションで確認した。通常起動の Chrome と実機で追加確認が必要。
- iPhone の Safari、Android 実機、Firefox、実機の画面ロック、Bluetooth / 音声出力先変更は未確認。タッチ QA は Chrome エミュレーション。
- 曲の聴き心地、初心者が聴いて解ける難易度、3曲目の長さは人による初回プレイで確認が必要。正解順を知る QA はこの評価を代替しない。
- GitHub Pages 上の配信は未実施。ローカルで同じプロジェクト prefix を検証済み。

実装を妨げる残りの blocker はない。次は初回体験の方向を確認し、必要な調整後に公開の判断を行う。
