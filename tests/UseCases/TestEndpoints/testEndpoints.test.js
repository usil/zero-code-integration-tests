const seoHelpers = require("../../../src/helpers/seo.helpers");
const getBrowserDriver = require("../../../src/browsers/browserDriver");
const { By, until } = require("selenium-webdriver");
const rs = require("randomstring");
const axios = require("axios").default;

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

  it("Test GET endpoint", async () => {
    const resGET = await axios.get(
      apiUrl +
        `/api/${tableName}?orderByColumn=id&orderType=asc&pageIndex=1&itemsPerPage=15&access_token=${accessToken}`
    );

    expect(resGET.data.code).toBe(200000);
    expect(resGET.data.content.items.length).toBe(6);
  });

  it("Test GET one endpoint", async () => {
    const resGET = await axios.get(
      apiUrl + `/api/${tableName}/1?access_token=${accessToken}`
    );

    expect(resGET.data.code).toBe(200000);
    expect(resGET.data.content.id).toBe(1);
  });

  it("Test POST endpoint", async () => {
    const resPOST = await axios.post(
      apiUrl + `/api/${tableName}?access_token=${accessToken}`,
      {
        inserts: [
          {
            title: "test",
          },
        ],
      }
    );

    expect(resPOST.data.code).toBe(200001);

    const resGET = await axios.get(
      apiUrl +
        `/api/${tableName}?orderByColumn=id&orderType=asc&pageIndex=0&itemsPerPage=22&access_token=${accessToken}`
    );

    expect(resGET.data.content.items.length).toBe(22);
  });

  it("Test PUT endpoint", async () => {
    const resPUT = await axios.put(
      apiUrl + `/api/${tableName}/1?access_token=${accessToken}`,
      {
        title: "testNew",
      }
    );

    expect(resPUT.data.code).toBe(200001);

    const resGET = await axios.get(
      apiUrl + `/api/${tableName}/1?access_token=${accessToken}`
    );

    expect(resGET.data.content.title).toBe("testNew");
  });

  it("Test DELETE endpoint", async () => {
    const resDELETE = await axios.delete(
      apiUrl + `/api/${tableName}/1?access_token=${accessToken}`
    );

    expect(resDELETE.data.code).toBe(200001);

    const resGET = await axios.get(
      apiUrl +
        `/api/${tableName}?orderByColumn=id&orderType=asc&pageIndex=0&itemsPerPage=22&access_token=${accessToken}`
    );

    expect(resGET.data.content.items.length).toBe(21);
  });

  it("Test QUERY = operator endpoint", async () => {
    const resPOST = await axios.post(
      apiUrl +
        `/api/${tableName}/query?access_token=${accessToken}&pagination=false`,
      {
        filters: [
          {
            column: "id",
            value: 2,
            operation: "=",
            negate: true,
          },
        ],
      }
    );

    expect(resPOST.data.content[0].id).not.toBe(2);
  });

  it("Test QUERY  > operator endpoint", async () => {
    const resPOST = await axios.post(
      apiUrl +
        `/api/${tableName}/query?access_token=${accessToken}&pagination=false`,
      {
        filters: [
          {
            column: "id",
            value: 3,
            operation: ">",
            negate: false,
          },
        ],
      }
    );

    expect(resPOST.data.content.length).toBe(19);
  });

  afterAll(async () => {
    await driver.quit();
  });
});
