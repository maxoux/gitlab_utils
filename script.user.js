// ==UserScript==
// @name         Gitlab Utils
// @namespace    http://tampermonkey.net/
// @version      2024-01-16
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

(function () {
  "use strict";

  listenForUrlChange(PATH_MR, () => {
    console.log("Im on the way !");
    const DraftMrs = Array.from(
      document.querySelectorAll(".merge-request-title-text a")
    ).filter((elem) => elem.text.startsWith("Draft: "));

    DraftMrs.forEach((element) => {
      element.style.cssText += "color: red; transition: color 0.3s";
    });
  });
})();
