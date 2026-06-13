import { AppState, AllowBypassMessage, CheckBypassMessage } from "./types";

const DEFAULT_BLOCKLIST = [
  // Original / Core Social Media
  "youtube.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "linkedin.com",
  "pinterest.com",

  // Forums & Content Aggregators
  "reddit.com",
  "quora.com",
  "news.ycombinator.com", // Hacker News

  // Streaming & Entertainment
  "netflix.com",
  "twitch.tv",
  "disneyplus.com",
  "hulu.com",
  "amazon.com/primevideo",

  // Messaging & Chat
  "discord.com",
  "whatsapp.com",
  "telegram.org",
];

const DEFAULT_STATE: AppState = {
  isFocusModeActive: false,
  defaultTimerDuration: 10,
  projects: [],
  activeProjectId: null,
  blocklist: DEFAULT_BLOCKLIST,
};

function getState(): Promise<AppState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (result) => {
      const s = result as unknown as Partial<AppState>;
      resolve({
        isFocusModeActive:
          s.isFocusModeActive ?? DEFAULT_STATE.isFocusModeActive,
        defaultTimerDuration:
          s.defaultTimerDuration ?? DEFAULT_STATE.defaultTimerDuration,
        projects: s.projects ?? DEFAULT_STATE.projects,
        activeProjectId: s.activeProjectId ?? DEFAULT_STATE.activeProjectId,
        blocklist: s.blocklist ?? DEFAULT_STATE.blocklist,
      });
    });
  });
}

async function syncRules(
  isFocusModeActive: boolean,
  blocklist: string[],
): Promise<void> {
  const existingRules = await chrome.declarativeNetRequest.getSessionRules();
  const existingIds = existingRules.map((r) => r.id);

  if (!isFocusModeActive || blocklist.length === 0) {
    if (existingIds.length > 0) {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: existingIds,
      });
    }
    return;
  }

  const newRules = blocklist.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "redirect" as chrome.declarativeNetRequest.RuleActionType,
      redirect: {
        url: chrome.runtime.getURL(`intercept.html?target=${domain}`),
      },
    } as chrome.declarativeNetRequest.RuleAction,
    condition: {
      urlFilter: domain,
      resourceTypes: [
        "main_frame" as chrome.declarativeNetRequest.ResourceType,
      ],
    } as chrome.declarativeNetRequest.RuleCondition,
  }));

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: existingIds,
    addRules: newRules,
  });
}

async function removeRuleForDomain(domain: string): Promise<number[]> {
  const rules = await chrome.declarativeNetRequest.getSessionRules();
  const matching = rules.filter((r) => r.condition.urlFilter === domain);
  const ids = matching.map((r) => r.id);
  if (ids.length > 0) {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: ids,
    });
  }
  return ids;
}

async function restoreRuleForDomain(
  domain: string,
  ids: number[],
): Promise<void> {
  if (ids.length === 0) return;
  const rules = ids.map((id) => ({
    id,
    priority: 1,
    action: {
      type: "redirect" as chrome.declarativeNetRequest.RuleActionType,
      redirect: {
        url: chrome.runtime.getURL(`intercept.html?target=${domain}`),
      },
    } as chrome.declarativeNetRequest.RuleAction,
    condition: {
      urlFilter: domain,
      resourceTypes: [
        "main_frame" as chrome.declarativeNetRequest.ResourceType,
      ],
    } as chrome.declarativeNetRequest.RuleCondition,
  }));
  await chrome.declarativeNetRequest.updateSessionRules({ addRules: rules });
}

// ── lifecycle ──────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get(null);
  if (Object.keys(result).length === 0) {
    await chrome.storage.local.set(DEFAULT_STATE);
  }
  const state = await getState();
  await syncRules(state.isFocusModeActive, state.blocklist);
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.session.clear();
  const state = await getState();
  await syncRules(state.isFocusModeActive, state.blocklist);
});

chrome.storage.onChanged.addListener(async (changes) => {
  if ("isFocusModeActive" in changes || "blocklist" in changes) {
    const state = await getState();
    await syncRules(state.isFocusModeActive, state.blocklist);
  }
});

// ── messaging ──────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (message: AllowBypassMessage | CheckBypassMessage, sender, sendResponse) => {
    if (message.type === "allowBypass") {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({});
        return true;
      }

      const domain = message.domain;
      const bypassKey = `bypass:${tabId}`;

      (async () => {
        const ruleIds = await removeRuleForDomain(domain);
        await chrome.storage.session.set({
          [bypassKey]: { domain, time: Date.now(), ruleIds },
        });
        chrome.tabs.update(tabId, {
          url: domain.startsWith("http") ? domain : `https://${domain}`,
        });
        setTimeout(async () => {
          const stored = await chrome.storage.session.get(bypassKey);
          const entry = stored[bypassKey] as
            | { domain: string; ruleIds: number[] }
            | undefined;
          if (entry) {
            await chrome.storage.session.remove(bypassKey);
            await restoreRuleForDomain(domain, ruleIds);
          }
        }, 3000);
      })();

      sendResponse({});
      return true;
    }

    if (message.type === "checkBypass") {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ bypassed: false });
        return true;
      }

      const bypassKey = `bypass:${tabId}`;
      (async () => {
        const stored = await chrome.storage.session.get(bypassKey);
        const entry = stored[bypassKey] as
          | { domain: string; ruleIds: number[] }
          | undefined;
        if (entry && entry.domain === message.domain) {
          await chrome.storage.session.remove(bypassKey);
          await restoreRuleForDomain(message.domain, entry.ruleIds);
          sendResponse({ bypassed: true });
        } else {
          sendResponse({ bypassed: false });
        }
      })();

      return true;
    }
  },
);
