"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
require('dotenv').config({ silent: true });
const pogobuf = require("pogobuf");
const logger = require("winston");
const moment = require("moment");
const fs = require("fs-promise");
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info('Login to pogo');
        let login = new pogobuf.PTCLogin();
        if (process.env.PROXY)
            login.setProxy(process.env.PROXY);
        let token = yield login.login(process.env.POGO_USER, process.env.POGO_PASSWORD);
        let client = new pogobuf.Client({
            deviceId: process.env.DEVICE_ID,
            authType: 'ptc',
            authToken: token,
            version: 5702,
            useHashingServer: true,
            hashingKey: process.env.HASH_KEY,
            mapObjectsThrottling: false,
            includeRequestTypeInResponse: true,
            proxy: process.env.PROXY,
        });
        client.setPosition({
            latitude: parseFloat(process.env.LAT),
            longitude: parseFloat(process.env.LNG),
        });
        yield client.init(false);
        yield client.batchStart().batchCall();
        yield client.getPlayer('FR', 'fr', 'Europe/Paris');
        logger.info('Logged in, downloading game master...');
        let item_templates = [];
        let response = yield client.downloadItemTemplates(true);
        item_templates = item_templates.concat(response.item_templates);
        while (response.page_offset !== 0) {
            response = yield client.downloadItemTemplates(true, response.page_offset, response.timestamp_ms);
            item_templates = item_templates.concat(response.item_templates);
        }
        logger.info('Last updated %s', moment(response.timestamp_ms).fromNow());
        let gameMaster = response.item_templates;
        let json = JSON.stringify(gameMaster, null, 4);
        yield fs.writeFile('item_templates.json', json);
    });
}
Main()
    .then(() => logger.info('Done.'))
    .catch(e => logger.error(e));
//# sourceMappingURL=index.js.map