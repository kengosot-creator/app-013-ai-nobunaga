// ============================================================
//  AI信長 用 Fish Audio 中継（Google Apps Script 版）
//
//  Cloudflare Worker 版より声が出るまで少し遅いが、Googleアカウントだけで作れる。
//
//  ■ 設置手順
//   1. https://script.google.com で「新しいプロジェクト」→ このコードを貼り付けて保存
//   2. 左の歯車「プロジェクトの設定」→「スクリプト プロパティ」に追加
//        FISH_API_KEY … Fish Audio の APIキー（必須）
//        PASSCODE     … 合言葉（任意）
//   3. エディタ上部の関数で「testFish」を選んで実行 → 権限を許可（外部への接続の許可）
//      ※ testFish の VOICE_ID を自分の声のIDに書き換えてから実行
//   4. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
//        次のユーザーとして実行：自分 ／ アクセスできるユーザー：全員
//   5. 表示された URL（https://script.google.com/macros/s/.../exec）をアプリの「中継URL」に貼る
//   ※ コードを直したら「デプロイを管理」→ 編集 →「新バージョン」で更新すること
// ============================================================

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty("FISH_API_KEY");
  const passcode = props.getProperty("PASSCODE");
  if (!apiKey) return out_({ error: "中継側に FISH_API_KEY が設定されていません" });

  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return out_({ error: "送られてきたデータが読めません" }); }

  if (passcode && body.passcode !== passcode) return out_({ error: "合言葉が違います" });

  const text = String(body.text || "").slice(0, 1000);
  if (!text) return out_({ error: "読み上げる文章が空です" });
  if (!body.reference_id) return out_({ error: "声のIDが指定されていません" });

  const speed = Math.min(2, Math.max(0.5, Number(body.speed) || 1));
  const res = UrlFetchApp.fetch("https://api.fish.audio/v1/tts", {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
      model: body.model || "s2.1-pro-free",
    },
    payload: JSON.stringify({
      text: text,
      reference_id: body.reference_id,
      format: "mp3",
      latency: "normal",
      prosody: { speed: speed },
    }),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  if (code !== 200) {
    const hint = code === 401 ? "（Fish AudioのAPIキーが正しくない）" : code === 402 ? "（Fish Audioのクレジット不足）" : "";
    return out_({ error: "Fish Audio " + code + hint + ": " + res.getContentText().slice(0, 300) });
  }
  return out_({ audio: Utilities.base64Encode(res.getBlob().getBytes()), mime: "audio/mpeg" });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 権限許可と動作確認用（エディタから実行）
function testFish() {
  const VOICE_ID = "ここに声のID";
  const r = doPost({ postData: { contents: JSON.stringify({ text: "わしが信長じゃ。", reference_id: VOICE_ID }) } });
  const j = JSON.parse(r.getContent());
  Logger.log(j.error ? "エラー: " + j.error : "成功：音声データ " + j.audio.length + " 文字分");
}
