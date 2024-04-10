// ==UserScript==
// @name         Gitlab Utils
// @namespace    http://tampermonkey.net/
// @version      2024-04-10
// @description  Little script to add some utils to gitlab website
// @downloadURL  https://raw.githubusercontent.com/maxoux/gitlab_utils/main/script.user.js
// @author       Matthieu Laizé
// @match        https://gitlab.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gitlab.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/js/all.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @resource     FONTAWESOME https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css
// @grant        GM.getResourceText
// @grant        GM_addStyle
// ==/UserScript==

const PATH_MR_OVERVIEW = "/merge_requests($|\\?.*)";
const PATH_MR_DETAILS = "/merge_requests/[0-9]{3,7}($|\\?.*)";

/**
 * Navigation Utils
 */

/**
 *
 * @param {{ path: string, exec: function }} dict Dictionnary of paths
 */

function listenForUrlChange(dict) {
  let lastUrlChange = undefined;

  const check = () => {
    const actualUrl = window.location.href;

    for (let item of dict) {
      const regex = new RegExp(item.path, "i");
      if (actualUrl != lastUrlChange && !!regex.exec(actualUrl)) {
        console.log("execute");
        lastUrlChange = actualUrl;
        return item.fn();
      }
    }
    lastUrlChange = actualUrl;
  };

  // setInterval(check, 5000);
  check();
}

function filterInPlace(array, fn) {
  let from = 0,
    to = 0;
  while (from < array.length) {
    if (fn(array[from])) {
      array[to] = array[from];
      to++;
    }
    from++;
  }
  array.length = to;
}

const executeByPath = [
  {
    path: PATH_MR_OVERVIEW,
    fn: () => {
      // Get mr infos
      const mrList = Array.from(
        document.querySelectorAll(".merge-request")
      ).map(getMrInfo);

      // Colorize
      mrList.forEach((mrItem) => {
        if (mrItem.status === "DRAFT") colorizeMr(mrItem.element, "red");
        if (mrItem.status === "APPROVED") colorizeMr(mrItem.element, "#48b448");
        if (mrItem.status === "REQUESTED")
          colorizeMr(mrItem.element, "#baba6a");
      });

      // Add mesage icon
      mrList.forEach((mrItem) => {
        const savedMr = saveManager.getMr(mrItem.id);
        console.log(
          `mr ${mrItem.id} have ${mrItem.messages} (${savedMr.messages} before)`,
          savedMr
        );

        if (
          savedMr.messages !== undefined &&
          savedMr.messages != mrItem.messages
        ) {
          console.log("Inserting icon message");
          insertIcon(
            "fas fa-message",
            mrItem.element.querySelector(".merge-request-title"),
            `${mrItem.messages - savedMr.messages} new messages`
          );
        }
      });
    },
  },
  {
    path: PATH_MR_DETAILS,
    fn: () => {
      console.log("I'm in a detailed MR");
      const mrId = document.querySelector(
        "[data-testid=breadcrumb-current-link]"
      ).innerText;
      const messages = Number(
        document.querySelector("[data-testid=notes-tab] span").innerText
      );

      console.log("Mr %s have %d messages", mrId, messages);
      saveManager.updateMr(mrId, { messages });
    },
  },
];

/**
 * END Navigation Utils
 */

const getMrInfo = (mr) => {
  const mrCheckStatus = {
    isDraft: (mr) =>
      mr
        .querySelector(".merge-request-title-text a")
        .text.startsWith("Draft: "),
    isApproved: (mr) => {
      const badgeElement = mr.querySelector(
        "[data-testid=mr-appovals].badge-success"
      );

      if (!badgeElement) return false;
      return badgeElement.title.indexOf("you've approved") !== -1;
    },
    isRequested: (mr) => {
      const strip = (str) => str.replace(/\?.*/g, "");

      const getRequestedAvatars = (mr) =>
        Array.from(mr.querySelectorAll(".issuable-reviewers img.avatar")).map(
          (elem) => strip(elem.src)
        );

      const userAvatar = document.querySelector(
        "[data-testid=user-menu-toggle] img"
      ).src;

      return getRequestedAvatars(mr).includes(strip(userAvatar));
    },
  };

  const getMrStatus = () => {
    if (mrCheckStatus.isDraft(mr)) return "DRAFT";
    else if (mrCheckStatus.isApproved(mr)) return "APPROVED";
    else if (mrCheckStatus.isRequested(mr)) return "REQUESTED";
    return "OPEN";
  };

  return {
    id: mr.querySelector(".issuable-reference").innerText.trim(),
    element: mr,
    status: getMrStatus(),
    messages:
      Number(mr.querySelector("[data-testid=issuable-comments]")?.innerText) ||
      0,
  };
};

function colorizeMr(mr, color) {
  mr.querySelector(
    ".merge-request-title-text a"
  ).style.cssText += `color: ${color}; transition: color 0.3s`;
}

function insertIcon(icon, element, tooltip) {
  element.insertAdjacentHTML(
    "beforeend",
    `<span ${
      tooltip ? `class="has-tooltip" title="${tooltip}"` : ""
    }><i style="margin-left: 5px; color: #baba6a" class="${icon}"></i></span>`
  );
}

class SaveManager {
  static key = "mr_overview_state";
  state = null;

  constructor() {
    const state = localStorage.getItem(SaveManager.key);

    if (!state) {
      this.state = {};
      this.saveData({});
    }

    this.state = JSON.parse(state);
  }

  saveData() {
    localStorage.setItem(SaveManager.key, JSON.stringify(this.state));
  }

  updateMr(mrId, data) {
    if (!this.state[mrId]) this.state[mrId] = {};

    this.state[mrId] = { ...this.state[mrId], ...data };
    this.saveData();
  }

  getMr(mrId) {
    return this.state[mrId] || {};
  }
}

const saveManager = new SaveManager();

(async function () {
  "use strict";
  const additionalCss = await GM.getResourceText("FONTAWESOME");
  console.log("style: ", additionalCss);
  GM_addStyle(additionalCss);

  listenForUrlChange(executeByPath);
})();
