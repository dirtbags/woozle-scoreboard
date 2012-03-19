teams = [
    ["LA",      "bombs.png",      "Los Alamos M'Atom Bombs"],
    ["ARG",     "animas.png",     "Animas Valley Roller Girls"],
    ["Taos",    "taos.png",       "Taos Whiplashes"],
    ["RIP",     "rip.png",        "Rollergirls In Pagosa"],
    ["4CRG",    "4crg.png",       "4 Corners Roller Girls"],
    ["DRG",     "durango.png",    "Durango Roller Girls"],
    ["SFe",     "brawlers.png",   "Disco Brawlers"],
    ["HCRD",    "aurora.png",     "High City Derby Divas"],
    ["Moab",    "moab.png",       "Moab Roller Derby"],
    ["Bots",    "hobots.png",     "Albuquerque Ho-Bots"],
    ["HNR",     "hustlen.png",    "HCDD Hustle N' Rollers"],
    ["DD",      "doubledown.png", "HCDD Double Down"],
    ["DCD",     "dcd.png",        "Duke City Derby"],
    ["RMRG",    "rmrg.png",       "Rocky Mountain Roller Girls"],
];
teams.sort();

// Add special teams at the beginning
teams.splice(0, 0,
             ["Blk", "black.png", "Black Team"],
             ["Wht", "white.png", "White Team"]
            );
