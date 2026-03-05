import type { StageProps } from "../types/game.ts";
import type { FC } from "react";
import { CaptchaStage } from "./CaptchaStage.tsx";
import { PasswordStage } from "./PasswordStage.tsx";
import { DataFormStage } from "./DataFormStage.tsx";
import { DownloadButtonStage } from "./DownloadButtonStage.tsx";
import { OnlineShopStage } from "./OnlineShopStage.tsx";

export const stageRegistry: Record<string, FC<StageProps>> = {
  captcha: CaptchaStage,
  password: PasswordStage,
  "data-form": DataFormStage,
  "download-button": DownloadButtonStage,
  "online-shop": OnlineShopStage,
};

export const stageNames: Record<string, string> = {
  captcha: "Captcha",
  password: "Password",
  "data-form": "Data Form",
  "download-button": "Download Button",
  "online-shop": "Online Shop",
};
