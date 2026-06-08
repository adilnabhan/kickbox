"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ConnectionState = {
  label: string;
  detail: string;
  tone: "ok" | "warn" | "error";
};

export function SupabaseStatus() {
  const [state, setState] = useState<ConnectionState>({
    label: "Checking Supabase",
    detail: "Connecting to your project database...",
    tone: "warn"
  });

  useEffect(() => {
    let mounted = true;

    async function checkConnection() {
      const { count, error } = await supabase
        .from("championships")
        .select("id", { count: "exact", head: true });

      if (!mounted) {
        return;
      }

      if (error) {
        setState({
          label: "Supabase needs schema",
          detail: "Run supabase/schema.sql in your Supabase SQL editor.",
          tone: "error"
        });
        return;
      }

      setState({
        label: "Supabase connected",
        detail: `${count ?? 0} championships available in your database.`,
        tone: "ok"
      });
    }

    checkConnection();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={`connection ${state.tone}`}>
      <span>{state.label}</span>
      <strong>{state.detail}</strong>
    </div>
  );
}

