import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete in order respecting foreign key constraints:
    // 1. matches (references profiles, championships)
    // 2. registrations (references profiles, championships, age_categories, weight_categories)
    // 3. weight_categories (references championships)
    // 4. age_categories (references championships)
    // 5. championships (references profiles)
    // 6. profiles (references auth.users - we keep profiles intact since they're auth-linked)

    const tables = [
      "matches",
      "registrations",
      "weight_categories",
      "age_categories",
      "championships",
    ];

    const results: { table: string; status: string; count?: number }[] = [];

    for (const table of tables) {
      // Use neq on a non-nullable field to select all rows
      const { error, count } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // matches all real rows

      if (error) {
        results.push({ table, status: `error: ${error.message}` });
      } else {
        results.push({ table, status: "cleared", count: count ?? 0 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "All data cleared successfully",
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
