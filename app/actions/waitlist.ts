"use server";

import { getDb } from "@/lib/db/client";
import { waitlist } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function submitToWaitlist(data: {
  fullName: string;
  email: string;
  phone: string;
  services: string[];
  plan: string;
}) {
  try {
    const db = await getDb();
    
    // Check if they are already on the waitlist
    const existing = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, data.email));
      
    if (existing.length > 0) {
      return { success: true };
    }

    const interestString = `Plan: ${data.plan} | Services: ${data.services.join(", ")}`;

    // Insert new waitlist entry
    await db.insert(waitlist).values({
      email: data.email,
      name: data.fullName,
      interest: interestString.substring(0, 120), // respect varchar 120 limit
      status: "PENDING",
    });

    return { success: true };
  } catch (error) {
    console.error("Waitlist submission error:", error);
    return { success: false, error: "Failed to submit waitlist" };
  }
}
