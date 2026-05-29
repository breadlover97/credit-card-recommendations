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
        <a class="table-card-link" href="#${cardAnchor(card)}">${card.card_name}</a>
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
    clientName: document.querySelector("#client-name").value.trim(),
    preference: document.querySelector("#reward-preference").value,
    simpleMode: document.querySelector("#simple-mode").checked,
    spend,
    totalSpend: Object.values(spend).reduce((sum, value) => sum + value, 0),
  };
}

function findCard(id) {
  return allCards().find((card) => card.card_id === id);
}

function addRecommendation(items, id, why, allocation, caution) {
  const card = findCard(id);
  if (!card || items.some((item) => item.card.card_id === id)) return;
  items.push({ card, why, allocation, caution });
}

function buildPortfolio(profile) {
  const { spend, preference, simpleMode, totalSpend } = profile;
  const items = [];

  if (preference === "cashback") {
    addRecommendation(
      items,
      "citi-smrt",
      "Cashback-first setup for groceries, online shopping, transport and MYR spend.",
      "Use when the monthly statement spend can clear the S$500 minimum.",
      "Do not treat wallet top-ups or travel-related online transactions as bonus spend."
    );
    return items;
  }

  if (simpleMode || totalSpend > 4500) {
    addRecommendation(
      items,
      "krisflyer-uob",
      "Simple direct-KrisFlyer fallback when the client dislikes juggling caps or regularly exceeds 4 mpd buckets.",
      "Use after specialised 4 mpd caps are filled, or as the main card for simplicity-first clients.",
      "Requires S$1,000 annual SIA Group spend to unlock accelerated categories."
    );
  }

  if (spend.online > 0) {
    addRecommendation(
      items,
      "citi-rewards",
      "First online retail bucket.",
      `Allocate up to about S$1,000 per statement month of eligible online retail, food delivery and ride-hailing spend.`,
      "Avoid flights, hotels, travel agencies and mobile wallet transactions."
    );
    if (spend.online > 800 || spend.travel > 0) {
      addRecommendation(
        items,
        "dbs-womans-world",
        "Second online bucket and useful for online travel-style payments.",
        "Allocate up to about S$1,000 per calendar month of online spend.",
        "DBS Points can be short-expiry; verify merchant coding for bonus eligibility."
      );
    }
  }

  if (spend.contactless > 0 || spend.transport > 0) {
    addRecommendation(
      items,
      "uob-preferred-visa",
      "Default offline mobile-contactless card.",
      "Use Apple Pay/Google Pay/Samsung Pay tap for everyday contactless spend and selected online merchants.",
      "Physical card tap does not count for this card's mobile-contactless bonus."
    );
  }

  const largestCategory = [
    ["dining", spend.dining],
    ["travel", spend.travel],
    ["transport", spend.transport],
    ["family/groceries", spend.groceries],
  ].sort((a, b) => b[1] - a[1])[0];

  if (largestCategory && largestCategory[1] >= 350) {
    addRecommendation(
      items,
      "uob-ladys",
      `Dedicated category card for ${largestCategory[0]}.`,
      `Set the quarterly category to ${largestCategory[0]} if the MCC fit is clean.`,
      "Category is MCC-based; the merchant's actual code matters more than the user's intention."
    );
  }

  if (spend.overseas >= 700 || spend.contactless >= 1300) {
    addRecommendation(
      items,
      "uob-visa-signature",
      "Higher-cap card for larger contactless or overseas months.",
      "Use only when the client can confidently clear the S$1,000 bucket minimum.",
      "Missing the minimum spend makes this much weaker."
    );
  }

  if (spend.online >= 700 || spend.groceries >= 400) {
    addRecommendation(
      items,
      "ocbc-rewards",
      "Shopping promo layer for selected platforms.",
      "Use for Shopee, Lazada, Taobao, TikTok Shop and Watsons while the promo is live.",
      "Promo is date-sensitive; recheck after 30 June 2026."
    );
  }

  if (items.length < 3) {
    addRecommendation(
      items,
      "hsbc-revolution",
      "Flexible starter card for eligible online/contactless categories.",
      "Use as a simple bridge card for dining, shopping, travel and selected everyday categories.",
      "Check HSBC selected categories and EGA conditions before promising the highest earn rate."
    );
  }

  return items.slice(0, simpleMode ? 4 : 6);
}

function portfolioMarkdown(profile, items) {
  const title = profile.clientName ? `Card portfolio for ${profile.clientName}` : "Tailored card portfolio";
  const spendLines = Object.entries(profile.spend)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `- ${key}: S$${value.toLocaleString("en-SG")}`);

  const cardLines = items.map((item, index) => [
    `${index + 1}. ${item.card.card_name}`,
    `   - Why: ${item.why}`,
    `   - Use: ${item.allocation}`,
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
    "Card earn rates, MCC treatment, exclusions and promos change frequently. Recheck official bank terms before client-specific advice.",
  ].join("\n");
}

function renderPortfolio(event) {
  if (event) event.preventDefault();
  const profile = profileValues();
  if (!profile || !selectors.portfolioOutput) return;
  const items = buildPortfolio(profile);
  appState.lastPortfolio = portfolioMarkdown(profile, items);

  const title = profile.clientName ? `${profile.clientName}'s card portfolio` : "Tailored card portfolio";
  selectors.portfolioOutput.innerHTML = `
    <div>
      <p class="eyebrow">Tailored recommendation</p>
      <h2>${title}</h2>
      <p>${items.length} cards selected from S$${profile.totalSpend.toLocaleString("en-SG")} monthly spend.</p>
    </div>
    <div class="portfolio-grid">
      ${items.map((item) => `
        <article class="portfolio-item">
          <h3>${item.card.card_name}</h3>
          <p><strong>Why:</strong> ${item.why}</p>
          <p><strong>Use:</strong> ${item.allocation}</p>
          <p><strong>Watch:</strong> ${item.caution}</p>
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
  document.querySelector('[data-spend="online"]').value = 1000;
  document.querySelector('[data-spend="contactless"]').value = 800;
  document.querySelector('[data-spend="dining"]').value = 500;
  document.querySelector('[data-spend="travel"]').value = 300;
  document.querySelector('[data-spend="groceries"]').value = 400;
  document.querySelector('[data-spend="transport"]').value = 200;
  document.querySelector('[data-spend="overseas"]').value = 0;
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

if (selectors.portfolioForm) renderPortfolio();
hydrateFromSheet();
