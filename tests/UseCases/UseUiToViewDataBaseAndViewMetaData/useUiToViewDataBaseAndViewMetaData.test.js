const seoHelpers = require("../../../src/helpers/seo.helpers");
const getBrowserDriver = require("../../../src/browsers/browserDriver");
const { By, until } = require("selenium-webdriver");
const rs = require("randomstring");

const webUrl = process.env.webUrl;
const password = process.env.adminPassword;

describe("Use UI to view data", () => {
  let driver;
  let tableName = "";

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

    await textAreaInput.sendKeys(`INSERT INTO ${tableName}
    (title)
    VALUES
    ("some");`);

    await button.click();

    await seoHelpers.artificialWait(3000);

    const insertValue = await resultTextArea.getAttribute("value");

    expect(JSON.parse(insertValue)[0].affectedRows).toBe(1);
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

  it("Go to view metadata", async () => {
    const firstButton = await driver.findElement(
      By.css(".show-table-header button")
    );

    await firstButton.click();

    await driver.wait(
      until.urlIs(webUrl + `/dashboard/table/${tableName}/meta-data`),
      5 * 1000
    );

    const tableMetaData = await driver.wait(
      until.elementLocated(By.css(".table-meta-data")),
      5 * 1000
    );

    const commentTable = await tableMetaData.findElement(
      By.css(".general h4:first-child")
    );

    const primaryKeyTable = await tableMetaData.findElement(
      By.css(".general h4:last-child")
    );

    const commentTableValue = await commentTable.getAttribute("innerHTML");
    const primaryKeyTableValue = await primaryKeyTable.getAttribute(
      "innerHTML"
    );

    expect(commentTableValue).toBe("Table Comment: No comment");
    expect(primaryKeyTableValue).toBe("Primary Key: id");

    const expansion = await driver.findElement(By.css("mat-expansion-panel"));

    await expansion.click();

    const allH4 = await driver.wait(
      until.elementsLocated(
        By.css(
          "mat-accordion .mat-expansion-panel:first-child .column-show-metadata h4"
        )
      ),
      5 * 1000
    );

    expect(allH4.length).toBe(5);

    const firstHFourValue = await allH4[0].getAttribute("innerHTML");

    expect(firstHFourValue.split("</span>")[1]).toBe(" PRI ");
  });

  afterAll(async () => {
    await driver.quit();
  });
});
