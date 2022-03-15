import nodeCron from "node-cron";
import puppeteer from "puppeteer";
import ora from "ora";
import chalk from "chalk";

const url = "https://www.worldometers.info/world-population/";

async function scrapeWorldPopulation() {
  console.log(chalk.green("Running scheduled job"));

  const spinner = ora({
    text: "Launching puppeteer",
    color: "blue",
    hideCursor: false,
  }).start();

  try {
    const date = Date.now();

    const browser = await puppeteer.launch();

    spinner.text = "Launching headless browser page";

    const newPage = await browser.newPage();

    spinner.text = "Navigating to URL";

    await newPage.goto(url, { waitUntil: "load", timeout: 0 });

    spinner.text = "Scraping page";

    const digitGroups = await newPage.evaluate(() => {
      const digitGroupsArr = [];

      const selector =
        "#maincounter-wrap .maincounter-number .rts-counter span";
      const digitSpans = document.querySelectorAll(selector);

      digitSpans.forEach((span) => {
        if (!isNaN(parseInt(span.textContent))) {
          digitGroupsArr.push(span.textContent);
        }
      });
      return JSON.stringify(digitGroupsArr);
    });

    spinner.text = "Closing headless browser";

    await browser.close();

    spinner.succeed(`Page scraping successfull after ${Date.now() - date}ms`);

    spinner.clear();

    console.log(
      chalk.yellow.bold(`World population on ${new Date().toISOString()}:`),
      chalk.blue.bold(JSON.parse(digitGroups).join(","))
    );
  } catch (error) {

    spinner.fail({ text: "Scraping failed" });

    spinner.clear();

    console.log(error);
  }
}

const job = nodeCron.schedule("*/30 * * * * *", scrapeWorldPopulation);