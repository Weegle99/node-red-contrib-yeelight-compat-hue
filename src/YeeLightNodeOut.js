// https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf
// https://github.com/song940/node-yeelight/blob/master/index.js

import Yeelight from 'yeelight2';
import convert from 'color-convert';

import { sanitizeState, hexToRgbInt, normalize, colorTemperatureToRgbInt, clamp } from './utils';

export default function YeeLightNodeOut(RED) {
    return function(config) {
        const node = this;

        const onInput = msg => {
            if (typeof msg.payload === 'string') {
                try {
                    msg.payload = JSON.parse(msg.payload);
                } catch (e) {
                    return node.error(
                        `Yeelight: Error during payload parsing\n${e}\n${msg.payload}`
                    );
                }
            }

            if (typeof msg.payload !== 'object') {
                return node.error(`Yeelight: Invalid payload\n${msg.payload}`);
            }

            const { on, bri, duration = 500, name } = msg.payload;

            if (typeof on === 'boolean') {
                return node.serverConfig.yeelight.set_power(on, null, duration);
            }
            if (bri) {
                return node.serverConfig.yeelight.set_bright(bri, null, duration);
            }
            if (name) {
                return node.serverConfig.yeelight.set_name(name);
            }
        };

        (function init() {
            RED.nodes.createNode(node, config);
            node.serverConfig = RED.nodes.getNode(config.server);

            if (!node.serverConfig || !node.serverConfig.hostname) {
                node.status({ fill: 'red', shape: 'ring', text: 'Hostname not set' });
                return;
            }

            node.serverConfig.registerClientNode(node);

            node.on('input', onInput);

            node.on('close', function() {
                if (node.serverConfig) {
                    node.serverConfig.deregisterClientNode(node);
                }
            });
        })();
    };
}
