// ============================================================
//  AI信長 用 Fish Audio 中継（Cloudflare Worker 版）
//
//  Fish Audio の API はブラウザから直接呼べないため、この中継を挟む。
//  Fish Audio の APIキーはここ（Cloudflare 側）にだけ置くので、
//  家族の端末に Fish Audio のキーを配る必要はない。
//
//  ■ 設置手順
//   1. https://dash.cloudflare.com に無料登録してログイン
//   2. 「Workers & Pages」→「作成」→「Hello World から始める」→ 名前を付けて「デプロイ」
//   3. 「コードを編集」を開き、中身を全部消してこのファイルを貼り付け →「デプロイ」
//   4. Worker の「設定」→「変数とシークレット」で次を追加（種類は「シークレット」）
//        FISH_API_KEY … Fish Audio の APIキー（必須）
//        PASSCODE     … 合言葉（任意。設定するとアプリ側にも同じ合言葉が必要になる）
//   5. 表示される URL（https://〇〇.〇〇.workers.dev）を、アプリの設定「中継URL」に貼る
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method !== "POST") return json({ error: "POSTのみ受け付けます" }, 405);
    if (!env.FISH_API_KEY) return json({ error: "中継側に FISH_API_KEY が設定されていません" }, 500);

    let body;
    try { body = JSON.parse(await req.text()); }
    catch { return json({ error: "送られてきたデータが読めません" }, 400); }

    if (env.PASSCODE && body.passcode !== env.PASSCODE) {
      return json({ error: "合言葉が違います" }, 401);
    }

    const text = String(body.text || "").slice(0, 1000);
    if (!text) return json({ error: "読み上げる文章が空です" }, 400);
    if (!body.reference_id) return json({ error: "声のIDが指定されていません" }, 400);

    const speed = Math.min(2, Math.max(0.5, Number(body.speed) || 1));

    const r = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.FISH_API_KEY}`,
        "Content-Type": "application/json",
        model: body.model || "s2.1-pro-free",
      },
      body: JSON.stringify({
        text,
        reference_id: body.reference_id,
        format: "mp3",
        latency: "normal",
        prosody: { speed },
      }),
    });

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      const hint =
        r.status === 401 ? "（Fish AudioのAPIキーが正しくない）" :
        r.status === 402 ? "（Fish Audioのクレジット不足）" : "";
      return json({ error: `Fish Audio ${r.status}${hint}: ${detail}` }, r.status);
    }

    return new Response(r.body, { headers: { ...CORS, "Content-Type": "audio/mpeg" } });
  },
};
