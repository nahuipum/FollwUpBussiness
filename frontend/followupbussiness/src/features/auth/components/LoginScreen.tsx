import { BrandPanel } from "./BrandPanel";
import { LoginForm } from "./LoginForm";
import "../styles/login.css";

export function LoginScreen() {
  return (
    <main className="login-golden">
      <BrandPanel />
      <LoginForm />
    </main>
  );
}
