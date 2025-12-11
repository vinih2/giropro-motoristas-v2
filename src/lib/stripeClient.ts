// src/lib/stripeClient.ts

export async function createCheckoutSession(accessToken: string) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error ?? "Failed to create checkout session");
  }

  return res.json();
}

export async function getCheckoutStatus(sessionId: string) {
  // Optional: create a GET /api/checkout route to retrieve session status
  const res = await fetch(`/api/checkout?session_id=${sessionId}`);
  if (!res.ok) {
    throw new Error("Failed to get checkout status");
  }
  return res.json();
}
