/* Copyright 2026 Marimo. All rights reserved. */

import { lazy } from "react";
import type { AppConfig, UserConfig } from "@/core/config/config-schema";
import { KnownQueryParams } from "@/core/constants";
import { EditApp } from "@/core/edit-app";
import { AppChrome } from "../editor/chrome/wrapper/app-chrome";

const LazyCommandPalette = lazy(
  () => import("../editor/controls/command-palette"),
);

const LazyFileSearchDialog = lazy(
  () => import("../editor/controls/file-search-dialog"),
);

interface Props {
  userConfig: UserConfig;
  appConfig: AppConfig;
}

const hideChrome = (() => {
  const url = new URL(window.location.href);
  return url.searchParams.get(KnownQueryParams.showChrome) === "false";
})();

const EditPage = (props: Props) => {
  if (hideChrome) {
    return (
      <>
        <EditApp hideControls={true} {...props} />
        <LazyCommandPalette />
        <LazyFileSearchDialog />
      </>
    );
  }

  return (
    <AppChrome>
      <EditApp {...props} />
      <LazyCommandPalette />
      <LazyFileSearchDialog />
    </AppChrome>
  );
};

export default EditPage;
