const appState = {
  cards: structuredClone(FALLBACK_CARDS),
  category: "miles",
  query: "",
  tag: "",
  definitionsOpen: false,
  lastPortfolio: "",
};

const tagOptions = [
  "online",
  "contactless",
  "dining",
  "travel",
  "shopping",
  "transport",
  "groceries",
  "overseas",
  "simplicity",
  "cashback",
];

const REWARD_PROGRAMS = {
  "hsbc-revolution": {
    program: "HSBC Rewards Points",
    type: "miles",
    quality: 90,
    flexibility: 96,
    simplicity: 76,
    partnerCount: "20+ airline and hotel partners",
    expiry: "About 37 months from the month after points are awarded.",
    pooling: "Kept by card, but pooled for redemption; redeem before cancelling a card.",
    friction: "Most airline and hotel transfers complete within 1 working day; miles/hotel redemption fee is currently waived.",
    note: "High-value flexible points because of broad partner coverage, relatively long validity and low current transfer friction.",
  },
  "citi-rewards": {
    program: "Citi ThankYou Points",
    type: "miles",
    quality: 88,
    flexibility: 94,
    simplicity: 60,
    partnerCount: "11 listed airline and hotel partners",
    expiry: "Up to 60 months from card approval cycle.",
    pooling: "Not pooled across Citi cards, even within the same points currency.",
    friction: "S$27.25 transfer fee unless an instant transfer waiver applies; each Citi card can create its own redemption block.",
    note: "Very flexible points with long validity and many partners, but orphan points matter because Citi does not pool cards.",
  },
  "dbs-womans-world": {
    program: "DBS Points",
    type: "miles",
    quality: 58,
    flexibility: 56,
    simplicity: 54,
    partnerCount: "KrisFlyer, Asia Miles, Qantas and AirAsia",
    expiry: "DBS Points with expiry generally expire 1 year from the quarterly period earned.",
    pooling: "Pooled only at redemption; redeem before cancelling the specific card.",
    friction: "S$27.25 transfer fee; 5,000 DBS Points transfer block for 10,000 KrisFlyer/Asia Miles/Qantas Points.",
    note: "Strong earn bucket, but lower point quality because expiry is short and partner breadth is narrower.",
  },
  "uob-ladys": {
    program: "UOB UNI$",
    type: "miles",
    quality: 68,
    flexibility: 58,
    simplicity: 74,
    partnerCount: "Primarily KrisFlyer and Asia Miles",
    expiry: "24 to 27 months, expiring 2 years from the last day of the earning quarter.",
    pooling: "UNI$ pool across UOB cards held by the same principal cardholder.",
    friction: "Conversion fee applies, but pooling makes multi-UOB setups cleaner.",
    note: "Less partner choice than Citi or HSBC, but strong ecosystem value when paired with other UOB UNI$ cards.",
  },
  "uob-preferred-visa": {
    program: "UOB UNI$",
    type: "miles",
    quality: 68,
    flexibility: 58,
    simplicity: 74,
    partnerCount: "Primarily KrisFlyer and Asia Miles",
    expiry: "24 to 27 months, expiring 2 years from the last day of the earning quarter.",
    pooling: "UNI$ pool across UOB cards held by the same principal cardholder.",
    friction: "Conversion fee applies, but pooling makes multi-UOB setups cleaner.",
    note: "Less partner choice than Citi or HSBC, but strong ecosystem value when paired with other UOB UNI$ cards.",
  },
  "uob-visa-signature": {
    program: "UOB UNI$",
    type: "miles",
    quality: 68,
    flexibility: 58,
    simplicity: 74,
    partnerCount: "Primarily KrisFlyer and Asia Miles",
    expiry: "24 to 27 months, expiring 2 years from the last day of the earning quarter.",
    pooling: "UNI$ pool across UOB cards held by the same principal cardholder.",
    friction: "Conversion fee applies, but pooling makes multi-UOB setups cleaner.",
    note: "Less partner choice than Citi or HSBC, but strong ecosystem value when paired with other UOB UNI$ cards.",
  },
  "krisflyer-uob": {
    program: "Direct KrisFlyer miles",
    type: "miles",
    quality: 54,
    flexibility: 36,
    simplicity: 92,
    partnerCount: "KrisFlyer only",
    expiry: "KrisFlyer miles generally expire 3 years after they are earned for basic and elite members.",
    pooling: "Miles credit straight into KrisFlyer and pool with other KrisFlyer miles.",
    friction: "No manual conversion or bank transfer fee, but no bank-points holding period.",
    note: "Best for simplicity and SIA loyalists; lower flexibility because miles are locked into KrisFlyer immediately.",
  },
  "ocbc-rewards": {
    program: "OCBC$",
    type: "miles",
    quality: 72,
    flexibility: 78,
    simplicity: 68,
    partnerCount: "Airline and hotel partners including KrisFlyer, Asia Miles, Avios, Flying Blue, United, Etihad, IHG, Accor and Marriott",
    expiry: "OCBC$ expire 24 months after they are earned.",
    pooling: "Only same OCBC reward currencies pool; OCBC$ do not pool with 90°N Miles or VOYAGE Miles.",
    friction: "Admin fee applies for airline and hotel exchanges.",
    note: "Better partner breadth than older OCBC setups, but OCBC$ expiry and currency silos still need tracking.",
  },
  "citi-smrt": {
    program: "SMRT$ cashback",
    type: "cashback",
    quality: 74,
    flexibility: 72,
    simplicity: 82,
    partnerCount: "Cashback, not miles partners",
    expiry: "Cashback rules apply instead of airline-mile expiry.",
    pooling: "Not relevant for miles pooling.",
    friction: "Simpler value than miles, but subject to minimum spend and category rules.",
    note: "Good for users who value cash value certainty over airline partner flexibility.",
  },
};

const selectors = {
  segments: document.querySelectorAll(".segment"),
  search: document.querySelector("#search-input"),
  tagFilters: document.querySelector("#tag-filters"),
  summary: document.querySelector("#summary-strip"),
  grid: document.querySelector("#card-grid"),
  tableWrap: document.querySelector(".table-wrap"),
  stickyTableHeader: document.querySelector("#sticky-table-header"),
  tableBody: document.querySelector("#card-table-body"),
  template: document.querySelector("#card-template"),
  cardsTitle: document.querySelector("#cards-title"),
  definitionsToggle: document.querySelector("#definitions-toggle"),
  portfolioForm: document.querySelector("#portfolio-form"),
  portfolioOutput: document.querySelector("#portfolio-output"),
  downloadPortfolio: document.querySelector("#download-portfolio"),
  resetProfile: document.querySelector("#reset-profile"),
  returnTop: document.querySelector("#return-top"),
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quote = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quote && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quote = !quote;
    } else if (char === "," && !quote) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quote) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function rowsToObjects(rows) {
  const [headers, ...dataRows] = rows;
  if (!headers || headers.length < 5) return [];

  return dataRows.map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header.trim()] = (row[index] || "").trim();
    });
    return item;
  }).filter((item) => item.card_name);
}

async function fetchSheetTab(tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);
  return rowsToObjects(parseCsv(await response.text()));
}

async function hydrateFromSheet() {
  try {
    const [miles, cashback] = await Promise.all([
      fetchSheetTab(SHEET_CONFIG.tabs.miles),
      fetchSheetTab(SHEET_CONFIG.tabs.cashback),
    ]);

    if (!miles.length) throw new Error("Miles tab returned no rows");

    appState.cards = {
      miles,
      cashback: cashback.length ? cashback : FALLBACK_CARDS.cashback,
    };

  } catch (error) {
    console.warn("Google Sheet data unavailable; using bundled card data.", error);
  }

  render();
  if (selectors.portfolioForm) renderPortfolio();
}

function allCards() {
  return [
    ...appState.cards.miles.map((card) => ({ ...card, group: "miles" })),
    ...appState.cards.cashback.map((card) => ({ ...card, group: "cashback" })),
  ];
}

function visibleCards() {
  const query = appState.query.toLowerCase();
  return allCards().filter((card) => {
    const categoryMatch = appState.category === "all" || card.group === appState.category;
    const haystack = Object.values(card).join(" ").toLowerCase();
    const queryMatch = !query || haystack.includes(query);
    const tagMatch = !appState.tag || haystack.includes(appState.tag);
    return categoryMatch && queryMatch && tagMatch;
  });
}

function renderTags() {
  if (!selectors.tagFilters) return;
  selectors.tagFilters.innerHTML = "";
  tagOptions.forEach((tag) => {
    const button = document.createElement("button");
    button.className = `chip${appState.tag === tag ? " active" : ""}`;
    button.type = "button";
    button.textContent = tag;
    button.addEventListener("click", () => {
      appState.tag = appState.tag === tag ? "" : tag;
      render();
    });
    selectors.tagFilters.append(button);
  });
}

function renderSummary(cards) {
  if (!selectors.summary) return;
  const cardsToSummarize = appState.category === "all" ? allCards() : allCards().filter((card) => card.group === appState.category);
  const banks = new Set(cardsToSummarize.map((card) => card.bank));
  const fourMpd = cardsToSummarize.filter((card) => /4 mpd|6 mpd|8 mpd/i.test(card.earn_rate)).length;
  const noMinSpend = cardsToSummarize.filter((card) => /none|no minimum/i.test(card.minimum_spend)).length;

  selectors.summary.innerHTML = `
    <div class="metric"><b>${cards.length}</b><span>Cards shown</span></div>
    <div class="metric"><b>${banks.size}</b><span>Banks covered</span></div>
    <div class="metric"><b>${fourMpd}</b><span>High earn cards</span></div>
    <div class="metric"><b>${noMinSpend}</b><span>No monthly minimum</span></div>
  `;
}

function concise(text) {
  if (!text) return "Check terms.";
  const firstSentence = text.split(". ")[0].trim();
  return firstSentence.length >= 28 ? firstSentence : text.trim();
}

function makeLink(label, url) {
  if (!url) return null;
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

function cardAnchor(card) {
  return `card-${card.card_id || card.card_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function cardReferenceHref(card) {
  const anchor = cardAnchor(card);
  return selectors.grid ? `#${anchor}` : `index.html#${anchor}`;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emphasize(text) {
  const escaped = escapeHtml(text);
  const pattern = /(1\.2\s?mpd|2\.4\s?mpd|3\s?mpd|4\s?mpd|5%|6\s?mpd|8\s?mpd|10X|S\$5 blocks|S\$500|S\$600|S\$1,000|S\$1,200|mobile contactless|mobile wallet|e-wallet top-ups|physical card tap|selected online|contactless|online|dining|travel|transport|groceries|overseas|statement month|calendar month|minimum spend|no minimum)/gi;
  return escaped.replace(pattern, "<strong>$1</strong>");
}

function syncDefinitionPanels() {
  if (selectors.grid) {
    selectors.grid.querySelectorAll("details").forEach((details) => {
      details.open = appState.definitionsOpen;
    });
  }

  if (selectors.definitionsToggle) {
    selectors.definitionsToggle.textContent = appState.definitionsOpen
      ? "Hide all exclusions/definitions"
      : "Show all exclusions/definitions";
    selectors.definitionsToggle.setAttribute("aria-expanded", String(appState.definitionsOpen));
  }
}

function syncStickyTableHeader() {
  if (!selectors.tableWrap || !selectors.stickyTableHeader) return;
  const table = selectors.tableWrap.querySelector(".card-table");
  const thead = table?.querySelector("thead");
  if (!table || !thead) return;

  if (!selectors.stickyTableHeader.firstElementChild) {
    const clone = table.cloneNode(false);
    clone.append(thead.cloneNode(true));
    selectors.stickyTableHeader.append(clone);
  }

  const headerHeight = thead.getBoundingClientRect().height;
  const rect = selectors.tableWrap.getBoundingClientRect();
  const isActive = rect.top < 0 && rect.bottom > headerHeight;

  selectors.stickyTableHeader.classList.toggle("visible", isActive);
  if (!isActive) return;

  const cloneTable = selectors.stickyTableHeader.querySelector(".card-table");
  selectors.stickyTableHeader.style.left = `${Math.max(rect.left, 0)}px`;
  selectors.stickyTableHeader.style.width = `${Math.min(rect.width, window.innerWidth - Math.max(rect.left, 0))}px`;
  cloneTable.style.width = `${table.scrollWidth}px`;
  cloneTable.style.transform = `translateX(${-selectors.tableWrap.scrollLeft}px)`;
}

function renderCards(cards) {
  if (!selectors.grid || !selectors.template || !selectors.cardsTitle) return;
  selectors.grid.innerHTML = "";
  selectors.cardsTitle.textContent = appState.category === "cashback"
    ? "Recommended cashback cards"
    : appState.category === "all"
      ? "All recommended cards"
      : "Recommended miles cards";

  if (!cards.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No cards match the current filters.";
    selectors.grid.append(empty);
    return;
  }

  cards.forEach((card) => {
    const node = selectors.template.content.firstElementChild.cloneNode(true);
    node.id = cardAnchor(card);
    node.setAttribute("tabindex", "-1");
    node.querySelector("h3").textContent = card.card_name;
    node.querySelector(".bank").textContent = `${card.bank} · ${card.category}`;
    node.querySelector(".tier").textContent = card.recommendation_tier;

    node.querySelectorAll("[data-field]").forEach((element) => {
      element.innerHTML = emphasize(card[element.dataset.field] || "Check official terms.");
    });

    const links = node.querySelector(".links");
    [
      ["Official page", card.official_product_url],
      ["Terms", card.official_terms_url],
      ["Rewards rules", card.official_rewards_or_exclusions_url],
      ["Review 1", card.research_reference_1],
      ["Review 2", card.research_reference_2],
    ].forEach(([label, url]) => {
      const link = makeLink(label, url);
      if (link) links.append(link);
    });

    selectors.grid.append(node);
  });

  syncDefinitionPanels();
}

function renderTable() {
  if (!selectors.tableBody) return;

  selectors.tableBody.innerHTML = "";
  allCards().forEach((card) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <th scope="row">
        <a class="table-card-link" href="${cardReferenceHref(card)}">${card.card_name}</a>
        <small class="card-type-text">${card.category}</small>
      </th>
      <td>${emphasize(concise(card.earn_rate))}</td>
      <td>${emphasize(concise(card.use_card_for))}</td>
      <td>${emphasize(concise(card.monthly_bonus_limit))}</td>
      <td>${emphasize(concise(card.nuances))}</td>
    `;
    selectors.tableBody.append(row);
  });

  selectors.stickyTableHeader?.replaceChildren();
  requestAnimationFrame(syncStickyTableHeader);
}

function profileValues() {
  if (!selectors.portfolioForm) return null;
  const spend = {};
  document.querySelectorAll("[data-spend]").forEach((input) => {
    spend[input.dataset.spend] = Number(input.value || 0);
  });

  return {
    userName: document.querySelector("#user-name").value.trim(),
    preference: document.querySelector("#reward-preference").value,
    simpleMode: document.querySelector("#simple-mode").checked,
    spend,
    totalSpend: Object.values(spend).reduce((sum, value) => sum + value, 0),
  };
}

function findCard(id) {
  return allCards().find((card) => card.card_id === id);
}

function money(value) {
  return `S$${Math.max(0, Math.round(value)).toLocaleString("en-SG")}`;
}

function cardCountLabel(count) {
  return `${count} ${count === 1 ? "card" : "cards"}`;
}

function spendAmount(spend, keys) {
  return keys.reduce((sum, key) => sum + Number(spend[key] || 0), 0);
}

function largestCategory(spend) {
  return [
    { key: "dining", label: "Dining", value: spend.dining, category: "Dining" },
    { key: "travel", label: "Travel", value: spend.travel, category: "Travel" },
    { key: "transport", label: "Transport", value: spend.transport, category: "Transport" },
    { key: "groceries", label: "Family/groceries", value: spend.groceries, category: "Family" },
  ].sort((a, b) => b.value - a.value)[0];
}

function preferenceLabel(value) {
  if (value === "cashback") return "Cashback first";
  if (value === "balanced") return "Balanced";
  return "Miles first";
}

function rewardProgram(cardId) {
  return REWARD_PROGRAMS[cardId] || {
    program: "Rewards programme",
    type: "miles",
    quality: 60,
    flexibility: 60,
    simplicity: 60,
    partnerCount: "Check official terms",
    expiry: "Check official terms.",
    pooling: "Check official terms.",
    friction: "Check official terms.",
    note: "Reward quality should be checked before final advice.",
  };
}

function likelyUobEcosystem(profile) {
  const category = largestCategory(profile.spend);
  let uobFitCount = 0;
  if (spendAmount(profile.spend, ["contactless", "transport"]) > 0 || profile.spend.online > 700) uobFitCount += 1;
  if (category?.value >= 300) uobFitCount += 1;
  if (profile.spend.overseas >= 900 || spendAmount(profile.spend, ["contactless", "transport"]) >= 1200) uobFitCount += 1;
  return uobFitCount >= 2;
}

function rewardQualityAdjustment(item, profile) {
  const reward = rewardProgram(item.card.card_id);
  const wantsCashback = profile.preference === "cashback";
  const wantsMiles = profile.preference === "miles";
  const lowMilesVolume = profile.totalSpend < 1600;
  let adjustment = 0;

  if (reward.type === "cashback") {
    adjustment += wantsCashback ? 210 : profile.preference === "balanced" ? 60 : -180;
    adjustment += profile.simpleMode ? 70 : 0;
  } else {
    adjustment += wantsCashback ? -140 : 0;
    adjustment += wantsMiles ? (reward.flexibility - 60) * 4 : (reward.quality - 60) * 2.2;
    adjustment += profile.simpleMode ? (reward.simplicity - 60) * 3 : 0;
  }

  if (/1 year|short/i.test(`${reward.expiry} ${reward.note}`) && lowMilesVolume) adjustment -= 130;
  if (/60 months|37 months|24 to 27 months/i.test(reward.expiry) && wantsMiles) adjustment += 35;
  if (/not pooled/i.test(reward.pooling) && lowMilesVolume) adjustment -= 80;
  if (/UOB UNI/i.test(reward.program) && likelyUobEcosystem(profile)) adjustment += 80;
  if (item.card.card_id === "krisflyer-uob" && !profile.simpleMode && wantsMiles) adjustment -= 65;
  if (item.card.card_id === "hsbc-revolution" && wantsMiles) adjustment += 70;

  return Math.round(adjustment);
}

function applyRewardQuality(candidates, profile) {
  return candidates.filter(Boolean).map((item) => {
    const reward = rewardProgram(item.card.card_id);
    const rewardScore = rewardQualityAdjustment(item, profile);
    return {
      ...item,
      reward,
      rewardScore,
      score: item.score + rewardScore,
    };
  });
}

function rewardQualitySummary(item) {
  const reward = item.reward || rewardProgram(item.card.card_id);
  return `${reward.program}: ${reward.note} ${reward.expiry}`;
}

function rewardQualityLabel(item) {
  const id = item.card.card_id;
  if (id === "hsbc-revolution" || id === "citi-rewards") return "High flexibility";
  if (id === "dbs-womans-world") return "Short expiry";
  if (/^uob-/.test(id)) return "Pooled UNI$";
  if (id === "krisflyer-uob") return "Simple KrisFlyer";
  if (id === "ocbc-rewards") return "Broad partners";
  if (id === "citi-smrt") return "Cashback value";
  return "Reward quality";
}

function addRecommendation(items, recommendation) {
  if (!recommendation?.card || items.some((item) => item.card.card_id === recommendation.card.card_id)) return;
  items.push(recommendation);
}

function recommendation(id, score, role, why, allocation, caution, priority = "Core") {
  const card = findCard(id);
  if (!card) return null;
  return { card, score, role, why, allocation, caution, priority };
}

function buildPortfolio(profile) {
  const { spend, preference, simpleMode, totalSpend } = profile;
  if (totalSpend <= 0) return [];

  const items = [];
  const category = largestCategory(spend);
  const onlineRetail = Math.max(0, spend.online);
  const onlineOverflow = Math.max(0, spend.online - 1000);
  const mobileContactless = spendAmount(spend, ["contactless", "transport"]);
  const shoppingSpend = Math.max(spend.online, 0) + Math.max(spend.groceries, 0);
  const cashbackSpend = spendAmount(spend, ["groceries", "transport", "online", "overseas"]);
  const wantsCashback = preference === "cashback";
  const wantsMiles = preference === "miles";
  const wantsBalanced = preference === "balanced";

  const candidates = [];

  if (wantsCashback || wantsBalanced) {
    const clearsMinimum = cashbackSpend >= 500;
    candidates.push(recommendation(
      "citi-smrt",
      Math.min(cashbackSpend, 1200) + (wantsCashback ? 900 : 150) + (clearsMinimum ? 250 : -350),
      "Cashback essentials",
      clearsMinimum
        ? "Best fit for a cashback-first user with enough groceries, online, MYR or commute spend to clear the S$500 minimum."
        : "Only a partial fit because the user may not clear the S$500 statement-month minimum reliably.",
      clearsMinimum
        ? `Put about ${money(Math.min(cashbackSpend, 1200))} of groceries, online shopping, MYR or commute spend here.`
        : "Use only if the user can reliably reach S$500 statement-month spend; otherwise keep this as optional.",
      "Do not count wallet top-ups or travel-related online transactions towards bonus cashback.",
      wantsCashback ? "Core" : "Optional"
    ));
  }

  if (!wantsCashback || wantsBalanced) {
    if (onlineRetail > 0) {
      candidates.push(recommendation(
        "citi-rewards",
        Math.min(onlineRetail, 1000) * 1.35 + (wantsMiles ? 250 : 0),
        "First online bucket",
        "Strong first card for online retail, food delivery, ride-hailing and selected shopping MCCs.",
        `Put the first ${money(Math.min(onlineRetail, 1000))} of eligible online retail-style spend here each statement month.`,
        "Avoid flights, hotels, OTAs, mobile-wallet routes and wallet top-ups.",
        "Core"
      ));
    }

    if (onlineOverflow > 0 || spend.travel > 0) {
      const dbsTarget = Math.min(1000, onlineOverflow + spend.travel);
      candidates.push(recommendation(
        "dbs-womans-world",
        dbsTarget * 1.15 + (spend.travel > 0 ? 250 : 0),
        "Online overflow / online travel",
        "Useful second online bucket, especially where Citi Rewards is excluded or travel-style online spend is involved.",
        `Put up to ${money(dbsTarget || 1000)} of online overflow or online travel-style transactions here each calendar month.`,
        "DBS Points from this card have short expiry; check merchant coding for bonus eligibility.",
        onlineRetail > 0 ? "Add-on" : "Core"
      ));
    }

    if (mobileContactless > 0 || spend.online > 700) {
      const contactlessTarget = Math.min(mobileContactless, 600);
      const selectedOnlineTarget = Math.min(Math.max(0, spend.online - Math.min(onlineRetail, 1000)), 600);
      candidates.push(recommendation(
        "uob-preferred-visa",
        (contactlessTarget * 1.45) + (selectedOnlineTarget * 0.7) + 150,
        "Everyday mobile contactless",
        "Best default for Apple Pay/Google Pay/Samsung Pay taps, with a separate selected-online bucket.",
        `Use up to ${money(600)} mobile contactless plus up to ${money(600)} selected online each calendar month.`,
        "Physical card tap does not count for the mobile-contactless bucket; UOB awards in S$5 blocks.",
        "Core"
      ));
    }

    if (category?.value >= 300) {
      candidates.push(recommendation(
        "uob-ladys",
        Math.min(category.value, 1000) * 1.15 + (category.value >= 600 ? 160 : 0),
        `${category.label} category card`,
        `Best dedicated category card because ${category.label.toLowerCase()} is one of the user's larger recurring spend buckets.`,
        `Set the quarterly category to ${category.category} and route up to ${money(Math.min(category.value, 1000))}/month if MCC fit is clean.`,
        "Category is MCC-based; actual merchant code matters more than the user's intention.",
        "Add-on"
      ));
    }

    if (spend.overseas >= 900 || mobileContactless >= 1200) {
      const bucket = spend.overseas >= mobileContactless ? "overseas" : "local petrol/contactless";
      candidates.push(recommendation(
        "uob-visa-signature",
        Math.max(spend.overseas, mobileContactless) + 150,
        "High-spend threshold bucket",
        `Good fit when the user can clear the S$1,000 ${bucket} bucket minimum.`,
        `Use for ${bucket} months where spend is at least S$1,000 and ideally near the S$1,200 cap.`,
        "Skip this card when the relevant bucket is below S$1,000; the earn rate becomes much weaker.",
        "Conditional"
      ));
    }

    if (shoppingSpend >= 600) {
      candidates.push(recommendation(
        "ocbc-rewards",
        Math.min(shoppingSpend, 1000) * 0.9,
        "Promo shopping layer",
        "Useful for listed shopping platforms while the 6 mpd promo remains available.",
        "Use for Watsons, Shopee, Lazada, Taobao, TikTok Shop and selected retail categories.",
        "Promo and merchant list are date-sensitive; recheck current OCBC terms before relying on it.",
        "Optional"
      ));
    }

    if (simpleMode || totalSpend > 4500) {
      candidates.push(recommendation(
        "krisflyer-uob",
        (simpleMode ? 900 : 250) + Math.max(0, totalSpend - 3500) * 0.25,
        "Simple direct-KrisFlyer fallback",
        "Good fit when the user wants fewer cards or regularly exceeds specialised 4 mpd caps.",
        "Use after specialised caps are filled, or as the main card when simplicity matters more than maximum earn rate.",
        "Requires S$1,000 annual SIA Group spend to unlock accelerated everyday categories.",
        simpleMode ? "Core" : "Overflow"
      ));
    }

    candidates.push(recommendation(
      "hsbc-revolution",
      Math.min(spendAmount(spend, ["dining", "travel", "online", "contactless"]), 1000) * 0.65 + 120,
      "Flexible starter / gap filler",
      "Good bridge card for eligible everyday categories when the user wants a cleaner starter setup.",
      "Use for eligible HSBC online/contactless bonus categories after more specialised buckets are assigned.",
      "Check HSBC selected categories and EGA conditions before assuming the highest earn rate.",
      "Optional"
    ));
  }

  const priorityWeight = { Core: 0, "Add-on": 1, Conditional: 2, Optional: 3, Overflow: 4 };
  const ranked = applyRewardQuality(candidates, profile)
    .filter((item) => item.score > 0)
    .sort((a, b) => (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9) || b.score - a.score);

  ranked.forEach((item) => addRecommendation(items, item));

  const maxCards = simpleMode ? 3 : wantsCashback ? 4 : 6;
  return items.slice(0, maxCards).map((item, index) => ({ ...item, rank: index + 1 }));
}

function portfolioMarkdown(profile, items) {
  const title = profile.userName ? `Card portfolio for ${profile.userName}` : "Tailored card portfolio";
  const spendLines = Object.entries(profile.spend)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `- ${key}: ${money(value)}`);

  const cardLines = items.map((item, index) => [
    `${index + 1}. ${item.card.card_name} (${item.priority}: ${item.role})`,
    `   - Use for: ${item.allocation}`,
    `   - Why: ${item.why}`,
    `   - Reward quality: ${rewardQualitySummary(item)}`,
    `   - Transfer/expiry notes: ${item.reward.partnerCount}; ${item.reward.pooling}; ${item.reward.friction}`,
    `   - Watch-out: ${item.caution}`,
    `   - Official: ${item.card.official_product_url}`,
  ].join("\n"));

  return [
    `# ${title}`,
    "",
    `Generated: ${new Date().toLocaleDateString("en-SG")}`,
    "",
    "## Spend profile",
    spendLines.length ? spendLines.join("\n") : "- No spend values entered",
    "",
    "## Recommended portfolio",
    cardLines.join("\n\n"),
    "",
    "## Important reminder",
    "Card earn rates, MCC treatment, exclusions and promos change frequently. Recheck official bank terms before user-specific advice.",
  ].join("\n");
}

function renderPortfolio(event) {
  if (event) event.preventDefault();
  const profile = profileValues();
  if (!profile || !selectors.portfolioOutput) return;
  const items = buildPortfolio(profile);
  appState.lastPortfolio = portfolioMarkdown(profile, items);

  const title = profile.userName ? `${escapeHtml(profile.userName)}'s card portfolio` : "Tailored card portfolio";
  if (profile.totalSpend <= 0) {
    selectors.portfolioOutput.innerHTML = `
      <div class="portfolio-hero">
        <div>
          <p class="eyebrow">Tailored recommendation</p>
          <h2>${title}</h2>
        </div>
        <p>Enter spend values to generate a recommended setup.</p>
      </div>
      <div class="portfolio-overview" aria-label="Portfolio summary">
        <span><strong>No spend entered</strong></span>
        <span><strong>${escapeHtml(preferenceLabel(profile.preference))}</strong> reward style</span>
      </div>
    `;
    return;
  }

  selectors.portfolioOutput.innerHTML = `
    <div class="portfolio-hero">
      <div>
        <p class="eyebrow">Tailored recommendation</p>
        <h2>${title}</h2>
      </div>
      <p>${cardCountLabel(items.length)} selected for ${money(profile.totalSpend)} monthly spend.</p>
    </div>
    <div class="portfolio-overview" aria-label="Portfolio summary">
      <span><strong>${money(profile.totalSpend)}</strong> monthly spend</span>
      <span><strong>${escapeHtml(preferenceLabel(profile.preference))}</strong> reward style</span>
      <span><strong>${cardCountLabel(items.length)}</strong> setup</span>
      <span><strong>Point quality</strong> included</span>
    </div>
    <div class="portfolio-grid">
      ${items.map((item) => `
        <article class="portfolio-item ${item.rank <= 2 ? "featured" : ""}">
          <div class="portfolio-item-top">
            <span class="rank-badge">${String(item.rank).padStart(2, "0")}</span>
            <span class="priority-badge">${escapeHtml(item.priority)}</span>
          </div>
          <h3>${escapeHtml(item.card.card_name)}</h3>
          <p class="portfolio-role">${escapeHtml(item.role)}</p>
          <div class="portfolio-use">
            <span>Use this for</span>
            <strong>${escapeHtml(item.allocation)}</strong>
          </div>
          <div class="portfolio-meta">
            <div>
              <span>Reward quality</span>
              <strong>${escapeHtml(rewardQualityLabel(item))}</strong>
            </div>
            <div>
              <span>Watch</span>
              <strong>${escapeHtml(concise(item.caution))}</strong>
            </div>
          </div>
          <details class="portfolio-details">
            <summary>More context</summary>
            <p><strong>Why:</strong> ${escapeHtml(item.why)}</p>
            <p><strong>Points:</strong> ${escapeHtml(rewardQualitySummary(item))}</p>
            <p><strong>Transfer/expiry:</strong> ${escapeHtml(`${item.reward.partnerCount}; ${item.reward.pooling}; ${item.reward.friction}`)}</p>
          </details>
        </article>
      `).join("")}
    </div>
  `;
}

function downloadPortfolio() {
  if (!selectors.downloadPortfolio) return;
  if (!appState.lastPortfolio) renderPortfolio();
  const blob = new Blob([appState.lastPortfolio], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "card-portfolio-recommendation.md";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function resetProfile() {
  if (!selectors.portfolioForm) return;
  selectors.portfolioForm.reset();
  document.querySelectorAll("[data-spend]").forEach((input) => {
    input.value = "";
  });
  renderPortfolio();
}

function render() {
  const cards = visibleCards();
  renderTags();
  renderTable();
  renderCards(cards);
}

selectors.segments.forEach((button) => {
  button.addEventListener("click", () => {
    selectors.segments.forEach((segment) => {
      segment.classList.toggle("active", segment === button);
      segment.setAttribute("aria-selected", segment === button ? "true" : "false");
    });
    appState.category = button.dataset.category;
    render();
  });
});

if (selectors.search) {
  selectors.search.addEventListener("input", (event) => {
    appState.query = event.target.value.trim();
    render();
  });
}

if (selectors.definitionsToggle) {
  selectors.definitionsToggle.addEventListener("click", () => {
    appState.definitionsOpen = !appState.definitionsOpen;
    syncDefinitionPanels();
  });
}

if (selectors.portfolioForm) {
  selectors.portfolioForm.addEventListener("submit", renderPortfolio);
}

if (selectors.downloadPortfolio) {
  selectors.downloadPortfolio.addEventListener("click", downloadPortfolio);
}

if (selectors.resetProfile) {
  selectors.resetProfile.addEventListener("click", resetProfile);
}

if (selectors.returnTop) {
  const updateTopButton = () => {
    selectors.returnTop.classList.toggle("visible", window.scrollY > 520);
  };

  selectors.returnTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", updateTopButton, { passive: true });
  updateTopButton();
}

if (selectors.tableWrap && selectors.stickyTableHeader) {
  window.addEventListener("scroll", syncStickyTableHeader, { passive: true });
  window.addEventListener("resize", syncStickyTableHeader);
  selectors.tableWrap.addEventListener("scroll", syncStickyTableHeader, { passive: true });
}

render();
if (selectors.portfolioForm) renderPortfolio();

const startSheetHydration = () => hydrateFromSheet();
if ("requestIdleCallback" in window) {
  window.requestIdleCallback(startSheetHydration, { timeout: 1200 });
} else {
  window.setTimeout(startSheetHydration, 0);
}
