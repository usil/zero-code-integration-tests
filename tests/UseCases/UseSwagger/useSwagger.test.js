const seoHelpers = require("../../../src/helpers/seo.helpers");
const getBrowserDriver = require("../../../src/browsers/browserDriver");
const { By, until } = require("selenium-webdriver");
const rs = require("randomstring");

const webUrl = process.env.webUrl;
const apiUrl = process.env.apiUrl;
const password = process.env.adminPassword;

describe("Use UI to view swagger", () => {
  let driver;
  let tableName = "";
  let accessToken = "";

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

  it("Sends a query, create a table and add data", async () => {
    const textAreaInput = driver.findElement(
      By.css("textarea[formcontrolname='rawQueryStatement']")
    );

    tableName = rs.generate({
      length: 6,
      charset: "alphabetic",
    });

    const createTableSqlStatement = `CREATE TABLE IF NOT EXISTS ${tableName} (
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

    await textAreaInput.clear();

    let values = "";

    for (let index = 0; index < 20; index++) {
      values += `("some-${index}"),\n`;
    }
    values += `("some-21")`;
    await textAreaInput.sendKeys(`INSERT INTO ${tableName}
    (title)
    VALUES
    ${values};`);

    await button.click();

    await seoHelpers.artificialWait(3000);

    const insertValue = await resultTextArea.getAttribute("value");

    expect(JSON.parse(insertValue)[0].affectedRows).toBe(21);
  });

  it("Create client for the added table", async () => {
    await driver.get(webUrl + "/dashboard/auth/resource");
    await driver.wait(
      until.urlIs(webUrl + "/dashboard/auth/resource"),
      5 * 1000
    );
    await seoHelpers.createResource(driver, tableName);
    await driver.get(webUrl + "/dashboard/auth/roles");
    await driver.wait(until.urlIs(webUrl + "/dashboard/auth/roles"), 5 * 1000);

    await seoHelpers.creatRole(driver);

    await driver.get(webUrl + "/dashboard/auth/clients");
    await driver.wait(
      until.urlIs(webUrl + "/dashboard/auth/clients"),
      5 * 1000
    );

    const result = await seoHelpers.createClient(driver, true);

    accessToken = result.accessToken;
    expect(accessToken).toBeTruthy();
  });

  it("Table has no elements, then it does", async () => {
    await driver.get(webUrl + `/dashboard/table/${tableName}`);
    await driver.wait(
      until.urlIs(webUrl + `/dashboard/table/${tableName}`),
      5 * 1000
    );
    const tableElement = await driver.wait(
      until.elementLocated(By.css("table")),
      5 * 1000
    );

    const tds = await tableElement.findElements(By.css("tbody td"));

    expect(tds.length).toBe(0);

    const lastButton = await driver.findElement(
      By.css(".show-table-header button:last-child")
    );

    await lastButton.click();

    const tableElementPostReload = await driver.wait(
      until.elementLocated(By.css("table tbody td")),
      5 * 1000
    );

    expect(tableElementPostReload).toBeTruthy();
  });

  it("Goes to the swagger", async () => {
    const allButtons = await driver.findElements(
      By.css(".show-table-header button")
    );

    const originalWindow = await driver.getWindowHandle();

    await allButtons[1].click();

    await driver.wait(
      async () => (await driver.getAllWindowHandles()).length === 2,
      5000
    );

    const windows = await driver.getAllWindowHandles();
    windows.forEach(async (handle) => {
      if (handle !== originalWindow) {
        await driver.switchTo().window(handle);
      }
    });

    await driver.wait(until.titleIs("Swagger UI"), 5000);

    const h3 = await driver.findElement(By.css(`h3[data-tag='${tableName}']`));

    const h3Parent = await h3.findElement(By.xpath("./.."));

    const allSpans = await h3Parent.findElements(
      By.css(".no-margin .operation-tag-content > span")
    );

    const lockButton = await allSpans[0].findElement(
      By.css(".opblock .opblock-summary .authorization__btn")
    );

    await driver.executeScript("arguments[0].click();", lockButton);

    const modal = await driver.wait(
      until.elementLocated(By.css(".modal-ux"), 5000)
    );

    const modalInput = await modal.findElement(By.css("input"));
    const authButton = await modal.findElement(By.css("form button"));

    await modalInput.sendKeys(accessToken);
    await authButton.click();

    const closeButton = await modal.findElement(By.css(".close-modal"));

    await closeButton.click();

    await allSpans[0].click();

    const tryOutGetButton = await allSpans[0].findElement(
      By.css(".try-out__btn")
    );

    await tryOutGetButton.click();

    await seoHelpers.artificialWait(3000);

    const pageIndexInputGET = await allSpans[0].findElement(
      By.css("input[placeholder='pageIndex']")
    );

    await pageIndexInputGET.sendKeys(1);

    const itemsPerPageInputGET = await allSpans[0].findElement(
      By.css("input[placeholder='itemsPerPage']")
    );

    await itemsPerPageInputGET.sendKeys(15);

    const executeButton = await allSpans[0].findElement(By.css(".execute"));

    await executeButton.click();

    expect(allSpans.length).toBe(6);
  });

  afterAll(async () => {
    await driver.quit();
  });
});
