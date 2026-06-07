import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guards";

export default async function RootPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }
  redirect("/auth/login");
}
