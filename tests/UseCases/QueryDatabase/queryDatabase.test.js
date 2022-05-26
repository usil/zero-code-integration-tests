const seoHelpers = require("../../../src/helpers/seo.helpers");
const getBrowserDriver = require("../../../src/browsers/browserDriver");
const { By, until } = require("selenium-webdriver");
const rs = require("randomstring");

const webUrl = process.env.webUrl;
const password = process.env.adminPassword;

describe("Query into database works", () => {
  let driver;

  beforeAll(async () => {
    driver = await getBrowserDriver();
    await seoHelpers.enterIntoZeroCode(driver, webUrl, password);
    await driver.get(webUrl + "/dashboard/raw-query");
    await driver.wait(until.urlIs(webUrl + "/dashboard/raw-query"), 5 * 1000);
    await driver.wait(
      until.elementLocated(
        By.xpath("//textarea[@formcontrolname='rawQueryStatement']")
      ),
      5000
    );
  });

  it("Sends a query, create a table", async () => {
    const textAreaInput = driver.findElement(
      By.css("textarea[formcontrolname='rawQueryStatement']")
    );

    const createTableSqlStatement = `CREATE TABLE IF NOT EXISTS ${rs.generate({
      length: 6,
      charset: "alphabetic",
    })} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL
    )`;

    await textAreaInput.sendKeys(createTableSqlStatement);

    const button = driver.findElement(By.css("section form button"));

    await button.click();

    await seoHelpers.artificialWait(3000);

    const resultTextArea = await driver.findElement(By.css(".result textarea"));

    const value = await resultTextArea.getAttribute("value");

    expect(JSON.parse(value)[0].serverStatus).toBe(2);
  });

  afterAll(async () => {
    await driver.quit();
  });
});
