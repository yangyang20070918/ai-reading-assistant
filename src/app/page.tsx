import { auth } from "@/lib/auth";
import { LoginPage } from "@/components/login-page";
import { Dashboard } from "@/components/dashboard";

const IS_DEMO = !process.env.GOOGLE_CLIENT_ID;

export default async function Home() {
  if (IS_DEMO) {
    return <Dashboard userName="Demo User" />;
  }

  const session = await auth();

  if (!session) {
    return <LoginPage />;
  }

  return <Dashboard userName={session.user?.name ?? "User"} />;
}
