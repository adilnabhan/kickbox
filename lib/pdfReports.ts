import { formatDivisionKey } from "./api";

// Shared professional CSS styles for the print documents
const sharedStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; padding: 30px; line-height: 1.5; background-color: #ffffff; }
  
  /* Header & Branding */
  .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px; }
  .report-logo-placeholder { display: flex; align-items: center; gap: 12px; }
  .report-logo-icon { background: #ef4444; color: #ffffff; width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }
  .report-title-section { text-align: right; }
  .report-title { font-size: 20px; font-weight: 800; text-transform: uppercase; color: #111827; letter-spacing: -0.02em; }
  .report-subtitle { font-size: 12px; color: #6b7280; font-weight: 500; margin-top: 2px; }
  
  /* Details Section */
  .details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
  .detail-item { display: flex; flexDirection: column; }
  .detail-label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.05em; }
  .detail-value { font-size: 13px; font-weight: 600; color: #111827; margin-top: 2px; }
  
  /* Tables */
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #1f2937; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; text-align: left; letter-spacing: 0.03em; }
  td { padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; }
  tr:nth-child(even) { background-color: #f9fafb; }
  .table-row-completed { background-color: #f0fdf4 !important; }
  
  /* Corners & Badges */
  .fighter-red { font-weight: 700; color: #dc2626; display: inline-flex; align-items: center; gap: 6px; }
  .fighter-blue { font-weight: 700; color: #2563eb; display: inline-flex; align-items: center; gap: 6px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-neutral { background: #f3f4f6; color: #374151; }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  
  /* Winner Highlight */
  .winner-cup { color: #d97706; font-weight: bold; margin-left: 4px; }
  
  /* Footer */
  .report-footer { display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 10px; color: #9ca3af; margin-top: auto; }
  
  /* Page break helpers */
  .page-break { page-break-after: always; }
  .avoid-page-break { page-break-inside: avoid; }
  
  /* Print configuration */
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
`;

function triggerPrintWindow(html: string): void {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait a brief moment for assets/stylesheets to load before opening print dialog
    setTimeout(() => {
      printWindow.print();
    }, 600);
  }
}

// 1. Helpers
function getFighterName(fighter: any): string {
  if (!fighter) return "TBD (Bye)";
  if (Array.isArray(fighter)) return fighter[0]?.full_name || "TBD (Bye)";
  return fighter.full_name || "TBD (Bye)";
}

function getCategoryLabel(catKey: string): string {
  return formatDivisionKey(catKey);
}

// ─────────────────────────────────────────────────────────────────────────────
// A. MATCH SCHEDULE PDF
// ─────────────────────────────────────────────────────────────────────────────
export function printMatchSchedulePDF(championship: any, matches: any[]): void {
  let html = `
    <html>
    <head>
      <title>Match Schedule - ${championship.name}</title>
      <style>
        ${sharedStyles}
        @page { size: portrait; margin: 15mm; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-logo-placeholder">
          <div class="report-logo-icon">🥊</div>
          <div>
            <div style="font-weight: 800; font-size: 16px; text-transform: uppercase;">WAK-1F Kickboxing</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">Tournament Management OS</div>
          </div>
        </div>
        <div class="report-title-section">
          <div class="report-title">Match Schedule</div>
          <div class="report-subtitle">Official Fight Card List</div>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Championship</div>
          <div class="detail-value">${championship.name}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Venue</div>
          <div class="detail-value">${championship.venue || "Official Arena"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Date</div>
          <div class="detail-value">${championship.start_date || "Scheduled Date"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Total Matches</div>
          <div class="detail-value">${matches.length} matches</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 60px;">No.</th>
            <th>Category / Weight Class</th>
            <th>Round</th>
            <th>Red Corner</th>
            <th style="text-align: center; width: 50px;">VS</th>
            <th>Blue Corner</th>
            <th>Ring</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  matches.forEach(m => {
    const isCompleted = m.status === "completed" || m.status === "walkover";
    const catName = m.ring_number?.split(" | CATEGORY:")[1] || "General";
    const ringName = m.ring_number?.split(" | CATEGORY:")[0] || m.ring_number;

    const winA = isCompleted && m.winner_id === m.fighter_a_id;
    const winB = isCompleted && m.winner_id === m.fighter_b_id;

    html += `
      <tr class="${isCompleted ? 'table-row-completed' : ''}">
        <td style="font-weight: bold; color: #111827;">#${m.match_number}</td>
        <td style="font-weight: 600;">${getCategoryLabel(catName)}</td>
        <td><span class="badge badge-neutral">${m.round_name}</span></td>
        <td>
          <span class="fighter-red ${winA ? 'winner' : ''}">${getFighterName(m.fighter_a)}</span>
          ${winA ? '<span class="winner-cup">🏆</span>' : ''}
        </td>
        <td style="text-align: center; font-weight: bold; color: #9ca3af;">VS</td>
        <td>
          <span class="fighter-blue ${winB ? 'winner' : ''}">${getFighterName(m.fighter_b)}</span>
          ${winB ? '<span class="winner-cup">🏆</span>' : ''}
        </td>
        <td style="font-weight: 600; color: #4b5563;">${ringName}</td>
        <td>
          <span class="badge ${isCompleted ? 'badge-success' : m.status === 'live' ? 'badge-red' : 'badge-warning'}">
            ${m.status}
          </span>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>

      <div class="report-footer">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>Page 1 of 1</div>
        <div>Official Referee Signature: _______________________</div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// B. CATEGORY BRACKET PDF
// ─────────────────────────────────────────────────────────────────────────────
export function printCategoryBracketPDF(championship: any, catKey: string, catMatches: any[], registrations: any[]): void {
  // Reconstruct full bracket columns
  const ROUND_ORDER_LIST = [
    "Round 1", "Round 2", "Round 3", "Round 4", "Quarter Final", "Semi Final", "Final"
  ];
  const getRoundPriority = (rName: string): number => {
    const name = rName.toLowerCase();
    if (name.includes("round 1") || name.includes("round of 16")) return 1;
    if (name.includes("quarter") || name.includes("qf")) return 2;
    if (name.includes("semi") || name.includes("sf")) return 3;
    if (name.includes("final")) return 4;
    return 99;
  };

  const roundGroups: { [key: string]: any[] } = {};
  catMatches.forEach(m => {
    const rName = m.round_name || "General";
    if (!roundGroups[rName]) roundGroups[rName] = [];
    roundGroups[rName].push(m);
  });

  const sortedRoundNames = Object.keys(roundGroups).sort((a, b) => {
    const prioA = getRoundPriority(a);
    const prioB = getRoundPriority(b);
    if (prioA !== prioB) return prioA - prioB;
    return a.localeCompare(b);
  });

  // Calculate winner
  const finalMatch = catMatches.find(m => (m.round_name || "").toLowerCase() === "final");
  let absoluteWinner = "TBD";
  if (finalMatch && finalMatch.winner_id) {
    absoluteWinner = getFighterName(finalMatch.winner_id === finalMatch.fighter_a_id ? finalMatch.fighter_a : finalMatch.fighter_b);
  }

  let html = `
    <html>
    <head>
      <title>Bracket Tree - ${getCategoryLabel(catKey)}</title>
      <style>
        ${sharedStyles}
        @page { size: landscape; margin: 10mm; }
        body { padding: 15px; background: #ffffff; color: #1a1a1a; font-size: 11px; }
        
        .bracket-container {
          display: flex;
          justify-content: flex-start;
          align-items: stretch;
          gap: 20px;
          margin-top: 24px;
          min-height: 480px;
          overflow-x: auto;
          padding-bottom: 20px;
        }
        
        .round-column {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          width: 200px;
          flex-shrink: 0;
        }

        .round-header-box {
          background: #1f2937;
          color: white;
          padding: 8px 10px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
        }

        .bracket-match-box {
          border: 1px solid #ccc;
          background: #ffffff;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          position: relative;
          margin: 10px 0;
        }

        .match-header-tag {
          background: #f3f4f6;
          padding: 3px 8px;
          font-size: 9px;
          font-weight: bold;
          color: #4b5563;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
        }

        .fighter-row {
          padding: 6px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 500;
          font-size: 11px;
          color: #374151;
        }

        .fighter-row.winner {
          background-color: #ecfdf5;
          font-weight: 700;
          color: #047857;
        }

        .fighter-row.loser {
          text-decoration: line-through;
          color: #9ca3af;
        }

        .winner-box {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 160px;
          border: 2px dashed #059669;
          background: #f0fdf4;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          align-self: center;
        }

        .winner-title {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 800;
          color: #065f46;
          letter-spacing: 0.05em;
        }

        .winner-name {
          font-size: 14px;
          font-weight: 800;
          color: #047857;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-logo-placeholder">
          <div class="report-logo-icon">🏆</div>
          <div>
            <div style="font-weight: 800; font-size: 16px; text-transform: uppercase;">WAK-1F Championship Bracket</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">Official Bracket Progression Tree</div>
          </div>
        </div>
        <div class="report-title-section">
          <div class="report-title" style="font-size: 18px;">${getCategoryLabel(catKey)}</div>
          <div class="report-subtitle">${championship.name}</div>
        </div>
      </div>

      <div class="bracket-container">
        ${sortedRoundNames.map(rName => {
          const roundMatches = [...roundGroups[rName]].sort((a, b) => a.match_number - b.match_number);
          return `
            <div class="round-column">
              <div class="round-header-box">
                <div>${rName}</div>
                <div style="font-size: 9px; font-weight: normal; text-transform: none; margin-top: 2px; color: #d1d5db;">${roundMatches.length} ${roundMatches.length === 1 ? 'Match' : 'Matches'}</div>
              </div>
              
              <div style="display: flex; flex-direction: column; justify-content: space-around; flex: 1;">
                ${roundMatches.map(m => {
                  const isCompleted = m.status === "completed" || m.status === "walkover";
                  const winA = isCompleted && m.winner_id === m.fighter_a_id;
                  const winB = isCompleted && m.winner_id === m.fighter_b_id;
                  
                  const isLoserA = isCompleted && m.winner_id !== m.fighter_a_id;
                  const isLoserB = isCompleted && m.winner_id !== m.fighter_b_id;

                  return `
                    <div class="bracket-match-box">
                      <div class="match-header-tag">
                        <span>MATCH #${m.match_number}</span>
                        <span>${m.status.toUpperCase()}</span>
                      </div>
                      
                      <div class="fighter-row ${winA ? 'winner' : ''} ${isLoserA ? 'loser' : ''}">
                        <span>🔴 ${getFighterName(m.fighter_a)}</span>
                        ${winA ? '<span>🏆</span>' : ''}
                      </div>
                      
                      <div style="height: 1px; background: #e5e7eb;"></div>
                      
                      <div class="fighter-row ${winB ? 'winner' : ''} ${isLoserB ? 'loser' : ''}">
                        <span>🔵 ${getFighterName(m.fighter_b)}</span>
                        ${winB ? '<span>🏆</span>' : ''}
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          `;
        }).join("")}

        <!-- Absolute Winner Pillar -->
        <div class="winner-box">
          <span style="font-size: 28px;">🏆</span>
          <div class="winner-title">Championship Winner</div>
          <div class="winner-name">${absoluteWinner}</div>
        </div>
      </div>

      <div class="report-footer" style="margin-top: 24px;">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>Official WAK-1F Bracket System</div>
        <div>Official Chief Referee Signature: _______________________</div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// C. ROUND-WISE MATCH SHEET PDF
// ─────────────────────────────────────────────────────────────────────────────
export function printRoundWisePDF(championship: any, roundName: string, matches: any[]): void {
  const roundMatches = matches.filter(m => (m.round_name || "").toLowerCase() === roundName.toLowerCase());

  let html = `
    <html>
    <head>
      <title>${roundName} Match Sheet - ${championship.name}</title>
      <style>
        ${sharedStyles}
        @page { size: portrait; margin: 15mm; }
        .score-block { display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 12px; background: #f3f4f6; padding: 12px; border-radius: 6px; }
        .score-box { border: 1px solid #d1d5db; background: white; width: 44px; height: 36px; text-align: center; font-size: 14px; font-weight: bold; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-logo-placeholder">
          <div class="report-logo-icon">📋</div>
          <div>
            <div style="font-weight: 800; font-size: 16px; text-transform: uppercase;">Official Judge Scorecard</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">WAK-1F Ring Official Sheet</div>
          </div>
        </div>
        <div class="report-title-section">
          <div class="report-title">${roundName}</div>
          <div class="report-subtitle">${championship.name}</div>
        </div>
      </div>

      <div style="font-size: 12px; color: #4b5563; margin-bottom: 20px; font-weight: bold;">
        Total Matches in this Round: ${roundMatches.length}
      </div>

      ${roundMatches.map((m, idx) => {
        const catName = m.ring_number?.split(" | CATEGORY:")[1] || "General";
        const ringName = m.ring_number?.split(" | CATEGORY:")[0] || m.ring_number;

        return `
          <div class="avoid-page-break" style="border: 2px solid #1f2937; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px;">
              <span style="font-size: 14px; font-weight: 800; color: #111827;">MATCH #${m.match_number}</span>
              <span class="badge badge-neutral" style="font-size: 11px; font-weight: bold;">${ringName}</span>
              <span style="font-size: 12px; font-weight: 700; color: #ef4444;">${getCategoryLabel(catName)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
              <div style="text-align: left; width: 42%;">
                <span class="badge badge-red" style="margin-bottom: 4px;">Red Corner</span>
                <div style="font-size: 15px; font-weight: 800; color: #dc2626;">${getFighterName(m.fighter_a)}</div>
              </div>
              <div style="font-weight: 800; font-size: 16px; color: #9ca3af;">VS</div>
              <div style="text-align: right; width: 42%;">
                <span class="badge badge-blue" style="margin-bottom: 4px;">Blue Corner</span>
                <div style="font-size: 15px; font-weight: 800; color: #2563eb;">${getFighterName(m.fighter_b)}</div>
              </div>
            </div>

            <div class="score-block">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #4b5563;">Scorecards: </span>
              <div style="display: flex; gap: 14px; align-items: center; margin-left: 12px;">
                <div>Judge 1: <input class="score-box" type="text" /> - <input class="score-box" type="text" /></div>
                <div>Judge 2: <input class="score-box" type="text" /> - <input class="score-box" type="text" /></div>
                <div>Judge 3: <input class="score-box" type="text" /> - <input class="score-box" type="text" /></div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 11px; color: #4b5563; font-weight: 600;">
              <div>Warning Points (RED): ____   (BLUE): ____</div>
              <div>Winner ID / Name: _______________________</div>
              <div>Referee Signature: _______________________</div>
            </div>
          </div>
        `;
      }).join("")}

      <div class="report-footer">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>Round-wise Official Scorecards</div>
        <div>Page 1 of 1</div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// D. RING-WISE MATCH SHEET
// ─────────────────────────────────────────────────────────────────────────────
export function printRingWisePDF(championship: any, ringNumber: string, matches: any[]): void {
  const ringMatches = matches.filter(m => {
    const ringName = m.ring_number?.split(" | CATEGORY:")[0] || m.ring_number;
    return ringName.toLowerCase().trim() === ringNumber.toLowerCase().trim();
  });

  let html = `
    <html>
    <head>
      <title>${ringNumber} Match Schedule - ${championship.name}</title>
      <style>
        ${sharedStyles}
        @page { size: portrait; margin: 15mm; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-logo-placeholder">
          <div class="report-logo-icon">🥋</div>
          <div>
            <div style="font-weight: 800; font-size: 16px; text-transform: uppercase;">Ring Coordinator Sheet</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">Tournament Floor Management</div>
          </div>
        </div>
        <div class="report-title-section">
          <div class="report-title">${ringNumber} Fight Card</div>
          <div class="report-subtitle">${championship.name}</div>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Ring / Tatami</div>
          <div class="detail-value" style="color: #ef4444;">${ringNumber}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Total Matches</div>
          <div class="detail-value">${ringMatches.length} fights</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Championship</div>
          <div class="detail-value">${championship.name}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Status</div>
          <div class="detail-value">Official Card</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 70px;">Match No.</th>
            <th>Category / Weight Class</th>
            <th>Round</th>
            <th>Red Corner</th>
            <th style="text-align: center; width: 50px;">VS</th>
            <th>Blue Corner</th>
            <th>Outcome / Winner</th>
          </tr>
        </thead>
        <tbody>
  `;

  ringMatches.forEach(m => {
    const isCompleted = m.status === "completed" || m.status === "walkover";
    const catName = m.ring_number?.split(" | CATEGORY:")[1] || "General";
    
    const winA = isCompleted && m.winner_id === m.fighter_a_id;
    const winB = isCompleted && m.winner_id === m.fighter_b_id;

    html += `
      <tr class="${isCompleted ? 'table-row-completed' : ''}">
        <td style="font-weight: bold; font-size: 13px; color: #111827;">#${m.match_number}</td>
        <td style="font-weight: 600;">${getCategoryLabel(catName)}</td>
        <td><span class="badge badge-neutral">${m.round_name}</span></td>
        <td>
          <span class="fighter-red ${winA ? 'winner' : ''}">${getFighterName(m.fighter_a)}</span>
        </td>
        <td style="text-align: center; font-weight: bold; color: #9ca3af;">VS</td>
        <td>
          <span class="fighter-blue ${winB ? 'winner' : ''}">${getFighterName(m.fighter_b)}</span>
        </td>
        <td style="font-weight: 700;">
          ${isCompleted ? (winA ? '🏆 RED WINNER' : '🏆 BLUE WINNER') : '<span style="color:#6b7280; font-weight:normal;">Scheduled</span>'}
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>

      <div class="report-footer">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>Ring-wise Referee Official Printout</div>
        <div>Chief Jury Signature: _______________________</div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// E. CATEGORY-WISE MATCH SHEET
// ─────────────────────────────────────────────────────────────────────────────
export function printCategoryWisePDF(championship: any, catKey: string, catMatches: any[]): void {
  let html = `
    <html>
    <head>
      <title>Category Card - ${getCategoryLabel(catKey)}</title>
      <style>
        ${sharedStyles}
        @page { size: portrait; margin: 15mm; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-logo-placeholder">
          <div class="report-logo-icon">📊</div>
          <div>
            <div style="font-weight: 800; font-size: 16px; text-transform: uppercase;">Official Division Card</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">WAK-1F Bracket Execution</div>
          </div>
        </div>
        <div class="report-title-section">
          <div class="report-title" style="font-size: 16px;">${getCategoryLabel(catKey)}</div>
          <div class="report-subtitle">${championship.name}</div>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Category Name</div>
          <div class="detail-value">${getCategoryLabel(catKey)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Total Category Fights</div>
          <div class="detail-value">${catMatches.length} matches</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Venue</div>
          <div class="detail-value">${championship.venue || "Official Hall"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Official Status</div>
          <div class="detail-value">Locked & Seeding Complete</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 70px;">Match No.</th>
            <th>Round</th>
            <th>Red Corner</th>
            <th style="text-align: center; width: 50px;">VS</th>
            <th>Blue Corner</th>
            <th>Ring</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody>
  `;

  catMatches.forEach(m => {
    const isCompleted = m.status === "completed" || m.status === "walkover";
    const ringName = m.ring_number?.split(" | CATEGORY:")[0] || m.ring_number;

    const winA = isCompleted && m.winner_id === m.fighter_a_id;
    const winB = isCompleted && m.winner_id === m.fighter_b_id;

    html += `
      <tr class="${isCompleted ? 'table-row-completed' : ''}">
        <td style="font-weight: bold; color: #111827;">#${m.match_number}</td>
        <td><span class="badge badge-neutral">${m.round_name}</span></td>
        <td>
          <span class="fighter-red ${winA ? 'winner' : ''}">${getFighterName(m.fighter_a)}</span>
        </td>
        <td style="text-align: center; font-weight: bold; color: #9ca3af;">VS</td>
        <td>
          <span class="fighter-blue ${winB ? 'winner' : ''}">${getFighterName(m.fighter_b)}</span>
        </td>
        <td style="font-weight: 600;">${ringName}</td>
        <td style="font-weight: 700;">
          ${isCompleted ? (winA ? '🔴 RED' : '🔵 BLUE') : 'Pending'}
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>

      <div class="report-footer">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>Category Match Execution Sheet</div>
        <div>Chief Marshal Signature: _______________________</div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// F. COMPETITOR LIST PDF
// ─────────────────────────────────────────────────────────────────────────────
export function printCompetitorListPDF(championship: any, registrations: any[]): void {
  let html = `
    <html>
    <head>
      <title>Competitor Master List - ${championship.name}</title>
      <style>
        ${sharedStyles}
        @page { size: portrait; margin: 15mm; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-logo-placeholder">
          <div class="report-logo-icon">👥</div>
          <div>
            <div style="font-weight: 800; font-size: 16px; text-transform: uppercase;">Official Competitor List</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">Championship Participant Registry</div>
          </div>
        </div>
        <div class="report-title-section">
          <div class="report-title">Fighter Master Registry</div>
          <div class="report-subtitle">${championship.name}</div>
        </div>
      </div>

      <div style="font-size: 12px; color: #4b5563; margin-bottom: 20px; font-weight: bold;">
        Total Registered approved competitors: ${registrations.length}
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50px;">No.</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Weight (kg)</th>
            <th>Club / Team Name</th>
            <th>Coach</th>
            <th>Category / Division Group</th>
          </tr>
        </thead>
        <tbody>
  `;

  registrations.forEach((reg, idx) => {
    const ageName = reg.age_categories?.name || "General";
    const weightName = reg.weight_categories?.name || "General";
    const key = `${ageName}-${weightName}-${reg.gender}`;

    html += `
      <tr>
        <td style="font-weight: bold; color: #6b7280;">${idx + 1}</td>
        <td style="font-weight: 700; color: #111827;">${getFighterName(reg.profiles)}</td>
        <td>
          <span class="badge ${reg.gender.toLowerCase() === 'male' ? 'badge-blue' : 'badge-red'}">
            ${reg.gender}
          </span>
        </td>
        <td style="font-weight: 600;">${reg.weight_kg} kg</td>
        <td style="font-weight: 600; color: #374151;">${reg.profiles?.club || reg.club || "Kerala Gym"}</td>
        <td style="color: #6b7280;">${reg.profiles?.coach || reg.coach || "Self"}</td>
        <td style="font-weight: bold; color: #dc2626;">${getCategoryLabel(key)}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>

      <div class="report-footer">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>Official Competitor Verification Registry</div>
        <div>Marshal Registrar Signature: _______________________</div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// G. WEIGH-IN SHEET PDF
// ─────────────────────────────────────────────────────────────────────────────
export function printWeighInSheetPDF(championship: any, registrations: any[]): void {
  let html = `
    <html>
    <head>
      <title>Official Weigh-In Sheet - ${championship.name}</title>
      <style>
        ${sharedStyles}
        @page { size: portrait; margin: 15mm; }
        .sign-cell { border-bottom: 1px solid #9ca3af; min-width: 90px; height: 28px; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-logo-placeholder">
          <div class="report-logo-icon">⚖️</div>
          <div>
            <div style="font-weight: 800; font-size: 16px; text-transform: uppercase;">Official Weigh-In Sheet</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">Medical & Weight Registry</div>
          </div>
        </div>
        <div class="report-title-section">
          <div class="report-title">Fighter Weigh-In Sheet</div>
          <div class="report-subtitle">${championship.name}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;">No.</th>
            <th>Competitor Name</th>
            <th>Age Category</th>
            <th>Gender</th>
            <th>Decl. Wt (kg)</th>
            <th style="width: 100px;">Actual Wt (kg)</th>
            <th style="width: 120px;">Fighter Signature</th>
            <th style="width: 120px;">Official Signature</th>
            <th>Remarks (Pass/Fail)</th>
          </tr>
        </thead>
        <tbody>
  `;

  registrations.forEach((reg, idx) => {
    html += `
      <tr>
        <td style="font-weight: bold; color: #6b7280;">${idx + 1}</td>
        <td style="font-weight: 700; color: #111827;">${getFighterName(reg.profiles)}</td>
        <td style="font-weight: 600;">${reg.age_categories?.name || "General"}</td>
        <td>
          <span class="badge ${reg.gender.toLowerCase() === 'male' ? 'badge-blue' : 'badge-red'}">
            ${reg.gender}
          </span>
        </td>
        <td style="font-weight: 600; color: #374151;">${reg.weight_kg} kg</td>
        <td><div class="sign-cell" style="border: 1px solid #d1d5db; background: #fafafa; border-radius: 4px;"></div></td>
        <td><div class="sign-cell"></div></td>
        <td><div class="sign-cell"></div></td>
        <td style="font-weight: 600; color: #9ca3af;">[  ] PASS  [  ] FAIL</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>

      <div class="report-footer">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>Official Weigh-in & Medical Records Registry</div>
        <div>Medical Doctor Signature: _______________________</div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// H. RESULT SHEET PDF
// ─────────────────────────────────────────────────────────────────────────────
export function printResultSheetPDF(championship: any, catKey: string, catMatches: any[]): void {
  // Determine final match
  const finalMatch = catMatches.find(m => (m.round_name || "").toLowerCase() === "final");
  const semiMatches = catMatches.filter(m => (m.round_name || "").toLowerCase() === "semi final");

  let goldMedal = "TBD";
  let silverMedal = "TBD";
  const bronzeMedalists: string[] = [];

  if (finalMatch && finalMatch.status === "completed") {
    goldMedal = getFighterName(finalMatch.winner_id === finalMatch.fighter_a_id ? finalMatch.fighter_a : finalMatch.fighter_b);
    silverMedal = getFighterName(finalMatch.winner_id === finalMatch.fighter_a_id ? finalMatch.fighter_b : finalMatch.fighter_a);
  }

  semiMatches.forEach(sm => {
    if (sm.status === "completed") {
      const loserId = sm.winner_id === sm.fighter_a_id ? sm.fighter_b_id : sm.fighter_a_id;
      const loserProfile = sm.winner_id === sm.fighter_a_id ? sm.fighter_b : sm.fighter_a;
      if (loserId) {
        bronzeMedalists.push(getFighterName(loserProfile));
      }
    }
  });

  let html = `
    <html>
    <head>
      <title>Official Results - ${getCategoryLabel(catKey)}</title>
      <style>
        ${sharedStyles}
        @page { size: portrait; margin: 15mm; }
        .podium-box { display: flex; justify-content: space-around; align-items: flex-end; margin-bottom: 32px; background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .podium-step { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .podium-gold { width: 140px; background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .podium-silver { width: 130px; background: #f3f4f6; border: 2px solid #d1d5db; border-radius: 8px; padding: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .podium-bronze { width: 120px; background: #fff7ed; border: 2px solid #fdba74; border-radius: 8px; padding: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .medal-badge { font-size: 24px; line-height: 1; margin-bottom: 6px; }
        .medal-name { font-size: 13px; font-weight: 800; color: #111827; }
        .medal-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #6b7280; margin-top: 4px; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-logo-placeholder">
          <div class="report-logo-icon">🎖️</div>
          <div>
            <div style="font-weight: 800; font-size: 16px; text-transform: uppercase;">Official Result Registry</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">Tournament Medal & Results</div>
          </div>
        </div>
        <div class="report-title-section">
          <div class="report-title" style="font-size: 16px;">${getCategoryLabel(catKey)}</div>
          <div class="report-subtitle">${championship.name}</div>
        </div>
      </div>

      <div class="podium-box">
        <div class="podium-step">
          <div class="podium-silver">
            <div class="medal-badge">🥈</div>
            <div class="medal-name">${silverMedal}</div>
            <div class="medal-label">Silver Medal</div>
          </div>
        </div>
        <div class="podium-step">
          <div class="podium-gold">
            <div class="medal-badge">🥇</div>
            <div class="medal-name">${goldMedal}</div>
            <div class="medal-label">Gold Medal</div>
          </div>
        </div>
        <div class="podium-step">
          <div class="podium-bronze">
            <div class="medal-badge">🥉</div>
            <div class="medal-name">${bronzeMedalists[0] || "TBD"}</div>
            <div class="medal-label">Bronze Medal</div>
          </div>
        </div>
        ${bronzeMedalists[1] ? `
          <div class="podium-step">
            <div class="podium-bronze">
              <div class="medal-badge">🥉</div>
              <div class="medal-name">${bronzeMedalists[1]}</div>
              <div class="medal-label">Bronze Medal</div>
            </div>
          </div>
        ` : ''}
      </div>

      <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #111827; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;">Bracket Match Outcomes</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 70px;">No.</th>
            <th>Round</th>
            <th>Red Corner</th>
            <th>Blue Corner</th>
            <th>Score / Method</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody>
  `;

  catMatches.forEach(m => {
    const isCompleted = m.status === "completed" || m.status === "walkover";
    const winA = isCompleted && m.winner_id === m.fighter_a_id;
    const winB = isCompleted && m.winner_id === m.fighter_b_id;

    html += `
      <tr class="${isCompleted ? 'table-row-completed' : ''}">
        <td style="font-weight: bold; color: #111827;">#${m.match_number}</td>
        <td><span class="badge badge-neutral">${m.round_name}</span></td>
        <td class="${winA ? 'winner' : ''}">${getFighterName(m.fighter_a)}</td>
        <td class="${winB ? 'winner' : ''}">${getFighterName(m.fighter_b)}</td>
        <td style="color: #6b7280; font-weight: 500;">
          ${m.status === "walkover" ? "Walkover (Bye)" : isCompleted ? "Points Decision (3-0)" : "Scheduled"}
        </td>
        <td style="font-weight: 800; color: #047857;">
          ${isCompleted ? getFighterName(m.winner_id === m.fighter_a_id ? m.fighter_a : m.fighter_b) : "TBD"}
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>

      <div class="report-footer">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>Official Medal Standings Certification</div>
        <div>Chief Ring Supervisor Signature: _______________________</div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// I. TOURNAMENT SUMMARY PDF
// ─────────────────────────────────────────────────────────────────────────────
export function printTournamentSummaryPDF(championship: any, matches: any[], registrations: any[]): void {
  // Compute counts
  const totalCompetitors = registrations.length;
  const totalMatches = matches.length;
  const completedMatches = matches.filter(m => m.status === "completed" || m.status === "walkover").length;
  const pendingMatches = totalMatches - completedMatches;

  // Group by category to find unique category keys
  const catSet = new Set(matches.map(m => m.ring_number?.split(" | CATEGORY:")[1]).filter(Boolean));
  const totalCategories = catSet.size;

  // Medal standings by club
  const clubMedals: { [key: string]: { gold: number, silver: number, bronze: number, name: string } } = {};
  
  // Find final matches
  const finalMatches = matches.filter(m => (m.round_name || "").toLowerCase() === "final" && (m.status === "completed" || m.status === "walkover"));
  finalMatches.forEach(m => {
    const goldWinnerId = m.winner_id;
    const silverLoserId = m.winner_id === m.fighter_a_id ? m.fighter_b_id : m.fighter_a_id;

    if (goldWinnerId) {
      const winnerReg = registrations.find(r => r.fighter_id === goldWinnerId);
      const winnerClub = winnerReg?.profiles?.club || winnerReg?.club || "Independent";
      if (!clubMedals[winnerClub]) clubMedals[winnerClub] = { gold: 0, silver: 0, bronze: 0, name: winnerClub };
      clubMedals[winnerClub].gold++;
    }

    if (silverLoserId) {
      const loserReg = registrations.find(r => r.fighter_id === silverLoserId);
      const loserClub = loserReg?.profiles?.club || loserReg?.club || "Independent";
      if (!clubMedals[loserClub]) clubMedals[loserClub] = { gold: 0, silver: 0, bronze: 0, name: loserClub };
      clubMedals[loserClub].silver++;
    }
  });

  // Find semi final matches to assign bronze medals
  const semiMatches = matches.filter(m => (m.round_name || "").toLowerCase() === "semi final" && (m.status === "completed" || m.status === "walkover"));
  semiMatches.forEach(m => {
    const loserId = m.winner_id === m.fighter_a_id ? m.fighter_b_id : m.fighter_a_id;
    if (loserId) {
      const loserReg = registrations.find(r => r.fighter_id === loserId);
      const loserClub = loserReg?.profiles?.club || loserReg?.club || "Independent";
      if (!clubMedals[loserClub]) clubMedals[loserClub] = { gold: 0, silver: 0, bronze: 0, name: loserClub };
      clubMedals[loserClub].bronze++;
    }
  });

  const sortedClubs = Object.values(clubMedals).sort((a, b) => {
    // 3 points for gold, 2 for silver, 1 for bronze
    const scoreA = a.gold * 3 + a.silver * 2 + a.bronze * 1;
    const scoreB = b.gold * 3 + b.silver * 2 + b.bronze * 1;
    return scoreB - scoreA;
  });

  let html = `
    <html>
    <head>
      <title>Tournament Summary - ${championship.name}</title>
      <style>
        ${sharedStyles}
        @page { size: portrait; margin: 15mm; }
        .summary-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
        .stat-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #f9fafb; text-align: center; }
        .stat-number { font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 4px; }
        .stat-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.05em; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-logo-placeholder">
          <div class="report-logo-icon">📊</div>
          <div>
            <div style="font-weight: 800; font-size: 16px; text-transform: uppercase;">Official Championship Summary</div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 600;">WAK-1F Executive Report</div>
          </div>
        </div>
        <div class="report-title-section">
          <div class="report-title">Tournament Summary</div>
          <div class="report-subtitle">${championship.name}</div>
        </div>
      </div>

      <div class="summary-stats-grid">
        <div class="stat-card">
          <div class="stat-number">${totalCompetitors}</div>
          <div class="stat-title">Fighters Registered</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${totalCategories}</div>
          <div class="stat-title">Active Divisions</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${totalMatches}</div>
          <div class="stat-title">Total Scheduled Fights</div>
        </div>
      </div>

      <div class="details-grid" style="margin-bottom: 32px;">
        <div class="detail-item">
          <div class="detail-label">Completed Matches</div>
          <div class="detail-value" style="color: #059669;">${completedMatches}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Pending Matches</div>
          <div class="detail-value" style="color: #d97706;">${pendingMatches}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Venue</div>
          <div class="detail-value">${championship.venue || "Official Arena"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Date</div>
          <div class="detail-value">${championship.start_date || "Scheduled Date"}</div>
        </div>
      </div>

      <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #111827; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;">Club / Team Standings</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 60px;">Rank</th>
            <th>Club / Team Name</th>
            <th style="text-align: center; width: 80px;">🥇 Gold</th>
            <th style="text-align: center; width: 80px;">🥈 Silver</th>
            <th style="text-align: center; width: 80px;">🥉 Bronze</th>
            <th style="text-align: center; width: 100px;">Total Points</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (sortedClubs.length === 0) {
    html += `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: #6b7280;">No medal standings recorded yet. Complete final matches to view rankings!</td>
      </tr>
    `;
  } else {
    sortedClubs.forEach((club, idx) => {
      const points = club.gold * 3 + club.silver * 2 + club.bronze * 1;
      html += `
        <tr>
          <td style="font-weight: bold; font-size: 13px; color: #111827;">#${idx + 1}</td>
          <td style="font-weight: 700; color: #111827;">${club.name}</td>
          <td style="text-align: center; font-weight: bold; color: #d97706;">${club.gold}</td>
          <td style="text-align: center; font-weight: bold; color: #4b5563;">${club.silver}</td>
          <td style="text-align: center; font-weight: bold; color: #b45309;">${club.bronze}</td>
          <td style="text-align: center; font-weight: 800; font-size: 13px; color: #dc2626;">${points} pts</td>
        </tr>
      `;
    });
  }

  html += `
        </tbody>
      </table>

      <div class="report-footer" style="margin-top: 48px;">
        <div>Printed on ${new Date().toLocaleString()}</div>
        <div>Official Championship General Standing Registry</div>
        <div>General Secretary Signature: _______________________</div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}
