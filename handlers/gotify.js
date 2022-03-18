const parse = require('../parser');

/***
 * This Gotify handler expects a token
 * for each configured origin (ex: user@origin).
 * This allows to include (via template placeholder)
 * the ogirinator of the email in the Gotify notification
 */

module.exports = (conf) => {
    // Expand the config
    const { endpoint, method, template, origins, fallbackToken } = conf;

    // Get final config based on email origin
    const getOriginConfig = (from) => origins.find(host => from.host.includes(host));

    // Build the notification request data from template
    const build = (notification) => {
        const title = parse(template.title, notification);
        const message = parse(template.message, notification);
    
        return { ...template, title, message };
    };

    // Get the request url based on the origin config
    const getUrl = (notification) => {
        const originConfig = getOriginConfig(notification.from);
        const token = originConfig?.token || fallbackToken;
        return `${endpoint}?token=${token}`;
    }

    // Request config generator
    return ({ notification }) => {
        const url = getUrl(notification);
        const data = build(notification);

        // Return an Axios config object
        return { method, url, data };
    };
};
