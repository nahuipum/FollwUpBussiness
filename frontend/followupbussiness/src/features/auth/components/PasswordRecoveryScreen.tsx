import { PasswordRecoveryRoute } from "./PasswordRecoveryRoute";
import "../styles/login.css";
import "../styles/password-recovery.css";

type PasswordRecoveryScreenProps = {
  route: "request" | "confirmation" | "reset" | "success";
  token: string | null;
};
export function PasswordRecoveryScreen({
  route,
  token,
}: PasswordRecoveryScreenProps) {
  return <PasswordRecoveryRoute route={route} token={token} />;
}
