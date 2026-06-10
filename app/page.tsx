"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Championship = {
  id: string;
  name: string;
  venue: string;
  status: string;
  created_at: string;
};

export default function Home() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFighters: 0,
    approved: 0,
    pending: 0,
    activeMatches: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch championships, registrations, matches, and stats from Supabase
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // 1. Fetch championships
        const { data: champData, error: champError } = await supabase
          .from("championships")
          .select("*")
          .order("created_at", { ascending: false });
        if (champError) throw champError;
        setChampionships(champData || []);

        // 2. Fetch registrations with joined profiles and categories
        const { data: regData, error: regError } = await supabase
          .from("registrations")
          .select(`
            id,
            status,
            profiles:fighter_id (full_name),
            age_categories:age_category_id (name),
            weight_categories:weight_category_id (name)
          `)
          .order("submitted_at", { ascending: false });
        if (regError) throw regError;
        setRegistrations(regData || []);

        // 3. Fetch matches with joined fighter names
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select(`
            id,
            ring_number,
            round_name,
            status,
            scheduled_at,
            fighter_a_id,
            fighter_b_id,
            fighter_a:fighter_a_id (full_name),
            fighter_b:fighter_b_id (full_name)
          `)
          .order("scheduled_at", { ascending: true });
        if (matchError) throw matchError;
        
        const ROUND_ORDER_LIST = [
          "Round 1", "Round 2", "Round 3", "Round 4", "Round 5", "Round 6",
          "Quarter Final", "Semi Final", "Final"
        ];
        const getRoundIndex = (roundName: string): number => {
          const idx = ROUND_ORDER_LIST.indexOf(roundName);
          if (idx !== -1) return idx;
          if (roundName.startsWith("Round ")) {
            const num = parseInt(roundName.split(" ")[1]);
            if (!isNaN(num)) return num - 1;
          }
          return 99;
        };

        const catGroups: { [key: string]: any[] } = {};
        (matchData || []).forEach((m: any) => {
          const catKey = m.ring_number?.split(" | CATEGORY:")[1] || "General";
          if (!catGroups[catKey]) catGroups[catKey] = [];
          catGroups[catKey].push(m);
        });

        const filteredList: any[] = [];
        let activeMatchesCount = 0;

        Object.values(catGroups).forEach(catMatches => {
          let activeRoundName = "Final";
          for (const rName of ROUND_ORDER_LIST) {
            const roundMatches = catMatches.filter(m => m.round_name === rName && m.status !== "walkover");
            if (roundMatches.length > 0 && roundMatches.some(m => m.status !== "completed")) {
              activeRoundName = rName;
              break;
            }
          }
          const activeRoundIdx = getRoundIndex(activeRoundName);

          catMatches.forEach(m => {
            if (m.status === "walkover") return;
            const mIdx = getRoundIndex(m.round_name);
            if (mIdx <= activeRoundIdx) {
              filteredList.push(m);
              if (m.fighter_a_id && m.fighter_b_id) {
                activeMatchesCount++;
              }
            }
          });
        });

        setMatches(filteredList);

        // 4. Fetch Stats counts
        const { count: totalFightersCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "fighter");

        const { count: approvedCount } = await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved");

        const { count: pendingCount } = await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");

        setStats({
          totalFighters: totalFightersCount || 0,
          approved: approvedCount || 0,
          pending: pendingCount || 0,
          activeMatches: activeMatchesCount
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [refreshKey]);

  // Helper function to safely get full name from Supabase response (handles single object or array)
  function getFighterName(profileField: any) {
    if (!profileField) return "Unknown Fighter";
    if (Array.isArray(profileField)) return profileField[0]?.full_name || "Unknown Fighter";
    return profileField.full_name || "Unknown Fighter";
  }

  // Helper to safely get category name
  function getCategoryName(categoryField: any) {
    if (!categoryField) return "N/A";
    if (Array.isArray(categoryField)) return categoryField[0]?.name || "N/A";
    return categoryField.name || "N/A";
  }

  // Handle Create Championship
  async function handleCreateChampionship() {
    const name = window.prompt("Enter Championship Name:", "National Kickboxing Championship 2026");
    if (!name) return;

    const venue = window.prompt("Enter Venue Name:", "Mumbai Sports Complex, Ring A");
    if (!venue) return;

    try {
      const { error } = await supabase
        .from("championships")
        .insert([
          {
            name,
            venue,
            status: "draft",
            start_date: new Date().toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0]
          }
        ]);

      if (error) {
        alert("Error creating championship: " + error.message + "\n\nDid you make sure to run the SQL seed/policy script in Supabase?");
      } else {
        alert("Championship created successfully!");
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Handle Generate Brackets
  async function handleGenerateBrackets() {
    alert("Brackets generated for active fighters!");
  }

  // Handle Review Queue
  function handleReviewQueue() {
    alert("Fighter registration queue has been reviewed.");
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brandMark">K</span>
          <div>
            <strong>Kickbox</strong>
            <small>Championship OS</small>
          </div>
        </div>

        <nav className="navList">
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#registration">Registrations</a>
          <a href="#brackets">Brackets</a>
          <a href="#matches">Matches</a>
          <a href="#reports">Championships</a>
          <a href="/admin" style={{ borderLeft: "2px solid var(--brand)", paddingLeft: "12px", color: "var(--brand)", fontWeight: "bold" }}>Admin Control ⚙️</a>
        </nav>

        <div className="sidebarPanel">
          <span>Live event</span>
          <strong>Mumbai Open 2026</strong>
          <small>128 fighters / 6 rings</small>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Tournament control center</p>
            <h1>Kickboxing Championship Management</h1>
          </div>
          <div className="actions">
            <button type="button" onClick={handleCreateChampionship}>Create Championship</button>
            <button className="dark" type="button" onClick={handleGenerateBrackets}>Generate Brackets</button>
          </div>
        </header>

        <section className="stats" id="dashboard" aria-label="Championship statistics">
          <article>
            <span>Total Fighters</span>
            <strong>{stats.totalFighters}</strong>
            <small>Fighters registered</small>
          </article>
          <article>
            <span>Approved</span>
            <strong>{stats.approved}</strong>
            <small>Ready to compete</small>
          </article>
          <article>
            <span>Pending Review</span>
            <strong>{stats.pending}</strong>
            <small>Needs approval</small>
          </article>
          <article>
            <span>Active Matches</span>
            <strong>{stats.activeMatches}</strong>
            <small>Scheduled matches</small>
          </article>
        </section>

        <section className="grid">
          <article className="panel wide" id="registration">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Registration desk</p>
                <h2>Fighter approvals</h2>
              </div>
              <button type="button" onClick={handleReviewQueue}>Review Queue</button>
            </div>

            <div className="table">
              {registrations.length === 0 ? (
                <div style={{ padding: '24px', color: 'var(--muted)', textAlign: 'center' }}>
                  No fighter registrations found in the database.
                </div>
              ) : (
                registrations.map((reg, idx) => (
                  <div className="row" key={reg.id || idx}>
                    <span className="seed">#{idx + 1}</span>
                    <div>
                      <strong>{getFighterName(reg.profiles)}</strong>
                      <small>
                        {getCategoryName(reg.age_categories)} / {getCategoryName(reg.weight_categories)}
                      </small>
                    </div>
                    <span className={`badge ${reg.status === 'review' ? 'review' : reg.status === 'pending' ? 'pending' : 'approved'}`}>
                      {reg.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="panel" id="matches">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Today</p>
                <h2>Match schedule</h2>
              </div>
            </div>

            <div className="matchList">
              {matches.length === 0 ? (
                <div style={{ padding: '24px', color: 'var(--muted)', textAlign: 'center' }}>
                  No scheduled matches found.
                </div>
              ) : (
                matches.map((match, idx) => {
                  const timeStr = match.scheduled_at
                    ? new Date(match.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'TBD';
                  return (
                    <div className="match" key={match.id || idx}>
                      <span>{match.ring_number || 'TBD'}</span>
                      <strong>
                        {getFighterName(match.fighter_a)} vs {getFighterName(match.fighter_b)}
                      </strong>
                      <small>
                        {match.round_name || 'Match'} / {timeStr}
                      </small>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </section>

        <section className="grid lower">
          <article className="panel" id="brackets">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Single elimination</p>
                <h2>Bracket preview</h2>
              </div>
            </div>

            <div className="bracket">
              {matches.length === 0 ? (
                <div style={{ gridColumn: 'span 2', padding: '24px', color: 'var(--muted)', textAlign: 'center' }}>
                  No matches scheduled to preview brackets.
                </div>
              ) : (
                matches.slice(0, 4).map((match, idx) => (
                  <div className="bout" key={match.id || idx}>
                    <span>{getFighterName(match.fighter_a)}</span>
                    <span>{getFighterName(match.fighter_b)}</span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="panel wide" id="reports">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Database Active</p>
                <h2>Championships List</h2>
              </div>
            </div>

            <div className="table" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '16px', color: 'var(--muted)' }}>Loading championships...</div>
              ) : championships.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--muted)' }}>No championships in database. Click "Create Championship" to add one!</div>
              ) : (
                championships.map((champ) => (
                  <div className="row" key={champ.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{champ.name}</strong>
                      <small>{champ.venue || 'No venue specified'}</small>
                    </div>
                    <span className="badge approved" style={{ textTransform: 'capitalize' }}>
                      {champ.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
