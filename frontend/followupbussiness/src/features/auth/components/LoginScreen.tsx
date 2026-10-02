import { BrandPanel } from "./BrandPanel";
import { LoginForm } from "./LoginForm";
import { ThemeToggle } from "../../../shared/theme/ThemeToggle";
import "../styles/login.css";

export function LoginScreen() {
  return (
    <main className="login-golden">
      <BrandPanel />
      <LoginForm />
      <ThemeToggle className="login-golden__theme-toggle" />
    </main>
  );
}
