import pandas as pd
from collections import defaultdict
import math

# 1. Ler o teu ficheiro
INPUT_FILE = "quarters_2025_REG.csv"
OUTPUT_FILE = "quarters_2025_REG_elo.csv"

df = pd.read_csv(INPUT_FILE)

# 2. Ordenar jogos por data/hora
# (o formato ISO já ordena bem como string, mas podemos converter para datetime se quiseres)
df = df.sort_values("scheduled").reset_index(drop=True)

# 3. Parâmetros do Elo
BASE_ELO = 1500      # rating inicial
K = 20               # "peso" de cada jogo (podes afinar depois)
HOME_ADV = 60        # vantagem de jogar em casa, em pontos Elo

# 4. Elo atual de cada equipa (dicionário)
elos = defaultdict(lambda: BASE_ELO)

# 5. Criar colunas para guardar os valores
df["elo_home_pre"] = 0.0
df["elo_away_pre"] = 0.0
df["elo_home_post"] = 0.0
df["elo_away_post"] = 0.0

for idx, row in df.iterrows():
    # só atualizar Elo para jogos fechados
    if row["status"] != "closed":
        # manter Elo anterior (ou zero) e saltar
        continue

    home = row["home_name"]
    away = row["away_name"]
    pts_home = row["home_score"]
    pts_away = row["away_score"]

    # Elo antes do jogo
    R_home = elos[home]
    R_away = elos[away]

    df.at[idx, "elo_home_pre"] = R_home
    df.at[idx, "elo_away_pre"] = R_away

    # Ajustar pela vantagem de casa
    R_home_eff = R_home + HOME_ADV
    R_away_eff = R_away

    # Probabilidade esperada de vitória da equipa da casa
    E_home = 1 / (1 + 10 ** ((R_away_eff - R_home_eff) / 400))

    # Resultado real (1 se casa ganhou, 0 se perdeu)
    if pts_home > pts_away:
        S_home = 1.0
    else:
        S_home = 0.0

    # Atualização do Elo
    delta = K * (S_home - E_home)

    R_home_new = R_home + delta
    R_away_new = R_away - delta  # simétrico

    # Guardar Elo depois do jogo na linha
    df.at[idx, "elo_home_post"] = R_home_new
    df.at[idx, "elo_away_post"] = R_away_new

    # Atualizar dicionário global
    elos[home] = R_home_new
    elos[away] = R_away_new

# 6. Diferença de Elo antes do jogo (útil no EdgeFinder)
df["elo_diff_pre"] = df["elo_home_pre"] - df["elo_away_pre"]

# 7. Guardar para um novo CSV
df.to_csv(OUTPUT_FILE, index=False)

print("Feito! Guardado em:", OUTPUT_FILE)
