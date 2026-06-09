// Go backend API client for Kickbox Classification Engine

const GO_API_BASE = process.env.NEXT_PUBLIC_GO_API_URL || "http://localhost:8080";

export interface Fighter {
  fighter_id: string;
  full_name: string;
  age: number;
  gender: string;
  weight_kg: number;
  gym_club?: string;
  coach_name?: string;
  phone?: string;
  email?: string;
  experience_level?: string;
  style?: string;
}

export interface ClassificationResult {
  fighter_id: string;
  full_name: string;
  age_category: string;
  age_category_code: string;
  gender: string;
  gender_code: string;
  weight_category: string;
  weight_kg: number;
  division_id: string;
}

export interface DivisionGroup {
  division_id: string;
  age_category: string;
  gender: string;
  weight_category: string;
  fighters: ClassificationResult[];
  fighter_count: number;
  bracket_status: string;
  bracket_size: string;
}

export interface BulkClassifyResponse {
  classified: ClassificationResult[];
  divisions: DivisionGroup[];
  total: number;
}

export interface MatchData {
  id: string;
  championship_id: string;
  division_id: string;
  match_number: number;
  round_name: string;
  fighter_a_id: string | null;
  fighter_b_id: string | null;
  fighter_a_name: string;
  fighter_b_name: string;
  winner_id: string | null;
  ring_number: string;
  scheduled_at: string | null;
  status: string;
  next_match_id: string | null;
  next_slot: string;
}

export interface BracketGenerateResponse {
  matches: MatchData[];
  summary: {
    total_divisions: number;
    total_matches: number;
    divisions: DivisionGroup[];
  };
}

// Classify a single fighter
export async function classifyFighter(fighter: Fighter): Promise<ClassificationResult> {
  const res = await fetch(`${GO_API_BASE}/api/v1/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fighter),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Classify multiple fighters and get division groupings
export async function classifyBulk(
  championshipId: string,
  fighters: Fighter[]
): Promise<BulkClassifyResponse> {
  const res = await fetch(`${GO_API_BASE}/api/v1/classify/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ championship_id: championshipId, fighters }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Generate brackets from classified divisions
export async function generateBrackets(
  championshipId: string,
  divisions: DivisionGroup[]
): Promise<BracketGenerateResponse> {
  const res = await fetch(`${GO_API_BASE}/api/v1/brackets/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ championship_id: championshipId, divisions }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Record match winner and auto-advance
export async function recordWinner(
  matches: MatchData[],
  matchId: string,
  winnerId: string
): Promise<{ updated_match: MatchData; next_match?: MatchData; all_matches: MatchData[] }> {
  const res = await fetch(`${GO_API_BASE}/api/v1/matches/winner`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matches, match_id: matchId, winner_id: winnerId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Check Go backend health
export async function checkHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${GO_API_BASE}/health`);
  if (!res.ok) throw new Error("Backend unavailable");
  return res.json();
}

// Client-side classification (fallback when Go backend is not available)
export interface AgeCategoryRule {
  name: string;
  code: string;
  minAge: number;
  maxAge: number;
  weights: number[];
}

export const WAK1F_AGE_CATEGORIES: AgeCategoryRule[] = [
  { name: "9-10", code: "A1", minAge: 9, maxAge: 10, weights: [21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54] },
  { name: "11-12", code: "A2", minAge: 11, maxAge: 12, weights: [24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 55, 60] },
  { name: "13-14", code: "A3", minAge: 13, maxAge: 14, weights: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 63, 67, 68] },
  { name: "15-16", code: "A4", minAge: 15, maxAge: 16, weights: [45, 48, 51, 54, 57, 60, 63, 66, 70, 75, 80, 85] },
  { name: "17-18", code: "A5", minAge: 17, maxAge: 18, weights: [45, 48, 51, 54, 57, 60, 63, 66, 70, 75, 80, 85] },
  { name: "19+", code: "SR", minAge: 19, maxAge: 999, weights: [48, 51, 54, 57, 60, 63.5, 67, 71, 76, 81, 86, 91] },
];

export function classifyFighterLocal(fighter: Fighter): ClassificationResult {
  // Determine age category rule
  let matchedCat = WAK1F_AGE_CATEGORIES[WAK1F_AGE_CATEGORIES.length - 1];
  for (const cat of WAK1F_AGE_CATEGORIES) {
    if (fighter.age >= cat.minAge && fighter.age <= cat.maxAge) {
      matchedCat = cat;
      break;
    }
  }

  // Gender
  const genderLower = fighter.gender.toLowerCase();
  const genderCode = genderLower === "male" || genderLower === "m" ? "M" : "F";
  const gender = genderCode === "M" ? "Male" : "Female";

  // Weight category
  const w = fighter.weight_kg;
  const weights = matchedCat.weights;
  let weightLabel = "";

  if (weights.length > 0) {
    if (w <= weights[0]) {
      weightLabel = `-${weights[0]}`;
    } else {
      let found = false;
      for (let i = 1; i < weights.length; i++) {
        // 100g overweight tolerance per WAK-1F
        if (w <= weights[i] + 0.1) {
          weightLabel = `-${weights[i]}`;
          found = true;
          break;
        }
      }
      if (!found) {
        const last = weights[weights.length - 1];
        weightLabel = `${last}+`;
      }
    }
  }

  const weightCategory = `${weightLabel} kg`;
  const weightNum = extractWeightNumber(weightLabel);
  const divisionId = `${matchedCat.code}-${genderCode}-${weightNum}`;

  return {
    fighter_id: fighter.fighter_id,
    full_name: fighter.full_name,
    age_category: matchedCat.name,
    age_category_code: matchedCat.code,
    gender,
    gender_code: genderCode,
    weight_category: weightCategory,
    weight_kg: fighter.weight_kg,
    division_id: divisionId,
  };
}

function extractWeightNumber(label: string): string {
  let clean = label.trim().replace(/\s*kg/gi, "");
  if (clean.startsWith("-")) {
    clean = clean.substring(1);
  }
  if (clean.endsWith("+")) {
    const numStr = clean.slice(0, -1);
    const val = parseFloat(numStr);
    if (!isNaN(val)) {
      return Math.ceil(val).toString() + "P";
    }
    return numStr + "P";
  }
  const val = parseFloat(clean);
  if (!isNaN(val)) {
    return Math.ceil(val).toString();
  }
  return clean;
}


// Client-side bulk classification (fallback)
export function classifyBulkLocal(fighters: Fighter[]): BulkClassifyResponse {
  const classified = fighters.map(f => classifyFighterLocal(f));

  const divMap: { [key: string]: DivisionGroup } = {};
  for (const c of classified) {
    if (!divMap[c.division_id]) {
      divMap[c.division_id] = {
        division_id: c.division_id,
        age_category: c.age_category,
        gender: c.gender,
        weight_category: c.weight_category,
        fighters: [],
        fighter_count: 0,
        bracket_status: "",
        bracket_size: "",
      };
    }
    divMap[c.division_id].fighters.push(c);
  }

  const divisions = Object.values(divMap).map(d => {
    d.fighter_count = d.fighters.length;
    const { status, size } = determineBracketSize(d.fighter_count);
    d.bracket_status = status;
    d.bracket_size = size;
    return d;
  });

  return { classified, divisions, total: classified.length };
}

function determineBracketSize(count: number): { status: string; size: string } {
  if (count <= 0) return { status: "Empty", size: "None" };
  if (count === 1) return { status: "Waiting", size: "None" };
  if (count === 2) return { status: "Ready", size: "Direct Final" };
  if (count <= 4) return { status: "Ready", size: "Semi Final" };
  if (count <= 8) return { status: "Ready", size: "Quarter Final" };
  if (count <= 16) return { status: "Ready", size: "Round of 16" };
  if (count <= 32) return { status: "Ready", size: "Round of 32" };
  return { status: "Ready", size: `Round of ${nextPow2(count)}` };
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function formatDivisionKey(divKey: string): string {
  const parts = divKey.split("-");
  if (parts.length >= 3) {
    const ageCode = parts[0];
    const genderCode = parts[1];
    const weightNum = parts[2];

    const ageMap: Record<string, string> = {
      "A1": "Age 9-10",
      "A2": "Age 11-12",
      "A3": "Age 13-14",
      "A4": "Age 15-16",
      "A5": "Age 17-18",
      "SR": "Age 19+"
    };
    const ageLabel = ageMap[ageCode] || ageCode;
    const genderLabel = genderCode === "M" ? "Male" : genderCode === "F" ? "Female" : genderCode;
    
    let weightLabel = weightNum;
    if (weightNum.endsWith("P")) {
      weightLabel = `${weightNum.slice(0, -1)}+ kg`;
    } else {
      weightLabel = `-${weightNum} kg`;
    }
    return `${genderLabel.toUpperCase()} · ${ageLabel.toUpperCase()} · ${weightLabel.toUpperCase()}`;
  }
  return divKey.toUpperCase();
}

// Generate PDF for match/bracket data
export function generateMatchPDF(
  divisions: DivisionGroup[],
  matches: MatchData[],
  championshipName: string
): void {
  // Build HTML content for PDF
  let html = `
    <html>
    <head>
      <title>${championshipName} - Match Schedule</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1a1a1a; }
        h1 { font-size: 22px; text-align: center; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 24px; }
        .division { margin-bottom: 28px; page-break-inside: avoid; }
        .division-header { background: #1a1a1a; color: white; padding: 8px 14px; border-radius: 6px 6px 0 0; font-size: 14px; font-weight: 700; }
        .division-meta { background: #f0f0f0; padding: 6px 14px; font-size: 12px; color: #555; border-bottom: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f8f8f8; padding: 8px 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 700; }
        td { padding: 7px 10px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #fafafa; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
        .badge-waiting { background: #fff3cd; color: #856404; }
        .badge-ready { background: #d4edda; color: #155724; }
        .badge-completed { background: #d1ecf1; color: #0c5460; }
        .winner { color: #28a745; font-weight: 700; }
        .fighters-list { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 14px; }
        .fighter-chip { background: #e9ecef; padding: 3px 10px; border-radius: 12px; font-size: 11px; }
        .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
        @media print { .no-print { display: none; } body { padding: 12px; } }
      </style>
    </head>
    <body>
      <h1>🥊 ${championshipName}</h1>
      <p class="subtitle">Auto-Generated Match Schedule & Bracket Report • ${new Date().toLocaleDateString()}</p>
  `;

  // Division summary
  if (divisions.length > 0) {
    html += `<h2 style="font-size:16px; margin-bottom:12px;">Division Summary (${divisions.length} divisions, ${divisions.reduce((s, d) => s + d.fighter_count, 0)} fighters)</h2>`;
    for (const div of divisions) {
      html += `
        <div class="division">
          <div class="division-header">${formatDivisionKey(div.division_id)}</div>
          <div class="division-meta">
            Fighters: ${div.fighter_count} • Bracket: <span class="badge badge-${div.bracket_status.toLowerCase()}">${div.bracket_size}</span>
          </div>
          <div class="fighters-list">
            ${div.fighters.map(f => `<span class="fighter-chip">${f.full_name} (${f.weight_kg}kg)</span>`).join("")}
          </div>
        </div>
      `;
    }
  }

  // Match schedule
  if (matches.length > 0) {
    // Group by division
    const matchByDiv: { [key: string]: MatchData[] } = {};
    for (const m of matches) {
      const key = m.division_id || "General";
      if (!matchByDiv[key]) matchByDiv[key] = [];
      matchByDiv[key].push(m);
    }

    html += `<h2 style="font-size:16px; margin: 24px 0 12px;">Match Schedule (${matches.length} matches)</h2>`;
    for (const [divId, divMatches] of Object.entries(matchByDiv)) {
      html += `
        <div class="division">
          <div class="division-header">${formatDivisionKey(divId)}</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Round</th>
                <th>Fighter A</th>
                <th>VS</th>
                <th>Fighter B</th>
                <th>Ring</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${divMatches.map(m => `
                <tr>
                  <td>${m.match_number}</td>
                  <td>${m.round_name}</td>
                  <td${m.winner_id === m.fighter_a_id ? ' class="winner"' : ''}>${m.fighter_a_name || 'TBD'}</td>
                  <td style="text-align:center;font-weight:bold;color:#999;">VS</td>
                  <td${m.winner_id === m.fighter_b_id ? ' class="winner"' : ''}>${m.fighter_b_name || 'TBD'}</td>
                  <td>${m.ring_number}</td>
                  <td>${m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</td>
                  <td><span class="badge badge-${m.status === 'completed' ? 'completed' : 'ready'}">${m.status}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  html += `
      <div class="footer">Kickbox Championship OS • Auto-Generated Report</div>
    </body></html>
  `;

  // Open in new window and trigger print/download
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}
