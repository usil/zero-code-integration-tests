# Zero-code integration test

This library propose is to test the database, api and web of zero-code. This project is based on the [selenium-nodejs-starter](https://github.com/usil/selenium-nodejs-starter) library.

## Requirements

- nodejs > 14
- zeo-code-api and zeo-code-web

## Variables

| Variable      | file     | description        | default value   |
| :------------ | :------------------ | :----  | :--- -- |
| BROWSER  |  | browser to be used by selenium | chrome   |
| ZERO_CODE_WEB_BASE_URL  | testOptions.json    | The url of the zeo-code web  | http://localhost:2112   |
| ZERO_CODE_API_BASE_URL   | testOptions.json    | The url of the zeo-code api  | http://localhost:2111  |
| ADMIN_PASSWORD | testOptions.json    | The admin user password, by default should be set as an environment variable |  |
| DISPLAY | testOptions.json    | required for screen process on linux | 0 |
| arguments     | browserOptions.json | Browser options  | `"--log-level=1", "--no-sandbox", "--headless", "--disable-gpu"` |


## Steps for Linux (all in one machine)

```
docker exec -it zero-code-api cat /app/credentials.txt
export BROWSER=chrome
export SERVER_IP=$(hostname -I | awk '{print $1}')
export ZERO_CODE_WEB_BASE_URL=http://$SERVER_IP:2112
export ZERO_CODE_API_BASE_URL=http://localhost:2111
export ADMIN_PASSWORD=*******
npm install chromedriver --detect_chromedriver_version
npm install
npm run test
```

Result:
![result](https://i.ibb.co/1QHykGN/test-Result.jpg)

To run it with a browser in background, add `"--headless"` in **browserOptions.json**

Note: if ip is used instead of localhost in ZERO_CODE_API_BASE_URL, you will have problems due to swagger issue

## Steps for Linux (real http domains)

```
docker exec -it zero-code-api cat /app/credentials.txt
export BROWSER=chrome
export ZERO_CODE_WEB_BASE_URL=http://zero-code-ui.acme.com
export ZERO_CODE_API_BASE_URL=http://zero-code-api.acme.com
export ADMIN_PASSWORD=*******
npm install chromedriver --detect_chromedriver_version
npm install
npm run test
```


## Steps for Windows

- https://github.com/usil/zero-code-integration-tests/wiki/Steps-for-Windows

## Detailed steps

More complex details in the [wiki](https://github.com/usil/zero-code-integration-tests/wiki)

## Contributors

<table>
  <tbody>
    <td>
      <img src="https://i.ibb.co/88Tp6n5/Recurso-7.png" width="100px;"/>
      <br />
      <label><a href="https://github.com/TacEtarip">Luis Huertas</a></label>
      <br />
    </td>
    <td>
      <img src="https://avatars0.githubusercontent.com/u/3322836?s=460&v=4" width="100px;"/>
      <br />
      <label><a href="http://jrichardsz.github.io/">JRichardsz</a></label>
      <br />
    </td>
  </tbody>
</table>
