import { redirect } from "next/navigation";

export const metadata = {
  title: "GDPR · Vello",
};

/** Păstrăm URL-ul /gdpr pentru linkuri vechi; conținutul GDPR este în Politica de confidențialitate. */
export default function GdprPage() {
  redirect("/privacy");
}
