"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SupabaseStatus } from "@/components/SupabaseStatus";

type Championship = {
  id: string;
  name: string;
  venue: string;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
};

type Registration = {
  id: string;
  championship_id: string;
  fighter_id: string;
  age_category_id: string;
  weight_category_id: string;
  status: string;
  gender: string;
  weight_kg: number;
  profiles?: { full_name: string };
  age_categories?: { name: string };
  weight_categories?: { name: string };
};

type Match = {
  id: string;
  match_number: number;
  round_name: string;
  fighter_a_id: string;
  fighter_b_id: string;
  winner_id: string;
  ring_number: string;
  status: string;
  scheduled_at: string;
  fighter_a?: { full_name: string };
  fighter_b?: { full_name: string };
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"championships" | "registrations" | "matches">("championships");

  // Database Data States
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [ageCategories, setAgeCategories] = useState<any[]>([]);
  const [weightCategories, setWeightCategories] = useState<any[]>([]);

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form States - Championships
  const [newChampName, setNewChampName] = useState("");
  const [newChampVenue, setNewChampVenue] = useState("");

  // Form States - Age/Weight Categories
  const [selectedChampId, setSelectedChampId] = useState("");
  const [newAgeName, setNewAgeName] = useState("");
  const [minAge, setMinAge] = useState(10);
  const [maxAge, setMaxAge] = useState(18);

  const [newWeightName, setNewWeightName] = useState("");
  const [weightGender, setWeightGender] = useState("male");
  const [minWeight, setMinWeight] = useState(50);
  const [maxWeight, setMaxWeight] = useState(60);

  // Fetch initial records
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch Championships
        const { data: champs } = await supabase
          .from("championships")
          .select("*")
          .order("created_at", { ascending: false });
        setChampionships(champs || []);
        if (champs && champs.length > 0 && !selectedChampId) {
          setSelectedChampId(champs[0].id);
        }

        // Fetch Registrations
        const { data: regs } = await supabase
          .from("registrations")
          .select(`
            id,
            championship_id,
            fighter_id,
            age_category_id,
            weight_category_id,
            status,
            gender,
            weight_kg,
            profiles:fighter_id (full_name),
            age_categories:age_category_id (name),
            weight_categories:weight_category_id (name)
          `)
          .order("submitted_at", { ascending: false });
        setRegistrations((regs as any) || []);

        // Fetch Matches
        const { data: mtch } = await supabase
          .from("matches")
          .select(`
            id,
            match_number,
            round_name,
            fighter_a_id,
            fighter_b_id,
            winner_id,
            ring_number,
            status,
            scheduled_at,
            fighter_a:fighter_a_id (full_name),
            fighter_b:fighter_b_id (full_name)
          `)
          .order("match_number", { ascending: true });
        setMatches((mtch as any) || []);

        // Fetch Existing Categories
        const { data: ageCats } = await supabase.from("age_categories").select("*");
        setAgeCategories(ageCats || []);

        const { data: weightCats } = await supabase.from("weight_categories").select("*");
        setWeightCategories(weightCats || []);

      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshKey]);

  // Create Championship Handler
  async function handleCreateChampionship(e: React.FormEvent) {
    e.preventDefault();
    if (!newChampName || !newChampVenue) return;

    try {
      const { data, error } = await supabase
        .from("championships")
        .insert([
          {
            name: newChampName,
            venue: newChampVenue,
            status: "active",
            start_date: new Date().toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0]
          }
        ])
        .select();

      if (error) throw error;
      alert("Championship created successfully!");
      setNewChampName("");
      setNewChampVenue("");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Create Age Category Handler
  async function handleCreateAgeCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChampId || !newAgeName) return;

    try {
      const { error } = await supabase.from("age_categories").insert([
        {
          championship_id: selectedChampId,
          name: newAgeName,
          min_age: Number(minAge),
          max_age: Number(maxAge)
        }
      ]);

      if (error) throw error;
      alert("Age Category added!");
      setNewAgeName("");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Create Weight Category Handler
  async function handleCreateWeightCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChampId || !newWeightName) return;

    try {
      const { error } = await supabase.from("weight_categories").insert([
        {
          championship_id: selectedChampId,
          gender: weightGender,
          name: newWeightName,
          min_weight: Number(minWeight),
          max_weight: Number(maxWeight)
        }
      ]);

      if (error) throw error;
      alert("Weight Category added!");
      setNewWeightName("");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Update Registration Status Handler (Approve / Reject)
  async function handleUpdateRegStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Automated Bracket Generator
  async function handleGenerateBrackets() {
    if (!selectedChampId) {
      alert("Select a championship first.");
      return;
    }

    try {
      // Find all approved fighters for the selected championship
      const approvedRegs = registrations.filter(
        (r) => r.championship_id === selectedChampId && r.status === "approved"
      );

      if (approvedRegs.length < 2) {
        alert("At least 2 approved registrations are required to generate brackets!");
        return;
      }

      // Group fighters by age_category + weight_category + gender
      const groups: { [key: string]: Registration[] } = {};
      approvedRegs.forEach((reg) => {
        const key = `${reg.age_category_id}-${reg.weight_category_id}-${reg.gender}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(reg);
      });

      let globalMatchCounter = 1;
      const matchesToInsert: any[] = [];

      // Loop through each group to seed the tournament tree structure
      for (const key in groups) {
        const groupFighters = groups[key];
        const numFighters = groupFighters.length;
        if (numFighters < 2) continue;

        // Calculate next power of 2 for tree structure slots
        let P = 2;
        while (P < numFighters) {
          P *= 2;
        }

        const firstRoundSize = P / 2;

        // Pre-generate matches for this group (from first round down to final)
        const groupMatches: any[] = [];
        let currentRoundSize = firstRoundSize;
        while (currentRoundSize >= 1) {
          let roundName = "Final";
          if (currentRoundSize === 2) roundName = "Semi Final";
          else if (currentRoundSize === 4) roundName = "Quarter Final";
          else if (currentRoundSize === 8) roundName = "Round of 16";
          else if (currentRoundSize > 8) roundName = `Round of ${currentRoundSize * 2}`;

          for (let m = 0; m < currentRoundSize; m++) {
            groupMatches.push({
              championship_id: selectedChampId,
              match_number: -1, // Assigned sequentially later
              round_name: roundName,
              fighter_a_id: null,
              fighter_b_id: null,
              winner_id: null,
              status: "scheduled",
              ring_number: `Ring ${(globalMatchCounter % 2) + 1}`,
              scheduled_at: new Date(Date.now() + globalMatchCounter * 20 * 60000).toISOString()
            });
          }
          currentRoundSize = Math.floor(currentRoundSize / 2);
        }

        // Seed fighters into the first round matches
        for (let i = 0; i < numFighters; i++) {
          const matchIndex = Math.floor(i / 2);
          if (i % 2 === 0) {
            groupMatches[matchIndex].fighter_a_id = groupFighters[i].fighter_id;
          } else {
            groupMatches[matchIndex].fighter_b_id = groupFighters[i].fighter_id;
          }
        }

        // Handle byes in the first round (if fighter_a is present but no fighter_b)
        for (let m = 0; m < firstRoundSize; m++) {
          if (groupMatches[m].fighter_a_id && !groupMatches[m].fighter_b_id) {
            groupMatches[m].winner_id = groupMatches[m].fighter_a_id;
            groupMatches[m].status = "completed";
          }
        }

        // Auto-propagate byes into the subsequent rounds
        for (let idx = 0; idx < groupMatches.length; idx++) {
          const currentM = groupMatches[idx];
          if (currentM.status === "completed" && currentM.winner_id) {
            let nextIndex = -1;
            let isFighterA = true;

            if (groupMatches.length === 3) {
              if (idx === 0) { nextIndex = 2; isFighterA = true; }
              else if (idx === 1) { nextIndex = 2; isFighterA = false; }
            } else if (groupMatches.length === 7) {
              if (idx === 0) { nextIndex = 4; isFighterA = true; }
              else if (idx === 1) { nextIndex = 4; isFighterA = false; }
              else if (idx === 2) { nextIndex = 5; isFighterA = true; }
              else if (idx === 3) { nextIndex = 5; isFighterA = false; }
              else if (idx === 4) { nextIndex = 6; isFighterA = true; }
              else if (idx === 5) { nextIndex = 6; isFighterA = false; }
            } else if (groupMatches.length === 15) {
              if (idx < 8) {
                nextIndex = 8 + Math.floor(idx / 2);
                isFighterA = idx % 2 === 0;
              } else if (idx < 12) {
                nextIndex = 12 + Math.floor((idx - 8) / 2);
                isFighterA = (idx - 8) % 2 === 0;
              } else if (idx < 14) {
                nextIndex = 14;
                isFighterA = idx === 12;
              }
            }

            if (nextIndex !== -1 && nextIndex < groupMatches.length) {
              if (isFighterA) {
                groupMatches[nextIndex].fighter_a_id = currentM.winner_id;
              } else {
                groupMatches[nextIndex].fighter_b_id = currentM.winner_id;
              }
            }
          }
        }

        // Assign global match numbers
        groupMatches.forEach((m) => {
          m.match_number = globalMatchCounter++;
          matchesToInsert.push(m);
        });
      }

      if (matchesToInsert.length === 0) {
        alert("Not enough fighters in the same age/weight groups to seed brackets.");
        return;
      }

      // Clear previous matches for clean generation
      await supabase.from("matches").delete().eq("championship_id", selectedChampId);

      // Insert new matches
      const { error } = await supabase.from("matches").insert(matchesToInsert);
      if (error) throw error;

      alert(`Brackets generated successfully! Created ${matchesToInsert.length} matches.`);
      setRefreshKey((prev) => prev + 1);

    } catch (err: any) {
      alert("Error generating brackets: " + err.message);
    }
  }

  // Record Winner score Desk
  async function handleRecordWinner(matchId: string, winnerId: string) {
    if (!winnerId) return;
    try {
      // 1. Update the current match as completed with the winner
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          winner_id: winnerId,
          status: "completed"
        })
        .eq("id", matchId);

      if (updateError) throw updateError;

      // 2. Fetch current match details to propagate the winner
      const { data: currentMatch, error: fetchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (fetchError || !currentMatch) throw fetchError || new Error("Match not found");

      // 3. Fetch all sibling matches of the same championship to trace progression
      const { data: siblingMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("championship_id", currentMatch.championship_id)
        .order("match_number", { ascending: true });

      if (siblingMatches && siblingMatches.length > 0) {
        const currentIndex = siblingMatches.findIndex((m) => m.id === matchId);
        if (currentIndex !== -1) {
          let nextIndex = -1;
          let isFighterA = true;

          if (siblingMatches.length === 3) {
            if (currentIndex === 0) { nextIndex = 2; isFighterA = true; }
            else if (currentIndex === 1) { nextIndex = 2; isFighterA = false; }
          } else if (siblingMatches.length === 7) {
            if (currentIndex === 0) { nextIndex = 4; isFighterA = true; }
            else if (currentIndex === 1) { nextIndex = 4; isFighterA = false; }
            else if (currentIndex === 2) { nextIndex = 5; isFighterA = true; }
            else if (currentIndex === 3) { nextIndex = 5; isFighterA = false; }
            else if (currentIndex === 4) { nextIndex = 6; isFighterA = true; }
            else if (currentIndex === 5) { nextIndex = 6; isFighterA = false; }
          } else if (siblingMatches.length === 15) {
            if (currentIndex < 8) {
              nextIndex = 8 + Math.floor(currentIndex / 2);
              isFighterA = currentIndex % 2 === 0;
            } else if (currentIndex < 12) {
              nextIndex = 12 + Math.floor((currentIndex - 8) / 2);
              isFighterA = (currentIndex - 8) % 2 === 0;
            } else if (currentIndex < 14) {
              nextIndex = 14;
              isFighterA = currentIndex === 12;
            }
          }

          if (nextIndex !== -1 && nextIndex < siblingMatches.length) {
            const nextMatch = siblingMatches[nextIndex];
            const updatePayload = isFighterA
              ? { fighter_a_id: winnerId }
              : { fighter_b_id: winnerId };

            const { error: nextError } = await supabase
              .from("matches")
              .update(updatePayload)
              .eq("id", nextMatch.id);

            if (nextError) console.error("Error propagating winner:", nextError);
          }
        }
      }

      alert("Winner recorded and bracket updated!");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Helpers to handle single / array profile fields
  function getFighterName(profileField: any) {
    if (!profileField) return "Unknown Fighter";
    if (Array.isArray(profileField)) return profileField[0]?.full_name || "Unknown Fighter";
    return profileField.full_name || "Unknown Fighter";
  }

  function getCategoryName(categoryField: any) {
    if (!categoryField) return "N/A";
    if (Array.isArray(categoryField)) return categoryField[0]?.name || "N/A";
    return categoryField.name || "N/A";
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brandMark">K</span>
          <div>
            <strong>Kickbox Admin</strong>
            <small>Championship control</small>
          </div>
        </div>

        <nav className="navList">
          <a href="/" className="navList a">← Main Site</a>
          <button
            className={activeTab === "championships" ? "active" : ""}
            onClick={() => setActiveTab("championships")}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Championships
          </button>
          <button
            className={activeTab === "registrations" ? "active" : ""}
            onClick={() => setActiveTab("registrations")}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Fighter Registry
          </button>
          <button
            className={activeTab === "matches" ? "active" : ""}
            onClick={() => setActiveTab("matches")}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Match Control
          </button>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Tournament Control Desk</p>
            <h1>Kickboxing Admin Operations</h1>
          </div>
          <div className="actions">
            <button className="dark" type="button" onClick={handleGenerateBrackets}>
              Auto Generate Brackets
            </button>
          </div>
        </header>

        <SupabaseStatus key={refreshKey} />

        {/* Tab 1: Manage Championships & Categories */}
        {activeTab === "championships" && (
          <section className="grid">
            <article className="panel" style={{ padding: '24px' }}>
              <h2>Create New Championship</h2>
              <form onSubmit={handleCreateChampionship} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Name</label>
                  <input
                    type="text"
                    placeholder="E.g., Delhi Kickboxing State Championship 2026"
                    value={newChampName}
                    onChange={(e) => setNewChampName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--line)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Venue</label>
                  <input
                    type="text"
                    placeholder="E.g., Talkatora Stadium, Ring B"
                    value={newChampVenue}
                    onChange={(e) => setNewChampVenue(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--line)' }}
                    required
                  />
                </div>
                <button type="submit" className="dark" style={{ marginTop: '8px' }}>Create Tournament</button>
              </form>
            </article>

            <article className="panel" style={{ padding: '24px' }}>
              <h2>Configure Tournament Categories</h2>
              <div style={{ marginTop: '16px', display: 'grid', gap: '24px' }}>
                {/* Select Champ */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Target Tournament</label>
                  <select
                    value={selectedChampId}
                    onChange={(e) => setSelectedChampId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--line)' }}
                  >
                    {championships.map((champ) => (
                      <option key={champ.id} value={champ.id}>{champ.name}</option>
                    ))}
                  </select>
                </div>

                {/* Create Age Category */}
                <form onSubmit={handleCreateAgeCategory} style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Add Age Division</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Junior, Youth, Senior"
                      value={newAgeName}
                      onChange={(e) => setNewAgeName(e.target.value)}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Min Age"
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value))}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Max Age"
                      value={maxAge}
                      onChange={(e) => setMaxAge(Number(e.target.value))}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                    />
                  </div>
                  <button type="submit" style={{ marginTop: '10px', fontSize: '12px' }}>Add Age Division</button>
                </form>

                {/* Create Weight Category */}
                <form onSubmit={handleCreateWeightCategory} style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Add Weight Bracket</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="e.g. 50-55 KG"
                      value={newWeightName}
                      onChange={(e) => setNewWeightName(e.target.value)}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                      required
                    />
                    <select
                      value={weightGender}
                      onChange={(e) => setWeightGender(e.target.value)}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="agnostic">Mixed</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Min kg"
                      value={minWeight}
                      onChange={(e) => setMinWeight(Number(e.target.value))}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Max kg"
                      value={maxWeight}
                      onChange={(e) => setMaxWeight(Number(e.target.value))}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                      required
                    />
                  </div>
                  <button type="submit" style={{ marginTop: '10px', fontSize: '12px' }}>Add Weight Bracket</button>
                </form>
              </div>
            </article>
          </section>
        )}

        {/* Tab 2: Fighter Approvals Registry */}
        {activeTab === "registrations" && (
          <section className="grid">
            <article className="panel wide" style={{ padding: '24px' }}>
              <h2>Fighter Registration Desk</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
                Approve registrations to make them available for tournament bracket seeding.
              </p>

              <div className="table" style={{ display: 'grid', gap: '10px' }}>
                {registrations.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>
                    No fighter registrations in database.
                  </div>
                ) : (
                  registrations.map((reg) => (
                    <div
                      key={reg.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        background: 'var(--panel)'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '16px', display: 'block' }}>
                          {getFighterName(reg.profiles)}
                        </strong>
                        <small style={{ color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
                          Division: {getCategoryName(reg.age_categories)} | Bracket: {getCategoryName(reg.weight_categories)} | Weight: {reg.weight_kg}kg ({reg.gender})
                        </small>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`badge ${reg.status === 'pending' ? 'pending' : reg.status === 'rejected' ? 'review' : 'approved'}`}>
                          {reg.status}
                        </span>

                        {reg.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateRegStatus(reg.id, "approved")}
                            style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--green)', color: '#fff', border: 'none' }}
                          >
                            Approve
                          </button>
                        )}
                        {reg.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateRegStatus(reg.id, "rejected")}
                            style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--brand)', color: '#fff', border: 'none' }}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        )}

        {/* Tab 3: Matches & Winner Recording */}
        {activeTab === "matches" && (
          <section className="grid">
            <article className="panel wide" style={{ padding: '24px' }}>
              <h2>Ringside Scorekeeper Desk</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
                Select winners for live/scheduled matches. Recording a winner automatically changes the match status to Completed.
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                {matches.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>
                    No matches generated yet. Set up tournament groups, approve fighters, and click "Auto Generate Brackets"!
                  </div>
                ) : (
                  matches.map((match) => {
                    const fighterAName = getFighterName(match.fighter_a);
                    const fighterBName = getFighterName(match.fighter_b);
                    const winnerName = match.winner_id === match.fighter_a_id ? fighterAName : fighterBName;

                    return (
                      <div
                        key={match.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px',
                          border: '1px solid var(--line)',
                          borderRadius: '8px',
                          background: 'var(--panel)'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: '800', textTransform: 'uppercase' }}>
                            {match.round_name} - {match.ring_number}
                          </span>
                          <strong style={{ display: 'block', fontSize: '18px', margin: '4px 0' }}>
                            {fighterAName} <span style={{ color: 'var(--muted)', fontWeight: '400' }}>vs</span> {fighterBName}
                          </strong>
                          {match.status === "completed" ? (
                            <small style={{ color: 'var(--green)', fontWeight: '600' }}>
                              ✓ Completed - Winner: {winnerName}
                            </small>
                          ) : (
                            <small style={{ color: 'var(--gold)', fontWeight: '600' }}>
                              ⏰ Scheduled
                            </small>
                          )}
                        </div>

                        {match.status !== "completed" && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleRecordWinner(match.id, match.fighter_a_id)}
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                            >
                              {fighterAName} Wins
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRecordWinner(match.id, match.fighter_b_id)}
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                            >
                              {fighterBName} Wins
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          </section>
        )}
      </section>
    </main>
  );
}
