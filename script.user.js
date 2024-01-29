// ==UserScript==
// @name         Gitlab Utils
// @namespace    http://tampermonkey.net/
// @version      2024-01-29
// @description  Little script to add some utils to gitlab website
// @downloadURL  https://raw.githubusercontent.com/maxoux/gitlab_utils/main/script.user.js
// @author       Matthieu Laizé
// @match        https://gitlab.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gitlab.com
// @grant        none
// ==/UserScript==

const PATH_MR = "/merge_requests($|\\?.*)";

function listenForUrlChange(route, cb) {
  let lastUrlChange = undefined;
  const regex = new RegExp(route, "i");

  const check = () => {
    const actualUrl = window.location.href;
    if (actualUrl != lastUrlChange && regex.exec(actualUrl)) {
      cb();
    }
    lastUrlChange = actualUrl;
  };

  setInterval(check, 5000);
  check();
}

function isDraftMr(mr) {
  return mr
    .querySelector(".merge-request-title-text a")
    .text.startsWith("Draft: ");
}

function isApprovedMr(mr) {
  return !!mr.querySelector("[data-testid=approval-solid-icon]");
}

function isRequestedMr(mr) {
  const strip = (str) => str.replace(/\?.*/g, "");

  const getRequestedAvatars = (mr) =>
    Array.from(mr.querySelectorAll("img.avatar")).map((elem) =>
      strip(elem.src)
    );

  const userAvatar = document.querySelector(
    "[data-testid=user-menu-toggle] img"
  ).src;

  return getRequestedAvatars(mr).includes(strip(userAvatar));
}

function colorizeMrs(mrList, color) {
  mrList.forEach((element) => {
    element.querySelector(
      ".merge-request-title-text a"
    ).style.cssText += `color: ${color}; transition: color 0.3s`;
  });
}

(function () {
  "use strict";

  listenForUrlChange(PATH_MR, () => {
    console.log("Adding some color !");

    const mrList = Array.from(document.querySelectorAll(".merge-request"));

    const draftList = mrList.filter(isDraftMr);
    const approvedList = mrList.filter(isApprovedMr);
    const requestedList = mrList.filter(isRequestedMr);

    colorizeMrs(requestedList, "#caca56");
    colorizeMrs(approvedList, "#5ce75c");
    colorizeMrs(draftList, "red");

    console.log("drafts : ", draftList);
  });
})();
