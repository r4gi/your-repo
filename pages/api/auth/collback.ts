import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { error } = await supabase.auth.exchangeCodeForSession(req.query.code as string);

  if (error) {
    console.error("Supabase Auth Error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.redirect("/home"); // 認証成功後のリダイレクト先
}
