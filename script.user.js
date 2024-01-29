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

function colorizeDraftMr(color) {
  const draftMrs = Array.from(
    document.querySelectorAll(".merge-request-title-text a")
  ).filter((elem) => elem.text.startsWith("Draft: "));

  draftMrs.forEach((element) => {
    element.style.cssText += `color: ${color}; transition: color 0.3s`;
  });
}

function colorizeApprovedMr(color) {
  const approvedMrs = Array.from(document.querySelectorAll(".merge-request"))
    .filter((elem) => !!elem.querySelector("[data-testid=approval-solid-icon]"))
    .map((approved) => approved.querySelector(".merge-request-title-text a"));

  approvedMrs.forEach((element) => {
    element.style.cssText += `color: ${color}; transition: color 0.3s`;
  });
}

function colorizeRequestedMr(color) {
  const strip = (str) => str.replace(/\?.*/g, "");

  const getRequestedAvatars = (mr) =>
    Array.from(mr.querySelectorAll("img.avatar")).map((elem) =>
      strip(elem.src)
    );

  const userAvatar = document.querySelector(
    "[data-testid=user-menu-toggle] img"
  ).src;

  const requestedMrs = Array.from(document.querySelectorAll(".merge-request"))
    .filter((elem) => getRequestedAvatars(elem).includes(strip(userAvatar)))
    .map((mr) => mr.querySelector(".merge-request-title-text a"));

  requestedMrs.forEach((element) => {
    element.style.cssText += `color: ${color}; transition: color 0.3s`;
  });
}

(function () {
  "use strict";

  listenForUrlChange(PATH_MR, () => {
    console.log("Im on the way !");
    colorizeDraftMr("red");
    colorizeRequestedMr("#caca56");
    colorizeApprovedMr("#5ce75c");
  });
})();
