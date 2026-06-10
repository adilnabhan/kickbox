"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import { generateMatchPDF, classifyFighterLocal, WAK1F_AGE_CATEGORIES, MatchData, formatDivisionKey } from "@/lib/api";

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
  profiles?: { id: string; full_name: string };
  age_categories?: { name: string };
  weight_categories?: { name: string };
};

type Match = {
  id: string;
  championship_id?: string;
  match_number: number;
  round_name: string;
  fighter_a_id: string;
  fighter_b_id: string;
  winner_id: string;
  ring_number: string;
  status: string;
  scheduled_at: string;
  fighter_a?: { id: string; full_name: string };
  fighter_b?: { id: string; full_name: string };
};

const FIGHTER_AVATARS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAF2diGzVgl-pM3cP24Lf8B9eMqXA3PidNJQfi1NKOunrE0KVj1RHa51hI_urTHXZ5f-xc7-PO-_j4Kutks9Udg4V06zyjpSlZD4ojg6p8XDKJMtrNZHfVHgCjrNq5nCsbkeSPFvFZcO-PaTap5n4fBtwwwFhl0jft7JXLb1ZMlr5b8f44iJXIpuIKXcF60OARF1jKGFbFt1FfuiMqb4QoZjEUF1e6c9ErUCWyhj6mkQHNaQt-K1-allYFjL-LxmHXjPLx6oZwI8qU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC6bWsplsCS4UGHKpWKXJQq1KUUcsRLGlsHWrNNpbcvcEHmpMgcMyerGtpH1q795l6r93sl7Q-hglKFhw9858luobS5J0v6ICQzQwSBOftWQ0HH3dKXsJf1k5_riRbAjSsPNLNPMNaQQBGufC9eZ6-dxFUAhFtH-UfimkMGciNDqEgF9Xvl8d4D8vNE6tNVkm8FRLb_gaTpx2vpKEQAkDJ_maaS3YhbJfKdY4C83waltnmQlzbEbKhHQ5uHJRQTyIDUzlUr-MFbVOA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBilR6AEOw6XI8chnAMPSMR4jr3Xd_qoC-cuT1Ypyjem3H8Eeen0rNEZQrPc4wEujigNoTiiJkWp1kWGBTyx1WQmzZSRPfzahm5KEZ5tDBqAqUMhRuWhbNGEKo_E5zw_IeRhPlTRmmGoiDWVDGtcMwjUghcpzQYr5JWuOIHOvAU1-kMBLwYHfosXM9jHJiiJR8_w8n7p_23LG-Bg-j1qUq-ifF5t9-dsN71NBahfmgHpj7YaW3fXnqwivC01KxF1gnxF4Dn4k_W4Mw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB-FYCUvmvqyziBU2PNnYw1BCT7T5zH3OZqclNUEzg528e0Zrv8-H133pDEfIkXUC5kWSMSgk8zdBEN9GBJyYWgZ93s02msQ89DnQ0z5ejUXMGgIgWst6WTZt91Q_hwcyq82OSKl5BWjPSHmIVkgkxZdBoHV7b_WFVhaWAznaQ_XD9OFSf6UbxuY1oY_ZMix7sL4ITr0jIR-Srj2_CQsQcgZV40fFofo_dX0bRDv7U73HjoOWOY_CJ-ptUEMNihJEDyHBt8Jq5AA5o",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBb-ts7h7gBVrFDUtXrKM40kI6nUNEzyE9VVzzv17ZDFH2QGmuPM8ga_jQsSutlQXJBkOxy0msp1Due2dDcCTBdRc4_KjW9qBbkaMiXZknZuixm4dlynFMHXI5nQpFSLsCEg5BPx1hlyzYhDErwiVlLuFec3_wHhPvLxMYFxIw-BJ2v5_8zoOnDCTc1Ztkiuoaen0Fzd7d1QYg9YIqcAVkgBE5a4LZgEGp803BcrM6AijsRXs1KRA7X0b3E869-QtYAzTuIgIgfIZ4",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCoDCjf1i6_is5zHeJZkoAT98S8ow6v0YaUx49wY90BJV9kOsKtuOIu5hJ3WyfFjSzqnGx7zvXKxSu_gmomgURy-q2DnDvMHBL-O8abmK9RXTrlc_RR07Hk7FazHz-4MasFYyevJxia6-zlizBMQRMjURKGDVPAw1PhVBrTqCw4ohKunK41r1qlu7eeEkbmxXjaFJxa_1i4wzGr0ZDebMbqnb-aeR1o3uPeqbzZMew3Uw5qgprCRej5SYMLPseWm24NiQD4cjZglbc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5eGh9U5Q8jFks0r9WyH0TWqxA2wnGfGjXIKThz_s165Csu3bjvidgt7OOfyb8I6OwpaDAdq_uvzwneTqQ8-j9y2hxaPPPc5G753ncRqIeC74nCSjZq6Ag6xDBKcuBW_bLSmEaUYVW1nlnfrVnCddgsuKAUXsC4eKxqLlw79v6iV_uscTxP2SENN53kvgTTn5dJ52k4GhqoRAWb1CSpxQOk4s9QO4G1pBlCXaXHXaT94ZUG1yVOi890NrksR6Z5jVuDcpplphppnA"
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"championships" | "registrations" | "matches">("championships");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedMatchCategory, setSelectedMatchCategory] = useState<string>("all");
  const [selectedMatchAge, setSelectedMatchAge] = useState<string>("all");
  const [selectedMatchGender, setSelectedMatchGender] = useState<string>("all");
  const [selectedMatchWeight, setSelectedMatchWeight] = useState<string>("all");
  const [matchViewMode, setMatchViewMode] = useState<"list" | "bracket">("bracket");

  // Helper to dynamically resolve readable labels for category keys
  function getDivisionLabel(catKey: string): string {
    if (!catKey) return "General";
    
    // Find registration with this category key
    const reg = registrations.find(r => 
      `${r.age_category_id}-${r.weight_category_id}-${r.gender.toLowerCase()}` === catKey.toLowerCase()
    );
    
    if (reg) {
      const ageLabel = reg.age_categories?.name || reg.age_category_id;
      const weightLabel = reg.weight_categories?.name || reg.weight_category_id;
      const genderLabel = reg.gender.toLowerCase() === "male" || reg.gender.toLowerCase() === "m" ? "Male" : "Female";
      return `${genderLabel.toUpperCase()} · ${ageLabel.toUpperCase()} · ${weightLabel.toUpperCase()}`;
    }
    
    // Fallback if not found or formatted differently
    return formatDivisionKey(catKey);
  }

  // Database Data States
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [ageCategories, setAgeCategories] = useState<any[]>([]);
  const [weightCategories, setWeightCategories] = useState<any[]>([]);

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // XLSX Upload States
  const [xlsxPreview, setXlsxPreview] = useState<any[]>([]);
  const [xlsxFileName, setXlsxFileName] = useState("");
  const [xlsxImporting, setXlsxImporting] = useState(false);

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

  // Check if Supabase is connected
  useEffect(() => {
    const savedMode = localStorage.getItem("kickbox_use_demo");
    if (savedMode === "true") {
      setIsDemoMode(true);
      return;
    } else if (savedMode === "false") {
      setIsDemoMode(false);
      return;
    }

    async function checkSupabase() {
      try {
        const { error } = await supabase
          .from("championships")
          .select("id")
          .limit(1);
        
        if (error || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
          console.warn("Supabase not connected. Switching to Demo Mode.");
          setIsDemoMode(true);
        } else {
          setIsDemoMode(false);
        }
      } catch (e) {
        console.warn("Supabase not connected. Switching to Demo Mode.");
        setIsDemoMode(true);
      }
    }
    checkSupabase();
  }, [refreshKey]);

  function fetchLocalData() {
    // Championships
    let localChamps = JSON.parse(localStorage.getItem("kickbox_championships") || "[]");
    if (localChamps.length === 0) {
      const defaultChamp = {
        id: "demo-championship-id",
        name: "WAK-1F National Championship 2026",
        venue: "Talkatora Indoor Stadium, New Delhi",
        status: "active",
        created_at: new Date().toISOString()
      };
      localChamps = [defaultChamp];
      localStorage.setItem("kickbox_championships", JSON.stringify(localChamps));
    }
    setChampionships(localChamps);
    if (localChamps.length > 0 && !selectedChampId) {
      setSelectedChampId(localChamps[0].id);
    }

    // Age & Weight categories
    const localAgeCats = JSON.parse(localStorage.getItem("kickbox_age_categories") || "[]");
    setAgeCategories(localAgeCats);

    const localWeightCats = JSON.parse(localStorage.getItem("kickbox_weight_categories") || "[]");
    setWeightCategories(localWeightCats);

    // Registrations
    const localRegs = JSON.parse(localStorage.getItem("kickbox_registrations") || "[]");
    setRegistrations(localRegs);

    // Matches
    const localMatches = JSON.parse(localStorage.getItem("kickbox_matches") || "[]");
    setMatches(localMatches);
  }

  // Fetch initial records
  useEffect(() => {
    let active = true;

    if (isDemoMode) {
      fetchLocalData();
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);

        // Fetch Championships
        const { data: champs } = await supabase
          .from("championships")
          .select("*")
          .order("created_at", { ascending: false });
        if (!active) return;
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
            profiles:fighter_id (id, full_name),
            age_categories:age_category_id (name),
            weight_categories:weight_category_id (name)
          `)
          .order("submitted_at", { ascending: false });
        if (!active) return;
        setRegistrations((regs as any) || []);

        // Fetch Matches
        const { data: mtch } = await supabase
          .from("matches")
          .select(`
            id,
            championship_id,
            match_number,
            round_name,
            fighter_a_id,
            fighter_b_id,
            winner_id,
            ring_number,
            status,
            scheduled_at,
            fighter_a:fighter_a_id (id, full_name),
            fighter_b:fighter_b_id (id, full_name)
          `)
          .order("match_number", { ascending: true });
        if (!active) return;
        setMatches((mtch as any) || []);

        // Fetch Existing Categories
        const { data: ageCats } = await supabase.from("age_categories").select("*");
        if (!active) return;
        setAgeCategories(ageCats || []);

        const { data: weightCats } = await supabase.from("weight_categories").select("*");
        if (!active) return;
        setWeightCategories(weightCats || []);

      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();

    return () => {
      active = false;
    };
  }, [refreshKey, isDemoMode]);

  // Synchronize Demo Mode data in real-time across multiple open tabs
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key && e.key.startsWith("kickbox_")) {
        setRefreshKey((prev) => prev + 1);
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Stable avatar helper
  function getFighterAvatar(id?: string) {
    if (!id) return FIGHTER_AVATARS[0];
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return FIGHTER_AVATARS[sum % FIGHTER_AVATARS.length];
  }

  // Create Championship Handler
  async function handleCreateChampionship(e: React.FormEvent) {
    e.preventDefault();
    if (!newChampName || !newChampVenue) return;

    try {
      if (isDemoMode) {
        const localChamps = JSON.parse(localStorage.getItem("kickbox_championships") || "[]");
        const newChamp = {
          id: "champ-" + Math.random().toString(36).substring(2, 11),
          name: newChampName,
          venue: newChampVenue,
          status: "active",
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString()
        };
        localChamps.push(newChamp);
        localStorage.setItem("kickbox_championships", JSON.stringify(localChamps));
        setSelectedChampId(newChamp.id);
        alert("Championship created successfully!");
        setNewChampName("");
        setNewChampVenue("");
        setRefreshKey((prev) => prev + 1);
        return;
      }

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
      if (isDemoMode) {
        const localAgeCats = JSON.parse(localStorage.getItem("kickbox_age_categories") || "[]");
        const newAge = {
          id: "age-" + Math.random().toString(36).substring(2, 11),
          championship_id: selectedChampId,
          name: newAgeName,
          min_age: Number(minAge),
          max_age: Number(maxAge)
        };
        localAgeCats.push(newAge);
        localStorage.setItem("kickbox_age_categories", JSON.stringify(localAgeCats));
        alert("Age Division added!");
        setNewAgeName("");
        setRefreshKey((prev) => prev + 1);
        return;
      }

      const { error } = await supabase.from("age_categories").insert([
        {
          championship_id: selectedChampId,
          name: newAgeName,
          min_age: Number(minAge),
          max_age: Number(maxAge)
        }
      ]);

      if (error) throw error;
      alert("Age Division added!");
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
      if (isDemoMode) {
        const localWeightCats = JSON.parse(localStorage.getItem("kickbox_weight_categories") || "[]");
        const newWeight = {
          id: "weight-" + Math.random().toString(36).substring(2, 11),
          championship_id: selectedChampId,
          gender: weightGender,
          name: newWeightName,
          min_weight: Number(minWeight),
          max_weight: Number(maxWeight)
        };
        localWeightCats.push(newWeight);
        localStorage.setItem("kickbox_weight_categories", JSON.stringify(localWeightCats));
        alert("Weight Bracket added!");
        setNewWeightName("");
        setRefreshKey((prev) => prev + 1);
        return;
      }

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
      alert("Weight Bracket added!");
      setNewWeightName("");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Update Registration Status Handler (Approve / Reject)
  async function handleUpdateRegStatus(id: string, status: string) {
    try {
      if (isDemoMode) {
        const localRegs = JSON.parse(localStorage.getItem("kickbox_registrations") || "[]");
        const idx = localRegs.findIndex((r: any) => r.id === id);
        if (idx !== -1) {
          localRegs[idx].status = status;
          localStorage.setItem("kickbox_registrations", JSON.stringify(localRegs));
        }
        setRefreshKey((prev) => prev + 1);
        return;
      }

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

  // Supabase Category Helper
  async function findOrCreateCategoriesSupabase(
    ageName: string,
    weightName: string,
    gender: string,
    championshipId: string
  ) {
    // Age Category
    let { data: ageCat } = await supabase
      .from("age_categories")
      .select("id")
      .eq("championship_id", championshipId)
      .eq("name", ageName)
      .maybeSingle();

    if (!ageCat) {
      const ageRule = WAK1F_AGE_CATEGORIES.find((r) => r.name === ageName);
      const { data: newAge, error: ageErr } = await supabase
        .from("age_categories")
        .insert({
          championship_id: championshipId,
          name: ageName,
          min_age: ageRule ? ageRule.minAge : 9,
          max_age: ageRule ? ageRule.maxAge : 999,
        })
        .select("id")
        .single();
      if (ageErr) throw ageErr;
      ageCat = newAge;
    }

    // Weight Category
    let { data: weightCat } = await supabase
      .from("weight_categories")
      .select("id")
      .eq("championship_id", championshipId)
      .eq("name", weightName)
      .eq("gender", gender)
      .maybeSingle();

    if (!weightCat) {
      const { data: newWeight, error: wtErr } = await supabase
        .from("weight_categories")
        .insert({
          championship_id: championshipId,
          name: weightName,
          gender: gender,
          min_weight: 0,
          max_weight: 0,
        })
        .select("id")
        .single();
      if (wtErr) throw wtErr;
      weightCat = newWeight;
    }

    return { ageCatId: ageCat.id, weightCatId: weightCat.id };
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

      // ── Helper: assign correct round names based on total stages ──────────
      const getRoundNames = (stages: number): string[] => {
        if (stages === 1) return ["Final"];
        if (stages === 2) return ["Semi Final", "Final"];
        if (stages === 3) return ["Quarter Final", "Semi Final", "Final"];
        const earlyRounds = Array.from({ length: stages - 3 }, (_, i) => `Round ${i + 1}`);
        return [...earlyRounds, "Quarter Final", "Semi Final", "Final"];
      };

      // ── Helper: get match index boundaries for each round ─────────────────
      const getRoundBoundaries = (roundSizes: number[]): number[] => {
        const starts: number[] = [];
        let acc = 0;
        for (const s of roundSizes) { starts.push(acc); acc += s; }
        return starts;
      };

      // ── Loop through each category group ─────────────────────────────────
      for (const key in groups) {
        const groupFighters = groups[key];
        const numFighters = groupFighters.length;
        if (numFighters < 2) continue;

        // Next power of 2 = total bracket slots
        let P = 2;
        while (P < numFighters) P *= 2;

        const stages = Math.log2(P);               // how many rounds total
        const firstRoundSize = P / 2;              // matches in round 1
        const roundNames = getRoundNames(stages);  // correct stage labels

        // Build round sizes array: [firstRoundSize, firstRoundSize/2, ..., 1]
        const roundSizes: number[] = [];
        let sz = firstRoundSize;
        while (sz >= 1) { roundSizes.push(sz); sz = Math.floor(sz / 2); }

        const roundStarts = getRoundBoundaries(roundSizes);

        // ── Build all match slots ──────────────────────────────────────────
        const groupMatches: any[] = [];
        for (let r = 0; r < roundSizes.length; r++) {
          for (let m = 0; m < roundSizes[r]; m++) {
            groupMatches.push({
              championship_id: selectedChampId,
              match_number: -1,
              round_name: roundNames[r],
              fighter_a_id: null,
              fighter_b_id: null,
              winner_id: null,
              status: "scheduled",
              ring_number: `Ring ${(globalMatchCounter % 2) + 1} | CATEGORY:${key}`,
              // Schedule each match 20 min apart, later rounds later in the day
              scheduled_at: new Date(Date.now() + (globalMatchCounter + r * 60) * 20 * 60000).toISOString()
            });
          }
        }

        // ── Seed fighters into round 1 slots using standard tournament seeding ──
        const getSeedingOrder = (p: number): number[] => {
          let order = [1, 2];
          while (order.length < p) {
            const nextOrder: number[] = [];
            const target = order.length * 2 + 1;
            for (const x of order) {
              nextOrder.push(x);
              nextOrder.push(target - x);
            }
            order = nextOrder;
          }
          return order;
        };

        const seedingOrder = getSeedingOrder(P);

        // Assign each fighter to their seeded position
        for (let i = 0; i < P; i++) {
          const seed = seedingOrder[i];
          if (seed <= numFighters) {
            const fighter = groupFighters[seed - 1];
            const matchIdx = Math.floor(i / 2);
            const isFighterA = i % 2 === 0;
            if (isFighterA) {
              groupMatches[matchIdx].fighter_a_id = fighter.fighter_id;
            } else {
              groupMatches[matchIdx].fighter_b_id = fighter.fighter_id;
            }
          }
        }

        // Helper to check if a match at a flat index has any active fighters in its subtree
        const hasFightersInSubtree = (idx: number): boolean => {
          if (idx < firstRoundSize) {
            return !!(groupMatches[idx].fighter_a_id || groupMatches[idx].fighter_b_id);
          }
          let roundIdx = -1;
          for (let r = 0; r < roundSizes.length; r++) {
            if (idx >= roundStarts[r] && idx < roundStarts[r] + roundSizes[r]) {
              roundIdx = r;
              break;
            }
          }
          if (roundIdx <= 0) return false;
          const offset = idx - roundStarts[roundIdx];
          const srcA = roundStarts[roundIdx - 1] + 2 * offset;
          const srcB = roundStarts[roundIdx - 1] + 2 * offset + 1;
          return hasFightersInSubtree(srcA) || hasFightersInSubtree(srcB);
        };

        // ── Propagate and handle all byes recursively ───────────────────
        for (let idx = 0; idx < groupMatches.length; idx++) {
          const currentM = groupMatches[idx];

          let canHaveA = true;
          let canHaveB = true;

          if (idx >= firstRoundSize) {
            let roundIdx = -1;
            for (let r = 0; r < roundSizes.length; r++) {
              if (idx >= roundStarts[r] && idx < roundStarts[r] + roundSizes[r]) {
                roundIdx = r;
                break;
              }
            }
            const offset = idx - roundStarts[roundIdx];
            const srcA = roundStarts[roundIdx - 1] + 2 * offset;
            const srcB = roundStarts[roundIdx - 1] + 2 * offset + 1;

            canHaveA = hasFightersInSubtree(srcA);
            canHaveB = hasFightersInSubtree(srcB);
          } else {
            canHaveA = !!currentM.fighter_a_id;
            canHaveB = !!currentM.fighter_b_id;
          }

          if (canHaveA && !canHaveB) {
            if (currentM.fighter_a_id) {
              currentM.winner_id = currentM.fighter_a_id;
              currentM.status = "walkover";
            }
          } else if (!canHaveA && canHaveB) {
            if (currentM.fighter_b_id) {
              currentM.winner_id = currentM.fighter_b_id;
              currentM.status = "walkover";
            }
          } else if (!canHaveA && !canHaveB) {
            currentM.status = "walkover";
          }

          if ((currentM.status === "completed" || currentM.status === "walkover") && currentM.winner_id) {
            let roundIdx = -1;
            for (let r = 0; r < roundSizes.length; r++) {
              if (idx >= roundStarts[r] && idx < roundStarts[r] + roundSizes[r]) {
                roundIdx = r;
                break;
              }
            }
            if (roundIdx !== -1 && roundIdx + 1 < roundSizes.length) {
              const offset = idx - roundStarts[roundIdx];
              const nextMatchIdx = roundStarts[roundIdx + 1] + Math.floor(offset / 2);
              const isFighterA = offset % 2 === 0;

              if (nextMatchIdx < groupMatches.length) {
                if (isFighterA) {
                  groupMatches[nextMatchIdx].fighter_a_id = currentM.winner_id;
                } else {
                  groupMatches[nextMatchIdx].fighter_b_id = currentM.winner_id;
                }
              }
            }
          }
        }

        // ── Assign global match numbers ───────────────────────────────────
        groupMatches.forEach((m) => {
          m.match_number = globalMatchCounter++;
          matchesToInsert.push(m);
        });
      }

      if (matchesToInsert.length === 0) {
        alert("Not enough fighters in the same age/weight groups to seed brackets.");
        return;
      }

      if (isDemoMode) {
        let localMatches = JSON.parse(localStorage.getItem("kickbox_matches") || "[]");
        localMatches = localMatches.filter((m: any) => m.championship_id !== selectedChampId);
        
        const matchesWithIds = matchesToInsert.map((m) => ({
          ...m,
          id: "match-" + Math.random().toString(36).substring(2, 11),
          fighter_a: m.fighter_a_id ? {
            id: m.fighter_a_id,
            full_name: registrations.find(r => r.fighter_id === m.fighter_a_id)?.profiles?.full_name || "Fighter A"
          } : null,
          fighter_b: m.fighter_b_id ? {
            id: m.fighter_b_id,
            full_name: registrations.find(r => r.fighter_id === m.fighter_b_id)?.profiles?.full_name || "Fighter B"
          } : null,
        }));
        
        localMatches.push(...matchesWithIds);
        localStorage.setItem("kickbox_matches", JSON.stringify(localMatches));
        
        alert(`Brackets generated successfully! Created ${matchesWithIds.length} matches.`);
        setRefreshKey((prev) => prev + 1);
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
      if (isDemoMode) {
        let localMatches = JSON.parse(localStorage.getItem("kickbox_matches") || "[]");
        const matchIdx = localMatches.findIndex((m: any) => m.id === matchId);
        if (matchIdx === -1) throw new Error("Match not found");
        
        // Update current match
        localMatches[matchIdx].winner_id = winnerId;
        localMatches[matchIdx].status = "completed";
        
        const currentMatch = localMatches[matchIdx];
        
        // Get all matches in same category, sorted by match_number
        const categoryPart = currentMatch.ring_number?.split(" | CATEGORY:")[1] || "";
        const siblingMatches = localMatches
          .filter((m: any) => m.championship_id === currentMatch.championship_id && (m.ring_number?.split(" | CATEGORY:")[1] || "") === categoryPart)
          .sort((a: any, b: any) => a.match_number - b.match_number);
          
        const currentIndex = siblingMatches.findIndex((m: any) => m.id === matchId);
        if (currentIndex !== -1) {
          // Rebuild round boundaries from match count
          const totalMatches = siblingMatches.length;
          // total = frs + frs/2 + ... + 1 = 2*frs - 1, so frs = (total+1)/2
          const frs = Math.round((totalMatches + 1) / 2);
          const roundSizes: number[] = [];
          let sz = frs;
          while (sz >= 1) { roundSizes.push(sz); sz = Math.floor(sz / 2); }
          
          // Find round boundaries
          const roundStarts: number[] = [];
          let acc = 0;
          for (const s of roundSizes) { roundStarts.push(acc); acc += s; }

          // Which round is currentIndex in?
          let roundIdx = -1;
          for (let r = 0; r < roundSizes.length; r++) {
            if (currentIndex >= roundStarts[r] && currentIndex < roundStarts[r] + roundSizes[r]) {
              roundIdx = r;
              break;
            }
          }

          if (roundIdx !== -1 && roundIdx + 1 < roundSizes.length) {
            const offset = currentIndex - roundStarts[roundIdx];
            const nextSiblingIdx = roundStarts[roundIdx + 1] + Math.floor(offset / 2);
            const isFighterA = offset % 2 === 0;
            
            if (nextSiblingIdx < siblingMatches.length) {
              const nextMatchSibling = siblingMatches[nextSiblingIdx];
              const realNextMatchIdx = localMatches.findIndex((m: any) => m.id === nextMatchSibling.id);
              if (realNextMatchIdx !== -1) {
                const winnerName = registrations.find(r => r.fighter_id === winnerId)?.profiles?.full_name || "Winner";
                if (isFighterA) {
                  localMatches[realNextMatchIdx].fighter_a_id = winnerId;
                  localMatches[realNextMatchIdx].fighter_a = { id: winnerId, full_name: winnerName };
                } else {
                  localMatches[realNextMatchIdx].fighter_b_id = winnerId;
                  localMatches[realNextMatchIdx].fighter_b = { id: winnerId, full_name: winnerName };
                }
              }
            }
          }
        }
        
        localStorage.setItem("kickbox_matches", JSON.stringify(localMatches));
        alert("Winner recorded and bracket updated!");
        setRefreshKey((prev) => prev + 1);
        return;
      }

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
      const { data: allSiblingMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("championship_id", currentMatch.championship_id)
        .order("match_number", { ascending: true });

      if (allSiblingMatches && allSiblingMatches.length > 0) {
        const categoryPart = currentMatch.ring_number?.split(" | CATEGORY:")[1] || "";
        const siblingMatches = allSiblingMatches
          .filter((m) => (m.ring_number?.split(" | CATEGORY:")[1] || "") === categoryPart)
          .sort((a, b) => a.match_number - b.match_number);

        const currentIndex = siblingMatches.findIndex((m) => m.id === matchId);
        if (currentIndex !== -1) {
          const totalMatches = siblingMatches.length;
          const frs = Math.round((totalMatches + 1) / 2);
          const roundSizes: number[] = [];
          let sz = frs;
          while (sz >= 1) { roundSizes.push(sz); sz = Math.floor(sz / 2); }

          const roundStarts: number[] = [];
          let acc = 0;
          for (const s of roundSizes) { roundStarts.push(acc); acc += s; }

          let roundIdx = -1;
          for (let r = 0; r < roundSizes.length; r++) {
            if (currentIndex >= roundStarts[r] && currentIndex < roundStarts[r] + roundSizes[r]) {
              roundIdx = r; break;
            }
          }

          if (roundIdx !== -1 && roundIdx + 1 < roundSizes.length) {
            const offset = currentIndex - roundStarts[roundIdx];
            const nextSiblingIdx = roundStarts[roundIdx + 1] + Math.floor(offset / 2);
            const isFighterA = offset % 2 === 0;

            if (nextSiblingIdx < siblingMatches.length) {
              const nextMatch = siblingMatches[nextSiblingIdx];
              const updatePayload = isFighterA ? { fighter_a_id: winnerId } : { fighter_b_id: winnerId };
              const { error: nextError } = await supabase.from("matches").update(updatePayload).eq("id", nextMatch.id);
              if (nextError) console.error("Error propagating winner:", nextError);
            }
          }
        }
      }

      alert("Winner recorded and bracket updated!");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Delete Championship Handler
  async function handleDeleteChampionship(id: string) {
    if (!confirm("Are you sure you want to delete this championship? This will permanently delete all associated divisions, registrations, and matches!")) return;
    try {
      if (isDemoMode) {
        let localChamps = JSON.parse(localStorage.getItem("kickbox_championships") || "[]");
        localChamps = localChamps.filter((c: any) => c.id !== id);
        localStorage.setItem("kickbox_championships", JSON.stringify(localChamps));
        
        let localRegs = JSON.parse(localStorage.getItem("kickbox_registrations") || "[]");
        localRegs = localRegs.filter((r: any) => r.championship_id !== id);
        localStorage.setItem("kickbox_registrations", JSON.stringify(localRegs));
        
        let localMatches = JSON.parse(localStorage.getItem("kickbox_matches") || "[]");
        localMatches = localMatches.filter((m: any) => m.championship_id !== id);
        localStorage.setItem("kickbox_matches", JSON.stringify(localMatches));
        
        if (selectedChampId === id) {
          setSelectedChampId(localChamps[0]?.id || "");
        }
        
        alert("Championship deleted successfully!");
        setRefreshKey((prev) => prev + 1);
        return;
      }

      const { error } = await supabase
        .from("championships")
        .delete()
        .eq("id", id);
      if (error) throw error;
      alert("Championship deleted successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error deleting championship: " + err.message);
    }
  }

  // Clear ALL data from Supabase (for fresh start)
  async function handleClearAllData() {
    if (!confirm("⚠️ WARNING: This will permanently delete ALL data from ALL tables (matches, registrations, categories, championships). Are you sure?")) return;
    if (!confirm("This action CANNOT be undone. Type OK to confirm you want to delete everything.")) return;

    try {
      setLoading(true);

      if (isDemoMode) {
        localStorage.removeItem("kickbox_championships");
        localStorage.removeItem("kickbox_registrations");
        localStorage.removeItem("kickbox_matches");
        localStorage.removeItem("kickbox_profiles");
        alert("✅ All demo data cleared!");
        setRefreshKey((prev) => prev + 1);
        return;
      }

      const res = await fetch("/api/clear-all-data", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        const summary = data.results
          .map((r: any) => `${r.table}: ${r.count ?? 0} rows deleted`)
          .join("\n");
        alert("✅ All data cleared successfully!\n\n" + summary);
        setSelectedChampId("");
        setRefreshKey((prev) => prev + 1);
      } else {
        alert("Error clearing data: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load Test Cohort (10+ Fighters for Age 9-10)
  async function handleLoadTestCohort() {
    try {
      setLoading(true);
      
      let targetChampId = selectedChampId;
      if (!targetChampId) {
        if (championships.length > 0) {
          targetChampId = championships[0].id;
          setSelectedChampId(targetChampId);
        } else {
          const newChamp = {
            id: isDemoMode ? "demo-championship-id" : crypto.randomUUID(),
            name: "WAK-1F National Championship 2026",
            venue: "Talkatora Indoor Stadium, New Delhi",
            status: "active",
            start_date: new Date().toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
            created_at: new Date().toISOString()
          };
          if (isDemoMode) {
            localStorage.setItem("kickbox_championships", JSON.stringify([newChamp]));
            setChampionships([newChamp]);
          } else {
            const { error } = await supabase.from("championships").insert([newChamp]);
            if (error) throw error;
            setChampionships([newChamp]);
          }
          targetChampId = newChamp.id;
          setSelectedChampId(targetChampId);
        }
      }

      const testFighters = [
        // 9-10 Male -24kg (4 fighters)
        { name: "Aarav Sharma", age: 9, gender: "Male", weight: 23.0 },
        { name: "Kabir Verma", age: 9, gender: "Male", weight: 22.5 },
        { name: "Vivaan Sen", age: 10, gender: "Male", weight: 23.8 },
        { name: "Reyansh Gupta", age: 10, gender: "Male", weight: 21.5 },
        
        // 9-10 Male -27kg (4 fighters)
        { name: "Ishan Iyer", age: 9, gender: "Male", weight: 26.2 },
        { name: "Atharv Joshi", age: 10, gender: "Male", weight: 25.8 },
        { name: "Arjun Nair", age: 10, gender: "Male", weight: 24.9 },
        { name: "Dhruv Mehta", age: 9, gender: "Male", weight: 26.9 },
        
        // 9-10 Male -30kg (2 fighters)
        { name: "Rudra Patel", age: 10, gender: "Male", weight: 29.5 },
        { name: "Ayaan Ali", age: 9, gender: "Male", weight: 28.2 },

        // 9-10 Female -24kg (2 fighters)
        { name: "Ananya Roy", age: 9, gender: "Female", weight: 23.2 },
        { name: "Diya Sharma", age: 10, gender: "Female", weight: 22.8 }
      ];

      if (isDemoMode) {
        const localRegs = JSON.parse(localStorage.getItem("kickbox_registrations") || "[]");
        const localAgeCats = JSON.parse(localStorage.getItem("kickbox_age_categories") || "[]");
        const localWeightCats = JSON.parse(localStorage.getItem("kickbox_weight_categories") || "[]");
        
        testFighters.forEach((f) => {
          const classification = classifyFighterLocal({
            fighter_id: "fighter-" + Math.random().toString(36).substring(2, 11),
            full_name: f.name,
            age: f.age,
            gender: f.gender,
            weight_kg: f.weight
          });
          const ageCategoryName = classification.age_category;
          const weightCategoryName = classification.weight_category;
          
          let ageCat = localAgeCats.find((a: any) => a.championship_id === targetChampId && a.name === ageCategoryName);
          if (!ageCat) {
            ageCat = {
              id: "age-" + Math.random().toString(36).substring(2, 11),
              championship_id: targetChampId,
              name: ageCategoryName,
              min_age: 9,
              max_age: 10
            };
            localAgeCats.push(ageCat);
          }
          
          let weightCat = localWeightCats.find((w: any) => w.championship_id === targetChampId && w.name === weightCategoryName && w.gender.toLowerCase() === f.gender.toLowerCase());
          if (!weightCat) {
            weightCat = {
              id: "weight-" + Math.random().toString(36).substring(2, 11),
              championship_id: targetChampId,
              gender: f.gender.toLowerCase(),
              name: weightCategoryName,
              min_weight: 0,
              max_weight: 0
            };
            localWeightCats.push(weightCat);
          }
          
          const newReg = {
            id: "reg-" + Math.random().toString(36).substring(2, 11),
            championship_id: targetChampId,
            fighter_id: "fighter-" + Math.random().toString(36).substring(2, 11),
            age_category_id: ageCat.id,
            weight_category_id: weightCat.id,
            status: "approved",
            gender: f.gender.toLowerCase(),
            weight_kg: f.weight,
            profiles: {
              id: "fighter-" + Math.random().toString(36).substring(2, 11),
              full_name: f.name
            },
            age_categories: { name: ageCategoryName },
            weight_categories: { name: weightCategoryName }
          };
          localRegs.push(newReg);
        });
        
        localStorage.setItem("kickbox_registrations", JSON.stringify(localRegs));
        localStorage.setItem("kickbox_age_categories", JSON.stringify(localAgeCats));
        localStorage.setItem("kickbox_weight_categories", JSON.stringify(localWeightCats));
        
        alert(`Successfully imported ${testFighters.length} test cohort fighters in Local Demo Mode! Divisions were automatically assigned.`);
        setRefreshKey((prev) => prev + 1);
      } else {
        let successCount = 0;
        for (const f of testFighters) {
          const classification = classifyFighterLocal({
            fighter_id: "fighter-" + Math.random().toString(36).substring(2, 11),
            full_name: f.name,
            age: f.age,
            gender: f.gender,
            weight_kg: f.weight
          });
          const ageCategoryName = classification.age_category;
          const weightCategoryName = classification.weight_category;

          const { ageCatId, weightCatId } = await findOrCreateCategoriesSupabase(
            ageCategoryName,
            weightCategoryName,
            f.gender.toLowerCase(),
            targetChampId
          );

          const randomFighterId = crypto.randomUUID();
          
          const { error: profileErr } = await supabase
            .from("profiles")
            .insert({
              id: randomFighterId,
              full_name: f.name
            });
            
          if (profileErr) {
            console.error("Profile insert error:", profileErr);
            continue;
          }

          const { error: regErr } = await supabase
            .from("registrations")
            .insert({
              championship_id: targetChampId,
              fighter_id: randomFighterId,
              age_category_id: ageCatId,
              weight_category_id: weightCatId,
              gender: f.gender.toLowerCase(),
              weight_kg: f.weight,
              status: "approved"
            });

          if (regErr) {
            console.error("Registration insert error:", regErr);
            continue;
          }
          successCount++;
        }
        alert(`Successfully imported ${successCount} test cohort fighters in Supabase Mode!`);
        setRefreshKey((prev) => prev + 1);
      }
    } catch (e: any) {
      alert("Test cohort import error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Load 100 Fighters Sample
  async function handleLoadSampleFighters() {
    try {
      setLoading(true);
      const res = await fetch("/api/seed-sample");
      if (!res.ok) throw new Error("Failed to load sample fighters endpoint");
      const data = await res.json();
      if (!data.success || !data.fighters) {
        throw new Error(data.error || "No fighters found in sample endpoint");
      }
      
      const sampleFighters = data.fighters;
      if (isDemoMode) {
        const localRegs = JSON.parse(localStorage.getItem("kickbox_registrations") || "[]");
        const localAgeCats = JSON.parse(localStorage.getItem("kickbox_age_categories") || "[]");
        const localWeightCats = JSON.parse(localStorage.getItem("kickbox_weight_categories") || "[]");
        
        sampleFighters.forEach((f: any) => {
          const classification = classifyFighterLocal({
            fighter_id: f.fighter_id || "fighter-" + Math.random().toString(36).substring(2, 11),
            full_name: f.full_name || f.name || "Unknown",
            age: f.age,
            gender: f.gender,
            weight_kg: f.weight_kg || f.weight || 60
          });
          const ageCategoryName = classification.age_category;
          const weightCategoryName = classification.weight_category;
          
          let ageCat = localAgeCats.find((a: any) => a.championship_id === selectedChampId && a.name === ageCategoryName);
          if (!ageCat) {
            ageCat = {
              id: "age-" + Math.random().toString(36).substring(2, 11),
              championship_id: selectedChampId,
              name: ageCategoryName,
              min_age: 10,
              max_age: 18
            };
            localAgeCats.push(ageCat);
          }
          
          let weightCat = localWeightCats.find((w: any) => w.championship_id === selectedChampId && w.name === weightCategoryName && w.gender.toLowerCase() === f.gender.toLowerCase());
          if (!weightCat) {
            weightCat = {
              id: "weight-" + Math.random().toString(36).substring(2, 11),
              championship_id: selectedChampId,
              gender: f.gender.toLowerCase(),
              name: weightCategoryName,
              min_weight: 0,
              max_weight: 0
            };
            localWeightCats.push(weightCat);
          }
          
          const newReg = {
            id: "reg-" + Math.random().toString(36).substring(2, 11),
            championship_id: selectedChampId,
            fighter_id: "fighter-" + Math.random().toString(36).substring(2, 11),
            age_category_id: ageCat.id,
            weight_category_id: weightCat.id,
            status: "approved",
            gender: f.gender.toLowerCase(),
            weight_kg: f.weight_kg || f.weight || 60,
            profiles: {
              id: f.fighter_id || "fighter-" + Math.random().toString(36).substring(2, 11),
              full_name: f.full_name || f.name || "Unknown"
            },
            age_categories: { name: ageCategoryName },
            weight_categories: { name: weightCategoryName }
          };
          localRegs.push(newReg);
        });
        
        localStorage.setItem("kickbox_registrations", JSON.stringify(localRegs));
        localStorage.setItem("kickbox_age_categories", JSON.stringify(localAgeCats));
        localStorage.setItem("kickbox_weight_categories", JSON.stringify(localWeightCats));
        
        alert(`Successfully imported ${sampleFighters.length} fighters in Local Demo Mode! Divisions were automatically assigned.`);
        setRefreshKey((prev) => prev + 1);
      } else {
        let successCount = 0;
        for (const f of sampleFighters) {
          const classification = classifyFighterLocal({
            fighter_id: f.fighter_id || "fighter-" + Math.random().toString(36).substring(2, 11),
            full_name: f.full_name || f.name || "Unknown",
            age: f.age,
            gender: f.gender,
            weight_kg: f.weight_kg || f.weight || 60
          });
          const ageCategoryName = classification.age_category;
          const weightCategoryName = classification.weight_category;

          const { ageCatId, weightCatId } = await findOrCreateCategoriesSupabase(
            ageCategoryName,
            weightCategoryName,
            f.gender.toLowerCase(),
            selectedChampId
          );

          const randomFighterId = crypto.randomUUID();
          
          const { error: profileErr } = await supabase
            .from("profiles")
            .insert({
              id: randomFighterId,
              full_name: f.full_name || f.name || "Unknown"
            });
            
          if (profileErr) {
            console.error("Profile insert error:", profileErr);
            continue;
          }

          const { error: regErr } = await supabase
            .from("registrations")
            .insert({
              championship_id: selectedChampId,
              fighter_id: randomFighterId,
              age_category_id: ageCatId,
              weight_category_id: weightCatId,
              gender: f.gender.toLowerCase(),
              weight_kg: f.weight_kg || f.weight || 60,
              status: "approved"
            });

          if (regErr) {
            console.error("Registration insert error:", regErr);
            continue;
          }
          successCount++;
        }
        alert(`Successfully imported ${successCount} fighters in Supabase Mode!`);
        setRefreshKey((prev) => prev + 1);
      }
    } catch (e: any) {
      alert("Import error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── XLSX BULK UPLOAD ──────────────────────────────────────────────────────
  async function handleXLSXFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setXlsxFileName(file.name);
    setXlsxPreview([]);

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      
      const allNormalised: any[] = [];

      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        rows.forEach((row: any) => {
          const get = (...keys: string[]) => {
            for (const k of keys) {
              const cleanKey = k.toLowerCase().replace(/[\s_()\-]/g, "");
              const found = Object.keys(row).find(rk => {
                const cleanRk = rk.toLowerCase().replace(/[\s_()\-]/g, "");
                return cleanRk === cleanKey || cleanRk.includes(cleanKey) || cleanKey.includes(cleanRk);
              });
              if (found && row[found] !== null && row[found] !== undefined && String(row[found]).trim() !== "") {
                return row[found];
              }
            }
            return "";
          };

          const name = String(get("fullname", "name", "fullName", "fighter_name", "fightername", "fightersname") || "").trim();
          if (!name || name.toLowerCase() === "name" || name.toLowerCase().includes("fighter id")) {
            return; // Skip empty rows or header duplicate rows
          }

          // Parse age category or age group (e.g. "9-10", "19+")
          const ageVal = get("agegroup", "age_group", "age group", "agecategory", "age_category", "age category", "age", "group");
          let age = 0;
          const ageStr = String(ageVal || sheetName || "").trim().toLowerCase();
          
          if (ageStr.includes("19") || ageStr.includes("sr") || ageStr.includes("senior")) {
            age = 19;
          } else if (ageStr.includes("17") || ageStr.includes("18")) {
            age = 17;
          } else if (ageStr.includes("15") || ageStr.includes("16")) {
            age = 15;
          } else if (ageStr.includes("13") || ageStr.includes("14")) {
            age = 13;
          } else if (ageStr.includes("11") || ageStr.includes("12")) {
            age = 11;
          } else if (ageStr.includes("9") || ageStr.includes("10")) {
            age = 9;
          } else {
            const parsed = parseInt(ageStr.replace(/[^0-9]/g, ""));
            age = isNaN(parsed) ? 19 : parsed;
          }

          // Parse weight category or weight (e.g. "48", "51 kg")
          const weightVal = get("weightcategory", "weight_category", "weight category", "weightkg", "weight_kg", "weight kg", "weight", "wt");
          let weight = 0;
          if (weightVal !== "") {
            const cleanWeightStr = String(weightVal).replace(/[^0-9.]/g, "");
            weight = parseFloat(cleanWeightStr);
          }
          if (isNaN(weight) || weight <= 0) {
            weight = 48; // fallback default
          }

          // Parse gender (Male/Female)
          const genderVal = get("gender", "sex");
          let gender = "Male"; // Default to Male if column not found
          if (genderVal) {
            const gStr = String(genderVal).trim().toLowerCase();
            if (gStr === "f" || gStr === "female" || gStr.includes("girl") || gStr.includes("women") || gStr.includes("female")) {
              gender = "Female";
            }
          }

          // Parse state or club
          const club = String(get("club", "gym", "state", "clubname", "club_name", "gymclub") || "Kerala").trim();
          const coach = String(get("coach", "coach_name", "coachname") || "Self").trim();

          allNormalised.push({ name, age, gender, weight, club, coach });
        });
      });

      if (allNormalised.length === 0) {
        alert("⚠️ No fighters parsed. Please check that your sheets have columns like 'Name' and 'Weight Category'.");
      } else {
        setXlsxPreview(allNormalised.slice(0, 500)); // Cap preview at 500
      }
    } catch (err: any) {
      alert("Error reading Excel file: " + err.message);
    }
    
    e.target.value = "";
  }


  async function handleXLSXImport() {
    if (!xlsxPreview.length || !selectedChampId) return;
    setXlsxImporting(true);
    try {
      let successCount = 0;

      // Helper function to generate valid UUIDs
      const generateUUID = () => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      if (isDemoMode) {
        // Local Demo Mode
        const localAgeCats = JSON.parse(localStorage.getItem("kickbox_age_categories") || "[]");
        const localWeightCats = JSON.parse(localStorage.getItem("kickbox_weight_categories") || "[]");
        const localRegs = JSON.parse(localStorage.getItem("kickbox_registrations") || "[]");

        for (const f of xlsxPreview) {
          const fighterId = "fighter-" + Math.random().toString(36).substring(2, 11);
          const classification = classifyFighterLocal({
            fighter_id: fighterId,
            full_name: f.name,
            age: f.age,
            gender: f.gender,
            weight_kg: f.weight
          });
          const ageCategoryName = classification.age_category;
          const weightCategoryName = classification.weight_category;

          let ageCat = localAgeCats.find((a: any) => a.championship_id === selectedChampId && a.name === ageCategoryName);
          if (!ageCat) {
            ageCat = { id: "age-" + Math.random().toString(36).substring(2, 11), championship_id: selectedChampId, name: ageCategoryName, min_age: 9, max_age: 99 };
            localAgeCats.push(ageCat);
          }
          let weightCat = localWeightCats.find((w: any) => w.championship_id === selectedChampId && w.name === weightCategoryName && w.gender.toLowerCase() === f.gender.toLowerCase());
          if (!weightCat) {
            weightCat = { id: "weight-" + Math.random().toString(36).substring(2, 11), championship_id: selectedChampId, gender: f.gender.toLowerCase(), name: weightCategoryName, min_weight: 0, max_weight: 0 };
            localWeightCats.push(weightCat);
          }
          localRegs.push({
            id: "reg-" + Math.random().toString(36).substring(2, 11),
            championship_id: selectedChampId,
            fighter_id: fighterId,
            age_category_id: ageCat.id,
            weight_category_id: weightCat.id,
            status: "approved",
            gender: f.gender.toLowerCase(),
            weight_kg: f.weight,
            profiles: { id: fighterId, full_name: f.name },
            age_categories: { name: ageCategoryName },
            weight_categories: { name: weightCategoryName }
          });
          successCount++;
        }

        localStorage.setItem("kickbox_registrations", JSON.stringify(localRegs));
        localStorage.setItem("kickbox_age_categories", JSON.stringify(localAgeCats));
        localStorage.setItem("kickbox_weight_categories", JSON.stringify(localWeightCats));

        alert(`✅ Imported ${successCount} fighters successfully in Demo Mode!`);
        setXlsxPreview([]);
        setXlsxFileName("");
        setRefreshKey(prev => prev + 1);

      } else {
        // Supabase Mode (Optimized bulk upload with valid UUIDs)
        const classifiedFighters = xlsxPreview.map(f => {
          const fighterId = generateUUID();
          const classification = classifyFighterLocal({
            fighter_id: fighterId,
            full_name: f.name,
            age: f.age,
            gender: f.gender,
            weight_kg: f.weight
          });
          return { f, fighterId, classification };
        });

        // 1. Fetch existing categories
        const { data: existingAgeCats, error: ageFetchErr } = await supabase
          .from("age_categories")
          .select("id, name")
          .eq("championship_id", selectedChampId);
        if (ageFetchErr) throw ageFetchErr;

        const { data: existingWeightCats, error: weightFetchErr } = await supabase
          .from("weight_categories")
          .select("id, name, gender")
          .eq("championship_id", selectedChampId);
        if (weightFetchErr) throw weightFetchErr;

        const ageCatMap = new Map(existingAgeCats?.map(c => [c.name, c.id]) || []);
        const weightCatMap = new Map(existingWeightCats?.map(c => [`${c.name}-${c.gender.toLowerCase()}`, c.id]) || []);

        // 2. Identify and bulk insert new categories
        const newAgeCatsToInsert: any[] = [];
        const newWeightCatsToInsert: any[] = [];

        classifiedFighters.forEach(({ f, classification }) => {
          const ageName = classification.age_category;
          const weightName = classification.weight_category;
          const gender = f.gender.toLowerCase();

          if (!ageCatMap.has(ageName) && !newAgeCatsToInsert.some(c => c.name === ageName)) {
            const ageRule = WAK1F_AGE_CATEGORIES.find((r) => r.name === ageName);
            newAgeCatsToInsert.push({
              championship_id: selectedChampId,
              name: ageName,
              min_age: ageRule ? ageRule.minAge : 9,
              max_age: ageRule ? ageRule.maxAge : 999
            });
          }

          const weightKey = `${weightName}-${gender}`;
          if (!weightCatMap.has(weightKey) && !newWeightCatsToInsert.some(c => c.name === weightName && c.gender === gender)) {
            newWeightCatsToInsert.push({
              championship_id: selectedChampId,
              name: weightName,
              gender: gender,
              min_weight: 0,
              max_weight: 0
            });
          }
        });

        // Bulk insert missing Age categories
        if (newAgeCatsToInsert.length > 0) {
          const { data: insertedAgeCats, error: ageInsertErr } = await supabase
            .from("age_categories")
            .insert(newAgeCatsToInsert)
            .select("id, name");
          if (ageInsertErr) throw ageInsertErr;
          insertedAgeCats?.forEach(c => ageCatMap.set(c.name, c.id));
        }

        // Bulk insert missing Weight categories
        if (newWeightCatsToInsert.length > 0) {
          const { data: insertedWeightCats, error: weightInsertErr } = await supabase
            .from("weight_categories")
            .insert(newWeightCatsToInsert)
            .select("id, name, gender");
          if (weightInsertErr) throw weightInsertErr;
          insertedWeightCats?.forEach(c => weightCatMap.set(`${c.name}-${c.gender.toLowerCase()}`, c.id));
        }

        // 3. Bulk insert profiles
        const profilesToInsert = classifiedFighters.map(({ f, fighterId }) => ({
          id: fighterId,
          full_name: f.name
        }));

        const CHUNK_SIZE = 100;
        for (let i = 0; i < profilesToInsert.length; i += CHUNK_SIZE) {
          const chunkProfiles = profilesToInsert.slice(i, i + CHUNK_SIZE);
          const { error: profileErr } = await supabase.from("profiles").insert(chunkProfiles);
          if (profileErr) throw profileErr;
        }

        // 4. Bulk insert registrations
        const registrationsToInsert = classifiedFighters.map(({ f, fighterId, classification }) => {
          const ageCatId = ageCatMap.get(classification.age_category);
          const weightCatId = weightCatMap.get(`${classification.weight_category}-${f.gender.toLowerCase()}`);
          return {
            championship_id: selectedChampId,
            fighter_id: fighterId,
            age_category_id: ageCatId,
            weight_category_id: weightCatId,
            gender: f.gender.toLowerCase(),
            weight_kg: f.weight,
            status: "approved",
            date_of_birth: new Date(new Date().getFullYear() - f.age, 0, 1).toISOString().split("T")[0]
          };
        });

        for (let i = 0; i < registrationsToInsert.length; i += CHUNK_SIZE) {
          const chunkRegs = registrationsToInsert.slice(i, i + CHUNK_SIZE);
          const { error: regErr } = await supabase.from("registrations").insert(chunkRegs);
          if (regErr) throw regErr;
          successCount += chunkRegs.length;
        }

        alert(`✅ Imported ${successCount} fighters successfully! Categories auto-assigned by WAK-1F rules.`);
        setXlsxPreview([]);
        setXlsxFileName("");
        setRefreshKey(prev => prev + 1);
      }
    } catch (err: any) {
      alert("Import error: " + err.message);
    } finally {
      setXlsxImporting(false);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  function handleClearLocalData() {
    if (!confirm("Are you sure you want to clear all local data? This will reset all local championships, registrations, and matches.")) return;
    localStorage.removeItem("kickbox_championships");
    localStorage.removeItem("kickbox_registrations");
    localStorage.removeItem("kickbox_age_categories");
    localStorage.removeItem("kickbox_weight_categories");
    localStorage.removeItem("kickbox_matches");
    setRefreshKey((prev) => prev + 1);
    alert("Local Storage cleared successfully.");
  }

  function handleDownloadPDF() {
    if (!selectedChampId) return;
    const champ = championships.find(c => c.id === selectedChampId);
    const champName = champ ? champ.name : "Kickboxing Championship";

    const champRegs = registrations.filter(r => r.championship_id === selectedChampId);
    
    const divMap: { [key: string]: any } = {};
    champRegs.forEach(reg => {
      const ageCategoryName = getCategoryName(reg.age_categories);
      const weightCategoryName = getCategoryName(reg.weight_categories);
      const key = `${ageCategoryName}-${weightCategoryName}-${reg.gender}`;
      
      if (!divMap[key]) {
        divMap[key] = {
          division_id: key,
          age_category: ageCategoryName,
          gender: reg.gender,
          weight_category: weightCategoryName,
          fighters: [],
          fighter_count: 0,
          bracket_status: "Ready",
          bracket_size: ""
        };
      }
      divMap[key].fighters.push({
        fighter_id: reg.fighter_id,
        full_name: getFighterName(reg.profiles),
        age_category: ageCategoryName,
        gender: reg.gender,
        weight_category: weightCategoryName,
        weight_kg: reg.weight_kg,
        division_id: key
      });
    });

    const divisions = Object.values(divMap).map((d: any) => {
      d.fighter_count = d.fighters.length;
      let count = d.fighter_count;
      let status = "Ready";
      let size = "None";
      if (count <= 0) { status = "Empty"; size = "None"; }
      else if (count === 1) { status = "Waiting"; size = "None"; }
      else if (count === 2) { status = "Ready"; size = "Direct Final"; }
      else if (count <= 4) { status = "Ready"; size = "Semi Final"; }
      else if (count <= 8) { status = "Ready"; size = "Quarter Final"; }
      else if (count <= 16) { status = "Ready"; size = "Round of 16"; }
      else { status = "Ready"; size = `Round of 32`; }
      
      d.bracket_status = status;
      d.bracket_size = size;
      return d;
    });

    const champMatches = matches.filter(m => m.championship_id === selectedChampId);
    
    const formattedMatches: MatchData[] = champMatches.map(m => {
      const categoryPart = m.ring_number?.split(" | CATEGORY:")[1] || "General";
      return {
        id: m.id,
        championship_id: m.championship_id || selectedChampId,
        division_id: categoryPart,
        match_number: m.match_number,
        round_name: m.round_name,
        fighter_a_id: m.fighter_a_id || null,
        fighter_b_id: m.fighter_b_id || null,
        fighter_a_name: getFighterName(m.fighter_a),
        fighter_b_name: getFighterName(m.fighter_b),
        winner_id: m.winner_id || null,
        ring_number: m.ring_number?.split(" | CATEGORY:")[0] || m.ring_number,
        scheduled_at: m.scheduled_at || null,
        status: m.status,
        next_match_id: null,
        next_slot: ""
      };
    });

    generateMatchPDF(divisions, formattedMatches, champName);
  }

  // Helpers to handle profile fields
  function getFighterName(profileField: any) {
    if (!profileField) return "TBD (Bye)";
    if (Array.isArray(profileField)) return profileField[0]?.full_name || "TBD (Bye)";
    return profileField.full_name || "TBD (Bye)";
  }

  // Helper to find registration details for a fighter
  function getFighterRegistrationDetails(fighterId?: string) {
    if (!fighterId) return "";
    const reg = registrations.find(r => r.fighter_id === fighterId);
    if (!reg) return "";
    const age = getCategoryName(reg.age_categories);
    const weight = getCategoryName(reg.weight_categories);
    return `${age} | ${weight}`;
  }

  function getCategoryName(categoryField: any) {
    if (!categoryField) return "General";
    if (Array.isArray(categoryField)) return categoryField[0]?.name || "General";
    return categoryField.name || "General";
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="desktop-sidebar" aria-label="Desktop Admin navigation">
        <div className="mb-md">
          <h3 className="brand-text">Kickbox Admin</h3>
          <p className="sidebar-subtitle">Operations Desk</p>
        </div>

        <nav className="nav-menu">
          <a href="/" className="nav-link" style={{ color: 'var(--text-secondary)' }}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>← Public Site</span>
          </a>

          <button
            className={`nav-link ${activeTab === "championships" ? "active" : ""}`}
            onClick={() => setActiveTab("championships")}
          >
            <span className="material-symbols-outlined">emoji_events</span>
            <span>Championships</span>
          </button>

          <button
            className={`nav-link ${activeTab === "registrations" ? "active" : ""}`}
            onClick={() => setActiveTab("registrations")}
          >
            <span className="material-symbols-outlined">verified_user</span>
            <span>Fighter Registry</span>
          </button>

          <button
            className={`nav-link ${activeTab === "matches" ? "active" : ""}`}
            onClick={() => setActiveTab("matches")}
          >
            <span className="material-symbols-outlined">sports_kabaddi</span>
            <span>Match Control</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handleGenerateBrackets}
            className="btn-primary"
            style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Auto Seed Brackets
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Top Header */}
        <header className="top-header">
          <span className="brand-text">Kickbox Admin Desk</span>
          <div className="header-actions">
            <SupabaseStatus key={refreshKey} />
            <button
              onClick={handleGenerateBrackets}
              className="btn-secondary"
              style={{ fontSize: '13px' }}
            >
              Auto Seed Brackets
            </button>
            <button
              onClick={handleClearAllData}
              style={{
                fontSize: '13px',
                background: 'rgba(255,59,48,0.12)',
                color: 'var(--neo-red)',
                border: '1px solid rgba(255,59,48,0.3)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete_forever</span>
              Clear All Data
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="main-content">
          {activeTab === "championships" && (
            <section className="dashboard-columns admin-cols">
              {/* Form 1: Create Championship */}
              <div className="admin-card">
                <h2 className="admin-title">Create Championship</h2>
                <p className="admin-subtitle">Add a new tournament schedule to the platform database</p>
                <form onSubmit={handleCreateChampionship}>
                  <div className="form-group">
                    <label className="form-label">Championship Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Mumbai Kickboxing Championship 2026"
                      value={newChampName}
                      onChange={(e) => setNewChampName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Venue Location</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Talkatora Stadium, Ring A"
                      value={newChampVenue}
                      onChange={(e) => setNewChampVenue(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                    Publish Championship
                  </button>
                </form>

                {/* Manage Championships List */}
                <div style={{ marginTop: '32px', borderTop: '1px solid var(--slate-light)', paddingTop: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Manage Championships</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {championships.length === 0 ? (
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No championships found.</span>
                    ) : (
                      championships.map((champ) => (
                        <div key={champ.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--midnight)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ minWidth: 0, flex: 1, marginRight: '12px' }}>
                            <strong style={{ display: 'block', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{champ.name}</strong>
                            <small style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{champ.venue}</small>
                          </div>
                          <button
                            onClick={() => handleDeleteChampionship(champ.id)}
                            className="btn-action-small"
                            style={{ backgroundColor: 'var(--neo-red)', color: 'white', padding: '4px 8px', fontSize: '11px', flexShrink: 0, borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Form 2: Configure categories */}
              <div className="admin-card">
                <h2 className="admin-title">Configure Divisions</h2>
                <p className="admin-subtitle">Manage tournament divisions & weight bracket definitions</p>
                
                <div className="form-group">
                  <label className="form-label">Select Championship</label>
                  <select
                    className="form-input"
                    value={selectedChampId}
                    onChange={(e) => setSelectedChampId(e.target.value)}
                  >
                    {championships.map((champ) => (
                      <option key={champ.id} value={champ.id}>{champ.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sub-form 1: Age Category */}
                <form onSubmit={handleCreateAgeCategory} style={{ borderTop: '1px solid var(--slate-light)', paddingTop: '16px', marginTop: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Add Age Division</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Division Name (e.g. Juniors)"
                      value={newAgeName}
                      onChange={(e) => setNewAgeName(e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Min Age"
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value))}
                      required
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Max Age"
                      value={maxAge}
                      onChange={(e) => setMaxAge(Number(e.target.value))}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '13px' }}>
                    Add Age Division
                  </button>
                </form>

                {/* Sub-form 2: Weight Category */}
                <form onSubmit={handleCreateWeightCategory} style={{ borderTop: '1px solid var(--slate-light)', paddingTop: '16px', marginTop: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Add Weight Bracket</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 50-55kg"
                      value={newWeightName}
                      onChange={(e) => setNewWeightName(e.target.value)}
                      required
                    />
                    <select
                      className="form-input"
                      value={weightGender}
                      onChange={(e) => setWeightGender(e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="agnostic">Mixed</option>
                    </select>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Min kg"
                      value={minWeight}
                      onChange={(e) => setMinWeight(Number(e.target.value))}
                      required
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Max kg"
                      value={maxWeight}
                      onChange={(e) => setMaxWeight(Number(e.target.value))}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '13px' }}>
                    Add Weight Bracket
                  </button>
                </form>
              </div>
            </section>
          )}

          {activeTab === "registrations" && (
            <section style={{ minWidth: 0 }}>
              <div className="column-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h2 className="column-title">Fighter Registration Desk</h2>
                  <p className="column-subtitle">Review, approve, or reject pending tournament registrations</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

                </div>
              </div>

              <div className="approvals-panel" style={{ width: '100%' }}>

                {/* ── XLSX Upload Panel ────────────────────────────────────── */}
                <div style={{ background: 'var(--slate)', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Upload Fighter Excel (XLSX)</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>Columns: Name, Age, Gender, Weight (kg), Club, Coach — categories auto-assigned by WAK-1F rules</p>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--neo-red)', color: 'white', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.04em' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
                      Choose .xlsx / .xls
                      <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleXLSXFileChange} />
                    </label>
                  </div>

                  {xlsxPreview.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          📄 <strong style={{ color: 'var(--text-primary)' }}>{xlsxFileName}</strong> — {xlsxPreview.length} fighters parsed
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setXlsxPreview([]); setXlsxFileName(""); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            Discard
                          </button>
                          <button onClick={handleXLSXImport} disabled={xlsxImporting || !selectedChampId} style={{ background: 'var(--success-green)', color: 'white', border: 'none', padding: '6px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: xlsxImporting ? 0.6 : 1 }}>
                            {xlsxImporting ? "Importing…" : `✓ Import ${xlsxPreview.length} Fighters`}
                          </button>
                        </div>
                      </div>
                      <div style={{ overflowX: 'auto', maxHeight: '240px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: 'var(--midnight)', position: 'sticky', top: 0 }}>
                              {['#','Name','Age','Gender','Weight (kg)','Club','Auto Category'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '700', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {xlsxPreview.slice(0, 50).map((f, i) => {
                              const cls = classifyFighterLocal({ fighter_id: String(i), full_name: f.name, age: f.age, gender: f.gender, weight_kg: f.weight });
                              return (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>{i + 1}</td>
                                  <td style={{ padding: '7px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>{f.name}</td>
                                  <td style={{ padding: '7px 12px', color: 'var(--text-primary)' }}>{f.age}</td>
                                  <td style={{ padding: '7px 12px' }}>
                                    <span style={{ background: f.gender === 'Male' ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)', color: f.gender === 'Male' ? '#60a5fa' : '#f472b6', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{f.gender}</span>
                                  </td>
                                  <td style={{ padding: '7px 12px', color: 'var(--text-primary)' }}>{f.weight} kg</td>
                                  <td style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>{f.club || '—'}</td>
                                  <td style={{ padding: '7px 12px' }}>
                                    <span style={{ background: 'rgba(255,149,0,0.15)', color: 'var(--warning-amber)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                      {cls.age_category} · {cls.weight_category} · {cls.gender}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {xlsxPreview.length > 50 && (
                              <tr><td colSpan={7} style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center' }}>…and {xlsxPreview.length - 50} more rows</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                {/* ─────────────────────────────────────────────────────────── */}
                <div className="approvals-list">
                  {registrations.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No fighter registrations found in the database.
                    </div>
                  ) : (
                    registrations.map((reg) => (
                      <div className="approval-item" key={reg.id} style={{ padding: '20px 24px' }}>
                        <div className="approval-fighter-details">
                          <div className="approval-avatar" style={{ width: '56px', height: '56px' }}>
                            <img src={getFighterAvatar(reg.profiles?.id)} alt={getFighterName(reg.profiles)} />
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '16px' }}>
                              {getFighterName(reg.profiles)}
                            </strong>
                            <small style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Division: {getCategoryName(reg.age_categories)} | Weight: {reg.weight_kg}kg ({reg.gender}) | Bracket: {getCategoryName(reg.weight_categories)}
                            </small>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className={`status-badge ${reg.status}`} style={{ fontSize: '11px', padding: '6px 14px' }}>
                            {reg.status}
                          </span>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            {reg.status !== "approved" && (
                              <button
                                onClick={() => handleUpdateRegStatus(reg.id, "approved")}
                                className="btn-action-small"
                                style={{ backgroundColor: 'var(--success-green)' }}
                              >
                                Approve
                              </button>
                            )}
                            {reg.status !== "rejected" && (
                              <button
                                onClick={() => handleUpdateRegStatus(reg.id, "rejected")}
                                className="btn-action-small"
                                style={{ backgroundColor: 'var(--neo-red)' }}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "matches" && (
            <section style={{ minWidth: 0 }}>
              <div className="column-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h2 className="column-title">Ringside Scorekeeper Desk</h2>
                  <p className="column-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    Control and record outcomes for scheduled bracket matches
                    <span style={{ fontSize: '11px', color: 'var(--success-green)', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(52,199,89,0.08)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(52,199,89,0.15)', fontWeight: 'bold' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
                      💡 Click any fighter in a match to record winner
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {matches.length > 0 && (() => {
                    const activeMatchKeys = Array.from(new Set(matches.map(m => m.ring_number?.split(" | CATEGORY:")[1]).filter(Boolean)));
                    
                    const uniqueAges = Array.from(new Set(
                      activeMatchKeys.map(k => {
                        const reg = registrations.find(r => `${r.age_category_id}-${r.weight_category_id}-${r.gender.toLowerCase()}` === k.toLowerCase());
                        return reg?.age_categories?.name || null;
                      }).filter((a): a is string => !!a)
                    )).sort();

                    const uniqueGenders = Array.from(new Set(
                      activeMatchKeys.map(k => {
                        const reg = registrations.find(r => `${r.age_category_id}-${r.weight_category_id}-${r.gender.toLowerCase()}` === k.toLowerCase());
                        return reg?.gender || null;
                      }).filter((g): g is string => !!g)
                    )).map(g => g.toLowerCase());

                    const uniqueWeights = Array.from(new Set(
                      activeMatchKeys.map(k => {
                        const reg = registrations.find(r => `${r.age_category_id}-${r.weight_category_id}-${r.gender.toLowerCase()}` === k.toLowerCase());
                        return reg?.weight_categories?.name || null;
                      }).filter((w): w is string => !!w)
                    )).sort((a, b) => {
                      const numA = parseFloat(a.replace(/[^\d.-]/g, '')) || 0;
                      const numB = parseFloat(b.replace(/[^\d.-]/g, '')) || 0;
                      return numA - numB;
                    });

                    return (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Age Category Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.05em' }}>Age Category</span>
                          <select
                            value={selectedMatchAge}
                            onChange={(e) => setSelectedMatchAge(e.target.value)}
                            className="form-input"
                            style={{ width: 'auto', minWidth: '150px', padding: '6px 10px', fontSize: '12px', height: '34px', backgroundColor: 'var(--midnight)', borderColor: 'rgba(255,255,255,0.12)', color: 'var(--text-primary)' }}
                          >
                            <option value="all">All Ages</option>
                            {uniqueAges.map(age => (
                              <option key={age} value={age}>{age}</option>
                            ))}
                          </select>
                        </div>

                        {/* Gender Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.05em' }}>Gender</span>
                          <select
                            value={selectedMatchGender}
                            onChange={(e) => setSelectedMatchGender(e.target.value)}
                            className="form-input"
                            style={{ width: 'auto', minWidth: '120px', padding: '6px 10px', fontSize: '12px', height: '34px', backgroundColor: 'var(--midnight)', borderColor: 'rgba(255,255,255,0.12)', color: 'var(--text-primary)' }}
                          >
                            <option value="all">All Genders</option>
                            {uniqueGenders.map(g => (
                              <option key={g} value={g}>{g === 'male' || g === 'm' ? 'Male' : 'Female'}</option>
                            ))}
                          </select>
                        </div>

                        {/* Weight Category Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.05em' }}>Weight</span>
                          <select
                            value={selectedMatchWeight}
                            onChange={(e) => setSelectedMatchWeight(e.target.value)}
                            className="form-input"
                            style={{ width: 'auto', minWidth: '130px', padding: '6px 10px', fontSize: '12px', height: '34px', backgroundColor: 'var(--midnight)', borderColor: 'rgba(255,255,255,0.12)', color: 'var(--text-primary)' }}
                          >
                            <option value="all">All Weights</option>
                            {uniqueWeights.map(w => (
                              <option key={w} value={w}>{w}</option>
                            ))}
                          </select>
                        </div>

                        {(selectedMatchAge !== "all" || selectedMatchGender !== "all" || selectedMatchWeight !== "all") && (
                          <button
                            onClick={() => {
                              setSelectedMatchAge("all");
                              setSelectedMatchGender("all");
                              setSelectedMatchWeight("all");
                            }}
                            className="btn-action-small"
                            style={{ alignSelf: 'flex-end', height: '34px', padding: '0 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restart_alt</span>
                            Reset
                          </button>
                        )}
                      </div>
                    );
                  })()}
                  {matches.length > 0 && (
                    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--midnight)', height: '38px', marginRight: '8px' }}>
                      <button
                        onClick={() => setMatchViewMode("bracket")}
                        style={{
                          height: '100%',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0 16px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: matchViewMode === "bracket" ? 'var(--neo-red)' : 'transparent',
                          color: '#FFFFFF',
                          fontWeight: 'bold'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schema</span>
                        Bracket Tree
                      </button>
                      <button
                        onClick={() => setMatchViewMode("list")}
                        style={{
                          height: '100%',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0 16px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: matchViewMode === "list" ? 'var(--neo-red)' : 'transparent',
                          color: '#FFFFFF',
                          fontWeight: 'bold'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>list</span>
                        List View
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleDownloadPDF}
                    className="btn-primary"
                    style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
                    disabled={matches.length === 0}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
                    Download Match Schedule PDF
                  </button>
                </div>
              </div>

              <div className="schedule-list">
                {matches.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', background: 'var(--slate)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                    No matches generated. Set up tournament divisions, approve fighters, and click "Auto Seed Brackets"!
                  </div>
                ) : (() => {
                  // Group matches by category key (from ring_number CATEGORY: tag)
                  const catGroups: { [key: string]: typeof matches } = {};
                  matches.forEach(m => {
                    const catKey = m.ring_number?.split(" | CATEGORY:")[1] || "General";
                    if (!catGroups[catKey]) catGroups[catKey] = [];
                    catGroups[catKey].push(m);
                  });

                  // Helper to get fighter name or waiting/feeder match label
                  function getFighterLabel(m: Match, side: 'a' | 'b') {
                    const id = side === 'a' ? m.fighter_a_id : m.fighter_b_id;
                    const profile = side === 'a' ? m.fighter_a : m.fighter_b;
                    if (id) {
                      return profile?.full_name || "Unknown Fighter";
                    }

                    // No fighter assigned yet. Let's find feeder match info
                    const categoryPart = m.ring_number?.split(" | CATEGORY:")[1] || "";
                    if (!categoryPart) return "TBD";
                    
                    const siblingMatches = matches
                      .filter((sm: any) => sm.championship_id === m.championship_id && (sm.ring_number?.split(" | CATEGORY:")[1] || "") === categoryPart)
                      .sort((x, y) => x.match_number - y.match_number);

                    const currentIndex = siblingMatches.findIndex((sm: any) => sm.id === m.id);
                    if (currentIndex === -1) return "TBD";

                    // Rebuild round sizes/starts
                    const totalMatches = siblingMatches.length;
                    const frs = Math.round((totalMatches + 1) / 2);
                    const roundSizes: number[] = [];
                    let sz = frs;
                    while (sz >= 1) { roundSizes.push(sz); sz = Math.floor(sz / 2); }
                    
                    const roundStarts: number[] = [];
                    let acc = 0;
                    for (const s of roundSizes) { roundStarts.push(acc); acc += s; }

                    // Find round index of currentIndex
                    let roundIdx = -1;
                    for (let r = 0; r < roundSizes.length; r++) {
                      if (currentIndex >= roundStarts[r] && currentIndex < roundStarts[r] + roundSizes[r]) {
                        roundIdx = r;
                        break;
                      }
                    }

                    // First round with no fighter_id is a Bye/TBD
                    if (roundIdx <= 0) return "TBD (Bye)";

                    // Subsequent rounds have feeder matches in the previous round
                    const offset = currentIndex - roundStarts[roundIdx];
                    const feederIdx = roundStarts[roundIdx - 1] + offset * 2 + (side === 'a' ? 0 : 1);
                    if (feederIdx < siblingMatches.length) {
                      const feeder = siblingMatches[feederIdx];
                      let roundShort = feeder.round_name;
                      if (feeder.round_name === "Quarter Final") roundShort = "QF";
                      else if (feeder.round_name === "Semi Final") roundShort = "SF";
                      else if (feeder.round_name === "Final") roundShort = "Final";
                      return `Waiting for ${roundShort} Match #${feeder.match_number}`;
                    }
                    return "TBD";
                  }

                  // Helper to get advanced round description
                  function getAdvanceRoundText(matchId: string) {
                    const currentMatchIndex = matches.findIndex(m => m.id === matchId);
                    if (currentMatchIndex === -1) return "Advanced";
                    const currentMatch = matches[currentMatchIndex];
                    
                    const categoryPart = currentMatch.ring_number?.split(" | CATEGORY:")[1] || "";
                    const siblingMatches = matches
                      .filter((sm: any) => sm.championship_id === currentMatch.championship_id && (sm.ring_number?.split(" | CATEGORY:")[1] || "") === categoryPart)
                      .sort((x, y) => x.match_number - y.match_number);
                      
                    const currentIndex = siblingMatches.findIndex((sm: any) => sm.id === matchId);
                    if (currentIndex === -1) return "Advanced";
                    
                    const totalMatches = siblingMatches.length;
                    const frs = Math.round((totalMatches + 1) / 2);
                    const roundSizes: number[] = [];
                    let sz = frs;
                    while (sz >= 1) { roundSizes.push(sz); sz = Math.floor(sz / 2); }
                    
                    const roundStarts: number[] = [];
                    let acc = 0;
                    for (const s of roundSizes) { roundStarts.push(acc); acc += s; }
                    
                    let roundIdx = -1;
                    for (let r = 0; r < roundSizes.length; r++) {
                      if (currentIndex >= roundStarts[r] && currentIndex < roundStarts[r] + roundSizes[r]) {
                        roundIdx = r;
                        break;
                      }
                    }
                    
                    if (roundIdx !== -1 && roundIdx + 1 < roundSizes.length) {
                      const offset = currentIndex - roundStarts[roundIdx];
                      const nextSiblingIdx = roundStarts[roundIdx + 1] + Math.floor(offset / 2);
                      if (nextSiblingIdx < siblingMatches.length) {
                        const nextMatch = siblingMatches[nextSiblingIdx];
                        return `Advanced to ${nextMatch.round_name}`;
                      }
                    }
                    return "Champion! 🏆";
                  }

                  // Progress bar helper for visual state
                  function renderCategoryProgressBar(catMatchesList: typeof matches) {
                    const roundMap: Record<string, { total: number; done: number }> = {};
                    const roundNamesOrder = ["Round 1", "Round 2", "Round 3", "Round 4", "Quarter Final", "Semi Final", "Final"];
                    
                    catMatchesList.forEach(m => {
                      if (!roundMap[m.round_name]) {
                        roundMap[m.round_name] = { total: 0, done: 0 };
                      }
                      roundMap[m.round_name].total += 1;
                      if (m.status === "completed" || m.status === "walkover") {
                        roundMap[m.round_name].done += 1;
                      }
                    });

                    const presentRounds = Object.keys(roundMap).sort((a, b) => {
                      return (roundNamesOrder.indexOf(a) ?? 99) - (roundNamesOrder.indexOf(b) ?? 99);
                    });

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }}>
                        {presentRounds.map((rName, idx) => {
                          const { total, done } = roundMap[rName];
                          const dots = [];
                          for (let i = 0; i < total; i++) {
                            dots.push(i < done ? "●" : "○");
                          }
                          let shortName = rName;
                          if (rName === "Quarter Final") shortName = "QF";
                          else if (rName === "Semi Final") shortName = "SF";
                          else if (rName === "Final") shortName = "Final";
                          else if (rName.startsWith("Round ")) shortName = "R" + rName.split(" ")[1];

                          return (
                            <span key={rName} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{shortName}</span>
                              <span style={{ letterSpacing: '1.5px', color: 'var(--warning-amber)', fontSize: '12px' }}>{dots.join("")}</span>
                              {idx < presentRounds.length - 1 && <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 4px' }}>→</span>}
                            </span>
                          );
                        })}
                      </div>
                    );
                  }

                  // Round order for sorting
                  const ROUND_ORDER: Record<string, number> = {
                    "Round 1": 1, "Round 2": 2, "Round 3": 3, "Round 4": 4,
                    "Quarter Final": 5, "Semi Final": 6, "Final": 7
                  };

                  const filteredGroups = Object.entries(catGroups).filter(([catKey]) => {
                    const reg = registrations.find(r => `${r.age_category_id}-${r.weight_category_id}-${r.gender.toLowerCase()}` === catKey.toLowerCase());
                    if (!reg) return true;
                    
                    const ageName = reg.age_categories?.name;
                    const weightName = reg.weight_categories?.name;
                    const gender = reg.gender.toLowerCase();

                    if (selectedMatchAge !== "all" && ageName !== selectedMatchAge) return false;
                    if (selectedMatchGender !== "all" && gender !== selectedMatchGender.toLowerCase()) return false;
                    if (selectedMatchWeight !== "all" && weightName !== selectedMatchWeight) return false;
                    
                    return true;
                  });

                  return filteredGroups.map(([catKey, catMatches]) => {
                    const sortedMatches = [...catMatches].sort((a, b) =>
                      (ROUND_ORDER[a.round_name] ?? 99) - (ROUND_ORDER[b.round_name] ?? 99) ||
                      a.match_number - b.match_number
                    );
                    const doneCount = catMatches.filter(m => m.status === "completed" || m.status === "walkover").length;
                    const totalCount = catMatches.length;
                    const allDone = doneCount === totalCount;

                    return (
                      <div key={catKey} style={{ marginBottom: '24px', background: 'var(--slate)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        {/* Category Header */}
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--midnight)', padding: '16px 20px', borderBottom: '2px solid var(--neo-red)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--neo-red)' }}>military_tech</span>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                                  {getDivisionLabel(catKey)}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  {totalCount} matches · {catMatches.filter(m => m.fighter_a_id || m.fighter_b_id).length} active fighter slots
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ fontSize: '12px', color: allDone ? 'var(--success-green)' : 'var(--warning-amber)', fontWeight: '700' }}>
                                {doneCount}/{totalCount} done
                              </div>
                              <div style={{ width: '80px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)' }}>
                                <div style={{ width: `${(doneCount / totalCount) * 100}%`, height: '100%', borderRadius: '3px', background: allDone ? 'var(--success-green)' : 'var(--neo-red)', transition: 'width 0.3s' }} />
                              </div>
                            </div>
                          </div>

                          {/* Visual Progress Bar */}
                          {renderCategoryProgressBar(catMatches)}
                        </div>

                        {/* Matches in this category */}
                        {matchViewMode === "bracket" ? (() => {
                          const roundGroups: { [key: string]: typeof catMatches } = {};
                          catMatches.forEach(m => {
                            const rName = m.round_name || "General";
                            if (!roundGroups[rName]) roundGroups[rName] = [];
                            roundGroups[rName].push(m);
                          });

                          function getRoundPriority(roundName: string): number {
                            const name = roundName.toLowerCase();
                            if (name.includes("round 1") || name.includes("round of 16")) return 1;
                            if (name.includes("quarter") || name.includes("qf")) return 2;
                            if (name.includes("semi") || name.includes("sf")) return 3;
                            if (name.includes("final")) return 4;
                            return 99;
                          }

                          const sortedRoundNames = Object.keys(roundGroups).sort((a, b) => {
                            const prioA = getRoundPriority(a);
                            const prioB = getRoundPriority(b);
                            if (prioA !== prioB) return prioA - prioB;
                            return a.localeCompare(b);
                          });

                          return (
                            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', padding: '24px 20px', background: 'var(--midnight)', borderTop: '1px solid rgba(255,255,255,0.03)' }} className="custom-scrollbar">
                              {sortedRoundNames.map((rName) => {
                                const roundMatches = [...roundGroups[rName]].sort((a, b) => a.match_number - b.match_number);
                                return (
                                  <div key={rName} style={{ display: 'flex', flexDirection: 'column', width: '280px', flexShrink: 0 }}>
                                    {/* Round Header */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--neo-red)', marginBottom: '16px' }}>
                                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase' }}>{rName}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}</div>
                                    </div>

                                    {/* Round Matches List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '20px', flex: 1, minHeight: '380px' }}>
                                      {roundMatches.map((match) => {
                                        const fighterAName = getFighterLabel(match, 'a');
                                        const fighterBName = getFighterLabel(match, 'b');
                                        const isCompleted = match.status === "completed" || match.status === "walkover";
                                        const isLive = match.status === "live" || match.status === "ongoing";
                                        const winA = !!match.winner_id && match.winner_id === match.fighter_a_id;
                                        const winB = !!match.winner_id && match.winner_id === match.fighter_b_id;

                                        return (
                                          <div
                                            key={match.id}
                                            style={{
                                              background: 'var(--slate)',
                                              border: isLive ? '2px solid var(--neo-red)' : '1px solid rgba(255,255,255,0.06)',
                                              borderRadius: '10px',
                                              overflow: 'hidden',
                                              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                              position: 'relative'
                                            }}
                                          >
                                            {/* Match Badge / Number */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)' }}>MATCH #{match.match_number}</span>
                                              {isLive && (
                                                <span style={{ fontSize: '9px', fontWeight: '800', color: '#FFFFFF', background: 'var(--neo-red)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>LIVE</span>
                                              )}
                                              {isCompleted && (
                                                <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--success-green)', textTransform: 'uppercase' }}>DONE</span>
                                              )}
                                            </div>

                                            {/* Fighters Pairing */}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                              {/* Fighter A */}
                                              <div
                                                onClick={() => {
                                                  if (!isCompleted && match.fighter_a_id && match.fighter_b_id) {
                                                    if (confirm(`Mark ${fighterAName} as the winner of Match #${match.match_number}?`)) {
                                                      handleRecordWinner(match.id, match.fighter_a_id);
                                                    }
                                                  }
                                                }}
                                                className={(!isCompleted && match.fighter_a_id && match.fighter_b_id) ? "fighter-slot-clickable" : ""}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  padding: '10px 12px',
                                                  background: winA ? 'rgba(52,199,89,0.05)' : 'transparent',
                                                  borderBottom: '1px solid rgba(255,255,255,0.03)'
                                                }}
                                                title={(!isCompleted && match.fighter_a_id && match.fighter_b_id) ? "Click to set as winner" : ""}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                  <img
                                                    src={getFighterAvatar(match.fighter_a_id || undefined)}
                                                    alt=""
                                                    style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                                  />
                                                  <span style={{ fontSize: '13px', fontWeight: winA ? '700' : '500', color: winA ? 'var(--success-green)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {fighterAName}
                                                  </span>
                                                </div>
                                                {winA && <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--success-green)' }}>emoji_events</span>}
                                              </div>

                                              {/* Fighter B */}
                                              <div
                                                onClick={() => {
                                                  if (!isCompleted && match.fighter_a_id && match.fighter_b_id) {
                                                    if (confirm(`Mark ${fighterBName} as the winner of Match #${match.match_number}?`)) {
                                                      handleRecordWinner(match.id, match.fighter_b_id);
                                                    }
                                                  }
                                                }}
                                                className={(!isCompleted && match.fighter_a_id && match.fighter_b_id) ? "fighter-slot-clickable" : ""}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  padding: '10px 12px',
                                                  background: winB ? 'rgba(52,199,89,0.05)' : 'transparent'
                                                }}
                                                title={(!isCompleted && match.fighter_a_id && match.fighter_b_id) ? "Click to set as winner" : ""}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                  <img
                                                    src={getFighterAvatar(match.fighter_b_id || undefined)}
                                                    alt=""
                                                    style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                                  />
                                                  <span style={{ fontSize: '13px', fontWeight: winB ? '700' : '500', color: winB ? 'var(--success-green)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {fighterBName}
                                                  </span>
                                                </div>
                                                {winB && <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--success-green)' }}>emoji_events</span>}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })() : (
                          sortedMatches.map((match) => {
                            const fighterAName = getFighterLabel(match, 'a');
                            const fighterBName = getFighterLabel(match, 'b');
                            const winnerName = match.winner_id === match.fighter_a_id ? fighterAName : fighterBName;
                            const isCompleted = match.status === "completed" || match.status === "walkover";
                            const ringLabel = match.ring_number?.split(" | CATEGORY:")[0] || "Ring 1";

                            return (
                              <div className="match-row" key={match.id} style={{ padding: '18px 20px', borderRadius: 0, borderBottom: '1px solid rgba(255,255,255,0.03)', borderLeft: `3px solid ${isCompleted ? 'var(--success-green)' : 'transparent'}` }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginRight: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontWeight: 'bold' }}>
                                  #{match.match_number}
                                </div>
                                
                                <div className="fighter-pairing" style={{ flex: 1.5 }}>
                                  {/* Fighter A details card */}
                                  <div
                                    onClick={() => {
                                      if (!isCompleted && match.fighter_a_id && match.fighter_b_id) {
                                        if (confirm(`Mark ${fighterAName} as the winner of Match #${match.match_number}?`)) {
                                          handleRecordWinner(match.id, match.fighter_a_id);
                                        }
                                      }
                                    }}
                                    className={`fighter-details ${(!isCompleted && match.fighter_a_id && match.fighter_b_id) ? "fighter-slot-clickable" : ""}`}
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      background: (!!match.winner_id && match.winner_id === match.fighter_a_id) ? 'rgba(52,199,89,0.08)' : 'transparent',
                                    }}
                                    title={(!isCompleted && match.fighter_a_id && match.fighter_b_id) ? "Click to set as winner" : ""}
                                  >
                                    <div className="fighter-pic">
                                      <img src={getFighterAvatar(match.fighter_a_id || undefined)} alt={fighterAName} />
                                    </div>
                                    <div className="fighter-info">
                                      <strong style={{ color: (!!match.winner_id && match.winner_id === match.fighter_a_id) ? 'var(--success-green)' : 'var(--text-primary)' }}>{fighterAName}</strong>
                                      <small>{getFighterRegistrationDetails(match.fighter_a_id || undefined) || ""}</small>
                                    </div>
                                    {!!match.winner_id && match.winner_id === match.fighter_a_id && (
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--success-green)', marginLeft: '8px' }}>emoji_events</span>
                                    )}
                                  </div>
                                  <div className="vs-divider">VS</div>
                                  {/* Fighter B details card */}
                                  <div
                                    onClick={() => {
                                      if (!isCompleted && match.fighter_a_id && match.fighter_b_id) {
                                        if (confirm(`Mark ${fighterBName} as the winner of Match #${match.match_number}?`)) {
                                          handleRecordWinner(match.id, match.fighter_b_id);
                                        }
                                      }
                                    }}
                                    className={`fighter-details right ${(!isCompleted && match.fighter_a_id && match.fighter_b_id) ? "fighter-slot-clickable" : ""}`}
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      background: (!!match.winner_id && match.winner_id === match.fighter_b_id) ? 'rgba(52,199,89,0.08)' : 'transparent',
                                    }}
                                    title={(!isCompleted && match.fighter_a_id && match.fighter_b_id) ? "Click to set as winner" : ""}
                                  >
                                    {!!match.winner_id && match.winner_id === match.fighter_b_id && (
                                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--success-green)', marginRight: '8px' }}>emoji_events</span>
                                    )}
                                    <div className="fighter-pic">
                                      <img src={getFighterAvatar(match.fighter_b_id || undefined)} alt={fighterBName} />
                                    </div>
                                    <div className="fighter-info">
                                      <strong style={{ color: (!!match.winner_id && match.winner_id === match.fighter_b_id) ? 'var(--success-green)' : 'var(--text-primary)' }}>{fighterBName}</strong>
                                      <small>{getFighterRegistrationDetails(match.fighter_b_id || undefined) || ""}</small>
                                    </div>
                                  </div>
                                </div>

                                <div className="ring-round-info" style={{ flex: 1.2, borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '20px' }}>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span className="ring-label">{ringLabel}</span>
                                    <span className="round-label" style={{ background: match.round_name === "Final" ? 'rgba(255,149,0,0.15)' : match.round_name === "Semi Final" ? 'rgba(255,59,48,0.1)' : 'rgba(255,255,255,0.05)', color: match.round_name === "Final" ? 'var(--warning-amber)' : match.round_name === "Semi Final" ? 'var(--neo-red)' : 'var(--text-secondary)' }}>
                                      {match.round_name}
                                    </span>
                                  </div>
                                  {isCompleted ? (
                                    <span style={{ fontSize: '12px', color: 'var(--success-green)', fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>emoji_events</span>
                                      {winnerName} → {getAdvanceRoundText(match.id)}
                                    </span>
                                  ) : (
                                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                      {match.fighter_a_id && match.fighter_b_id ? "💡 Click fighter to select winner." : "Waiting for opponents..."}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Tabs">
        <button
          className={`bottom-nav-btn ${activeTab === "championships" ? "active" : ""}`}
          onClick={() => setActiveTab("championships")}
        >
          <span className="material-symbols-outlined">emoji_events</span>
          <span className="tab-label">Config</span>
        </button>

        <button
          className={`bottom-nav-btn ${activeTab === "registrations" ? "active" : ""}`}
          onClick={() => setActiveTab("registrations")}
        >
          <span className="material-symbols-outlined">verified_user</span>
          <span className="tab-label">Fighters</span>
        </button>

        <button
          className={`bottom-nav-btn ${activeTab === "matches" ? "active" : ""}`}
          onClick={() => setActiveTab("matches")}
        >
          <span className="material-symbols-outlined">sports_kabaddi</span>
          <span className="tab-label">Matches</span>
        </button>

        <button
          className="bottom-nav-btn"
          onClick={() => window.location.href = "/"}
        >
          <span className="material-symbols-outlined">home</span>
          <span className="tab-label">Public</span>
        </button>
      </nav>
    </div>
  );
}
