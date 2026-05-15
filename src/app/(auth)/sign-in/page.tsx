import Link from "next/link";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Войти — DrawLink" };

export default function SignInPage() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg">
          С возвращением
        </h1>
        <p className="text-sm text-fg-secondary">
          Нет аккаунта?{" "}
          <Link href="/sign-up" className="font-medium text-brand hover:underline">
            Регистрация
          </Link>
        </p>
      </div>

      <SignInForm />
    </div>
  );
}
