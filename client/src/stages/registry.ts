import type { StageProps } from "../types/game.ts";
import type { FC } from "react";
import { CaptchaStage } from "./CaptchaStage.tsx";
import { PasswordStage } from "./PasswordStage.tsx";
import { DataFormStage } from "./DataFormStage.tsx";
import { DownloadButtonStage } from "./DownloadButtonStage.tsx";
import { OnlineShopStage } from "./OnlineShopStage.tsx";
import { InstallerStage } from "./InstallerStage.tsx";
import { CookieBannerStage } from "./CookieBannerStage.tsx";
import { AgeVerificationStage } from "./AgeVerificationStage.tsx";
import { SpamFilterStage } from "./SpamFilterStage.tsx";
import { AdPopupStage } from "./AdPopupStage.tsx";

export const stageRegistry: Record<string, FC<StageProps>> = {
  captcha: CaptchaStage,
  password: PasswordStage,
  "data-form": DataFormStage,
  "download-button": DownloadButtonStage,
  "online-shop": OnlineShopStage,
  installer: InstallerStage,
  "cookie-banner": CookieBannerStage,
  "age-verification": AgeVerificationStage,
  "spam-filter": SpamFilterStage,
  "ad-popup": AdPopupStage,
};

export const stageNames: Record<string, string> = {
  captcha: "Captcha",
  password: "Password",
  "data-form": "Data Form",
  "download-button": "Download Button",
  "online-shop": "Online Shop",
  installer: "Installer",
  "cookie-banner": "Cookie Banner",
  "age-verification": "Age Verification",
  "spam-filter": "Spam Filter",
  "ad-popup": "Ad Popup",
};
