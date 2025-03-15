import { useState } from "react";
import { supabase } from "../lib/supabase"; // Supabaseクライアントのインポート
import bcrypt from "bcryptjs"; // bcryptjsのインポート

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // パスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(password, 10);  // 10はsaltのラウンド数

      // ユーザー登録
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: password,  // Supabaseのauthはパスワードをハッシュ化して保存する
      });

      if (signUpError) {
        throw signUpError;
      }

      // users テーブルに追加情報を保存
      const { data: insertData, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            email,
            username,
            password_hash: hashedPassword,  // ハッシュ化したパスワードを保存
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      console.log("User registered:", data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
