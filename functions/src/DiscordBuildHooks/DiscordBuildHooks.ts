import * as functions from "firebase-functions";
const fetch = require("node-fetch");

export const gcpBuildTriggerDiscord = functions.pubsub
  .topic("cloud-builds")
  .onPublish(async (pubSubEvent) => {
    const build = JSON.parse(
      Buffer.from(pubSubEvent.data, "base64").toString()
    );
    const status = ["SUCCESS", "FAILURE", "INTERNAL_ERROR", "TIMEOUT"];
    if (status.indexOf(build.status) === -1) {
      console.log("Status not found");
    }
    try {
      const msg = createBuildMessage(build);
      const response = await sentDiscordBuildPost(msg);
      console.log("-- response notification --", response);
    } catch (e) {
      console.log(e);
      const msg = {
        content: `Deploy ไม่สำเร็จ ${e}`,
      };
      await sentDiscordBuildPost(msg);
    }
  });

const sentDiscordBuildPost = async (body: object) => {
  console.log("Call Discord with", JSON.stringify(body));
  const result = await fetch(
    "https://discord.com/api/webhooks/786072666423558175/C6xERc77rtOrgCBnUdm65z1KgHETMXYdwEeDxkVPG-cWaeC5aE42ltZ1_dBGWubkT3DP",
    {
      body: JSON.stringify(body),
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );
  return result;
};

const handleStatusBuild = (build: GoogleCloudBuild) => {
  if (build.status === "QUEUED") {
    return `กำลัง Deploy..`;
  } else if (build.status === "SUCCESS") {
    return `Deploy เสร็จสิ้น..`;
  } else if (build.status === "WORKING") {
    return `Deploy กำลังทำงาน..`;
  } else if (build.status === "FAILURE") {
    return `Deploy ไม่ผ่าน.. (${build.buildTriggerId})`;
  } else if (build.status === "TIMEOUT") {
    return `Deploy ไม่ผ่านเนื่องจากTIMEOUT.. (${build.buildTriggerId})`;
  } else if (build.status === "CANCELLED") {
    return `Deploy ถูกยกเลิก.. (${build.buildTriggerId})`;
  } else {
    return `STATUS_UNKNOWN (${build.buildTriggerId})`;
  }
};

const createBuildMessage = (build: GoogleCloudBuild) => {
  const embeds: Embed[] = [];
  const msg = {
    content: `[${build.id}] : ${handleStatusBuild(build)} / Project : [${
      build.projectId
    }] / Status : [${build.status}]`,
    embeds: embeds,
  };
  return msg;
};

export interface Embed {
  title?: string;
  description?: string;
  color?: number;
}

export interface GoogleCloudBuild {
  id: string;
  projectId: string;
  status: string;
  steps?: Step[];
  createTime: Date;
  startTime: Date;
  finishTime: Date;
  buildTriggerId: string;
  options: Options;
}

export interface Options {
  substitutionOption?: string;
  logging?: string;
}

export interface Step {
  name: string;
  args: string[];
  entrypoint: string;
  timing: Timing;
  pullTiming: Timing;
  status: string;
}

export interface Timing {
  startTime: Date;
  endTime: Date;
}
