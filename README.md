# AI 信長

織田信長が軍師として相談に乗る、ブラウザで動くAIアプリ（PWA）です。
スマホのホーム画面に追加すると、普通のアプリのように使えます。

- 会話：Claude（中身を考える → 信長の口調に直す、の2段階）
- 声：Fish Audio（中継経由）またはブラウザ内蔵の読み上げ
- 姿：声の大きさに合わせて口が動く

## ファイル構成

```
index.html             アプリ本体（画面・人格設定・会話・声）
manifest.webmanifest   アプリ化の設定（名前・アイコン）
sw.js                  起動を速くする仕組み（Service Worker）
icons/                 アイコン画像
proxy/                 Fish Audio の中継（どちらか一方を使う）
  fish-proxy-worker.js   Cloudflare Worker 版（おすすめ）
  fish-proxy-gas.gs      Google Apps Script 版
```

## 公開のしかた（GitHub Pages）

1. リポジトリの Settings → Pages
2. Source：Deploy from a branch ／ Branch：`main`・`/ (root)` → Save
3. 数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/` で開けるようになる

## 使い始め

1. 上のURLをスマホの Safari / Chrome で開く
2. 設定画面に Claude の APIキーを入れる
3. 声を Fish Audio にする場合は、`proxy/` の手順で中継を作り、中継URLと声のIDを入れる
4. 共有ボタン →「ホーム画面に追加」

## 安全について

- APIキーはコードに含めていません。各端末のブラウザ内にだけ保存されます。
- Fish Audio の APIキーは中継（Cloudflare / GAS）側にだけ置きます。
- 家族向けの試作版です。Claude Console で月の利用上限を設定しておくと安心です。

## 更新するとき

`index.html` などを直したら、`sw.js` の `VERSION` の数字を上げてください（例：`v1` → `v2`）。
各端末で次に開いたときに新しい版へ切り替わります。
