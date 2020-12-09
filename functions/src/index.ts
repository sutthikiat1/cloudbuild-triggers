import * as functions from "firebase-functions";

export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello Firebase Functiom!");
});

export { gcpBuildTriggerDiscord } from "./DiscordBuildHooks/DiscordBuildHooks";
