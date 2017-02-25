require('dotenv').config({silent: true});

import * as pogobuf from 'pogobuf';
import * as logger from 'winston';
import * as moment from 'moment';
import * as fs from 'fs-promise';

async function Main() {
    logger.info('Login to pogo');

    let login = new pogobuf.PTCLogin();
    if (process.env.PROXY) login.setProxy(process.env.PROXY);

    let token = await login.login(process.env.POGO_USER, process.env.POGO_PASSWORD);

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

    await client.init(false);
    await client.batchStart().batchCall();
    await client.getPlayer('FR', 'fr', 'Europe/Paris');

    logger.info('Logged in, downloading game master.');

    let response = await client.downloadItemTemplates(false);
    logger.info('Last updated %s', moment(response.timestamp_ms).fromNow());

    let gameMaster = response.item_templates;
    let json = JSON.stringify(gameMaster, null, 4);
    await fs.writeFile('item_templates.json', json);
}

Main()
.then(() => logger.info('Done.'))
.catch(e => logger.error(e));
