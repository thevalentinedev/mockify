import { redirect } from "next/navigation";

/** Admin prepare flow moved server-side — redirect old URL */
export default function ImportPage() {
  redirect("/");
}
