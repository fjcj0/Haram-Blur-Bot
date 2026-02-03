import cron from "cron";
import http from "http";
import https from "https";
const job = new cron.CronJob("*/20 * * * *", function () {
    const url = process.env.SERVER + "/api/cron";
    const client = url.startsWith("https") ? https : http;
    client.get(url, (response) => {
        if (response.statusCode === 200) {
            console.log("Cron → /api/cron request sent successfully");
        } else {
            console.log("Cron → /api/cron request failed: ", response.statusCode);
        }
    }).on("error", (error) => {
        console.log("Cron request error: ", error);
    });
});
export default job;