const fighters = [
  { name: "Ayan Khan", category: "Youth / 55-60 KG", status: "Approved", seed: 1 },
  { name: "Mira Joseph", category: "Adult / 50-55 KG", status: "Pending", seed: 4 },
  { name: "Rahul Nair", category: "Adult / 65-70 KG", status: "Approved", seed: 2 },
  { name: "Sara Malik", category: "Junior / 45-50 KG", status: "Review", seed: 3 }
];

const matches = [
  { ring: "Ring 1", time: "10:30 AM", bout: "Ayan Khan vs Dev Roy", round: "Quarter Final" },
  { ring: "Ring 2", time: "11:15 AM", bout: "Sara Malik vs Lina Das", round: "Semi Final" },
  { ring: "Ring 1", time: "12:00 PM", bout: "Rahul Nair vs Omar Ali", round: "Final" }
];

const bracket = [
  ["Ayan Khan", "Dev Roy"],
  ["Rahul Nair", "Omar Ali"],
  ["Sara Malik", "Lina Das"],
  ["Mira Joseph", "Tara Sen"]
];

export default function Home() {
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
          <a href="#reports">Reports</a>
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
            <button type="button">Create Championship</button>
            <button className="dark" type="button">Generate Brackets</button>
          </div>
        </header>

        <section className="stats" id="dashboard" aria-label="Championship statistics">
          <article>
            <span>Total Fighters</span>
            <strong>128</strong>
            <small>18 new today</small>
          </article>
          <article>
            <span>Approved</span>
            <strong>96</strong>
            <small>75% ready</small>
          </article>
          <article>
            <span>Pending Review</span>
            <strong>24</strong>
            <small>Docs required</small>
          </article>
          <article>
            <span>Active Matches</span>
            <strong>12</strong>
            <small>Across 6 rings</small>
          </article>
        </section>

        <section className="grid">
          <article className="panel wide" id="registration">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Registration desk</p>
                <h2>Fighter approvals</h2>
              </div>
              <button type="button">Review Queue</button>
            </div>

            <div className="table">
              {fighters.map((fighter) => (
                <div className="row" key={fighter.name}>
                  <span className="seed">#{fighter.seed}</span>
                  <div>
                    <strong>{fighter.name}</strong>
                    <small>{fighter.category}</small>
                  </div>
                  <span className={`badge ${fighter.status.toLowerCase()}`}>{fighter.status}</span>
                </div>
              ))}
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
              {matches.map((match) => (
                <div className="match" key={match.bout}>
                  <span>{match.ring}</span>
                  <strong>{match.bout}</strong>
                  <small>
                    {match.round} / {match.time}
                  </small>
                </div>
              ))}
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
              {bracket.map((pair) => (
                <div className="bout" key={pair.join("-")}>
                  <span>{pair[0]}</span>
                  <span>{pair[1]}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide" id="reports">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Backend ready</p>
                <h2>Supabase data flow</h2>
              </div>
            </div>

            <div className="flow">
              <div>
                <strong>Auth</strong>
                <small>Admin, fighter, referee roles</small>
              </div>
              <div>
                <strong>Registrations</strong>
                <small>Profiles, categories, documents</small>
              </div>
              <div>
                <strong>Matches</strong>
                <small>Schedules, scores, winners</small>
              </div>
              <div>
                <strong>Reports</strong>
                <small>Results and championship summary</small>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

