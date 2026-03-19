import { Suspense } from "react";
import ReceiptClient from "./receipt-client";

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-10">লোড হচ্ছে...</main>
      }>
      <ReceiptClient />
    </Suspense>
  );
}
