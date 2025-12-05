import pandas as pd

df = pd.read_csv("quarters_2025_REG_elo.csv")

teams = sorted(set(df["home_name"]) | set(df["away_name"]))

rows = []
for team in teams:
    sub = df[(df["home_name"] == team) | (df["away_name"] == team)]
    last = sub.iloc[-1]  # último jogo dessa equipa

    if last["home_name"] == team:
        elo_final = last["elo_home_post"]
    else:
        elo_final = last["elo_away_post"]

    # opcional: calcular record W/L
    wins = 0
    losses = 0
    for _, r in sub.iterrows():
        if r["home_name"] == team:
            if r["home_score"] > r["away_score"]:
                wins += 1
            else:
                losses += 1
        else:
            if r["away_score"] > r["home_score"]:
                wins += 1
            else:
                losses += 1

    rows.append({
        "team": team,
        "elo_final": elo_final,
        "wins": wins,
        "losses": losses,
        "games": wins + losses
    })

rank = pd.DataFrame(rows).sort_values("elo_final", ascending=False)
rank.to_csv("nba_elo_ranking_2025.csv", index=False)
print(rank.head(10))
