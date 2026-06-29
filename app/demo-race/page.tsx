import { redirect } from "next/navigation";

export default function DemoRacePage() {
  redirect("/?menu=recommended");
}
